import { RENDER } from '../core/constants.js';

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function computeCameraRig({ hero, previous, dt }) {
  const sin = Math.sin(hero.yaw);
  const cos = Math.cos(hero.yaw);
  const distance = lerp(13, 20, hero.speed01);
  const height = lerp(5.2, 7.4, hero.speed01);
  const desired = {
    x: hero.position.x - sin * distance,
    y: hero.position.y + height,
    z: hero.position.z + cos * distance,
  };
  const spring = 1 - Math.exp(-dt * 9);
  const position = {
    x: lerp(previous.x, desired.x, spring),
    y: lerp(previous.y, desired.y, spring),
    z: lerp(previous.z, desired.z, spring),
  };
  return {
    position,
    target: {
      x: hero.position.x,
      y: hero.position.y + 2.2,
      z: hero.position.z,
    },
    fov: Math.round(lerp(RENDER.cameraFov, RENDER.boostFov, hero.speed01)),
  };
}

export function updateThreeCamera(camera, rigPose) {
  camera.position.set(rigPose.position.x, rigPose.position.y, rigPose.position.z);
  camera.lookAt(rigPose.target.x, rigPose.target.y, rigPose.target.z);
  camera.fov = rigPose.fov;
  camera.updateProjectionMatrix();
}
