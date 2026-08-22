import { config } from "dotenv";
import { fileURLToPath } from "node:url";

// The repo root .env is the single source of DATABASE_URL and PORT. Plain
// `dotenv/config` (what scripts/ uses) reads ./.env relative to process.cwd(),
// which is server/ when started through `pnpm --filter`, so the path is
// resolved from this module instead.
config({ path: fileURLToPath(new URL("../../.env", import.meta.url)), quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL lipsește din .env-ul din rădăcina proiectului");
}

// Loopback by default: in prod the reverse proxy dials from the same host, and
// in dev so does Vite. Override with HOST=0.0.0.0 to reach dev from the LAN.
export const HOST = process.env.HOST ?? "127.0.0.1";
export const PORT = Number(process.env.PORT ?? 8787);

// Where Google sends the browser back after consent. Left unset it is derived
// from the incoming request's origin, which is right for both dev (the browser
// talks to Vite on :5173, which proxies /api here) and prod behind Caddy. Set it
// only if that guess is wrong — whatever value is used has to be registered
// verbatim as an authorized redirect URI on the OAuth client.
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
