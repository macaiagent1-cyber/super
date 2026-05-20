import { FLIGHT } from '../core/constants.js';

const DODGE_IFRAMES = 0.35;
const DODGE_COOLDOWN = 0.85;
const DODGE_DURATION = 0.16;
const DODGE_LIFT_SCALE = 0.2;

/**
 * Short directional dash with brief invulnerability.
 * Trigger: KeyQ (left), KeyR (right), or Spacebar (forward).
 * Effect: hero's velocity gets a strong impulse in the dodge direction; iFrames countdown.
 */
export function createDodgeSystem({ eventBus = null } = {}) {
  let iFrames = 0;
  let cooldown = 0;
  let dashRemaining = 0;
  const dashDirection = { x: 0, z: -1 };

  function applyDash(heroState, dt, dashSpeed) {
    if (dashRemaining <= 0) return;

    const step = Math.min(dt, dashRemaining);
    heroState.velocity.x = dashDirection.x * dashSpeed;
    heroState.velocity.z = dashDirection.z * dashSpeed;
    heroState.velocity.y = Math.max(heroState.velocity.y, dashSpeed * DODGE_LIFT_SCALE);
    heroState.position.x += heroState.velocity.x * step;
    heroState.position.z += heroState.velocity.z * step;
    heroState.position.y += heroState.velocity.y * step;
    dashRemaining = Math.max(0, dashRemaining - step);
  }

  return {
    get iFrames() {
      return iFrames;
    },
    /**
     * Mutate hero state by applying dodge impulse if input.dodge is pressed-this-frame and cooldown ok.
     */
    update(heroState, intent, dt) {
      cooldown = Math.max(0, cooldown - dt);
      iFrames = Math.max(0, iFrames - dt);

      const dashSpeed = FLIGHT.boostSpeed * 1.4;

      if (intent.dodge && cooldown <= 0) {
        // Direction in hero local: dodgeDir is +X for right, -X for left, +Z/-Z for forward/back.
        let dx = intent.dodgeX || 0;
        let dz = intent.dodgeZ || 0;
        if (dx === 0 && dz === 0) dz = -1;

        const length = Math.hypot(dx, dz) || 1;
        dx /= length;
        dz /= length;

        const yaw = heroState.yaw;
        const sin = Math.sin(yaw);
        const cos = Math.cos(yaw);
        dashDirection.x = dx * cos - dz * sin;
        dashDirection.z = dx * sin + dz * cos;

        iFrames = DODGE_IFRAMES;
        cooldown = DODGE_COOLDOWN;
        dashRemaining = DODGE_DURATION;

        eventBus?.emit?.('combat.dodge', { dx, dz });
      }

      applyDash(heroState, dt, dashSpeed);
    },
    isInvulnerable() {
      return iFrames > 0;
    },
  };
}
