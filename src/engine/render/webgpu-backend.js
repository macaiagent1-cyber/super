export async function createWebGPUBackend({ canvas, antialias = true }) {
  if (!navigator.gpu) {
    throw new Error('WebGPU unavailable');
  }
  const { WebGPURenderer } = await import('three/webgpu');
  const renderer = new WebGPURenderer({ canvas, antialias });
  await renderer.init();
  return {
    label: 'webgpu-high',
    renderer,
    async getAdapterInfo() {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return 'WebGPU adapter unavailable';
      return adapter.info ? JSON.stringify(adapter.info) : adapter.name || 'WebGPU adapter';
    },
  };
}
