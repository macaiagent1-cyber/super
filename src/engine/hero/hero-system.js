import * as THREE from 'three';
import { FLIGHT } from '../core/constants.js';
import { createFlightState, stepFlight } from './hero-flight.js';

export function createHeroSystem({ scene, csm = null } = {}) {
  const state = createFlightState();
  const mesh = scene ? createHeroMesh({ csm }) : null;
  if (scene && mesh) scene.add(mesh);

  function syncMesh() {
    if (!mesh) return;
    mesh.position.set(state.position.x, state.position.y, state.position.z);
    mesh.rotation.set(state.pitch, state.yaw, state.bank, 'YXZ');
  }

  return {
    state,
    mesh,
    update(input, dt, collisionWorld = null) {
      const next = stepFlight(state, input, dt);
      Object.assign(state, next);
      if (collisionWorld) {
        const resolved = collisionWorld.resolveCapsule(
          state.position,
          FLIGHT.capsuleRadius,
          FLIGHT.capsuleHeight
        );
        state.position = resolved.position;
        if (resolved.hitGround && state.velocity.y < 0) state.velocity.y = 0;
      }
      syncMesh();
    },
    setPosition(position) {
      state.position = { ...position };
      syncMesh();
    },
  };
}

function createHeroMesh({ csm = null } = {}) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.45, 1.15, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0x265cff, roughness: 0.55 })
  );
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  setupCsmMaterial(csm, body.material);
  const cape = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.06, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xd51f2a, roughness: 0.7 })
  );
  cape.position.set(0, -0.05, 0.7);
  cape.castShadow = true;
  setupCsmMaterial(csm, cape.material);
  group.add(body, cape);
  return group;
}

function setupCsmMaterial(csm, material) {
  if (!csm) return;

  const materials = Array.isArray(material) ? material : [material];
  for (const entry of materials) {
    if (entry) csm.setupMaterial(entry);
  }
}
