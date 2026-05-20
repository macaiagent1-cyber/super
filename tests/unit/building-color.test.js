import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createBuildingForLot } from '../../src/engine/world/building-kit.js';

// Three.js's THREE.Color CSS parser requires comma-separated HSL.
// Modern space-separated form silently returns white. This guards against
// regressing back to space form.

function makeRng() {
  let n = 0;
  return {
    range: (lo, hi) => lo + ((n++ * 0.137) % 1) * (hi - lo),
  };
}

describe('building palette renders as actual color (not white)', () => {
  it('color string is parseable by THREE.Color and is not white', () => {
    for (let i = 0; i < 12; i += 1) {
      const building = createBuildingForLot({
        lot: { x: 0, z: 0, width: 20, depth: 20 },
        rng: makeRng(),
        heightBias: 1,
      });
      const color = new THREE.Color(building.color);
      // White = r=g=b=1. The palette has lightness ≤ 0.42 so r,g,b should all be < 0.9.
      const sum = color.r + color.g + color.b;
      expect(sum, `iteration ${i}: ${building.color} → ${color.getHexString()}`).toBeLessThan(2.7);
      expect(sum, `iteration ${i}: ${building.color} → ${color.getHexString()}`).toBeGreaterThan(0);
    }
  });

  it('uses comma-separated HSL form so THREE.Color regex matches', () => {
    const building = createBuildingForLot({
      lot: { x: 0, z: 0, width: 20, depth: 20 },
      rng: makeRng(),
      heightBias: 1,
    });
    expect(building.color).toMatch(/hsl\(\s*\d+\s*,\s*\d+(?:\.\d+)?%\s*,\s*\d+(?:\.\d+)?%\s*\)/);
  });
});
