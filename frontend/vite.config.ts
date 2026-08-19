import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Same-origin in dev: the browser only ever talks to :5173, so there is no
    // CORS and no preflight, and fetch("/api/...") keeps working unchanged if
    // the built SPA is later served by the Hono process itself.
    proxy: { "/api": { target: "http://localhost:8787" } },
  },
});
