import * as THREE from 'three';

export async function createWebGL2Backend({ canvas, antialias = true }) {
  const context = canvas.getContext('webgl2', { antialias });
  if (!context) {
    throw new Error('WebGL2 unavailable');
  }
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias });
  return {
    label: 'webgl2-low',
    renderer,
    async getAdapterInfo() {
      return context.getParameter(context.RENDERER);
    },
  };
}
