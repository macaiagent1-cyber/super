import * as THREE from 'three';
import { createClock } from '../engine/core/clock.js';
import { RENDER } from '../engine/core/constants.js';
import { createEngineLoop } from '../engine/core/engine-loop.js';
import { eventBus } from '../engine/core/event-bus.js';
import { createCivilianSystem } from '../engine/ai/civilian-ai.js';
import { createThreatSystem } from '../engine/ai/threat-ai.js';
import { createTrafficSystem } from '../engine/ai/traffic-ai.js';
import { createAudioBus } from '../engine/audio/audio-bus.js';
import { createInputRouter } from '../engine/core/input-router.js';
import { createDodgeSystem } from '../engine/combat/dodge-system.js';
import { createDestructibleSystem } from '../engine/combat/destructibles.js';
import { createGrabSystem } from '../engine/combat/grab-throw.js';
import { createHeatVisionSystem } from '../engine/combat/heat-vision.js';
import { tryPunch } from '../engine/combat/punch-system.js';
import { createImpactFx } from '../engine/vfx/impact-fx.js';
import { createDevConsole, attachDevConsole } from '../engine/dev-tools/dev-console.js';
import { createPerfHud } from '../engine/dev-tools/perf-hud.js';
import { createSaveStore } from '../engine/save/save-store.js';
import { getForwardVector } from '../engine/hero/hero-flight.js';
import { createHeroSystem } from '../engine/hero/hero-system.js';
import { computeCameraRig, updateThreeCamera } from '../engine/render/camera-rig.js';
import { addBatchedBuildings, addRoadMeshes } from '../engine/render/instancing-system.js';
import { createRenderSystem } from '../engine/render/render-system.js';
import { createHudOverlay } from '../engine/ui/hud-overlay.js';
import { createPauseMenu } from '../engine/ui/pause-menu.js';
import { createTitleScreen } from '../engine/ui/title-screen.js';
import { createCollisionWorld } from '../engine/world/collision-world.js';
import { generateDistrict } from '../engine/world/district-generator.js';

