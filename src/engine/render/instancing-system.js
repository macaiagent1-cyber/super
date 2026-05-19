import * as THREE from 'three';
import { sceneRoots } from './scene-roots.js';

class InstancingSystem {
  constructor() {
    this.instances = new Map();
  }

  createInstances(id, geometry, material, count) {
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    sceneRoots.world.add(mesh);
    this.instances.set(id, mesh);
    return mesh;
  }

  setInstanceTransform(id, index, matrix) {
    const mesh = this.instances.get(id);
    if (mesh) {
      mesh.setMatrixAt(index, matrix);
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  update() {
    // Frustum culling and other instance-wide updates can go here
  }
}

export const instancingSystem = new InstancingSystem();
