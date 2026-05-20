import { describe, expect, it } from 'vitest';
import { generateDistrict } from '../../src/engine/world/district-generator.js';

describe('district generator', () => {
  it('creates deterministic buildings and roads for a 3x3 city', () => {
    const district = generateDistrict({ seed: 42 });
    const replay = generateDistrict({ seed: 42 });
    expect(district.buildings.length).toBeGreaterThanOrEqual(36);
    expect(district.roads.length).toBe(18);
    expect(replay).toEqual(district);
  });
});
