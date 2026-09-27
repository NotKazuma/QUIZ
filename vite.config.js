import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' supaya laman boleh dihos di subfolder GitHub Pages (/QUIZ/).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { chunkSizeWarningLimit: 700 },
});
