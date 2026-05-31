import { Hono } from "hono";
import { syncFromCsv } from "../sync.ts";

export const syncRoutes = new Hono();

// POST /api/sync
// Re-reads the CSVs in sources/ and upserts master data.
syncRoutes.post("/", async (c) => {
  const started = Date.now();
  try {
    const result = await syncFromCsv();
    return c.json({
      ok: true,
      durationMs: Date.now() - started,
      ...result,
    });
  } catch (err) {
    console.error("sync failed:", err);
    return c.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      500
    );
  }
});
