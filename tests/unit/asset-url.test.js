import { describe, it, expect } from 'vitest';
import { assetUrl } from '../../src/engine/core/asset-url.js';

// import.meta.env.BASE_URL is whatever Vitest defaults to (likely '/').
// We test the normalization invariant: regardless of base form, the result
// has exactly one slash between base and path, and no double slashes.

describe('assetUrl', () => {
  it('returns a path with exactly one slash between base and the asset path', () => {
    const url = assetUrl('assets/foo.png');
    expect(url).toMatch(/^\/(?:.+\/)?assets\/foo\.png$/);
    expect(url).not.toMatch(/\/\//);
  });

  it('strips a leading slash on the asset path', () => {
    const url = assetUrl('/assets/foo.png');
    expect(url).not.toMatch(/\/\//);
  });

  it('handles repeated leading slashes on the asset path', () => {
    const url = assetUrl('///assets/foo.png');
    expect(url).not.toMatch(/\/\//);
  });
});
