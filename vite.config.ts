import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 1420,
    strictPort: true,
  },
  build: {
    target: 'es2020',
    minify: !process.env.TAURI_DEBUG,
    rollupOptions: {
      output: {
        manualChunks: {
          'maplibre-gl': ['maplibre-gl'],
        },
      },
    },
  },
});