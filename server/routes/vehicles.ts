import { Hono } from "hono";
import { db } from "../db.ts";

export const vehiclesRoutes = new Hono();

// GET /api/vehicles?q=<query>&limit=20
// Substring match on nrInmatriculare, model, or tip.
vehiclesRoutes.get("/", async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  const limit = clampInt(c.req.query("limit"), 1, 100, 20);

  const where = q
    ? {
        OR: [
          { nrInmatriculare: { contains: q } },
          { model: { contains: q } },
          { tip: { contains: q } },
        ],
      }
    : {};

  const rows = await db.vehicul.findMany({
    where,
    take: limit,
    orderBy: { nrInmatriculare: "asc" },
    select: {
      id: true,
      nrInmatriculare: true,
      nrInventar: true,
      tip: true,
      model: true,
      anProducere: true,
    },
  });

  return c.json(rows);
});

function clampInt(raw: string | undefined, min: number, max: number, fallback: number): number {
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}
