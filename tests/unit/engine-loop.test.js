import { describe, expect, it } from 'vitest';
import { createEngineLoop } from '../../src/engine/core/engine-loop.js';

describe('engine loop', () => {
  it('runs update before render and counts frames', () => {
    const calls = [];
    const loop = createEngineLoop({
      clock: {
        tick: () => ({ frame: 1, dt: 1 / 60, steps: 1, fixedStep: 1 / 60, alpha: 0 }),
      },
      input: { update: () => calls.push('input') },
      update: () => calls.push('update'),
      render: () => calls.push('render'),
      requestFrame: () => 1,
      cancelFrame: () => {},
      resize: () => calls.push('resize'),
    });
    loop.start();
    loop.step(16);
    expect(calls).toEqual(['resize', 'input', 'update', 'render']);
    expect(loop.getFrameCount()).toBe(1);
  });
});
