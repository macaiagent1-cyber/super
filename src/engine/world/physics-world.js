// Wraps @dimforge/rapier3d-simd-compat. Async init loads WASM via bundler-friendly import.
//
// API:
//   const physics = await createPhysicsWorld();
//   physics.world           -> RAPIER.World instance
//   physics.RAPIER          -> the module
//   physics.step(dt)        -> advance simulation
//   physics.createHeroCapsule(position, radius, height)
//   physics.createStaticBox(min, max, tag)
//   physics.createDynamicBox({ position, halfExtents, mass, tag })
//   physics.raycast(origin, direction, maxDistance, options)
//   physics.sweepCapsule(position, direction, maxDistance, options)
//   physics.syncQueries()
//   physics.removeBody(handle)
//
// Falls back to the static AABB collision-world if Rapier fails to load.

import { FLIGHT } from '../core/constants.js';
import { createCollisionWorld } from './collision-world.js';

const IDENTITY_ROTATION = Object.freeze({ x: 0, y: 0, z: 0, w: 1 });

let initPromise = null;

async function initRapier() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const module = await import('@dimforge/rapier3d-simd-compat');
    const RAPIER = module.default ?? module;
    // Rapier 0.19.3's compat init() passes a Uint8Array of WASM bytes to the
    // internal wbg loader, which then warns "deprecated parameters... pass a
    // single object instead". We can't influence the internal call from here
    // (it's their wrapper, not ours). Suppress only that exact message during
    // init so it doesn't pollute the console; restore after.
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const first = args[0];
      if (typeof first === 'string' && first.includes('deprecated parameters for the initialization function')) {
        return;
      }
      originalWarn.apply(console, args);
    };
    try {
      await RAPIER.init();
    } finally {
      console.warn = originalWarn;
    }
    return RAPIER;
  })();
  return initPromise;
}

export async function createPhysicsWorld({ gravity = { x: 0, y: FLIGHT.gravity, z: 0 } } = {}) {
  try {
    const RAPIER = await initRapier();
    return createRapierPhysicsWorld(RAPIER, gravity);
  } catch (error) {
    return createFallbackPhysicsWorld(error, gravity);
  }
}

