import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Vitest config for Vaidya Assist FE. Uses jsdom for DOM testing and
// reuses the Vite React plugin so JSX works in tests as in the app.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
    // jsdom's URL defaults to about:blank; react-router requires a real origin.
    // Each test file sets the URL via the `setupFiles` or per-test if needed.
  },
});
