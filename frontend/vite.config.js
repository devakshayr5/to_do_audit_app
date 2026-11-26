import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The proxy forwards any request starting with /api to the Node server,
// so the React code can just call fetch('/api/todos') with no CORS fuss.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:5000' },
  },
});
