import { describe, expect, it } from 'vitest';
import { FLIGHT, WORLD, RENDER } from '../../src/engine/core/constants.js';

describe('core constants', () => {
  it('exports numeric flight tuning', () => {
    expect(FLIGHT.gravity).toBeTypeOf('number');
    expect(FLIGHT.hoverDamping).toBeGreaterThan(0);
    expect(FLIGHT.cruiseSpeed).toBeGreaterThan(FLIGHT.hoverSpeed);
    expect(FLIGHT.boostSpeed).toBeGreaterThan(FLIGHT.cruiseSpeed);
  });

  it('exports world and render budgets', () => {
    expect(WORLD.tileSize).toBe(96);
    expect(WORLD.drawDistance).toBeGreaterThan(WORLD.tileSize);
    expect(RENDER.fixedStep).toBeCloseTo(1 / 60, 6);
    expect(RENDER.maxDelta).toBe(0.05);
  });
});
