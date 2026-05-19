import * as THREE from 'three';
import { renderSystem } from './render-system.js';

class CameraRig {
  constructor() {
    this.target = null;
    this.offset = new THREE.Vector3(0, 5, 15);
    this.lookOffset = new THREE.Vector3(0, 2, 0);
    this.smoothSpeed = 0.125;
    
    this.currentPosition = new THREE.Vector3();
    this.idealPosition = new THREE.Vector3();
  }

  setTarget(object) {
    this.target = object;
    if (this.target) {
      this.currentPosition.copy(this.target.position).add(this.offset);
    }
  }

  update(dt) {
    if (!this.target) return;

    const camera = renderSystem.camera;
    if (!camera) return;

    // Calculate ideal position in world space
    this.idealPosition.copy(this.offset).applyQuaternion(this.target.quaternion).add(this.target.position);
    
    // Smoothly interpolate
    this.currentPosition.lerp(this.idealPosition, this.smoothSpeed);
    
    camera.position.copy(this.currentPosition);
    
    // Look at target with offset
    const targetPos = new THREE.Vector3().copy(this.lookOffset).applyQuaternion(this.target.quaternion).add(this.target.position);
    camera.lookAt(targetPos);
  }
}

export const cameraRig = new CameraRig();
