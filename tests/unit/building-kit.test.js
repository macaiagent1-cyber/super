import { describe, expect, it } from 'vitest';
import { createBuildingForLot } from '../../src/engine/world/building-kit.js';
import { createRng } from '../../src/engine/core/rng.js';

describe('building kit', () => {
  it('sizes building boxes to lots and returns HSL colors', () => {
    const building = createBuildingForLot({
      lot: { x: 10, z: 20, width: 18, depth: 22 },
      rng: createRng(9),
      heightBias: 1,
    });
    expect(building.position).toEqual({ x: 10, y: building.size.y / 2, z: 20 });
    expect(building.size.x).toBeLessThanOrEqual(18);
    expect(building.size.z).toBeLessThanOrEqual(22);
    expect(building.color).toMatch(/^hsl\(/);
  });
});
