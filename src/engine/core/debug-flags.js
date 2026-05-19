export const DEBUG = {
  SHOW_FPS: true,
  SHOW_STATS: true,
  FREE_CAMERA: false,
  DISABLE_AI: false,
  DISABLE_AUDIO: false,
  WIREFRAME: false,
  SHOW_COLLIDERS: false,
  LOG_LEVEL: 'info' // debug, info, warn, error
};

export function setDebugFlag(key, value) {
  if (key in DEBUG) {
    DEBUG[key] = value;
  }
}
