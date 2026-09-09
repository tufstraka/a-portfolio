import { defineConfig } from 'vite';

export default defineConfig({
  base: './',

  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: { game: 'index.html', resume: 'resume.html' },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'three';
          }
        }
      }
    }
  },
  server: {
    open: false
  }
});
