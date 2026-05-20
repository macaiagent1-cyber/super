function pollGamepad() {
  const pads = globalThis.navigator?.getGamepads?.() || [];
  for (const pad of pads) {
    if (pad && pad.connected) return pad;
  }
  return null;
}

// Only swallow keys the game actually consumes. Blanket `preventDefault()`
// breaks devtools (F12, Cmd+Opt+I), reload (Cmd+R, F5), tab focus, and any
// browser shortcut while the page has focus — including when NOT pointer-
// locked. With this whitelist, modifier-key combos (Cmd/Ctrl/Alt) always
// pass through to the browser regardless.
const CONSUMED_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'KeyQ', 'KeyE', 'KeyR', 'KeyF',
  'Space',
  'ShiftLeft', 'ShiftRight',
  'Escape', 'Backquote',
  'Tab',
]);

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
    _lastPadA: false,

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
      if (CONSUMED_KEYS.has(event.code) && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault?.();
      }
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
      this._lastPadA = false;
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
      const intent = {
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
        dodge: this.isPressed('Space') || this.isPressed('KeyQ') || this.isPressed('KeyR'),
        dodgeX: (this.isPressed('KeyR') ? 1 : 0) - (this.isPressed('KeyQ') ? 1 : 0),
        dodgeZ: this.isPressed('Space') ? -1 : 0,
      };

      const pad = pollGamepad();
      if (pad) {
        const deadzone = 0.15;
        const lx = Math.abs(pad.axes[0]) > deadzone ? pad.axes[0] : 0;
        const ly = Math.abs(pad.axes[1]) > deadzone ? pad.axes[1] : 0;
        const rx = Math.abs(pad.axes[2]) > deadzone ? pad.axes[2] : 0;
        const ry = Math.abs(pad.axes[3]) > deadzone ? pad.axes[3] : 0;
        intent.yaw += lx;
        intent.pitch += ly;
        intent.throttle = Math.max(intent.throttle, -ly > 0 ? -ly : 0);
        intent.lookX += rx * 8;
        intent.lookY += ry * 8;
        if (pad.buttons[7]?.pressed) intent.boost = true;
        if (pad.buttons[5]?.pressed) intent.punch = true;
        if (pad.buttons[6]?.pressed) intent.heatVision = true;
        if (pad.buttons[2]?.pressed) intent.grab = true;
        const padAPressed = !!pad.buttons[0]?.pressed;
        if (padAPressed && !this._lastPadA) {
          intent.dodge = true;
          intent.dodgeZ = -1;
        }
        this._lastPadA = padAPressed;
      }

      return intent;
    },
  };
}
