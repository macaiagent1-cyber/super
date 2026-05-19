import * as THREE from 'three';
import { sceneRoots } from '../render/scene-roots.js';
import { heroFlight } from './hero-flight.js';

class HeroSystem {
  constructor() {
    this.root = new THREE.Group();
    this.transform = this.root;
    this.mesh = null;
    
    this.state = {
      transform: this.transform,
      velocity: new THREE.Vector3(),
      mode: 'flight' // flight, ground
    };
  }

  init() {
    // Placeholder mesh
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.root.add(this.mesh);
    
    sceneRoots.world.add(this.root);
    
    // Initial position
    this.root.position.set(0, 50, 0);
  }

  update(dt) {
    if (this.state.mode === 'flight') {
      heroFlight.update(dt, this.state);
    }
  }
}

export const heroSystem = new HeroSystem();
