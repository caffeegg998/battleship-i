/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all local IPs
    allowedHosts: ['it63.cvn.canon.co.jp', 'all'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
