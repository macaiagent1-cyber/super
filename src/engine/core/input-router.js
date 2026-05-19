import { eventBus } from './event-bus.js';

class InputRouter {
  constructor() {
    this.keys = new Set();
    this.justPressed = new Set();
    this.buffer = new Set();

    this.mouse = {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      buttons: new Set()
    };

    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);

    this.enabled = false;
  }

  enable() {
    if (this.enabled) return;
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('mouseup', this.boundMouseUp);
    this.enabled = true;
  }

  disable() {
    if (!this.enabled) return;
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mousedown', this.boundMouseDown);
    window.removeEventListener('mouseup', this.boundMouseUp);
    this.enabled = false;
  }

  onKeyDown(e) {
    if (!this.keys.has(e.code)) {
      this.buffer.add(e.code);
    }
    this.keys.add(e.code);
    
    if (e.code === 'Backquote') {
      eventBus.emit('ui.toggleConsole');
    }
  }

  onKeyUp(e) {
    this.keys.delete(e.code);
  }

  onMouseMove(e) {
    this.mouse.dx += e.movementX;
    this.mouse.dy += e.movementY;
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  onMouseDown(e) {
    this.mouse.buttons.add(e.button);
  }

  onMouseUp(e) {
    this.mouse.buttons.delete(e.button);
  }

  update() {
    this.justPressed = new Set(this.buffer);
    this.buffer.clear();

    // Reset mouse delta after it's been consumed by systems
    // This is usually done at the end of the frame or by systems themselves.
    // For now, we'll let the engine loop call a clear method.
  }

  clearMouseDelta() {
    this.mouse.dx = 0;
    this.mouse.dy = 0;
  }

  isDown(code) {
    return this.keys.has(code);
  }

  isJustPressed(code) {
    return this.justPressed.has(code);
  }
}

export const inputRouter = new InputRouter();
