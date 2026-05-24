import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Set SHARE=1 (via `pnpm share`) to expose the dev server through Caddy
// at https://artiombn.duckdns.org. HMR then routes through the public TLS endpoint.
const PUBLIC_HOST = 'artiombn.duckdns.org';
const sharing = process.env.SHARE === '1';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    allowedHosts: [PUBLIC_HOST],
    hmr: sharing
      ? { host: PUBLIC_HOST, protocol: 'wss', clientPort: 443 }
      : undefined,
  },
});
