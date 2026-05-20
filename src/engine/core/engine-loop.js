export function createEngineLoop({
  clock,
  input,
  update,
  render,
  resize,
  requestFrame = window.requestAnimationFrame.bind(window),
  cancelFrame = window.cancelAnimationFrame.bind(window),
}) {
  let running = false;
  let frameHandle = null;
  let frameCount = 0;

  function frame(nowMs) {
    if (!running) return;
    step(nowMs);
    frameHandle = requestFrame(frame);
  }

  function step(nowMs) {
    const timing = clock.tick(nowMs);
    input.update();
    for (let i = 0; i < timing.steps; i += 1) {
      update(timing.fixedStep, timing);
    }
    render(timing);
    frameCount += 1;
  }

  return {
    start() {
      if (running) return;
      running = true;
      resize();
      frameHandle = requestFrame(frame);
    },
    stop() {
      running = false;
      if (frameHandle !== null) cancelFrame(frameHandle);
      frameHandle = null;
    },
    step,
    getFrameCount() {
      return frameCount;
    },
  };
}
