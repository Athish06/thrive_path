import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Remove lucide-react from exclude to allow proper bundling
  optimizeDeps: {
    include: ['lucide-react'],
  },
  server: {
    headers: {
      // Remove any Permissions-Policy headers that might cause issues
      'Permissions-Policy': '',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/files': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
