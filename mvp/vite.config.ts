import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Both the Hono server (server/index.ts) and this proxy read PORT from
// the root .env, so changing it in one place updates both.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(import.meta.dirname, '..'), '');
  const serverPort = env.PORT ?? '3000';

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      allowedHosts: ['artiombn.duckdns.org'],
      proxy: {
        '/api': `http://localhost:${serverPort}`,
      },
    },
  };
});
