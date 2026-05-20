export function formatPerfHud({ fps, frameMs, calls, triangles, backendLabel, adapterInfo }) {
  return [
    `FPS ${Math.round(fps)}`,
    `${frameMs.toFixed(2)} ms`,
    `Draws ${calls}`,
    `Tris ${triangles}`,
    backendLabel,
    adapterInfo,
  ].join('\n');
}

export function createPerfHud({ root, renderSystem }) {
  let frames = 0;
  let elapsed = 0;
  let fps = 0;
  let adapterInfo = 'adapter pending';

  renderSystem.getAdapterInfo().then(info => {
    adapterInfo = info;
  }).catch(error => {
    adapterInfo = error.message;
  });

  return {
    update(dt) {
      frames += 1;
      elapsed += dt;
      if (elapsed >= 0.25) {
        fps = frames / elapsed;
        frames = 0;
        elapsed = 0;
      }
      const stats = renderSystem.getStats();
      root.textContent = formatPerfHud({
        fps,
        frameMs: dt * 1000,
        calls: stats.calls,
        triangles: stats.triangles,
        backendLabel: stats.backendLabel,
        adapterInfo,
      });
    },
  };
}
