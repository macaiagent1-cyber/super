import * as THREE from 'three';
import { createRng } from '../core/rng.js';

const DRONE_HIT_RADIUS = 2.2;

function vecDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function normalize(x, y, z) {
  const len = Math.hypot(x, y, z) || 1;
  return { x: x / len, y: y / len, z: z / len };
}

/**
 * Drone threat AI. Spawns N flying drones around the hero.
 * Each drone:
 *  - Patrols a random position near the hero
 *  - Pursues when hero within 60m
 *  - Fires laser/glow projectile when within 25m
 *  - Takes damage from punch / heat-vision hit handlers
 *  - Destroyed at 0 HP, respawns elsewhere after 8s
 */
export function createThreatSystem({
  scene,
  physicsWorld,
  audioBus,
  eventBus = null,
  seed = 42,
  count = 6,
  csm = null,
}) {
  const rng = createRng(seed ^ 0xfeed);
  const drones = [];
  const group = new THREE.Group();
  group.name = 'threats';
  scene.add(group);

  const bodyGeo = new THREE.OctahedronGeometry(0.9, 0);
  const eyeGeo = new THREE.SphereGeometry(0.18, 8, 8);
  const projectileGeo = new THREE.SphereGeometry(0.16, 10, 10);
  const projectileMat = new THREE.MeshBasicMaterial({
    color: 0xff5533,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const projectiles = [];

  function randomPatrolTarget(center) {
    const ang = rng.range(0, Math.PI * 2);
    const dist = rng.range(18, 42);
    return {
      x: center.x + Math.cos(ang) * dist,
      y: center.y + rng.range(-4, 8),
      z: center.z + Math.sin(ang) * dist,
    };
  }

  function placeDrone(drone, center, index) {
    const ang = (index / Math.max(1, count)) * Math.PI * 2 + rng.range(-0.35, 0.35);
    const dist = 35 + rng.range(0, 25);
    drone.mesh.position.set(
      center.x + Math.cos(ang) * dist,
      Math.max(10, center.y + rng.range(-10, -2)),
      center.z + Math.sin(ang) * dist,
    );
    drone.target = randomPatrolTarget(center);
    drone.retargetAt = rng.range(0.4, 1.5);
  }

  function acquireProjectile() {
    let shot = projectiles.find(p => !p.alive);
    if (!shot) {
      const mesh = new THREE.Mesh(projectileGeo, projectileMat.clone());
      mesh.visible = false;
      group.add(mesh);
      shot = {
        mesh,
        alive: false,
        ttl: 0,
        velocity: { x: 0, y: 0, z: 0 },
      };
      projectiles.push(shot);
    }
    return shot;
  }

  function fireAtHero(drone, heroState) {
    const origin = drone.mesh.position;
    const target = {
      x: heroState.position.x,
      y: heroState.position.y + 0.4,
      z: heroState.position.z,
    };
    const dir = normalize(target.x - origin.x, target.y - origin.y, target.z - origin.z);
    const shot = acquireProjectile();
    shot.alive = true;
    shot.ttl = 1.2;
    shot.velocity.x = dir.x * 38;
    shot.velocity.y = dir.y * 38;
    shot.velocity.z = dir.z * 38;
    shot.mesh.position.set(origin.x + dir.x * 0.9, origin.y + dir.y * 0.9, origin.z + dir.z * 0.9);
    shot.mesh.scale.setScalar(1);
    shot.mesh.material.opacity = 0.9;
    shot.mesh.visible = true;
    eventBus?.emit?.('threat.attack', {
      drone,
      position: { x: shot.mesh.position.x, y: shot.mesh.position.y, z: shot.mesh.position.z },
      target,
      damage: 6,
    });
  }

  function updateProjectiles(dt, heroState) {
    for (const shot of projectiles) {
      if (!shot.alive) continue;
      shot.ttl -= dt;
      shot.mesh.position.x += shot.velocity.x * dt;
      shot.mesh.position.y += shot.velocity.y * dt;
      shot.mesh.position.z += shot.velocity.z * dt;
      shot.mesh.material.opacity = Math.max(0, shot.ttl / 1.2);

      const hitHero = heroState?.position && vecDistance(shot.mesh.position, heroState.position) < 1.4;
      if (shot.ttl <= 0 || hitHero) {
        shot.alive = false;
        shot.mesh.visible = false;
        if (hitHero) {
          eventBus?.emit?.('threat.hitHero', {
            damage: 6,
            point: { x: shot.mesh.position.x, y: shot.mesh.position.y, z: shot.mesh.position.z },
          });
        }
      }
    }
  }

  function spawnDrone(i) {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a4a,
      roughness: 0.4,
      metalness: 0.7,
      emissive: 0x220011,
      emissiveIntensity: 0.5,
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3030 });
    if (csm) csm.setupMaterial(bodyMat);

    const drone = new THREE.Group();
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    drone.add(body);
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, 0, 0.65);
    drone.add(eye);
    group.add(drone);

    const threat = {
      mesh: drone,
      body,
      bodyMat,
      hp: 60,
      maxHp: 60,
      mode: 'patrol',
      target: { x: 0, y: 14, z: 0 },
      cooldown: rng.range(0.2, 1.4),
      attackRange: 25,
      pursuitRange: 60,
      speed: 8 + rng.range(0, 3),
      dead: false,
      respawnAt: 0,
      retargetAt: 0,
      retreatUntil: 0,
      initialized: false,
      index: i,
    };
    placeDrone(threat, { x: 0, y: 18, z: 0 }, i);
    return threat;
  }

  for (let i = 0; i < count; i += 1) {
    drones.push(spawnDrone(i));
  }

  let elapsed = 0;
  void physicsWorld;

  return {
    drones,
    /**
     * Damage a drone (called from punch / heat-vision hit handlers).
     */
    damageDrone(droneMesh, amount) {
      const drone = drones.find(d => d.mesh === droneMesh || d.body === droneMesh);
      if (!drone || drone.dead) return false;
      drone.hp -= amount;
      drone.bodyMat.emissiveIntensity = 1.5;
      drone.retreatUntil = elapsed + 2.5;
      eventBus?.emit?.('threat.damaged', { drone, amount, hp: Math.max(0, drone.hp) });
      if (drone.hp <= 0) {
        drone.dead = true;
        drone.respawnAt = elapsed + 8;
        drone.mesh.visible = false;
        if (audioBus) audioBus.carImpact();
        eventBus?.emit?.('threat.destroyed', { drone });
      }
      return true;
    },
    /**
     * Hit-test a ray against drones. Returns nearest drone within range or null.
     */
    raycastDrones(origin, direction, maxDistance) {
      const ray = normalize(direction.x, direction.y, direction.z);
      let best = null;
      for (const d of drones) {
        if (d.dead) continue;
        const dx = d.mesh.position.x - origin.x;
        const dy = d.mesh.position.y - origin.y;
        const dz = d.mesh.position.z - origin.z;
        const projection = ray.x * dx + ray.y * dy + ray.z * dz;
        if (projection < 0 || projection > maxDistance) continue;
        const distSq = dx * dx + dy * dy + dz * dz;
        const perpendicularSq = Math.max(0, distSq - projection * projection);
        if (perpendicularSq > DRONE_HIT_RADIUS * DRONE_HIT_RADIUS) continue;
        if (!best || projection < best.distance) {
          best = { drone: d, distance: projection };
        }
      }
      return best;
    },
    update(dt, heroState) {
      elapsed += dt;
      updateProjectiles(dt, heroState);

      const heroPosition = heroState?.position ?? { x: 0, y: 18, z: 0 };
      for (const d of drones) {
        if (!d.initialized && heroState?.position) {
          placeDrone(d, heroPosition, d.index);
          d.initialized = true;
        }

        if (d.dead) {
          if (elapsed > d.respawnAt) {
            d.dead = false;
            d.hp = d.maxHp;
            placeDrone(d, heroPosition, d.index);
            d.mesh.visible = true;
            d.bodyMat.emissiveIntensity = 0.5;
            eventBus?.emit?.('threat.respawned', { drone: d });
          }
          continue;
        }

        d.cooldown = Math.max(0, d.cooldown - dt);
        d.retargetAt = Math.max(0, d.retargetAt - dt);
        d.bodyMat.emissiveIntensity = Math.max(0.5, d.bodyMat.emissiveIntensity - 4 * dt);

        const dx = heroPosition.x - d.mesh.position.x;
        const dy = heroPosition.y - d.mesh.position.y;
        const dz = heroPosition.z - d.mesh.position.z;
        const dist = Math.hypot(dx, dy, dz);
        const nrm = dist || 1;
        const hurt = d.hp / d.maxHp < 0.4 || elapsed < d.retreatUntil;

        if (hurt && dist < d.pursuitRange * 1.25) {
          d.mode = 'retreat';
          d.target.x = d.mesh.position.x - (dx / nrm) * 24;
          d.target.y = Math.max(12, heroPosition.y + 8);
          d.target.z = d.mesh.position.z - (dz / nrm) * 24;
        } else if (dist < d.pursuitRange) {
          d.mode = 'pursue';
          d.target.x = heroPosition.x - (dx / nrm) * 6;
          d.target.y = heroPosition.y + 2;
          d.target.z = heroPosition.z - (dz / nrm) * 6;
          if (dist < d.attackRange && d.cooldown <= 0) {
            fireAtHero(d, heroState);
            d.cooldown = rng.range(0.8, 1.6);
          }
        } else {
          d.mode = 'patrol';
          if (d.retargetAt <= 0 || vecDistance(d.mesh.position, d.target) < 2) {
            d.target = randomPatrolTarget(heroPosition);
            d.retargetAt = rng.range(1.5, 3.5);
          }
        }

        const moveX = d.target.x - d.mesh.position.x;
        const moveY = d.target.y - d.mesh.position.y;
        const moveZ = d.target.z - d.mesh.position.z;
        const moveDist = Math.hypot(moveX, moveY, moveZ);
        const speed = d.mode === 'retreat' ? d.speed * 1.35 : d.speed;
        const step = Math.min(speed * dt, moveDist);
        if (moveDist > 0.001) {
          d.mesh.position.x += (moveX / moveDist) * step;
          d.mesh.position.y += (moveY / moveDist) * step;
          d.mesh.position.z += (moveZ / moveDist) * step;
        }

        d.mesh.lookAt(heroPosition.x, heroPosition.y, heroPosition.z);
        d.body.rotation.y += dt * 1.2;
      }
    },
  };
}
