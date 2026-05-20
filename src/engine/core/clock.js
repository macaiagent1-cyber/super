export function createClock({ fixedStep = 1 / 60, maxDelta = 0.05 } = {}) {
  let lastMs = null;
  let accumulator = 0;
  let timeScale = 1;
  let hitstopRemaining = 0;
  let frame = 0;

  return {
    tick(nowMs) {
      if (lastMs === null) {
        lastMs = nowMs;
        return { frame, rawDt: 0, dt: 0, steps: 0, alpha: 0, fixedStep };
      }

      const rawDt = Math.max(0, (nowMs - lastMs) / 1000);
      lastMs = nowMs;

      let dt = Math.min(rawDt, maxDelta);
      if (hitstopRemaining > 0) {
        const consumed = Math.min(hitstopRemaining, dt);
        hitstopRemaining -= consumed;
        dt -= consumed;
      }
      dt *= timeScale;

      accumulator += dt;
      let steps = 0;
      while (accumulator >= fixedStep) {
        accumulator -= fixedStep;
        steps += 1;
      }
      frame += 1;

      return {
        frame,
        rawDt,
        dt,
        steps,
        alpha: accumulator / fixedStep,
        fixedStep,
      };
    },
    setTimeScale(nextScale) {
      timeScale = Math.max(0, nextScale);
    },
    addHitstop(seconds) {
      hitstopRemaining = Math.max(hitstopRemaining, seconds);
    },
    reset(nowMs = null) {
      lastMs = nowMs;
      accumulator = 0;
      hitstopRemaining = 0;
      frame = 0;
    },
  };
}
