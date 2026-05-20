import { describe, expect, it } from 'vitest';
import { computeCameraRig } from '../../src/engine/render/camera-rig.js';

describe('camera rig', () => {
  it('places camera behind and above the hero', () => {
    const pose = computeCameraRig({
      hero: { position: { x: 0, y: 10, z: 0 }, yaw: 0, speed01: 0 },
      previous: { x: 0, y: 0, z: 0 },
      dt: 1 / 60,
    });
    expect(pose.target.y).toBeGreaterThan(10);
    expect(pose.position.z).toBeGreaterThan(0);
    expect(pose.fov).toBe(68);
  });

  it('pumps fov during boost', () => {
    const pose = computeCameraRig({
      hero: { position: { x: 0, y: 0, z: 0 }, yaw: 0, speed01: 1 },
      previous: { x: 0, y: 0, z: 0 },
      dt: 1 / 60,
    });
    expect(pose.fov).toBe(78);
  });
});
