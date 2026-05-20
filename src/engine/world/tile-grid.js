import { createRng, hashSeed } from '../core/rng.js';
import { WORLD } from '../core/constants.js';

export function createTileGrid({ seed, radius = WORLD.districtRadius, tileSize = WORLD.tileSize }) {
  const cells = [];
  for (let iz = -radius; iz <= radius; iz += 1) {
    for (let ix = -radius; ix <= radius; ix += 1) {
      const cellSeed = hashSeed(`tile:${ix}:${iz}`, seed);
      const rng = createRng(cellSeed);
      cells.push({
        ix,
        iz,
        x: ix * tileSize,
        z: iz * tileSize,
        tileSize,
        seed: cellSeed,
        heightBias: Number(rng.range(0.75, 1.25).toFixed(4)),
      });
    }
  }
  return { seed, radius, tileSize, cells };
}
