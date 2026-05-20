import { describe, expect, it } from 'vitest';
import {
  applyDamage,
  computeKnockback,
  punchImpulse,
} from '../../src/engine/combat/damage-model.js';

describe('combat damage model', () => {
  it('reduces hp by armor-mitigated damage', () => {
    const next = applyDamage({ hp: 100, armor: 10 }, { amount: 30 });
    expect(next.hp).toBe(75);
    expect(next.dead).toBe(false);
  });

  it('clamps hp at zero', () => {
    const next = applyDamage({ hp: 5, armor: 0 }, { amount: 100 });
    expect(next.hp).toBe(0);
    expect(next.dead).toBe(true);
  });

  it('knockback scales with attack strength + target mass', () => {
    const k1 = computeKnockback({ strength: 1000, mass: 1500, direction: { x: 1, y: 0, z: 0 } });
    const k2 = computeKnockback({ strength: 1000, mass: 100, direction: { x: 1, y: 0, z: 0 } });
    expect(k2.x).toBeGreaterThan(k1.x);
  });

  it('punch impulse is forward + slight up', () => {
    const impulse = punchImpulse({ forward: { x: 0, y: 0, z: -1 }, strength: 1500, mass: 200 });
    expect(impulse.z).toBeLessThan(0);
    expect(impulse.y).toBeGreaterThan(0);
  });
});
