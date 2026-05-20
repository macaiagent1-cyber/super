export function createInputRouter() {
  return {
    _keys: {},
    _pressedBuffer: {},
    _pressedFrame: {},
    _mouseDown: new Set(),
    _mousePressedBuffer: new Set(),
    _mousePressedFrame: new Set(),
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
      canvas.addEventListener('mousedown', event => this.handleMouseDown(event));
      canvas.addEventListener('mouseup', event => this.handleMouseUp(event));
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

    handleMouseDown(event) {
      if (!this._mouseDown.has(event.button)) this._mousePressedBuffer.add(event.button);
      this._mouseDown.add(event.button);
    },

    handleMouseUp(event) {
      this._mouseDown.delete(event.button);
    },

    setPointerLocked(pointerLocked) {
      this.pointerLocked = pointerLocked;
    },

    update() {
      this._pressedFrame = this._pressedBuffer;
      this._pressedBuffer = {};
      this._mousePressedFrame = this._mousePressedBuffer;
      this._mousePressedBuffer = new Set();
      this.mouseDeltaX = this._pendingMouseX;
      this.mouseDeltaY = this._pendingMouseY;
      this._pendingMouseX = 0;
      this._pendingMouseY = 0;
    },

    clear() {
      this._keys = {};
      this._pressedBuffer = {};
      this._pressedFrame = {};
      this._mouseDown = new Set();
      this._mousePressedBuffer = new Set();
      this._mousePressedFrame = new Set();
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

    isMouseDown(button) {
      return this._mouseDown.has(button);
    },

    isMousePressed(button) {
      return this._mousePressedFrame.has(button);
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
        punch: this._mousePressedFrame.has(0),
        heatVision: this.isDown('KeyE'),
        grab: this.isDown('KeyF') || this._mouseDown.has(2),
      };
    },
  };
}
