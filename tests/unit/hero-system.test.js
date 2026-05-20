import { describe, expect, it } from 'vitest';
import { createHeroSystem } from '../../src/engine/hero/hero-system.js';
import { createCollisionWorld } from '../../src/engine/world/collision-world.js';

describe('hero system', () => {
  it('owns hero state and advances it from input intent', () => {
    const hero = createHeroSystem();
    hero.update({ throttle: 1, boost: false, yaw: 0, pitch: 0, lookX: 0, lookY: 0 }, 0.5);
    expect(hero.state.position.z).toBeLessThan(0);
    expect(hero.state.velocity.z).toBeLessThan(0);
  });

  it('keeps the capsule from falling through the collision world', () => {
    const hero = createHeroSystem();
    const world = createCollisionWorld();
    hero.setPosition({ x: 0, y: -10, z: 0 });
    hero.update({ throttle: 0, boost: false, yaw: 0, pitch: 0, lookX: 0, lookY: 0 }, 1 / 60, world);
    expect(hero.state.position.y).toBe(1.5);
  });
});
