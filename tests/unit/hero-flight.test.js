import { describe, expect, it } from 'vitest';
import { createFlightState, stepFlight } from '../../src/engine/hero/hero-flight.js';

describe('hero flight math', () => {
  it('accelerates forward from W input', () => {
    const state = createFlightState();
    const next = stepFlight(state, { throttle: 1, boost: false, yaw: 0, pitch: 0, lookX: 0, lookY: 0 }, 0.5);
    expect(next.velocity.z).toBeLessThan(0);
    expect(next.speed).toBeGreaterThan(0);
  });

  it('mouse look changes yaw and pitch', () => {
    const state = createFlightState();
    const next = stepFlight(state, { throttle: 0, boost: false, yaw: 0, pitch: 0, lookX: 100, lookY: -50 }, 1);
    expect(next.yaw).toBeGreaterThan(0);
    expect(next.pitch).toBeGreaterThan(0);
  });

  it('keyboard yaw banks into turns', () => {
    const state = createFlightState();
    const next = stepFlight(state, { throttle: 1, boost: false, yaw: 1, pitch: 0, lookX: 0, lookY: 0 }, 0.25);
    expect(next.yaw).toBeGreaterThan(0);
    expect(next.bank).toBeLessThan(0);
  });
});
