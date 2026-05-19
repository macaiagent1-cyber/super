import { engineLoop } from './engine/core/engine-loop.js';
import { renderSystem } from './engine/render/render-system.js';
import { heroSystem } from './engine/hero/hero-system.js';
import { districtGenerator } from './engine/world/district-generator.js';
import { cameraRig } from './engine/render/camera-rig.js';
import { logger } from './engine/core/logger.js';

class Game {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    logger.info('game', 'Initializing game');

    // Init Render
    await renderSystem.init();
    engineLoop.setRenderSystem(renderSystem);

    // Init World
    districtGenerator.generate();

    // Init Hero
    heroSystem.init();
    engineLoop.addSystem(heroSystem);
    
    // Set Camera Target
    cameraRig.setTarget(heroSystem.transform);

    this.initialized = true;
    logger.info('game', 'Game initialized');
  }

  start() {
    engineLoop.start();
  }
}

export const game = new Game();
