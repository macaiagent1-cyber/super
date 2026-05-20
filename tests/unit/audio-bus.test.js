import { describe, expect, it, beforeEach, vi } from 'vitest';

// Mock howler before importing audio-bus so the import picks up the mock.
vi.mock('howler', () => {
  const masterGain = { connect: vi.fn() };
  const Howler = {
    ctx: null,
    masterGain,
    autoUnlock: false,
    _volume: 1,
    volume: vi.fn(function (v) {
      if (v !== undefined) this._volume = v;
      return this._volume;
    }),
    _howls: [],
  };
  class Howl {
    constructor(opts) {
      this._opts = opts;
      Howler._howls.push(this);
    }
    play() {}
    playing() { return true; }
    stop() {}
    volume(v) {
      if (v !== undefined) this._opts.volume = v;
      return this._opts.volume;
    }
    state() { return 'loaded'; }
    once() {}
  }
  return { Howler, Howl };
});

import { Howler } from 'howler';
import { createAudioBus } from '../../src/engine/audio/audio-bus.js';

describe('audio-bus', () => {
  beforeEach(() => {
    // Reset shared Howler state between tests.
    Howler._howls.length = 0;
    Howler._volume = 1;
    Howler.ctx = null;
    Howler.volume.mockClear();
    // Provide a fake AudioContext globally.
    globalThis.window = globalThis;
    globalThis.AudioContext = class {
      constructor() {
        this.destination = { connect: vi.fn() };
        this.sampleRate = 44100;
        this.currentTime = 0;
      }
      resume() {}
      createGain() {
        return { gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() };
      }
      createOscillator() {
        return { type: 'sine', frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
      }
      createBuffer() { return { getChannelData: () => new Float32Array(64) }; }
      createBufferSource() { return { buffer: null, connect: vi.fn(), start: vi.fn(), stop: vi.fn() }; }
    };
  });

  it('setMusicVolume clamps to [0, 1]', () => {
    const bus = createAudioBus();
    bus.ensureContext();
    bus.setMusicVolume(0.42);
    expect(Howler.volume).toHaveBeenLastCalledWith(0.42);
    bus.setMusicVolume(-5);
    expect(Howler.volume).toHaveBeenLastCalledWith(0);
    bus.setMusicVolume(99);
    expect(Howler.volume).toHaveBeenLastCalledWith(1);
  });

  it('does NOT pin Howler.volume to 0 on context init (regression)', () => {
    // A previous version of ensureContext() called Howler.volume(0)
    // unconditionally, silencing SFX forever even after the slider was raised.
    const bus = createAudioBus();
    bus.ensureContext();
    const calls = Howler.volume.mock.calls;
    // Either no calls (mute-via-default-settings path) or the call sets a
    // non-zero value. Specifically: no Howler.volume(0) on init.
    const muteCalls = calls.filter(c => c[0] === 0);
    expect(muteCalls.length).toBe(0);
  });

  it('stopMusic is safe to call before startMusic', () => {
    const bus = createAudioBus();
    expect(() => bus.stopMusic()).not.toThrow();
  });

  it('exposes the procedural SFX surface', () => {
    const bus = createAudioBus();
    for (const fn of ['boostWhoosh', 'punchImpact', 'heatVisionHum', 'dodgeWhoosh', 'carImpact']) {
      expect(typeof bus[fn]).toBe('function');
      expect(() => bus[fn]()).not.toThrow();
    }
  });
});
