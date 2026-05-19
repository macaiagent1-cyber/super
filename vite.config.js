import { defineConfig } from 'vite';

// Port 5173 matches .claude/launch.json (super-dev). Avoiding open:true to keep dev server headless-friendly.
export default defineConfig({
  server: {
    port: 5173,
    strictPort: false,
    host: '127.0.0.1'
  },
  build: {
    target: 'esnext'
  }
});
