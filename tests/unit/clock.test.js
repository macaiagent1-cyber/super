import { describe, expect, it } from 'vitest';
import { createClock } from '../../src/engine/core/clock.js';

describe('clock', () => {
  it('clamps dt and exposes fixed steps', () => {
    const clock = createClock({ fixedStep: 1 / 60, maxDelta: 0.05 });
    clock.tick(0);
    const frame = clock.tick(100);
    expect(frame.rawDt).toBeCloseTo(0.1, 6);
    expect(frame.dt).toBe(0.05);
    expect(frame.steps).toBe(3);
    expect(frame.alpha).toBeGreaterThan(0);
  });

  it('applies time scale and hitstop', () => {
    const clock = createClock({ fixedStep: 0.1, maxDelta: 1 });
    clock.tick(0);
    clock.setTimeScale(0.5);
    expect(clock.tick(200).dt).toBeCloseTo(0.1, 6);
    clock.addHitstop(0.2);
    expect(clock.tick(300).dt).toBe(0);
    expect(clock.tick(500).dt).toBeGreaterThan(0);
  });
});
