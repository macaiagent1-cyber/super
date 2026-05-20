// SFC32: small fast chaotic, 32-bit, period 2^128.
// Reference: PractRand-tested, used in many JS game engines.

function fnv1a(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeSfc32(seedA, seedB, seedC, seedD) {
  let a = seedA >>> 0;
  let b = seedB >>> 0;
  let c = seedC >>> 0;
  let d = seedD >>> 0;
  return function next() {
    a |= 0; b |= 0; c |= 0; d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = ((c << 21) | (c >>> 11));
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

function makeStream(intSeed) {
  // Splat one 32-bit seed into 4 sub-seeds with golden-ratio LCG
  let s = intSeed >>> 0;
  const ks = [];
  for (let i = 0; i < 4; i++) {
    s = Math.imul(s ^ (s >>> 16), 0x85ebca6b) >>> 0;
    s = Math.imul(s ^ (s >>> 13), 0xc2b2ae35) >>> 0;
    s = (s ^ (s >>> 16)) >>> 0;
    ks.push(s);
  }
  const next = makeSfc32(ks[0], ks[1], ks[2], ks[3]);
  return {
    next,
    range(min, max) {
      return min + next() * (max - min);
    },
    int(min, maxExclusive) {
      return Math.floor(min + next() * (maxExclusive - min));
    },
  };
}

export function createRng(seed) {
  return makeStream(seed | 0);
}

export const STREAM_NAMES = ['city', 'population', 'traffic', 'weather', 'ambient', 'capture'];

export function getStream(name, seed) {
  const nameHash = fnv1a(name);
  // Combine name-hash with provided seed to derive a stream-specific sub-seed
  const subSeed = (nameHash ^ ((seed | 0) >>> 0)) >>> 0;
  return makeStream(subSeed);
}

// FNV-1a hash of a string combined with a base seed.
// Already present internally as `fnv1a` but exposed here as a named helper.
export function hashSeed(name, baseSeed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h ^ ((baseSeed | 0) >>> 0)) >>> 0;
}
