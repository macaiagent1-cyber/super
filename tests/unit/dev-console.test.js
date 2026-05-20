import { describe, expect, it } from 'vitest';
import { createDevConsole } from '../../src/engine/dev-tools/dev-console.js';

describe('dev console', () => {
  it('dispatches quality, seed, render backend, and perf capture commands', () => {
    const calls = [];
    const consoleApi = createDevConsole({
      setQuality: value => calls.push(['quality', value]),
      setSeed: value => calls.push(['seed', value]),
      setBackend: value => calls.push(['backend', value]),
      setPerfCapture: value => calls.push(['perf', value]),
    });
    expect(consoleApi.execute('quality high')).toBe('quality high');
    expect(consoleApi.execute('seed 42')).toBe('seed 42');
    expect(consoleApi.execute('render backend webgl2')).toBe('render backend webgl2');
    expect(consoleApi.execute('perf capture start')).toBe('perf capture start');
    expect(calls).toEqual([
      ['quality', 'high'],
      ['seed', 42],
      ['backend', 'webgl2'],
      ['perf', 'start'],
    ]);
  });
});
