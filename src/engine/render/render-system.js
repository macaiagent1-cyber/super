import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { logger } from '../core/logger.js';
import { sceneRoots } from './scene-roots.js';
import { APP_CONFIG } from '../core/app-config.js';
import { cameraRig } from './camera-rig.js';

class RenderSystem {
  constructor() {
    this.renderer = null;
    this.camera = null;
    this.canvas = null;
  }

  async init() {
    logger.info('render', 'Initializing RenderSystem');

    this.renderer = new WebGPURenderer({ antialias: true, alpha: false });
    
    await this.renderer.init();
    
    this.canvas = this.renderer.domElement;
    document.body.appendChild(this.canvas);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    // Basic setup
    this.renderer.setClearColor(0x87ceeb); // Sky blue
    
    // Add a light
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(100, 200, 100);
    sceneRoots.world.add(sun);
    
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRoots.world.add(ambient);

    logger.info('render', `Renderer initialized. Backend: ${this.renderer.backendType}`);
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  render(dt, alpha) {
    cameraRig.update(dt);
    this.renderer.render(sceneRoots.world, this.camera);
  }
}

export const renderSystem = new RenderSystem();
