import { createClock } from '../engine/core/clock.js';
import { RENDER } from '../engine/core/constants.js';
import { createEngineLoop } from '../engine/core/engine-loop.js';
import { eventBus } from '../engine/core/event-bus.js';
import { createInputRouter } from '../engine/core/input-router.js';
import { tryPunch } from '../engine/combat/punch-system.js';
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
  for (const b of district.buildings) {
    const halfX = b.size.x / 2;
    const halfZ = b.size.z / 2;
    physicsWorld.createStaticBox(
      { x: b.position.x - halfX, y: 0, z: b.position.z - halfZ },
      { x: b.position.x + halfX, y: b.size.y, z: b.position.z + halfZ },
      'building'
    );
  }

  const collisionWorld = createCollisionWorld();
  collisionWorld.addBuildings(district.buildings);

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
      hero.update(intent, dt, collisionWorld);
      physicsWorld.step(dt);
      if (intent.punch) {
        tryPunch({
          origin: hero.state.position,
          forward: getForwardVector(hero.state.yaw, hero.state.pitch),
          physicsWorld,
          strength: 2200,
          range: 3,
          eventBus,
        });
      }
    },
    render(timing) {
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
