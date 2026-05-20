import { describe, expect, it } from 'vitest';
import { clusterBuildingsForBatches } from '../../src/engine/render/instancing-system.js';

describe('instancing system', () => {
  it('clusters buildings into no more than five batches', () => {
    const buildings = Array.from({ length: 36 }, (_, index) => ({
      size: { y: 10 + index },
      color: `hsl(${200 + index} 20% 50%)`,
    }));
    const clusters = clusterBuildingsForBatches(buildings, 5);
    expect(clusters.length).toBeLessThanOrEqual(5);
    expect(clusters.flat()).toHaveLength(36);
  });
});
