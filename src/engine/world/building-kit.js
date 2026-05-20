import { WORLD } from '../core/constants.js';

export function createBuildingForLot({ lot, rng, heightBias }) {
  const margin = 2;
  const width = Math.max(6, lot.width - margin * 2);
  const depth = Math.max(6, lot.depth - margin * 2);
  const height = rng.range(WORLD.minBuildingHeight, WORLD.maxBuildingHeight) * heightBias;
  const roundedHeight = Number(height.toFixed(2));
  const hue = Math.round(rng.range(205, 228));
  const sat = Math.round(rng.range(18, 34));
  const light = Math.round(rng.range(38, 58));

  return {
    position: {
      x: lot.x,
      y: roundedHeight / 2,
      z: lot.z,
    },
    size: {
      x: Number(width.toFixed(2)),
      y: roundedHeight,
      z: Number(depth.toFixed(2)),
    },
    color: `hsl(${hue} ${sat}% ${light}%)`,
    lot,
  };
}

export function createRoadSegment({ x, z, width, depth }) {
  return {
    position: { x, y: 0.03, z },
    size: { x: width, y: 0.06, z: depth },
    color: 'hsl(220 11% 18%)',
  };
}
