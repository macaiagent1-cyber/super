import { FLIGHT } from '../core/constants.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function approach(current, target, amount) {
  if (current < target) return Math.min(target, current + amount);
  return Math.max(target, current - amount);
}

function length3(v) {
  return Math.hypot(v.x, v.y, v.z);
}

function normalize3(v) {
  const len = length3(v) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export function createFlightState() {
  return {
    position: { x: 0, y: 8, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    bank: 0,
    speed: 0,
    speed01: 0,
    mode: 'hover',
  };
}

export function getForwardVector(yaw, pitch) {
  const cosPitch = Math.cos(pitch);
  return normalize3({
    x: Math.sin(yaw) * cosPitch,
    y: Math.sin(pitch),
    z: -Math.cos(yaw) * cosPitch,
  });
}

export function stepFlight(state, input, dt) {
  const yawInput = input.yaw || 0;
  const pitchInput = input.pitch || 0;
  const throttle = clamp(input.throttle || 0, 0, 1);
  const targetSpeed = input.boost ? FLIGHT.boostSpeed : FLIGHT.cruiseSpeed * throttle;
  const accel = input.boost ? FLIGHT.boostAcceleration : FLIGHT.acceleration;
  const speed = approach(state.speed, targetSpeed, accel * dt);

  const yaw = state.yaw + yawInput * FLIGHT.yawRate * dt + (input.lookX || 0) * FLIGHT.mouseYawRate;
  const pitch = clamp(
    state.pitch - pitchInput * FLIGHT.pitchRate * dt - (input.lookY || 0) * FLIGHT.mousePitchRate,
    -FLIGHT.maxPitch,
    FLIGHT.maxPitch
  );
  const bankTarget = clamp(-yawInput - (input.lookX || 0) * 0.01, -1, 1) * FLIGHT.maxBank;
  const bank = approach(state.bank, bankTarget, FLIGHT.bankRate * dt);
  const forward = getForwardVector(yaw, pitch);

  let velocity = {
    x: forward.x * speed,
    y: forward.y * speed,
    z: forward.z * speed,
  };

  if (speed < 0.1) {
    const damp = Math.exp(-FLIGHT.hoverDamping * dt);
    velocity = {
      x: state.velocity.x * damp,
      y: state.velocity.y * damp,
      z: state.velocity.z * damp,
    };
  }

  const position = {
    x: state.position.x + velocity.x * dt,
    y: Math.max(1.5, state.position.y + velocity.y * dt),
    z: state.position.z + velocity.z * dt,
  };

  return {
    position,
    velocity,
    yaw,
    pitch,
    bank,
    speed,
    speed01: clamp(speed / FLIGHT.boostSpeed, 0, 1),
    mode: speed > FLIGHT.cruiseSpeed * 0.8 ? 'fly' : 'hover',
  };
}
