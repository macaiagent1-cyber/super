import * as THREE from 'three';
import { RENDER } from '../core/constants.js';
import { createWebGPUBackend } from './webgpu-backend.js';
import { createWebGL2Backend } from './webgl2-backend.js';

export function chooseRenderBackend({ forceWebGL2, hasWebGPU }) {
  return forceWebGL2 || !hasWebGPU ? 'webgl2' : 'webgpu';
}

export async function createRenderSystem({ canvas, forceWebGL2 = false } = {}) {
  const desired = chooseRenderBackend({ forceWebGL2, hasWebGPU: !!navigator.gpu });
  let backend;

  if (desired === 'webgpu') {
    try {
      backend = await createWebGPUBackend({ canvas });
    } catch (error) {
      console.warn('[render] WebGPU failed, falling back to WebGL2', error);
      backend = await createWebGL2Backend({ canvas });
    }
  } else {
    backend = await createWebGL2Backend({ canvas });
  }

  const renderer = backend.renderer;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fc7ff);
  scene.fog = new THREE.Fog(0x8fc7ff, 240, 680);

  const camera = new THREE.PerspectiveCamera(RENDER.cameraFov, 1, 0.1, 1200);
  camera.position.set(0, 18, 36);

  const sun = new THREE.DirectionalLight(0xffffff, 3.5);
  sun.position.set(90, 140, 80);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x3b4658, 1.4));

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900),
    new THREE.MeshStandardMaterial({ color: 0x394658, roughness: 0.95, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  function resize() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  return {
    backendLabel: backend.label,
    renderer,
    scene,
    camera,
    getAdapterInfo: backend.getAdapterInfo,
    resize,
    render() {
      renderer.render(scene, camera);
    },
    getStats() {
      const info = renderer.info;
      return {
        calls: info.render.calls,
        triangles: info.render.triangles,
        backendLabel: backend.label,
      };
    },
  };
}
