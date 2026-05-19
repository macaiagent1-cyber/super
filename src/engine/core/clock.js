import { PHYSICS_STEP, MAX_DT } from './constants.js';

class Clock {
  constructor() {
    this.startTime = 0;
    this.currentTime = 0;
    this.elapsed = 0;
    this.dt = 0;
    this.frame = 0;
    this.paused = false;
    this.timeScale = 1.0;
    
    this.accumulator = 0;
    this.fixedStep = PHYSICS_STEP;
  }

  start() {
    this.startTime = performance.now() / 1000;
    this.currentTime = this.startTime;
  }

  update(nowMs) {
    const now = nowMs / 1000;
    let frameDt = now - this.currentTime;
    this.currentTime = now;

    if (this.paused) {
      this.dt = 0;
      return false;
    }

    // Clamp dt to avoid huge jumps (e.g. after tab backgrounding)
    if (frameDt > MAX_DT) frameDt = MAX_DT;
    
    this.dt = frameDt * this.timeScale;
    this.elapsed += this.dt;
    this.frame++;

    this.accumulator += this.dt;
    
    return true;
  }

  consumeFixedStep() {
    if (this.accumulator >= this.fixedStep) {
      this.accumulator -= this.fixedStep;
      return true;
    }
    return false;
  }

  get alpha() {
    return this.accumulator / this.fixedStep;
  }

  pause() { this.paused = true; }
  resume() { this.paused = false; }
}

export const clock = new Clock();