export async function startS1B() {
  const canvas = document.getElementById('game');
  const hudRoot = document.getElementById('hud-root');
  const params = new URLSearchParams(window.location.search);
  const forceWebGL2 = params.has('forceWebGL2');
  const seed = Number(params.get('seed') || 42);
  const saveStore = createSaveStore();
  const savedData = saveStore.load();
  const currentSettings = {
    ...saveStore.DEFAULTS.settings,
    ...(savedData.settings || {}),
    backend: forceWebGL2 ? 'webgl2' : 'auto',
  };
  const progress = {
    ...saveStore.DEFAULTS.progress,
    ...(savedData.progress || {}),
  };
  document.body.dataset.quality = currentSettings.quality;
  document.body.dataset.sensitivity = String(currentSettings.mouseSensitivity);
  if (savedData._recoveredFromCorruption) showSaveRecoveryNotice(document.body);
  const renderSystem = await createRenderSystem({ canvas, forceWebGL2 });
  const district = generateDistrict({ seed });
  addBatchedBuildings(renderSystem.scene, district.buildings, renderSystem.csm);
  addRoadMeshes(renderSystem.scene, district.roads, renderSystem.csm);
  const civilians = createCivilianSystem({
    scene: renderSystem.scene,
    seed,
    count: 24,
    csm: renderSystem.csm,
  });
  const traffic = createTrafficSystem({ scene: renderSystem.scene, count: 8, csm: renderSystem.csm });
  const audioBus = createAudioBus();
  audioBus.setMusicVolume?.(currentSettings.musicVolume);

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
  eventBus.on('combat.dodge', () => audioBus.dodgeWhoosh());
  eventBus.on('combat.destroyed', event => {
    if (event?.tag === 'car') audioBus.carImpact();
  });
  eventBus.on('combat.throw', event => {
    if (event?.tag === 'car') progress.carsThrown += 1;
  });
  eventBus.on('combat.heatHit', hit => {
    if (hit.tag === 'car' && hit.bodyHandle !== undefined) {
      destructibles.damage(hit.bodyHandle, 30 * hit.dt);
    }
  });

  const input = createInputRouter();
  input.attach(canvas);
  const hero = createHeroSystem({ scene: renderSystem.scene, csm: renderSystem.csm, physicsWorld });
  hero.setPosition({ x: 0, y: 34, z: 120 });
  const threats = createThreatSystem({
    scene: renderSystem.scene,
    physicsWorld,
    audioBus,
    eventBus,
    seed,
    count: 6,
    csm: renderSystem.csm,
  });
  threats.update(0, hero.state);

  const heroHp = { current: 100, max: 100 };
  const heroEnergy = { current: 100, max: 100 };
  eventBus.on('threat.hitHero', event => {
    heroHp.current = Math.max(0, heroHp.current - (event?.damage ?? 0));
  });
  eventBus.on('threat.destroyed', () => {
    progress.threatsDestroyed += 1;
  });
  const hud = createHudOverlay({ root: document.body });
  const perfHud = createPerfHud({ root: hudRoot, renderSystem });
  const clock = createClock({ fixedStep: RENDER.fixedStep, maxDelta: RENDER.maxDelta });
  const cameraMemory = { x: 0, y: 38, z: 145 };
  let wasBoosting = false;
  let paused = false;
  let mouseSensitivity = currentSettings.mouseSensitivity;
  let saveTimer = 0;

  function updateEnergy(intent, dt) {
    if (intent.boost) heroEnergy.current = Math.max(0, heroEnergy.current - 25 * dt);
    else if (intent.heatVision) heroEnergy.current = Math.max(0, heroEnergy.current - 35 * dt);
    else heroEnergy.current = Math.min(heroEnergy.max, heroEnergy.current + 18 * dt);
  }

  function persistSave() {
    currentSettings.quality = document.body.dataset.quality || currentSettings.quality;
    currentSettings.mouseSensitivity = mouseSensitivity;

    saveStore.save({
      settings: { ...currentSettings },
      progress: {
        ...progress,
        playTimeSeconds: Math.round(progress.playTimeSeconds * 100) / 100,
      },
    });
  }

  const { consoleRoot, inputEl, outputEl } = buildConsoleDom();
  document.body.append(consoleRoot);
  const devConsole = createDevConsole({
    setQuality: value => {
      document.body.dataset.quality = value;
      if (isQualityValue(value)) {
        currentSettings.quality = value;
        persistSave();
      }
    },
    setSeed: value => {
      const next = new URL(window.location.href);
      next.searchParams.set('seed', String(value));
      window.location.href = next.toString();
    },
    setBackend: value => {
      currentSettings.backend = value === 'webgl2' ? 'webgl2' : 'auto';
      persistSave();
      const next = new URL(window.location.href);
      if (value === 'webgl2') next.searchParams.set('forceWebGL2', '1');
      else next.searchParams.delete('forceWebGL2');
      window.location.href = next.toString();
    },
    setPerfCapture: value => { document.body.dataset.perfCapture = value; },
  });
  attachDevConsole({ inputElement: inputEl, outputElement: outputEl, devConsole });

  const pauseMenu = createPauseMenu({
    root: document.body,
    initialSettings: currentSettings,
    onResume: () => {
      setPaused(false, { requestPointerLock: true });
    },
    onSetSeed: newSeed => {
      const next = new URL(window.location.href);
      next.searchParams.set('seed', String(newSeed));
      window.location.href = next.toString();
    },
    onSetQuality: quality => {
      document.body.dataset.quality = quality;
      currentSettings.quality = quality;
      persistSave();
    },
    onSetVolume: volume => {
      currentSettings.musicVolume = volume;
      audioBus.setMusicVolume?.(volume);
      persistSave();
    },
    onSetSensitivity: sensitivity => {
      mouseSensitivity = sensitivity;
      currentSettings.mouseSensitivity = sensitivity;
      document.body.dataset.sensitivity = String(sensitivity);
      persistSave();
    },
  });
  const title = createTitleScreen({
    root: document.body,
    onStart: () => {
      audioBus.ensureContext();
      audioBus.startMusic();
      audioBus.setMusicVolume?.(currentSettings.musicVolume);
      canvas.requestPointerLock?.();
    },
  });

  function setPaused(nextPaused, { requestPointerLock = false } = {}) {
    if (paused === nextPaused) {
      if (!paused && requestPointerLock) canvas.requestPointerLock?.();
      return;
    }

    paused = nextPaused;
    clock.setTimeScale(paused ? 0 : 1);
    input.clear();

    if (paused) {
      pauseMenu.show();
      if (document.pointerLockElement === canvas) document.exitPointerLock?.();
    } else {
      pauseMenu.hide();
      if (requestPointerLock) canvas.requestPointerLock?.();
    }
  }

  window.addEventListener('keydown', event => {
    if (event.code !== 'Escape' || event.repeat) return;
    event.preventDefault?.();
    if (title.isShown()) return;
    setPaused(!paused, { requestPointerLock: paused });
  });

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement !== canvas && !paused && !pauseMenu.isVisible() && !title.isShown()) {
      setPaused(true);
    }
  });

  window.addEventListener('pagehide', persistSave);

  const loop = createEngineLoop({
    clock,
    input,
    resize: renderSystem.resize,
    update(dt) {
      if (paused) return;
      saveTimer += dt;
      progress.playTimeSeconds += dt;
      if (saveTimer >= 5) {
        saveTimer = 0;
        persistSave();
      }
      const intent = input.getFlightIntent();
      intent.lookX *= mouseSensitivity;
      intent.lookY *= mouseSensitivity;
      if (heroEnergy.current < 8) {
        intent.boost = false;
        intent.heatVision = false;
      }
      updateEnergy(intent, dt);
      if (intent.boost && !wasBoosting) audioBus.boostWhoosh();
      wasBoosting = intent.boost;
      dodge.update(hero.state, intent, dt);
      hero.update(intent, dt, collisionWorld);
      grabSystem.update(hero.state, intent, dt);
      physicsWorld.step(dt);
      heatVision.update(hero.state, intent, dt);
      if (intent.heatVision) {
        const eyeOrigin = {
          x: hero.state.position.x,
          y: hero.state.position.y + 0.6,
          z: hero.state.position.z,
        };
        const fwd = getForwardVector(hero.state.yaw, hero.state.pitch);
        const physicsHit = physicsWorld.raycast(eyeOrigin, fwd, 80);
        const droneHit = threats.raycastDrones(eyeOrigin, fwd, 80);
        if (droneHit && (!physicsHit || droneHit.distance <= physicsHit.distance)) {
          threats.damageDrone(droneHit.drone.mesh, 30 * dt);
        }
      }
      threats.update(dt, hero.state);
      civilians.update(dt, hero.state);
      traffic.update(dt);
      impactFx.update(dt);
      hud.update({
        hp: heroHp.current,
        hpMax: heroHp.max,
        energy: heroEnergy.current,
        energyMax: heroEnergy.max,
        heroPos: hero.state.position,
        threats: threats.drones,
        cars,
      });
      if (intent.punch) {
        const fwd = getForwardVector(hero.state.yaw, hero.state.pitch);
        const droneHit = threats.raycastDrones(hero.state.position, fwd, 6);
        if (droneHit) {
          threats.damageDrone(droneHit.drone.mesh, 40);
          impactFx.spawn({
            position: droneHit.drone.mesh.position,
            normal: { x: -fwd.x, y: -fwd.y, z: -fwd.z },
          });
          audioBus.punchImpact();
        } else {
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
            audioBus.punchImpact();
            if (result.bodyHandle !== undefined) {
              destructibles.damage(result.bodyHandle, 45);
            }
          }
        }
      }
    },
    render(timing) {
      const frameDt = paused ? 0 : (timing.dt || RENDER.fixedStep);
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
            car.sinkOffset = Math.min(car.sinkOffset + frameDt, 10);
            car.mesh.position.y -= car.sinkOffset;
          }
        }
      }
      const pose = computeCameraRig({ hero: hero.state, previous: cameraMemory, dt: frameDt });
      Object.assign(cameraMemory, pose.position);
      updateThreeCamera(renderSystem.camera, pose);
      renderSystem.render();
      perfHud.update(frameDt);
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

