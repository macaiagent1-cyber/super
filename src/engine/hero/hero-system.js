import { FLIGHT } from '../core/constants.js';
import { createFlightState, stepFlight } from './hero-flight.js';
import { createHeroModel, poseHeroForFlight } from './hero-model.js';

export function createHeroSystem({ scene, csm = null } = {}) {
  const state = createFlightState();
  const mesh = scene ? createHeroModel({ csm }) : null;
  if (scene && mesh) scene.add(mesh);

  function syncMesh() {
    if (!mesh) return;
    mesh.position.set(state.position.x, state.position.y, state.position.z);
    mesh.rotation.set(state.pitch, state.yaw, 0, 'YXZ');
    poseHeroForFlight(mesh, state);
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
