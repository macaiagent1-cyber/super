import { WORLD } from '../core/constants.js';

export function createBuildingForLot({ lot, rng, heightBias }) {
  const margin = 2;
  const width = Math.max(6, lot.width - margin * 2);
  const depth = Math.max(6, lot.depth - margin * 2);
  const height = rng.range(WORLD.minBuildingHeight, WORLD.maxBuildingHeight) * heightBias;
  const roundedHeight = Number(height.toFixed(2));
  // Varied city palette: cool office concrete, warm brick, glass tinted
  const archetype = rng.range(0, 1);
  let hue, sat, light;
  if (archetype < 0.45) {
    // cool concrete / glass towers
    hue = Math.round(rng.range(200, 235));
    sat = Math.round(rng.range(8, 22));
    light = Math.round(rng.range(22, 38));
  } else if (archetype < 0.78) {
    // warm brick / brownstone
    hue = Math.round(rng.range(20, 40));
    sat = Math.round(rng.range(22, 44));
    light = Math.round(rng.range(20, 34));
  } else {
    // accent: terracotta or teal hotel
    hue = Math.round(rng.range(0, 360));
    sat = Math.round(rng.range(30, 55));
    light = Math.round(rng.range(28, 42));
  }

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
    color: 'hsl(220 9% 12%)',  // darker asphalt — was 18% lightness, too pale
  };
}
