import * as THREE from 'three';

const CAPE_HEIGHT = 1.6;
const CAPE_WIDTH = 1.05;
const CAPE_SEG_X = 12;
const CAPE_SEG_Y = 24;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function taperCapeGeometry(geometry) {
  const positions = geometry.attributes.position;

  for (let i = 0; i < positions.count; i += 1) {
    const y = positions.getY(i);
    const tail01 = clamp01(-y / CAPE_HEIGHT);
    const taper = 1 - tail01 * 0.16;
    positions.setX(i, positions.getX(i) * taper);
  }

  positions.needsUpdate = true;
}

function installCapeShader(material, uniforms) {
  const previousOnBeforeCompile = material.onBeforeCompile;

  material.onBeforeCompile = (shader, renderer) => {
    previousOnBeforeCompile.call(material, shader, renderer);

    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uVelocity = uniforms.uVelocity;
    shader.uniforms.uSpeed01 = uniforms.uSpeed01;
    shader.uniforms.uWind = uniforms.uWind;
    material.userData.shader = shader;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        uniform vec3 uVelocity;
        uniform float uSpeed01;
        uniform vec3 uWind;`
      )
      .replace(
        '#include <begin_vertex>',
        `vec3 transformed = vec3(position);

        float w = clamp(-position.y / ${CAPE_HEIGHT.toFixed(1)}, 0.0, 1.0);
        float wEase = w * w * (3.0 - 2.0 * w);

        vec3 localVelocity = uVelocity;
        float velocityLen = length(localVelocity);
        vec3 velocityDir = velocityLen > 0.0001 ? localVelocity / velocityLen : vec3(0.0, 0.0, -1.0);

        vec3 windDir = length(uWind) > 0.0001 ? normalize(uWind) : vec3(0.0, 0.0, 0.0);
        vec3 airflow = -velocityDir * (0.85 + uSpeed01 * 0.65) + windDir * 0.35 + vec3(0.0, 0.0, 0.18);
        airflow.y *= 0.3;
        vec3 trailDir = length(airflow) > 0.0001 ? normalize(airflow) : vec3(0.0, 0.0, 1.0);

        float speedKick = uSpeed01 * 1.4;
        transformed += trailDir * wEase * (0.2 + speedKick * 0.8);
        transformed.y += wEase * (-0.05 - speedKick * 0.25);

        float windPhase = dot(position.xz, windDir.xz) * 4.0;
        float ripple = sin(uTime * 3.2 + position.x * 4.2 + w * 6.0 + windPhase) * 0.06;
        ripple += sin(uTime * 4.7 + w * 3.5 + windPhase * 0.5) * 0.04;
        transformed.x += wEase * ripple * (0.5 + uSpeed01 * 0.4);
        transformed.z += wEase * ripple * 0.3;`
      );
  };

  material.customProgramCacheKey = () => 'hero-cape-v1';
}

/**
 * Build a flowing cape attached to hero.userData.bones.capeAnchor.
 * Uses MeshStandardMaterial + onBeforeCompile to inject a wind/velocity vertex displacement.
 *
 * Returns { mesh, material, uniforms, update(state, dt) }.
 * `state` is the hero flight state (has yaw, speed01, velocity).
 */
export function createHeroCape({ heroModel, csm = null }) {
  const anchor = heroModel.userData.bones?.capeAnchor;
  if (!anchor) throw new Error('hero cape requires capeAnchor bone');

  const geometry = new THREE.PlaneGeometry(CAPE_WIDTH, CAPE_HEIGHT, CAPE_SEG_X, CAPE_SEG_Y);
  geometry.translate(0, -CAPE_HEIGHT / 2, 0);
  taperCapeGeometry(geometry);

  const material = new THREE.MeshStandardMaterial({
    color: 0xb91d28,
    roughness: 0.62,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const uniforms = {
    uTime: { value: 0 },
    uVelocity: { value: new THREE.Vector3(0, 0, 0) },
    uSpeed01: { value: 0 },
    uWind: { value: new THREE.Vector3(0.5, 0, 0.3) },
  };

  if (csm) csm.setupMaterial(material);
  installCapeShader(material, uniforms);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'heroCape';
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  anchor.add(mesh);

  const worldVelocity = new THREE.Vector3();
  const anchorQuaternion = new THREE.Quaternion();

  return {
    mesh,
    material,
    uniforms,
    update(state, dt = 0) {
      uniforms.uTime.value += dt;
      uniforms.uSpeed01.value = clamp01(state.speed01 || 0);

      if (state.velocity) {
        worldVelocity.set(state.velocity.x, state.velocity.y, state.velocity.z);
        anchor.getWorldQuaternion(anchorQuaternion).invert();
        uniforms.uVelocity.value.copy(worldVelocity.applyQuaternion(anchorQuaternion));
      } else {
        uniforms.uVelocity.value.set(0, 0, 0);
      }
    },
  };
}
