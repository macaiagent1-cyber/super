import { defineConfig } from 'vite';

// `base` is configurable so GitHub Pages (which serves from /repo-name/) and
// any path-based hosting just work. Local dev + Vercel/Netlify (which serve
// from root) override with BASE=/ or omit.
const BASE = process.env.SUPER_BASE_PATH || '/';

export default defineConfig({
  base: BASE,
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js'],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');

          if (normalizedId.includes('/node_modules/@dimforge/rapier3d-simd-compat/')) {
            return 'rapier';
          }

          if (normalizedId.includes('/node_modules/three/build/three.webgpu')) {
            return 'three-webgpu';
          }

          if (normalizedId.includes('/node_modules/three/')) {
            return 'three-core';
          }

          if (normalizedId.includes('/src/engine/')) {
            return 'engine';
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
