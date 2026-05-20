import * as THREE from 'three';
import { createClock } from '../engine/core/clock.js';
import { RENDER } from '../engine/core/constants.js';
import { createEngineLoop } from '../engine/core/engine-loop.js';
import { eventBus } from '../engine/core/event-bus.js';
import { createInputRouter } from '../engine/core/input-router.js';
import { createDodgeSystem } from '../engine/combat/dodge-system.js';
import { createDestructibleSystem } from '../engine/combat/destructibles.js';
import { createGrabSystem } from '../engine/combat/grab-throw.js';
import { createHeatVisionSystem } from '../engine/combat/heat-vision.js';
import { tryPunch } from '../engine/combat/punch-system.js';
import { createImpactFx } from '../engine/vfx/impact-fx.js';
import { createDevConsole, attachDevConsole } from '../engine/dev-tools/dev-console.js';
import { createPerfHud } from '../engine/dev-tools/perf-hud.js';
import { getForwardVector } from '../engine/hero/hero-flight.js';
import { createHeroSystem } from '../engine/hero/hero-system.js';
import { computeCameraRig, updateThreeCamera } from '../engine/render/camera-rig.js';
import { addBatchedBuildings, addRoadMeshes } from '../engine/render/instancing-system.js';
import { createRenderSystem } from '../engine/render/render-system.js';
import { createCollisionWorld } from '../engine/world/collision-world.js';
import { generateDistrict } from '../engine/world/district-generator.js';

