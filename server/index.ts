import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { syncFromCsv } from "./sync.ts";
import { materialsRoutes } from "./routes/materials.ts";
import { vehiclesRoutes } from "./routes/vehicles.ts";
import { syncRoutes } from "./routes/sync.ts";
import { comandaRoutes } from "./routes/comanda.ts";

const PORT = Number(process.env.PORT ?? 3000);

const app = new Hono();
app.use("*", cors());

app.get("/health", (c) => c.json({ ok: true }));
app.route("/api/materials", materialsRoutes);
app.route("/api/vehicles", vehiclesRoutes);
app.route("/api/sync", syncRoutes);
app.route("/api/comanda", comandaRoutes);

async function main() {
  console.log("Syncing master data from sources/ ...");
  const started = Date.now();
  try {
    const result = await syncFromCsv();
    console.log(`Synced in ${Date.now() - started}ms:`, result);
  } catch (err) {
    console.error("Startup sync failed:", err);
  }

  serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`Server listening on http://localhost:${info.port}`);
  });
}

main();
