import { describe, expect, it } from 'vitest';
import { createDestructibleSystem } from '../../src/engine/combat/destructibles.js';

describe('destructibles', () => {
  it('damages registered bodies and marks dead at 0 hp', () => {
    const sys = createDestructibleSystem();
    sys.register(7, { hp: 50, armor: 0, tag: 'car' });
    const s1 = sys.damage(7, 30);
    expect(s1.hp).toBeCloseTo(20, 5);
    const s2 = sys.damage(7, 30);
    expect(s2.hp).toBe(0);
    expect(s2.dead).toBe(true);
  });

  it('ignores damage on unregistered or dead bodies', () => {
    const sys = createDestructibleSystem();
    expect(sys.damage(99, 100)).toBeNull();
    sys.register(1, { hp: 10 });
    sys.damage(1, 100);
    expect(sys.damage(1, 100)).toBeNull();
  });
});
