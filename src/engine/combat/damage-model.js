/**
 * Pure-function combat math. No DOM, no Three, no Rapier dependencies.
 */

export function applyDamage(target, { amount }) {
  const mitigated = amount * (1 - target.armor / (target.armor + 50));
  const hp = Math.max(0, target.hp - mitigated);
  return { ...target, hp, dead: hp <= 0 };
}

export function computeKnockback({ strength, mass, direction }) {
  const k = strength / Math.max(50, mass);
  return {
    x: direction.x * k,
    y: direction.y * k + 0.4 * k,
    z: direction.z * k,
  };
}

export function punchImpulse({ forward, strength, mass }) {
  const factor = strength / Math.max(80, mass);
  return {
    x: forward.x * factor,
    y: Math.abs(factor) * 0.35,
    z: forward.z * factor,
  };
}

export function isHitInArc({ heroForward, toTarget, arcAngle = 0.9 }) {
  const len = Math.hypot(toTarget.x, toTarget.y, toTarget.z) || 1;
  const tNorm = {
    x: toTarget.x / len,
    y: toTarget.y / len,
    z: toTarget.z / len,
  };
  const dot = heroForward.x * tNorm.x + heroForward.y * tNorm.y + heroForward.z * tNorm.z;
  return dot > Math.cos(arcAngle);
}
