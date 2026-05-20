import { describe, expect, it, beforeEach } from 'vitest';
import { createSaveStore } from '../../src/engine/save/save-store.js';

// Mock localStorage for Node test environment.
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: k => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();

global.localStorage = localStorageMock;

describe('save store', () => {
  beforeEach(() => localStorage.clear());

  it('returns defaults on first load (no save)', () => {
    const store = createSaveStore();
    const data = store.load();
    expect(data._isDefault).toBe(true);
    expect(data.settings.quality).toBe('high');
  });

  it('roundtrips a save', () => {
    const store = createSaveStore();
    const ok = store.save({
      settings: { quality: 'ultra', mouseSensitivity: 1.5, musicVolume: 0.8, backend: 'auto' },
      progress: { districtsVisited: 3, threatsDestroyed: 12, carsThrown: 4, playTimeSeconds: 300 },
    });
    expect(ok).toBe(true);
    const data = store.load();
    expect(data.settings.quality).toBe('ultra');
    expect(data.progress.threatsDestroyed).toBe(12);
  });

  it('recovers from corruption (checksum mismatch)', () => {
    const store = createSaveStore();
    localStorage.setItem('super:save', JSON.stringify({
      version: 1,
      schemaHash: 'super-v1',
      payload: { settings: {}, progress: {} },
      payloadChecksum: 'badchecksum',
    }));
    const data = store.load();
    expect(data._recoveredFromCorruption).toBe(true);
    expect(localStorage.getItem('super:save:backup')).toBeTruthy();
  });

  it('recovers from broken JSON', () => {
    const store = createSaveStore();
    localStorage.setItem('super:save', '{ broken json garbage }');
    const data = store.load();
    expect(data._recoveredFromCorruption).toBe(true);
  });
});
