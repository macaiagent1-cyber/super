import { WORLD } from '../core/constants.js';
import { createRng } from '../core/rng.js';
import { createBuildingForLot, createRoadSegment } from './building-kit.js';
import { createTileGrid } from './tile-grid.js';

export function generateDistrict({ seed = 42 } = {}) {
  const grid = createTileGrid({ seed, radius: 1, tileSize: WORLD.tileSize });
  const buildings = [];
  const roads = [];

  for (const cell of grid.cells) {
    const half = WORLD.tileSize / 2;
    roads.push(createRoadSegment({
      x: cell.x,
      z: cell.z,
      width: WORLD.roadWidth,
      depth: WORLD.tileSize,
    }));
    roads.push(createRoadSegment({
      x: cell.x,
      z: cell.z,
      width: WORLD.tileSize,
      depth: WORLD.roadWidth,
    }));

    const rng = createRng(cell.seed);
    const lotW = (WORLD.tileSize - WORLD.roadWidth - WORLD.sidewalkWidth * 2) / 2;
    const lotD = lotW;
    const offsets = [
      [-half / 2, -half / 2],
      [half / 2, -half / 2],
      [-half / 2, half / 2],
      [half / 2, half / 2],
    ];
    for (const [ox, oz] of offsets) {
      buildings.push(createBuildingForLot({
        lot: {
          x: Number((cell.x + ox).toFixed(2)),
          z: Number((cell.z + oz).toFixed(2)),
          width: lotW,
          depth: lotD,
        },
        rng,
        heightBias: cell.heightBias,
      }));
    }
  }

  return { seed, grid, buildings, roads };
}
