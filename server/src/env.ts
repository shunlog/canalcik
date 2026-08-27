import { config } from "dotenv";
import { fileURLToPath } from "node:url";

// In dev the repo root .env is the single source of config. Plain
// `dotenv/config` (what scripts/ uses) reads ./.env relative to process.cwd(),
// which is server/ when started through `pnpm --filter`, so the path is
// resolved from this module instead.
//
// In prod there is no .env in the image: compose injects the same variables
// from /srv/canalcik/.env (see deploy/). dotenv never overwrites a
// variable that is already set, and a missing file is not an error, so the same
// call is correct in both cases.
config({ path: fileURLToPath(new URL("../../.env", import.meta.url)), quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL lipsește din mediu (.env în dev, EnvironmentFile în prod)");
}

if (!process.env.TEMPLATES_DIR) {
  throw new Error("TEMPLATES_DIR lipsește din mediu (.env în dev, EnvironmentFile în prod)");
}

// Loopback by default: in prod the reverse proxy dials from the same host, and
// in dev so does Vite. Override with HOST=0.0.0.0 to reach dev from the LAN.
export const HOST = process.env.HOST ?? "127.0.0.1";
export const PORT = Number(process.env.PORT ?? 8787);
