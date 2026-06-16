import { defineConfig } from 'vite';

export default defineConfig({
  base: '/a-portfolio/',
  publicDir: 'textures',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
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
    open: true
  }
});
