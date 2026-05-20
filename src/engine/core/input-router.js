export function createInputRouter() {
  return {
    _keys: {},
    _pressedBuffer: {},
    _pressedFrame: {},
    _pendingMouseX: 0,
    _pendingMouseY: 0,
    mouseDeltaX: 0,
    mouseDeltaY: 0,
    pointerLocked: false,
    canvas: null,

    attach(canvas, target = window, doc = document) {
      this.canvas = canvas;
      target.addEventListener('keydown', event => this.handleKeyDown(event));
      target.addEventListener('keyup', event => this.handleKeyUp(event));
      target.addEventListener('blur', () => this.clear());
      target.addEventListener('mousemove', event => this.handleMouseMove(event));
      canvas.addEventListener('click', () => canvas.requestPointerLock?.());
      canvas.addEventListener('contextmenu', event => event.preventDefault());
      doc.addEventListener('pointerlockchange', () => {
        this.pointerLocked = doc.pointerLockElement === canvas;
      });
    },

    handleKeyDown(event) {
      if (!this._keys[event.code]) this._pressedBuffer[event.code] = true;
      this._keys[event.code] = true;
      event.preventDefault?.();
    },

    handleKeyUp(event) {
      this._keys[event.code] = false;
    },

    handleMouseMove(event) {
      if (!this.pointerLocked) return;
      this._pendingMouseX += event.movementX || 0;
      this._pendingMouseY += event.movementY || 0;
    },

    setPointerLocked(pointerLocked) {
      this.pointerLocked = pointerLocked;
    },

    update() {
      this._pressedFrame = this._pressedBuffer;
      this._pressedBuffer = {};
      this.mouseDeltaX = this._pendingMouseX;
      this.mouseDeltaY = this._pendingMouseY;
      this._pendingMouseX = 0;
      this._pendingMouseY = 0;
    },

    clear() {
      this._keys = {};
      this._pressedBuffer = {};
      this._pressedFrame = {};
      this._pendingMouseX = 0;
      this._pendingMouseY = 0;
      this.mouseDeltaX = 0;
      this.mouseDeltaY = 0;
    },

    isDown(code) {
      return !!this._keys[code];
    },

    isPressed(code) {
      return !!this._pressedFrame[code];
    },

    getFlightIntent() {
      return {
        pitch: (this.isDown('KeyS') ? 1 : 0) - (this.isDown('KeyW') ? 1 : 0),
        yaw: (this.isDown('KeyD') ? 1 : 0) - (this.isDown('KeyA') ? 1 : 0),
        throttle: this.isDown('KeyW') ? 1 : 0,
        brake: this.isDown('KeyS') ? 1 : 0,
        boost: this.isDown('ShiftLeft') || this.isDown('ShiftRight'),
        lookX: this.mouseDeltaX,
        lookY: this.mouseDeltaY,
      };
    },
  };
}
