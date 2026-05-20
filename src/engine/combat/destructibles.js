import { applyDamage } from './damage-model.js';

/**
 * Tracks damage state of dynamic bodies (cars, props) that can be destroyed.
 * Keeps a Map of bodyHandle -> state.
 */
export function createDestructibleSystem({ eventBus = null } = {}) {
  const states = new Map();

  return {
    /** Register a destructible. Call when spawning car/prop. */
    register(bodyHandle, { hp = 100, armor = 5, tag = 'destructible' } = {}) {
      states.set(bodyHandle, { hp, maxHp: hp, armor, tag, dead: false });
    },

    /** Apply damage. Returns next state or null if not registered. */
    damage(bodyHandle, amount) {
      const state = states.get(bodyHandle);
      if (!state || state.dead) return null;
      const next = applyDamage(state, { amount });
      Object.assign(state, next);
      if (next.dead && eventBus?.emit) {
        eventBus.emit('combat.destroyed', { bodyHandle, tag: state.tag });
      }
      return next;
    },

    /** Get current state. */
    get(bodyHandle) {
      return states.get(bodyHandle);
    },

    /** Iterator. */
    all() {
      return states.entries();
    },
  };
}
