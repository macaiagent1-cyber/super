import { FLIGHT } from '../core/constants.js';
import { createHeroCape } from './cape-sim.js';
import { createFlightState, stepFlight } from './hero-flight.js';
import { createHeroModel, poseHeroForFlight } from './hero-model.js';

export function createHeroSystem({ scene, csm = null, physicsWorld = null } = {}) {
  const state = createFlightState();
  const mesh = scene ? createHeroModel({ csm }) : null;
  let cape = null;
  let physicsBody = null;
  if (scene && mesh) {
    scene.add(mesh);
    cape = createHeroCape({ heroModel: mesh, csm });
  }
  if (physicsWorld) {
    const cap = physicsWorld.createHeroCapsule(
      state.position,
      FLIGHT.capsuleRadius,
      FLIGHT.capsuleHeight
    );
    physicsBody = cap.body;
  }

  function syncMesh(dt = 1 / 60) {
    if (!mesh) return;
    mesh.position.set(state.position.x, state.position.y, state.position.z);
    mesh.rotation.set(state.pitch, state.yaw, 0, 'YXZ');
    poseHeroForFlight(mesh, state);
    if (cape) cape.update(state, dt);
  }

  function syncPhysics() {
    if (!physicsBody) return;
    physicsBody.setNextKinematicTranslation({
      x: state.position.x,
      y: state.position.y,
      z: state.position.z,
    });
  }

  return {
    state,
    mesh,
    cape,
    physicsBody,
    update(input, dt, world = null) {
      const next = stepFlight(state, input, dt);
      Object.assign(state, next);
      const floorY = FLIGHT.capsuleRadius + FLIGHT.capsuleHeight / 2;
      if (state.position.y < floorY) {
        state.position.y = floorY;
        if (state.velocity.y < 0) state.velocity.y = 0;
      }
      if (world && typeof world.resolveCapsule === 'function') {
        const resolved = world.resolveCapsule(
          state.position,
          FLIGHT.capsuleRadius,
          FLIGHT.capsuleHeight
        );
        state.position = resolved.position;
        if (resolved.hitGround && state.velocity.y < 0) state.velocity.y = 0;
      }
      syncPhysics();
      syncMesh(dt);
    },
    setPosition(position) {
      state.position = { ...position };
      syncPhysics();
      syncMesh();
    },
  };
}
