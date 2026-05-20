import * as THREE from 'three';
import { PMREMGenerator } from 'three';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { CSM } from 'three/addons/csm/CSM.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RENDER } from '../core/constants.js';
import { assetUrl } from '../core/asset-url.js';
import { createWebGPUBackend } from './webgpu-backend.js';
import { createWebGL2Backend } from './webgl2-backend.js';

const HDRI_PATH = assetUrl('assets/hdri/belfast_sunset_puresky_2k.exr');
const SOFTWARE_WEBGL_COMPOSER_PIXEL_RATIO = 0.25;
const SUN_DIRECTION = new THREE.Vector3(-0.7, -1.0, -0.7).normalize();

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
  renderer.toneMappingExposure = 0.55;  // tuned harder: HDRI ambient is hot, buildings hit pure-white at 0.7

  const scene = new THREE.Scene();
  await applyHdriEnvironment({ renderer, scene, backendLabel: backend.label });

  const camera = new THREE.PerspectiveCamera(RENDER.cameraFov, 1, 0.1, 1200);
  camera.position.set(0, 18, 36);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const csm = createCsm({ scene, camera, backendLabel: backend.label });
  if (!csm) createFallbackSun(scene);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900),
    new THREE.MeshStandardMaterial({ color: 0x394658, roughness: 0.95, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  csm?.setupMaterial(ground.material);
  scene.add(ground);

  const composer = backend.label === 'webgl2-low'
    ? createBloomComposer({ renderer, scene, camera, canvas })
    : null;

  function resize() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    composer?.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  return {
    backendLabel: backend.label,
    renderer,
    scene,
    camera,
    csm,
    getAdapterInfo: backend.getAdapterInfo,
    resize,
    render() {
      csm?.updateFrustums();
      csm?.update();

      if (composer) {
        composer.render();
        return;
      }

      renderer.render(scene, camera);
    },
    getStats() {
      // WebGPU's `info.render.calls` is CUMULATIVE since app start; only
      // `info.render.frameCalls` is per-frame. WebGL2's `info.render.calls`
      // IS per-frame (autoReset). Prefer frameCalls when available so the
      // HUD reports a meaningful number on both backends. The runtime audit
      // caught this — earlier the HUD reported "Draws 21,182" which was
      // actually 21k draws *since page load*, not per-frame.
      const info = renderer.info;
      const calls = info.render.frameCalls ?? info.render.calls;
      return {
        calls,
        triangles: info.render.triangles,
        backendLabel: backend.label,
      };
    },
  };
}

function createCsm({ scene, camera, backendLabel }) {
  if (backendLabel === 'webgpu-high') return null;

  try {
    return new CSM({
      maxFar: 600,
      cascades: 3,
      mode: 'practical',
      parent: scene,
      shadowMapSize: 1024,
      lightDirection: SUN_DIRECTION.clone(),
      lightIntensity: 1.8,  // tuned down: HDRI already provides ambient
      lightColor: new THREE.Color(0xfff2dc),  // warm sunset tint
      camera,
    });
  } catch (error) {
    console.warn('[render] CSM failed, falling back to a single shadow sun', error);
    return null;
  }
}

function createFallbackSun(scene) {
  const sun = new THREE.DirectionalLight(0xfff2dc, 1.8);  // tuned down + warm sunset tint
  sun.castShadow = true;
  sun.position.copy(SUN_DIRECTION).multiplyScalar(-180);
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 600;
  sun.shadow.camera.left = -300;
  sun.shadow.camera.right = 300;
  sun.shadow.camera.top = 300;
  sun.shadow.camera.bottom = -300;
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0002;
  scene.add(sun);
  scene.add(sun.target);
  return sun;
}

async function applyHdriEnvironment({ renderer, scene, backendLabel }) {
  const loader = new EXRLoader();
  const texture = await loader.loadAsync(HDRI_PATH);
  texture.mapping = THREE.EquirectangularReflectionMapping;

  const PMREM = await getPmremGeneratorClass(backendLabel);
  const pmremGenerator = new PMREM(renderer);
  const envMap = pmremGenerator.fromEquirectangular(texture).texture;

  scene.environment = envMap;
  scene.environmentIntensity = 0.32;       // PMREM ambient dialed way back so building albedo reads
  scene.background = texture;               // use ORIGINAL HDRI for sharp sky (PMREM is blurry)
  scene.backgroundIntensity = 0.6;          // tone background down too so it doesn't crush horizon

  // Tinted fog — push the start back so close buildings stay readable
  const fogColor = sampleHdriAmbient(texture);
  fogColor.multiplyScalar(0.55);            // mute fog
  scene.fog = new THREE.Fog(fogColor, 380, 850);

  // Note: do NOT dispose `texture` — we're using it as background now.
  pmremGenerator.dispose();
}

async function getPmremGeneratorClass(backendLabel) {
  if (backendLabel !== 'webgpu-high') return PMREMGenerator;

  const { PMREMGenerator: WebGPUPMREMGenerator } = await import('three/webgpu');
  return WebGPUPMREMGenerator;
}

function sampleHdriAmbient(texture) {
  const image = texture.image;
  if (!image?.data || !image.width || !image.height) {
    return new THREE.Color(0xc1ad91);
  }

  const { data, width, height } = image;
  const channels = Math.max(3, Math.floor(data.length / (width * height)));
  const xStep = Math.max(1, Math.floor(width / 16));
  const yStep = Math.max(1, Math.floor(height / 8));
  const yStart = Math.floor(height * 0.4);
  const yEnd = Math.floor(height * 0.62);
  const read = texture.type === THREE.HalfFloatType
    ? index => THREE.DataUtils.fromHalfFloat(data[index])
    : index => data[index];

  let r = 0;
  let g = 0;
  let b = 0;
  let samples = 0;

  for (let y = yStart; y < yEnd; y += yStep) {
    for (let x = 0; x < width; x += xStep) {
      const offset = (y * width + x) * channels;
      const texelR = read(offset);
      const texelG = read(offset + 1);
      const texelB = read(offset + 2);
      const peak = Math.max(texelR, texelG, texelB);

      if (!Number.isFinite(peak) || peak <= 0) continue;

      const sunClamp = peak > 4 ? 4 / peak : 1;
      r += texelR * sunClamp;
      g += texelG * sunClamp;
      b += texelB * sunClamp;
      samples += 1;
    }
  }

  if (samples === 0) return new THREE.Color(0xc1ad91);

  const exposure = 1.15 / samples;
  return new THREE.Color(
    1 - Math.exp(-r * exposure),
    1 - Math.exp(-g * exposure),
    1 - Math.exp(-b * exposure)
  );
}

function createBloomComposer({ renderer, scene, camera, canvas }) {
  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || window.innerHeight;
  const composer = new EffectComposer(renderer);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.45, 0.4, 0.85);

  if (isSoftwareWebGLRenderer(renderer)) {
    composer.setPixelRatio(SOFTWARE_WEBGL_COMPOSER_PIXEL_RATIO);
  }

  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  return composer;
}

function isSoftwareWebGLRenderer(renderer) {
  const context = renderer.getContext?.();
  const debugInfo = context?.getExtension?.('WEBGL_debug_renderer_info');
  const rendererInfo = debugInfo
    ? context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : context?.getParameter?.(context.RENDERER);

  return /llvmpipe|software|swiftshader/i.test(rendererInfo || '');
}
