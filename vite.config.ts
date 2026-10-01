import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// URL API backend. Saat dev, fallback ke proxy lokal (lihat server.proxy di bawah)
// kalau VITE_API_URL tidak diset.
const apiUrl = process.env.VITE_API_URL ?? '';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: apiUrl
      ? undefined
      : {
          '/api': {
            target: 'http://localhost:4000',
            changeOrigin: true,
          },
        },
  },
});