function isQualityValue(value) {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'ultra';
}

function showSaveRecoveryNotice(root) {
  if (root.querySelector('#save-recovery-notice')) return;

  const notice = document.createElement('div');
  notice.id = 'save-recovery-notice';
  notice.style.cssText = [
    'position:fixed',
    'right:16px',
    'bottom:16px',
    'z-index:1200',
    'max-width:min(360px,calc(100vw - 32px))',
    'padding:12px 14px',
    'background:rgba(15,22,34,0.94)',
    'border:1px solid rgba(255,255,255,0.22)',
    'border-radius:6px',
    'box-shadow:0 10px 30px rgba(0,0,0,0.35)',
    'color:#f4f7fb',
    'font:0.85rem ui-sans-serif,system-ui,sans-serif',
  ].join(';');

  const message = document.createElement('span');
  message.textContent = 'Save data was corrupted and reset to defaults. Old data was backed up to super:save:backup.';

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.textContent = 'Dismiss';
  dismiss.style.cssText = [
    'margin-left:12px',
    'padding:4px 8px',
    'border:1px solid rgba(255,255,255,0.22)',
    'border-radius:4px',
    'background:rgba(255,255,255,0.08)',
    'color:#f4f7fb',
    'font:inherit',
    'cursor:pointer',
  ].join(';');
  dismiss.addEventListener('click', () => notice.remove());

  notice.append(message, dismiss);
  root.append(notice);
}
