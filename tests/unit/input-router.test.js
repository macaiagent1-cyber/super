import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInputRouter } from '../../src/engine/core/input-router.js';

describe('input router', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('double-buffers pressed keys like fps-game', () => {
    const input = createInputRouter();
    input.handleKeyDown({ code: 'KeyW', preventDefault() {} });
    expect(input.isDown('KeyW')).toBe(true);
    expect(input.isPressed('KeyW')).toBe(false);
    input.update();
    expect(input.isPressed('KeyW')).toBe(true);
    input.update();
    expect(input.isPressed('KeyW')).toBe(false);
  });

  it('accumulates mouse look only while pointer locked', () => {
    const input = createInputRouter();
    input.setPointerLocked(false);
    input.handleMouseMove({ movementX: 20, movementY: 10 });
    input.update();
    expect(input.mouseDeltaX).toBe(0);
    expect(input.mouseDeltaY).toBe(0);
    input.setPointerLocked(true);
    input.handleMouseMove({ movementX: 20, movementY: -10 });
    input.update();
    expect(input.mouseDeltaX).toBe(20);
    expect(input.mouseDeltaY).toBe(-10);
  });

  it('double-buffers mouse button presses for punch intent', () => {
    const input = createInputRouter();
    input.handleMouseDown({ button: 0 });
    expect(input.isMouseDown(0)).toBe(true);
    expect(input.isMousePressed(0)).toBe(false);
    input.update();
    expect(input.isMousePressed(0)).toBe(true);
    expect(input.getFlightIntent().punch).toBe(true);
    input.update();
    expect(input.isMousePressed(0)).toBe(false);
    expect(input.getFlightIntent().punch).toBe(false);
    input.handleMouseUp({ button: 0 });
    expect(input.isMouseDown(0)).toBe(false);
  });

  it('merges first connected gamepad into flight intent', () => {
    const input = createInputRouter();
    const buttons = Array.from({ length: 8 }, () => ({ pressed: false }));
    for (const index of [0, 2, 5, 6, 7]) buttons[index].pressed = true;
    vi.stubGlobal('navigator', {
      getGamepads: () => [{
        connected: true,
        axes: [0.3, -0.6, 0.25, -0.5],
        buttons,
      }],
    });

    const intent = input.getFlightIntent();

    expect(intent.yaw).toBeCloseTo(0.3);
    expect(intent.pitch).toBeCloseTo(-0.6);
    expect(intent.throttle).toBeCloseTo(0.6);
    expect(intent.lookX).toBeCloseTo(2);
    expect(intent.lookY).toBeCloseTo(-4);
    expect(intent.boost).toBe(true);
    expect(intent.punch).toBe(true);
    expect(intent.heatVision).toBe(true);
    expect(intent.grab).toBe(true);
    expect(intent.dodge).toBe(true);
    expect(input.getFlightIntent().dodge).toBe(false);
  });
});
