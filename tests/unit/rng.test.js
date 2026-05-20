import { describe, expect, it } from 'vitest';
import { createRng, getStream } from '../../src/engine/core/rng.js';

describe('rng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const aValues = Array.from({ length: 5 }, () => a.next());
    const bValues = Array.from({ length: 5 }, () => b.next());
    expect(aValues).toEqual(bValues);
  });

  it('produces values in [0, 1)', () => {
    const rng = createRng(1234);
    for (let i = 0; i < 100; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('different seeds produce different sequences', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a.next()).not.toBe(b.next());
  });

  it('exposes named streams: city, population, traffic, weather, ambient, capture', () => {
    const city = getStream('city', 42);
    const traffic = getStream('traffic', 42);
    expect(city.next()).toBeTypeOf('number');
    expect(traffic.next()).toBeTypeOf('number');
    expect(city.next()).not.toBe(traffic.next());  // different streams diverge
  });

  it('range and int helpers work', () => {
    const rng = createRng(99);
    const f = rng.range(10, 20);
    expect(f).toBeGreaterThanOrEqual(10);
    expect(f).toBeLessThan(20);
    const i = rng.int(5, 10);
    expect(Number.isInteger(i)).toBe(true);
    expect(i).toBeGreaterThanOrEqual(5);
    expect(i).toBeLessThan(10);
  });
});
