import { describe, expect, it } from 'vitest';
import { formatPerfHud } from '../../src/engine/dev-tools/perf-hud.js';

describe('perf hud', () => {
  it('formats fps, frame ms, renderer stats, backend, and adapter', () => {
    const text = formatPerfHud({
      fps: 60,
      frameMs: 16.6,
      calls: 4,
      triangles: 1200,
      backendLabel: 'webgpu-high',
      adapterInfo: 'Apple GPU',
    });
    expect(text).toContain('FPS 60');
    expect(text).toContain('16.60 ms');
    expect(text).toContain('Draws 4');
    expect(text).toContain('Tris 1200');
    expect(text).toContain('webgpu-high');
    expect(text).toContain('Apple GPU');
  });
});
