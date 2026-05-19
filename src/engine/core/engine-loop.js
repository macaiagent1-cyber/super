import { clock } from './clock.js';
import { inputRouter } from './input-router.js';
import { logger } from './logger.js';
import { eventBus } from './event-bus.js';

class EngineLoop {
  constructor() {
    this.systems = [];
    this.renderSystem = null;
    this.running = false;
    this.frameId = null;

    this.onFrame = this.onFrame.bind(this);
  }

  setRenderSystem(renderSystem) {
    this.renderSystem = renderSystem;
  }

  addSystem(system) {
    this.systems.push(system);
  }

  start() {
    if (this.running) return;
    logger.info('engine', 'Starting engine loop');
    this.running = true;
    clock.start();
    inputRouter.enable();
    this.frameId = requestAnimationFrame(this.onFrame);
  }

  stop() {
    this.running = false;
    if (this.frameId) cancelAnimationFrame(this.frameId);
    inputRouter.disable();
  }

  onFrame(now) {
    if (!this.running) return;

    if (clock.update(now)) {
      inputRouter.update();

      // Fixed step updates for physics/AI/logic
      while (clock.consumeFixedStep()) {
        for (const system of this.systems) {
          if (system.fixedUpdate) {
            system.fixedUpdate(clock.fixedStep);
          }
        }
      }

      // Variable step updates
      for (const system of this.systems) {
        if (system.update) {
          system.update(clock.dt);
        }
      }

      // Render
      if (this.renderSystem) {
        this.renderSystem.render(clock.dt, clock.alpha);
      }

      inputRouter.clearMouseDelta();
    }

    this.frameId = requestAnimationFrame(this.onFrame);
  }
}

export const engineLoop = new EngineLoop();
