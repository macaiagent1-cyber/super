export const FLIGHT = Object.freeze({
  gravity: -28,
  hoverSpeed: 0,
  cruiseSpeed: 42,
  boostSpeed: 86,
  acceleration: 34,
  boostAcceleration: 58,
  hoverDamping: 8,
  pitchRate: 1.8,
  yawRate: 2.4,
  mousePitchRate: 0.003,
  mouseYawRate: 0.0035,
  maxPitch: 1.1,
  bankRate: 7.5,
  maxBank: 0.72,
  capsuleRadius: 0.55,
  capsuleHeight: 1.9,
});

export const WORLD = Object.freeze({
  tileSize: 96,
  districtRadius: 1,
  drawDistance: 420,
  roadWidth: 18,
  sidewalkWidth: 4,
  minBuildingHeight: 10,
  maxBuildingHeight: 92,
});

export const RENDER = Object.freeze({
  fixedStep: 1 / 60,
  maxDelta: 0.05,
  targetFps: 60,
  highPresetMinFps: 55,
  webglLowMinFps: 30,
  cameraFov: 68,
  boostFov: 78,
});
