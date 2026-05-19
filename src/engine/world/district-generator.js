import * as THREE from 'three';
import { TILE_SIZE, DISTRICT_SIZE } from '../core/constants.js';
import { instancingSystem } from '../render/instancing-system.js';
import { sceneRoots } from '../render/scene-roots.js';
import { logger } from '../core/logger.js';

class DistrictGenerator {
  constructor() {
    this.buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  }

  generate() {
    logger.info('world', 'Generating 3x3 district');
    
    const count = DISTRICT_SIZE * DISTRICT_SIZE;
    instancingSystem.createInstances('buildings', this.buildingGeometry, this.buildingMaterial, count);
    
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const rotation = new THREE.Quaternion();

    let index = 0;
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const height = 20 + Math.random() * 80;
        const width = 20 + Math.random() * 20;
        const depth = 20 + Math.random() * 20;

        position.set(x * TILE_SIZE, height / 2, z * TILE_SIZE);
        scale.set(width, height, depth);
        rotation.set(0, 0, 0, 1);

        matrix.compose(position, rotation, scale);
        instancingSystem.setInstanceTransform('buildings', index, matrix);
        index++;
      }
    }
    
    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(TILE_SIZE * 10, TILE_SIZE * 10);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    sceneRoots.world.add(ground);
  }
}

export const districtGenerator = new DistrictGenerator();
