export const APP_CONFIG = {
  quality: 'high',
  resolution: { width: 1440, height: 900 },
  targetFPS: 60,
  webGPU: true,
  seed: Math.floor(Math.random() * 1000000)
};

export function setQuality(level) {
  APP_CONFIG.quality = level;
  // Emit event for systems to react
}
