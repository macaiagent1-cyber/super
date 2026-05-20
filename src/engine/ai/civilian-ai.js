import * as THREE from 'three';
import { WORLD } from '../core/constants.js';
import { createRng } from '../core/rng.js';

const ROAD_CENTERS = [-WORLD.tileSize, 0, WORLD.tileSize];
const SIDEWALK_OFFSET = WORLD.roadWidth / 2 + WORLD.sidewalkWidth * 0.5;
const CITY_LIMIT = WORLD.tileSize * 1.45;
const TURN_RADIUS = 1.8;

function choose(rng, values) {
  return values[rng.int(0, values.length)];
}

function nearestRoadCenter(value) {
  let best = ROAD_CENTERS[0];
  let bestDistance = Math.abs(value - best);
  for (let i = 1; i < ROAD_CENTERS.length; i += 1) {
    const distance = Math.abs(value - ROAD_CENTERS[i]);
    if (distance < bestDistance) {
      best = ROAD_CENTERS[i];
      bestDistance = distance;
    }
  }
  return best;
}

function placeOnSidewalk(civ, rng, x, z) {
  const horizontal = rng.next() > 0.5;
  if (horizontal) {
    civ.axis = 'x';
    civ.roadCenter = nearestRoadCenter(z);
    civ.side = z >= civ.roadCenter ? 1 : -1;
    civ.mesh.position.set(
      THREE.MathUtils.clamp(x, -CITY_LIMIT, CITY_LIMIT),
      0,
      civ.roadCenter + civ.side * SIDEWALK_OFFSET
    );
  } else {
    civ.axis = 'z';
    civ.roadCenter = nearestRoadCenter(x);
    civ.side = x >= civ.roadCenter ? 1 : -1;
    civ.mesh.position.set(
      civ.roadCenter + civ.side * SIDEWALK_OFFSET,
      0,
      THREE.MathUtils.clamp(z, -CITY_LIMIT, CITY_LIMIT)
    );
  }
  civ.dir = choose(rng, [-1, 1]);
  civ.turnCooldown = rng.range(0.4, 1.2);
}

function updateWalkVector(civ) {
  civ.vx = civ.axis === 'x' ? civ.dir : 0;
  civ.vz = civ.axis === 'z' ? civ.dir : 0;
}

function maybeTurnAtIntersection(civ, rng) {
  const travel = civ.axis === 'x' ? civ.mesh.position.x : civ.mesh.position.z;
  const intersection = nearestRoadCenter(travel);
  if (Math.abs(travel - intersection) > TURN_RADIUS || civ.turnCooldown > 0) return;

  civ.turnCooldown = rng.range(0.7, 1.8);
  if (rng.next() > 0.45) return;

  civ.axis = civ.axis === 'x' ? 'z' : 'x';
  civ.roadCenter = intersection;
  civ.side = choose(rng, [-1, 1]);
  civ.dir = choose(rng, [-1, 1]);
  if (civ.axis === 'x') {
    civ.mesh.position.z = civ.roadCenter + civ.side * SIDEWALK_OFFSET;
  } else {
    civ.mesh.position.x = civ.roadCenter + civ.side * SIDEWALK_OFFSET;
  }
}

function keepInsideCity(civ) {
  if (civ.mesh.position.x > CITY_LIMIT) {
    civ.mesh.position.x = CITY_LIMIT;
    civ.dir = -1;
    civ.vx = -Math.abs(civ.vx);
  } else if (civ.mesh.position.x < -CITY_LIMIT) {
    civ.mesh.position.x = -CITY_LIMIT;
    civ.dir = 1;
    civ.vx = Math.abs(civ.vx);
  }

  if (civ.mesh.position.z > CITY_LIMIT) {
    civ.mesh.position.z = CITY_LIMIT;
    civ.dir = -1;
    civ.vz = -Math.abs(civ.vz);
  } else if (civ.mesh.position.z < -CITY_LIMIT) {
    civ.mesh.position.z = -CITY_LIMIT;
    civ.dir = 1;
    civ.vz = Math.abs(civ.vz);
  }
}

/**
 * Simple civilian AI: walks on sidewalk lanes, turns randomly at intersections,
 * and panics away from the hero when the hero is nearby and moving fast.
 */
export function createCivilianSystem({ scene, seed = 42, count = 24, csm = null }) {
  const rng = createRng(seed);
  const group = new THREE.Group();
  group.name = 'civilians';
  scene.add(group);

  const bodyGeo = new THREE.CapsuleGeometry(0.22, 0.9, 4, 8);
  const headGeo = new THREE.SphereGeometry(0.18, 8, 8);
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe6b88a, roughness: 0.6 });
  if (csm) csm.setupMaterial(skinMat);

  const civilians = [];

  for (let i = 0; i < count; i += 1) {
    const color = new THREE.Color().setHSL(rng.range(0, 1), 0.45, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    if (csm) csm.setupMaterial(bodyMat);

    const civMesh = new THREE.Group();
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.position.y = 0.55;
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.25;
    head.castShadow = true;
    civMesh.add(body, head);

    group.add(civMesh);

    const civ = {
      mesh: civMesh,
      axis: 'x',
      roadCenter: 0,
      side: 1,
      dir: 1,
      vx: 1,
      vz: 0,
      walkSpeed: rng.range(0.8, 1.6),
      panicSpeed: 6,
      turnCooldown: rng.range(0.2, 1.2),
      mode: 'wander',
    };
    placeOnSidewalk(civ, rng, rng.range(-CITY_LIMIT, CITY_LIMIT), rng.range(-CITY_LIMIT, CITY_LIMIT));
    updateWalkVector(civ);
    civilians.push(civ);
  }

  return {
    update(dt, heroState) {
      const heroPosition = heroState?.position ?? { x: 9999, z: 9999 };
      const heroVelocity = heroState?.velocity ?? { x: 0, z: 0 };
      const heroSpeed = Math.hypot(heroVelocity.x, heroVelocity.z);

      for (const civ of civilians) {
        const dx = civ.mesh.position.x - heroPosition.x;
        const dz = civ.mesh.position.z - heroPosition.z;
        const distToHero = Math.hypot(dx, dz);

        if (distToHero < 14 && heroSpeed > 8) {
          civ.mode = 'panic';
          const nrm = Math.hypot(dx, dz) || 1;
          civ.vx = dx / nrm;
          civ.vz = dz / nrm;
        } else if (civ.mode === 'panic' && distToHero > 25) {
          civ.mode = 'wander';
          placeOnSidewalk(civ, rng, civ.mesh.position.x, civ.mesh.position.z);
        }

        if (civ.mode === 'wander') {
          civ.turnCooldown = Math.max(0, civ.turnCooldown - dt);
          maybeTurnAtIntersection(civ, rng);
          updateWalkVector(civ);
        }

        const speed = civ.mode === 'panic' ? civ.panicSpeed : civ.walkSpeed;
        civ.mesh.position.x += civ.vx * speed * dt;
        civ.mesh.position.z += civ.vz * speed * dt;
        keepInsideCity(civ);

        if (Math.abs(civ.vx) > 0.01 || Math.abs(civ.vz) > 0.01) {
          civ.mesh.rotation.y = Math.atan2(civ.vx, civ.vz);
        }
      }
    },
  };
}