export async function startS1B() {
  const canvas = document.getElementById('game');
  const hudRoot = document.getElementById('hud-root');
  const params = new URLSearchParams(window.location.search);
  const forceWebGL2 = params.has('forceWebGL2');
  const seed = Number(params.get('seed') || 42);
  const renderSystem = await createRenderSystem({ canvas, forceWebGL2 });
  const district = generateDistrict({ seed });
  addBatchedBuildings(renderSystem.scene, district.buildings, renderSystem.csm);
  addRoadMeshes(renderSystem.scene, district.roads, renderSystem.csm);

  const { createPhysicsWorld } = await import('../engine/world/physics-world.js');
  const physicsWorld = await createPhysicsWorld();
  const cars = [];
  const destructibles = createDestructibleSystem({ eventBus });
  const carDamageColor = new THREE.Color(0x222222);
  for (const b of district.buildings) {
    const halfX = b.size.x / 2;
    const halfZ = b.size.z / 2;
    physicsWorld.createStaticBox(
      { x: b.position.x - halfX, y: 0, z: b.position.z - halfZ },
      { x: b.position.x + halfX, y: b.size.y, z: b.position.z + halfZ },
      'building'
    );
  }
  physicsWorld.createStaticBox(
    { x: -450, y: -1, z: -450 },
    { x: 450, y: 0, z: 450 },
    'ground'
  );
  for (let i = 0; i < 6; i += 1) {
    const x = Math.sin(i * 1.3) * 60;
    const z = Math.cos(i * 1.3) * 60;
    const carBody = physicsWorld.createDynamicBox({
      position: { x, y: 1.2, z },
      halfExtents: { x: 1.1, y: 0.6, z: 2.3 },
      mass: 1200,
      tag: 'car',
    });
    const carMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.2, 4.6),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL((i * 0.18) % 1, 0.55, 0.5),
        roughness: 0.5,
        metalness: 0.3,
        transparent: true,
        opacity: 1,
      })
    );
    const originalColor = carMesh.material.color.getHex();
    if (renderSystem.csm) renderSystem.csm.setupMaterial(carMesh.material);
    carMesh.position.set(x, 1.2, z);
    carMesh.castShadow = true;
    carMesh.receiveShadow = true;
    renderSystem.scene.add(carMesh);
    destructibles.register(carBody.body.handle, { hp: 150, armor: 8, tag: 'car' });
    cars.push({ body: carBody.body, mesh: carMesh, originalColor, sinkOffset: 0 });
  }

  const collisionWorld = createCollisionWorld();
  collisionWorld.addBuildings(district.buildings);

  const heatVision = createHeatVisionSystem({
    scene: renderSystem.scene,
    physicsWorld,
    eventBus,
  });
  const grabSystem = createGrabSystem({ physicsWorld, eventBus });
  const dodge = createDodgeSystem({ eventBus });
  const impactFx = createImpactFx({ scene: renderSystem.scene });
  eventBus.on('combat.heatHit', hit => {
    if (hit.tag === 'car' && hit.bodyHandle !== undefined) {
      destructibles.damage(hit.bodyHandle, 30 * hit.dt);
    }
  });

  const input = createInputRouter();
  input.attach(canvas);
  const hero = createHeroSystem({ scene: renderSystem.scene, csm: renderSystem.csm, physicsWorld });
  hero.setPosition({ x: 0, y: 34, z: 120 });

  const perfHud = createPerfHud({ root: hudRoot, renderSystem });
  const clock = createClock({ fixedStep: RENDER.fixedStep, maxDelta: RENDER.maxDelta });
  const cameraMemory = { x: 0, y: 38, z: 145 };

  const { consoleRoot, inputEl, outputEl } = buildConsoleDom();
  document.body.append(consoleRoot);
  const devConsole = createDevConsole({
    setQuality: value => { document.body.dataset.quality = value; },
    setSeed: value => {
      const next = new URL(window.location.href);
      next.searchParams.set('seed', String(value));
      window.location.href = next.toString();
    },
    setBackend: value => {
      const next = new URL(window.location.href);
      if (value === 'webgl2') next.searchParams.set('forceWebGL2', '1');
      else next.searchParams.delete('forceWebGL2');
      window.location.href = next.toString();
    },
    setPerfCapture: value => { document.body.dataset.perfCapture = value; },
  });
  attachDevConsole({ inputElement: inputEl, outputElement: outputEl, devConsole });

  const loop = createEngineLoop({
    clock,
    input,
    resize: renderSystem.resize,
    update(dt) {
      const intent = input.getFlightIntent();
      dodge.update(hero.state, intent, dt);
      hero.update(intent, dt, collisionWorld);
      grabSystem.update(hero.state, intent, dt);
      physicsWorld.step(dt);
      heatVision.update(hero.state, intent, dt);
      impactFx.update(dt);
      if (intent.punch) {
        const fwd = getForwardVector(hero.state.yaw, hero.state.pitch);
        const result = tryPunch({
          origin: hero.state.position,
          forward: fwd,
          physicsWorld,
          strength: 2200,
          range: 3,
          eventBus,
        });
        if (result) {
          impactFx.spawn({
            position: result.point,
            normal: { x: -fwd.x, y: -fwd.y, z: -fwd.z },
          });
          if (result.bodyHandle !== undefined) {
            destructibles.damage(result.bodyHandle, 45);
          }
        }
      }
    },
    render(timing) {
      for (const car of cars) {
        const t = car.body.translation();
        const r = car.body.rotation?.() ?? { x: 0, y: 0, z: 0, w: 1 };
        car.mesh.position.set(t.x, t.y, t.z);
        car.mesh.quaternion.set(r.x, r.y, r.z, r.w);
        const state = destructibles.get(car.body.handle);
        if (state) {
          const hpRatio = state.maxHp > 0 ? state.hp / state.maxHp : 0;
          const damageT = THREE.MathUtils.clamp(1 - hpRatio, 0, 1);
          car.mesh.material.color.lerpColors(
            new THREE.Color(car.originalColor),
            carDamageColor,
            damageT,
          );
          car.mesh.material.opacity = state.dead ? 0.45 : 1 - damageT * 0.2;
          if (state.dead && car.mesh.position.y > -8) {
            car.sinkOffset = Math.min(car.sinkOffset + (timing.dt || RENDER.fixedStep), 10);
            car.mesh.position.y -= car.sinkOffset;
          }
        }
      }
      const pose = computeCameraRig({ hero: hero.state, previous: cameraMemory, dt: timing.dt || RENDER.fixedStep });
      Object.assign(cameraMemory, pose.position);
      updateThreeCamera(renderSystem.camera, pose);
      renderSystem.render();
      perfHud.update(timing.dt || RENDER.fixedStep);
    },
  });

  window.addEventListener('resize', renderSystem.resize);
  loop.start();
}

function buildConsoleDom() {
  const consoleRoot = document.createElement('div');
  consoleRoot.id = 'console-root';
  const inputEl = document.createElement('input');
  inputEl.setAttribute('aria-label', 'dev console');
  inputEl.value = 'seed 42';
  const outputEl = document.createElement('output');
  consoleRoot.append(inputEl, outputEl);
  return { consoleRoot, inputEl, outputEl };
}
