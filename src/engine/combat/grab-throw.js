import { punchImpulse } from './damage-model.js';

const GRAB_RANGE = 6;
const ATTACH_OFFSET = Object.freeze({ x: 0, y: -0.2, z: 2.4 });

/**
 * Grab system. Hold KeyF or RMB: kinematic-attach the nearest dynamic body
 * in front of hero. Release: launch with forward impulse.
 */
export function createGrabSystem({ physicsWorld, eventBus = null } = {}) {
  let grabbed = null;
  let attachOffset = { ...ATTACH_OFFSET };

  // CRITICAL: when a grabbed body is destroyed (e.g., heat-vision on a held
  // car), Rapier's `removeBody` invalidates the wasm-side body. Calling
  // setNextKinematicTranslation on a removed body is undefined behavior in
  // the wasm bindings — it can crash the module or silently write garbage.
  // We listen for combat.destroyed and clear `grabbed` if the handle matches
  // so the next update() doesn't touch a dead body.
  eventBus?.on?.('combat.destroyed', payload => {
    if (!grabbed) return;
    const grabbedHandle = grabbed.entry?.body?.handle;
    if (grabbedHandle != null && payload?.bodyHandle === grabbedHandle) {
      grabbed = null;
    }
  });

  function tryGrab(heroState) {
    if (grabbed || !physicsWorld) return false;

    const forward = getForward(heroState);
    const hit = raycastIgnoringHero(physicsWorld, heroState.position, forward, GRAB_RANGE);
    if (!hit) return false;

    const entry = physicsWorld.bodies?.get?.(hit.bodyHandle);
    if (!entry || !isDynamic(entry.body)) return false;

    const body = entry.body;
    const kinematicType = physicsWorld.RAPIER?.RigidBodyType?.KinematicPositionBased;
    if (kinematicType === undefined || !body.setBodyType) return false;

    body.setBodyType(kinematicType, true);
    grabbed = { entry, prevType: 'dynamic' };
    attachOffset = { ...ATTACH_OFFSET };
    eventBus?.emit?.('combat.grab', { tag: entry.tag });
    return true;
  }

  function release(heroState, strength = 8000) {
    if (!grabbed) return false;

    const body = grabbed.entry.body;
    const dynamicType = physicsWorld.RAPIER?.RigidBodyType?.Dynamic;
    if (dynamicType === undefined || !body.setBodyType) return false;

    body.setBodyType(dynamicType, true);

    const forward = getForward(heroState);
    const mass = body.mass?.() || 200;
    const impulse = punchImpulse({ forward, strength, mass });
    body.applyImpulse?.({
      x: impulse.x,
      y: impulse.y + Math.abs(impulse.x + impulse.z) * 0.15,
      z: impulse.z,
    }, true);

    eventBus?.emit?.('combat.throw', { tag: grabbed.entry.tag });
    grabbed = null;
    return true;
  }

  function update(heroState, intent, dt) {
    if (intent.grab && !grabbed) {
      tryGrab(heroState);
    } else if (!intent.grab && grabbed) {
      release(heroState);
    }

    if (!grabbed) return;

    // Defense in depth: re-check the body is still registered in the physics
    // world before touching it. Even with the combat.destroyed listener
    // above, an out-of-order event or a non-event-mediated removeBody would
    // leave a dangling reference. Verify and self-heal.
    const stillAlive = physicsWorld.bodies?.has?.(grabbed.entry.body.handle);
    if (!stillAlive) {
      grabbed = null;
      return;
    }

    const forward = getForward(heroState);
    // Use FULL 3D forward (including Y) so the held body tracks the hero's
    // pitch during climbs and dives. Previously we only used forward.x/.z
    // which made cars lag vertically when the hero pitched up or down.
    const target = {
      x: heroState.position.x + forward.x * attachOffset.z,
      y: heroState.position.y + forward.y * attachOffset.z + attachOffset.y,
      z: heroState.position.z + forward.z * attachOffset.z,
    };
    grabbed.entry.body.setNextKinematicTranslation(target);
  }

  return { tryGrab, release, update };
}

function getForward(heroState) {
  const cosP = Math.cos(heroState.pitch);
  return {
    x: Math.sin(heroState.yaw) * cosP,
    y: Math.sin(heroState.pitch),
    z: -Math.cos(heroState.yaw) * cosP,
  };
}

function isDynamic(body) {
  return typeof body?.isDynamic === 'function' ? body.isDynamic() : false;
}

function raycastIgnoringHero(physicsWorld, origin, forward, range) {
  return physicsWorld.raycast(origin, forward, range, {
    filterPredicate(collider) {
      const body = collider.parent?.();
      const entry = body ? physicsWorld.bodies?.get?.(body.handle) : null;
      return entry?.tag !== 'hero';
    },
  });
}
