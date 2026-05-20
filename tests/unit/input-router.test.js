import { describe, expect, it } from 'vitest';
import { createInputRouter } from '../../src/engine/core/input-router.js';

describe('input router', () => {
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
});
