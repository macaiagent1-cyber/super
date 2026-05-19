import * as THREE from 'three';
import { inputRouter } from '../core/input-router.js';
import { clock } from '../core/clock.js';

class HeroFlight {
  constructor() {
    this.velocity = new THREE.Vector3();
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    
    // Tuning constants
    this.maxSpeed = 100;
    this.acceleration = 50;
    this.damping = 0.95;
    this.turnSpeed = 1.5;
    this.pitchSpeed = 1.2;
    this.bankingAmount = 0.5;
  }

  update(dt, heroState) {
    const { transform } = heroState;

    // Mouse look
    this.rotation.y -= inputRouter.mouse.dx * 0.002 * this.turnSpeed;
    this.rotation.x -= inputRouter.mouse.dy * 0.002 * this.pitchSpeed;
    this.rotation.x = Math.max(-Math.PI * 0.4, Math.min(Math.PI * 0.4, this.rotation.x));

    // Input thrust
    const input = new THREE.Vector3();
    if (inputRouter.isDown('KeyW')) input.z -= 1;
    if (inputRouter.isDown('KeyS')) input.z += 1;
    if (inputRouter.isDown('KeyA')) input.x -= 1;
    if (inputRouter.isDown('KeyD')) input.x += 1;
    if (inputRouter.isDown('Space')) input.y += 1;
    if (inputRouter.isDown('ShiftLeft')) input.y -= 1;

    if (input.lengthSq() > 0) {
      input.normalize();
      
      const thrust = new THREE.Vector3().copy(input);
      thrust.applyEuler(this.rotation);
      
      const speedMult = inputRouter.isDown('ShiftLeft') ? 2 : 1;
      this.velocity.addScaledVector(thrust, this.acceleration * speedMult * dt);
    }

    // Apply damping
    this.velocity.multiplyScalar(Math.pow(this.damping, dt * 60));

    // Limit speed
    if (this.velocity.length() > this.maxSpeed) {
      this.velocity.setLength(this.maxSpeed);
    }

    // Move
    transform.position.addScaledVector(this.velocity, dt);
    
    // Apply rotation
    transform.quaternion.setFromEuler(this.rotation);
    
    // Banking (visual only, for now we just rotate the mesh if we had one)
    // For now we'll just keep the transform clean.
  }
}

export const heroFlight = new HeroFlight();
