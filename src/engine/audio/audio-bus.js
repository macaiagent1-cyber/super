import { Howl, Howler } from 'howler';

// Kevin MacLeod, "Heroic Age", CC-BY 4.0, incompetech.com
const MUSIC_URL = '/assets/audio/heroic-age.mp3';

/**
 * Lightweight procedural audio bus.
 * No external SFX files: synthesized sounds are routed through Howler's
 * AudioContext/master gain when available.
 */
export function createAudioBus() {
  let ctx = null;
  let initialized = false;
  let warned = false;
  let musicNodes = null;

  function ensureContext() {
    if (initialized && ctx) {
      ctx.resume?.();
      return ctx;
    }

    try {
      ctx = Howler?.ctx;
      if (!ctx) {
        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioContextCtor();
      }
      Howler.autoUnlock = true;
      initialized = true;
      ctx.resume?.();
    } catch (error) {
      if (!warned) {
        console.warn('[audio] AudioContext unavailable', error);
        warned = true;
      }
    }

    return ctx;
  }

  function getOutputNode(c) {
    return Howler?.masterGain ?? c.destination;
  }

  function playTone({
    frequency = 220,
    duration = 0.2,
    type = 'sine',
    volume = 0.5,
    decay = true,
    noise = false,
  }) {
    const c = ensureContext();
    if (!c) return;

    const t = c.currentTime;
    const gain = c.createGain();
    gain.gain.setValueAtTime(volume, t);
    if (decay) {
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    } else {
      gain.gain.setValueAtTime(volume, t + duration);
    }
    gain.connect(getOutputNode(c));

    if (noise) {
      const bufferSize = Math.floor(c.sampleRate * duration);
      const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i += 1) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const src = c.createBufferSource();
      src.buffer = buffer;
      src.connect(gain);
      src.start(t);
      src.stop(t + duration);
      return;
    }

    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, frequency * 0.5), t + duration);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + duration);
  }

  // Real music — Howl playing the MacLeod CC-BY MP3
  let musicHowl = null;
  let musicVolume = 0.35;

  function startMusic() {
    ensureContext();
    if (musicHowl) {
      if (!musicHowl.playing()) musicHowl.play();
      return;
    }
    musicHowl = new Howl({
      src: [MUSIC_URL],
      loop: true,
      volume: musicVolume,
      html5: false,  // Web Audio for spatial/effect-routing support
      onloaderror: (id, err) => {
        console.warn('[audio] music load failed, falling back to procedural pad', err);
        startProceduralPad();
      },
      onplayerror: () => {
        // Autoplay block — try unlocking on next user gesture
        musicHowl.once('unlock', () => musicHowl.play());
      },
    });
    musicHowl.play();
  }

  function setMusicVolume(value) {
    musicVolume = Math.max(0, Math.min(1, value));
    musicHowl?.volume(musicVolume);
    if (musicNodes?.gain) musicNodes.gain.gain.value = musicVolume * 0.06;
  }

  function stopMusic() {
    musicHowl?.stop();
    if (musicNodes) {
      for (const o of musicNodes.oscs) o.stop();
      musicNodes.gain?.disconnect();
      musicNodes = null;
    }
  }

  // Procedural fallback for when the MP3 can't load (offline, file missing, etc.)
  function startProceduralPad() {
    const c = ensureContext();
    if (!c) return;
    if (musicNodes) return;
    musicNodes = { oscs: [], gain: null };

    const masterGain = c.createGain();
    masterGain.gain.value = musicVolume * 0.06;
    masterGain.connect(c.destination);
    musicNodes.gain = masterGain;

    const baseFreq = 110;
    const freqs = [baseFreq, baseFreq * 1.5, baseFreq * 2];
    for (const f of freqs) {
      const osc = c.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;

      const lfoG = c.createGain();
      lfoG.gain.value = 1.5;

      const lfo = c.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1 + Math.random() * 0.3;
      lfo.connect(lfoG).connect(osc.frequency);

      osc.connect(masterGain);
      osc.start();
      lfo.start();
      musicNodes.oscs.push(osc, lfo);
    }
  }

  return {
    ensureContext,
    startMusic,
    setMusicVolume,
    stopMusic,
    boostWhoosh() {
      playTone({ frequency: 380, duration: 0.5, type: 'sawtooth', volume: 0.25 });
    },
    punchImpact() {
      playTone({ frequency: 95, duration: 0.18, type: 'square', volume: 0.6 });
      playTone({ duration: 0.25, volume: 0.5, noise: true });
    },
    heatVisionHum() {
      playTone({ frequency: 240, duration: 0.5, type: 'triangle', volume: 0.18, decay: false });
    },
    dodgeWhoosh() {
      playTone({ frequency: 700, duration: 0.18, type: 'sine', volume: 0.4 });
    },
    carImpact() {
      playTone({ frequency: 60, duration: 0.4, type: 'square', volume: 0.5 });
      playTone({ duration: 0.4, volume: 0.6, noise: true });
    },
  };
}
