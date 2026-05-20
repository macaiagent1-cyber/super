import { describe, expect, it, vi } from 'vitest';
import { tryPunch } from '../../src/engine/combat/punch-system.js';

describe('punch system', () => {
  it('returns null when no physics world', () => {
    const r = tryPunch({
      origin: { x: 0, y: 0, z: 0 },
      forward: { x: 0, y: 0, z: -1 },
      physicsWorld: null,
    });
    expect(r).toBeNull();
  });

  it('returns null when raycast misses', () => {
    const physicsWorld = {
      raycast: vi.fn(() => null),
      bodies: new Map(),
    };
    const r = tryPunch({
      origin: { x: 0, y: 0, z: 0 },
      forward: { x: 0, y: 0, z: -1 },
      physicsWorld,
    });
    expect(r).toBeNull();
    expect(physicsWorld.raycast).toHaveBeenCalled();
  });

  it('returns hit data when raycast hits', () => {
    const fakeBody = {
      isDynamic: () => false,
      mass: () => 200,
      applyImpulse: vi.fn(),
    };
    const handle = 42;
    const bodies = new Map([[handle, { tag: 'building', body: fakeBody }]]);
    const physicsWorld = {
      raycast: () => ({
        distance: 1.2,
        point: { x: 0, y: 0, z: -1.2 },
        tag: 'building',
        bodyHandle: handle,
      }),
      bodies,
    };
    const r = tryPunch({
      origin: { x: 0, y: 0, z: 0 },
      forward: { x: 0, y: 0, z: -1 },
      physicsWorld,
    });
    expect(r).toBeDefined();
    expect(r.tag).toBe('building');
    expect(r.impulse).toBeNull();
  });

  it('applies impulse and emits a combat event for dynamic bodies', () => {
    const applyImpulse = vi.fn();
    const fakeBody = {
      isDynamic: () => true,
      mass: () => 200,
      applyImpulse,
    };
    const handle = 7;
    const hit = {
      distance: 1,
      point: { x: 0, y: 0, z: -1 },
      tag: 'crate',
      bodyHandle: handle,
    };
    const eventBus = { emit: vi.fn() };
    const physicsWorld = {
      raycast: vi.fn(() => hit),
      bodies: new Map([[handle, { tag: 'crate', body: fakeBody }]]),
    };

    const r = tryPunch({
      origin: { x: 0, y: 0, z: 0 },
      forward: { x: 0, y: 0, z: -1 },
      physicsWorld,
      strength: 1800,
      eventBus,
    });

    expect(r.impulse).toMatchObject({ x: 0, z: -9 });
    expect(applyImpulse).toHaveBeenCalledWith(r.impulse, true);
    expect(eventBus.emit).toHaveBeenCalledWith('combat.punch', { hit, impulse: r.impulse });
  });

  it('ignores hero self hits', () => {
    const eventBus = { emit: vi.fn() };
    const physicsWorld = {
      raycast: vi.fn(() => ({ distance: 0.1, tag: 'hero', bodyHandle: 1 })),
      bodies: new Map(),
    };

    const r = tryPunch({
      origin: { x: 0, y: 0, z: 0 },
      forward: { x: 0, y: 0, z: -1 },
      physicsWorld,
      eventBus,
    });

    expect(r).toBeNull();
    expect(eventBus.emit).not.toHaveBeenCalled();
  });
});
