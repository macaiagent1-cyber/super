import { describe, expect, it } from 'vitest';
import { chooseRenderBackend } from '../../src/engine/render/render-system.js';

describe('render backend selection', () => {
  it('honors forced WebGL2', () => {
    expect(chooseRenderBackend({ forceWebGL2: true, hasWebGPU: true })).toBe('webgl2');
  });

  it('prefers WebGPU when available and not forced off', () => {
    expect(chooseRenderBackend({ forceWebGL2: false, hasWebGPU: true })).toBe('webgpu');
    expect(chooseRenderBackend({ forceWebGL2: false, hasWebGPU: false })).toBe('webgl2');
  });
});
