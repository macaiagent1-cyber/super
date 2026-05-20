import { describe, expect, it } from 'vitest';
import { createCollisionWorld } from '../../src/engine/world/collision-world.js';

describe('collision world', () => {
  it('resolves a capsule above the ground', () => {
    const world = createCollisionWorld();
    const result = world.resolveCapsule({ x: 0, y: -5, z: 0 }, 0.5, 2);
    expect(result.position.y).toBe(1.5);
    expect(result.hitGround).toBe(true);
  });

  it('raycasts against static AABBs', () => {
    const world = createCollisionWorld();
    world.addAabb({ min: { x: -1, y: 0, z: -1 }, max: { x: 1, y: 4, z: 1 }, tag: 'building' });
    const hit = world.raycast({ x: 0, y: 2, z: -5 }, { x: 0, y: 0, z: 1 }, 20);
    expect(hit.tag).toBe('building');
  });
});
