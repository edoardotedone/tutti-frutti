import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/tutti-frutti/',
  plugins: [react(), tailwindcss()],
  server: {
    // HMR can be disabled via DISABLE_HMR env var
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
