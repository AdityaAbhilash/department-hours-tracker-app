import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  define: {
    __BUILD_ID__: JSON.stringify(process.env.VITE_BUILD_ID || 'local-dev')
  }
});
