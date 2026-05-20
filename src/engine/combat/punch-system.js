import { punchImpulse } from './damage-model.js';

/**
 * Triggered when hero presses LMB. Performs a forward sphere-cast proxy via physicsWorld.raycast.
 * On hit: applies impulse if the hit body is dynamic; emits an event for VFX.
 *
 * Returns null if no hit; otherwise { distance, point, tag, bodyHandle, impulse }.
 */
export function tryPunch({
  origin,
  forward,
  physicsWorld,
  strength = 1800,
  range = 2.5,
  eventBus = null,
}) {
  if (!physicsWorld) return null;

  const hit = physicsWorld.raycast(origin, forward, range);
  if (!hit) return null;
  if (hit.tag === 'hero') return null;

  const entry = physicsWorld.bodies?.get?.(hit.bodyHandle);
  let impulse = null;
  if (entry?.body?.isDynamic?.()) {
    const mass = entry.body.mass?.() || 200;
    impulse = punchImpulse({ forward, strength, mass });
    entry.body.applyImpulse?.({ x: impulse.x, y: impulse.y, z: impulse.z }, true);
  }

  eventBus?.emit?.('combat.punch', { hit, impulse });
  return { ...hit, impulse };
}
