import { describe, expect, it } from 'vitest';
import { createPhysicsWorld } from '../../src/engine/world/physics-world.js';

describe('physics world', () => {
  it('loads Rapier and creates a world', async () => {
    const physics = await createPhysicsWorld();
    expect(physics.world).toBeDefined();
    expect(physics.RAPIER).toBeDefined();
  });

  it('steps a dynamic box under gravity', async () => {
    const physics = await createPhysicsWorld();
    const { body } = physics.createDynamicBox({
      position: { x: 0, y: 50, z: 0 },
      halfExtents: { x: 0.5, y: 0.5, z: 0.5 },
      mass: 10,
    });
    for (let i = 0; i < 30; i++) physics.step(1 / 60);
    const t = body.translation();
    expect(t.y).toBeLessThan(50);
  });

  it('raycasts hit static boxes', async () => {
    const physics = await createPhysicsWorld();
    physics.createStaticBox({ x: -1, y: 0, z: -1 }, { x: 1, y: 4, z: 1 }, 'building');
    const hit = physics.raycast({ x: 0, y: 2, z: -5 }, { x: 0, y: 0, z: 1 }, 20);
    expect(hit).not.toBeNull();
    expect(hit.tag).toBe('building');
  });
});