function createRapierPhysicsWorld(RAPIER, gravity) {
  const world = new RAPIER.World(gravity);
  const bodies = new Map(); // body handle -> { tag, body, collider }
  const colliders = new Map(); // collider handle -> same entry
  let queryDirty = false;

  function registerBody(tag, body, collider) {
    const entry = { tag, body, collider };
    bodies.set(body.handle, entry);
    colliders.set(collider.handle, entry);
    queryDirty = true;
    return { body, collider };
  }

  function step(dt) {
    world.timestep = dt;
    world.step();
    queryDirty = false;
  }

  function flushQueries() {
    const timestep = world.timestep;
    world.timestep = 0;
    world.step();
    world.timestep = timestep;
    queryDirty = false;
  }

  function ensureQueries() {
    if (queryDirty) flushQueries();
  }

  function syncQueries() {
    flushQueries();
  }

  function createHeroCapsule(position, radius = FLIGHT.capsuleRadius, height = FLIGHT.capsuleHeight) {
    const desc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(position.x, position.y, position.z);
    const body = world.createRigidBody(desc);
    const colliderDesc = RAPIER.ColliderDesc
      .capsule(height / 2, radius)
      .setFriction(0.0)
      .setRestitution(0.0);
    const collider = world.createCollider(colliderDesc, body);
    return registerBody('hero', body, collider);
  }

  function createStaticBox(min, max, tag = 'static') {
    const halfX = (max.x - min.x) / 2;
    const halfY = (max.y - min.y) / 2;
    const halfZ = (max.z - min.z) / 2;
    const cx = (max.x + min.x) / 2;
    const cy = (max.y + min.y) / 2;
    const cz = (max.z + min.z) / 2;
    const desc = RAPIER.RigidBodyDesc.fixed().setTranslation(cx, cy, cz);
    const body = world.createRigidBody(desc);
    const colliderDesc = RAPIER.ColliderDesc
      .cuboid(halfX, halfY, halfZ)
      .setFriction(0.6);
    const collider = world.createCollider(colliderDesc, body);
    return registerBody(tag, body, collider);
  }

  function createDynamicBox({ position, halfExtents, mass = 200, tag = 'dynamic' }) {
    const desc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setLinearDamping(0.4)
      .setAngularDamping(0.6);
    const body = world.createRigidBody(desc);
    const colliderDesc = RAPIER.ColliderDesc
      .cuboid(halfExtents.x, halfExtents.y, halfExtents.z)
      .setMass(mass)
      .setFriction(0.55)
      .setRestitution(0.1);
    const collider = world.createCollider(colliderDesc, body);
    return registerBody(tag, body, collider);
  }

  function raycast(origin, direction, maxDistance, options = {}) {
    ensureQueries();
    const ray = new RAPIER.Ray(origin, direction);
    const hit = world.castRay(
      ray,
      maxDistance,
      options.solid !== false,
      options.filterFlags,
      options.filterGroups,
      optionCollider(options.excludeCollider),
      optionBody(options.excludeRigidBody),
      options.filterPredicate,
    );
    if (!hit) return null;

    const distance = hit.timeOfImpact ?? hit.toi;
    const entry = colliders.get(hit.collider.handle);
    return {
      distance,
      point: pointAlong(origin, direction, distance),
      tag: entry?.tag || 'static',
      bodyHandle: entry?.body?.handle,
    };
  }

  function sweepCapsule(position, direction, maxDistance, options = {}) {
    const radius = options.radius ?? FLIGHT.capsuleRadius;
    const height = options.height ?? FLIGHT.capsuleHeight;
    const shape = new RAPIER.Capsule(height / 2, radius);
    return sweepShape(shape, position, direction, maxDistance, options);
  }

  function sweepBox(position, halfExtents, direction, maxDistance, options = {}) {
    const shape = new RAPIER.Cuboid(halfExtents.x, halfExtents.y, halfExtents.z);
    return sweepShape(shape, position, direction, maxDistance, options);
  }

  function sweepShape(shape, position, direction, maxDistance, options = {}) {
    const velocity = normalizeDirection(direction);
    if (!velocity) return null;
    ensureQueries();

    const hit = world.castShape(
      position,
      options.rotation ?? IDENTITY_ROTATION,
      velocity,
      shape,
      options.targetDistance ?? 0,
      maxDistance,
      options.stopAtPenetration !== false,
      options.filterFlags,
      options.filterGroups,
      optionCollider(options.excludeCollider),
      optionBody(options.excludeRigidBody),
      options.filterPredicate,
    );
    if (!hit) return null;

    const distance = hit.time_of_impact ?? hit.timeOfImpact ?? hit.toi;
    const entry = colliders.get(hit.collider.handle);
    return {
      distance,
      point: pointAlong(position, velocity, distance),
      tag: entry?.tag || 'static',
      bodyHandle: entry?.body?.handle,
      normal: hit.normal1,
      witness1: hit.witness1,
      witness2: hit.witness2,
    };
  }

  function removeBody(handle) {
    const entry = bodies.get(handle);
    if (!entry) return;
    world.removeCollider(entry.collider, false);
    world.removeRigidBody(entry.body);
    bodies.delete(handle);
    colliders.delete(entry.collider.handle);
    queryDirty = true;
  }

  return {
    RAPIER,
    world,
    bodies,
    step,
    createHeroCapsule,
    createStaticBox,
    createDynamicBox,
    raycast,
    sweepCapsule,
    sweepBox,
    sweepShape,
    syncQueries,
    removeBody,
  };
}

