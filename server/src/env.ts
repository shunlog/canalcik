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

export const PORT = Number(process.env.PORT ?? 8787);
