import { describe, expect, it } from 'vitest';
import { createHeroSystem } from '../../src/engine/hero/hero-system.js';

describe('hero system', () => {
  it('owns hero state and advances it from input intent', () => {
    const hero = createHeroSystem();
    hero.update({ throttle: 1, boost: false, yaw: 0, pitch: 0, lookX: 0, lookY: 0 }, 0.5);
    expect(hero.state.position.z).toBeLessThan(0);
    expect(hero.state.velocity.z).toBeLessThan(0);
  });
});