function createFallbackPhysicsWorld(rapierLoadError, gravity) {
  const world = createCollisionWorld();
  const bodies = new Map();
  let nextHandle = 1;

  function registerBody(tag, body, collider, aabb = null) {
    bodies.set(body.handle, { tag, body, collider, aabb });
    return { body, collider };
  }

  function createBody(position, type) {
    const state = {
      position: { ...position },
      velocity: { x: 0, y: 0, z: 0 },
    };
    return {
      handle: nextHandle++,
      type,
      translation: () => ({ ...state.position }),
      setTranslation(next) {
        state.position = { ...next };
      },
      setNextKinematicTranslation(next) {
        state.position = { ...next };
      },
      userData: state,
    };
  }

  function step(dt) {
    for (const entry of bodies.values()) {
      if (entry.body.type !== 'dynamic') continue;
      const state = entry.body.userData;
      state.velocity.y += gravity.y * dt;
      state.position.x += state.velocity.x * dt;
      state.position.y += state.velocity.y * dt;
      state.position.z += state.velocity.z * dt;
    }
  }

  function syncQueries() {}

  function createHeroCapsule(position, radius = FLIGHT.capsuleRadius, height = FLIGHT.capsuleHeight) {
    const body = createBody(position, 'kinematic');
    const collider = { handle: body.handle, radius, height };
    return registerBody('hero', body, collider);
  }

  function createStaticBox(min, max, tag = 'static') {
    const aabb = { min, max, tag };
    world.addAabb(aabb);
    const body = createBody({
      x: (max.x + min.x) / 2,
      y: (max.y + min.y) / 2,
      z: (max.z + min.z) / 2,
    }, 'fixed');
    const collider = {
      handle: body.handle,
      halfExtents: {
        x: (max.x - min.x) / 2,
        y: (max.y - min.y) / 2,
        z: (max.z - min.z) / 2,
      },
    };
    return registerBody(tag, body, collider, aabb);
  }

  function createDynamicBox({ position, halfExtents, mass = 200, tag = 'dynamic' }) {
    const body = createBody(position, 'dynamic');
    const collider = { handle: body.handle, halfExtents, mass };
    return registerBody(tag, body, collider);
  }

  function raycast(origin, direction, maxDistance) {
    const hit = world.raycast(origin, direction, maxDistance);
    if (!hit) return null;
    return {
      distance: hit.distance,
      point: hit.point,
      tag: hit.tag || 'static',
    };
  }

  function sweepCapsule(position, direction, maxDistance) {
    const velocity = normalizeDirection(direction);
    if (!velocity) return null;
    return raycast(position, velocity, maxDistance);
  }

  function sweepBox(position, halfExtents, direction, maxDistance) {
    return sweepCapsule(position, direction, maxDistance);
  }

  function sweepShape(shape, position, direction, maxDistance) {
    return sweepCapsule(position, direction, maxDistance);
  }

  function removeBody(handle) {
    const entry = bodies.get(handle);
    if (!entry) return;
    if (entry.aabb) {
      const index = world.aabbs.indexOf(entry.aabb);
      if (index !== -1) world.aabbs.splice(index, 1);
    }
    bodies.delete(handle);
  }

  return {
    RAPIER: null,
    rapierLoadError,
    world,
    bodies,
    step,
    createHeroCapsule,
    createStaticBox,
    createDynamicBox,
    raycast,
    sweepCapsule,
    sweepBox,
    sweepShape,
    syncQueries,
    removeBody,
  };
}

function pointAlong(origin, direction, distance) {
  return {
    x: origin.x + direction.x * distance,
    y: origin.y + direction.y * distance,
    z: origin.z + direction.z * distance,
  };
}

function normalizeDirection(direction) {
  const length = Math.hypot(direction.x, direction.y, direction.z);
  if (length <= 1e-9) return null;
  return {
    x: direction.x / length,
    y: direction.y / length,
    z: direction.z / length,
  };
}

function optionCollider(value) {
  return value?.collider ?? value;
}

function optionBody(value) {
  return value?.body ?? value;
}
