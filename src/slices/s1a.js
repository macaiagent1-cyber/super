import * as THREE from 'three';
import { createClock } from '../engine/core/clock.js';
import { RENDER } from '../engine/core/constants.js';
import { createEngineLoop } from '../engine/core/engine-loop.js';
import { createInputRouter } from '../engine/core/input-router.js';
import { createDevConsole, attachDevConsole } from '../engine/dev-tools/dev-console.js';
import { createPerfHud } from '../engine/dev-tools/perf-hud.js';
import { createHeroSystem } from '../engine/hero/hero-system.js';
import { computeCameraRig, updateThreeCamera } from '../engine/render/camera-rig.js';
import { createRenderSystem } from '../engine/render/render-system.js';

export async function startS1A() {
  const canvas = document.getElementById('game');
  const hudRoot = document.getElementById('hud-root');
  const forceWebGL2 = new URLSearchParams(window.location.search).has('forceWebGL2');
  const renderSystem = await createRenderSystem({ canvas, forceWebGL2 });

  const input = createInputRouter();
  input.attach(canvas);

  const hero = createHeroSystem({ scene: renderSystem.scene });
  hero.setPosition({ x: 0, y: 16, z: 48 });
  addBoxes(renderSystem.scene);

  const perfHud = createPerfHud({ root: hudRoot, renderSystem });
  const clock = createClock({ fixedStep: RENDER.fixedStep, maxDelta: RENDER.maxDelta });
  const cameraMemory = { x: 0, y: 20, z: 65 };

  const { consoleRoot, inputEl, outputEl } = buildConsoleDom();
  document.body.append(consoleRoot);
  const devConsole = createDevConsole({
    setQuality: value => { document.body.dataset.quality = value; },
    setSeed: value => { document.body.dataset.seed = String(value); },
    setBackend: value => { window.location.search = value === 'webgl2' ? '?forceWebGL2=1' : ''; },
    setPerfCapture: value => { document.body.dataset.perfCapture = value; },
  });
  attachDevConsole({ inputElement: inputEl, outputElement: outputEl, devConsole });

  const loop = createEngineLoop({
    clock,
    input,
    resize: renderSystem.resize,
    update(dt) {
      hero.update(input.getFlightIntent(), dt);
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
  inputEl.value = 'quality high';
  const outputEl = document.createElement('output');
  consoleRoot.append(inputEl, outputEl);
  return { consoleRoot, inputEl, outputEl };
}

function addBoxes(scene) {
  const geometry = new THREE.BoxGeometry(8, 16, 8);
  for (let i = 0; i < 20; i += 1) {
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL((i * 0.07) % 1, 0.46, 0.52),
      roughness: 0.82,
    });
    const mesh = new THREE.Mesh(geometry, material);
    const x = (i % 5 - 2) * 24;
    const z = (Math.floor(i / 5) - 2) * 24;
    mesh.position.set(x, 8, z);
    scene.add(mesh);
  }
}
