import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// PERF-1 fix: rollup manualChunks. Each heavy vendor library is its own
// chunk so the browser can cache it across deploys (the app's own code
// changes often; MUI/Recharts/Framer Motion rarely do). The chunk
// names below are tuned to the heaviest imports in the audit:
//   - mui:        the entire @mui/* + @emotion surface (~500 kB)
//   - charts:     recharts (BarChart, LineChart, PieChart in Dashboard)
//   - motion:     framer-motion (used on every page transition)
//   - dates:      dayjs + @mui/x-date-pickers
//   - utils:      axios, socket.io, react-router, redux, react-toastify
//   - vendor:     everything else from node_modules
export default defineConfig({
  plugins: [react()],
  // PERF-2 fix: dev proxy. In production the frontend talks to the
  // onrender backend at https://vaidya-assist-be.onrender.com/api via
  // VITE_API_URL, but during local dev that cross-origin hop means
  // every request is a slow round trip and any preflight / CORS
  // surprise is impossible to debug. The dev server proxies /api → the
  // real backend, so locally the app uses a relative /api baseURL and
  // looks like a same-origin app to the browser. The override is
  // intentional: if a developer needs to point at a local backend
  // (e.g. a fork), VITE_API_URL_TARGET wins.
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL_TARGET || 'https://vaidya-assist-be.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          mui: [
            '@mui/material',
            '@mui/icons-material',
            '@mui/x-date-pickers',
            '@mui/system',
            '@emotion/react',
            '@emotion/styled',
            '@emotion/cache',
          ],
          charts: ['recharts'],
          motion: ['framer-motion'],
          dates: ['dayjs'],
          utils: [
            'axios',
            'socket.io-client',
            'react-router-dom',
            '@reduxjs/toolkit',
            'react-redux',
            'react-toastify',
            'prop-types',
          ],
        },
      },
    },
  },
});

// PERF-2 fix: production cache policy. Vite builds emit hashed filenames
// (e.g. index-3a2b.js) for the long-lived asset chunks, and a single
// index.html that references them. The deployment platform (Render
// static site / CDN) must serve them with these headers so the browser
// caches aggressively and the SPA picks up new versions atomically:
//
//   /assets/*  →  Cache-Control: public, max-age=31536000, immutable
//                 (the hash in the filename is the cache buster;
//                  a 1-year TTL is safe because the file content
//                  literally cannot change without the hash changing)
//
//   /*.html    →  Cache-Control: no-cache
//                 (the browser revalidates on every visit so a new
//                  deploy is picked up at the next navigation)
//
//   /api/*     →  no caching; the backend sets its own headers
//
// This is a deployment-config concern, not a Vite one — the comment
// lives here so a Render / Nginx / Cloudflare author can find the
// policy next to the build that produces the assets.
