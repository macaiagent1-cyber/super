import { describe, expect, it } from 'vitest';
import { createTileGrid } from '../../src/engine/world/tile-grid.js';

describe('tile grid', () => {
  it('creates deterministic 3x3 district cells', () => {
    const grid = createTileGrid({ seed: 42, radius: 1, tileSize: 96 });
    expect(grid.cells).toHaveLength(9);
    expect(grid.cells[0]).toMatchObject({ ix: -1, iz: -1 });
    expect(grid.cells[4]).toMatchObject({ ix: 0, iz: 0, x: 0, z: 0 });
    expect(createTileGrid({ seed: 42, radius: 1, tileSize: 96 }).cells).toEqual(grid.cells);
  });
});
