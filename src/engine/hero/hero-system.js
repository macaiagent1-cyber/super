import { FLIGHT } from '../core/constants.js';
import { createHeroCape } from './cape-sim.js';
import { createFlightState, stepFlight } from './hero-flight.js';
import { createHeroModel, poseHeroForFlight } from './hero-model.js';

export function createHeroSystem({ scene, csm = null } = {}) {
  const state = createFlightState();
  const mesh = scene ? createHeroModel({ csm }) : null;
  let cape = null;
  if (scene && mesh) {
    scene.add(mesh);
    cape = createHeroCape({ heroModel: mesh, csm });
  }

  function syncMesh(dt = 1 / 60) {
    if (!mesh) return;
    mesh.position.set(state.position.x, state.position.y, state.position.z);
    mesh.rotation.set(state.pitch, state.yaw, 0, 'YXZ');
    poseHeroForFlight(mesh, state);
    if (cape) cape.update(state, dt);
  }

  return {
    state,
    mesh,
    cape,
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
      syncMesh(dt);
    },
    setPosition(position) {
      state.position = { ...position };
      syncMesh();
    },
  };
}
