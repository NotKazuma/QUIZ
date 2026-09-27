import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base '/' — laman di akar domain (kuiz.kazumadigital.net) dengan laluan seperti /kedai, /profil.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: { chunkSizeWarningLimit: 800 },
});
