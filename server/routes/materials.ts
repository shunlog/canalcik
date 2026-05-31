import { Hono } from "hono";
import { db } from "../db.ts";

export const materialsRoutes = new Hono();

// GET /api/materials?q=<query>&limit=20
// Returns up to `limit` materials whose `cod` or `denumire` contains `q`
// (case-insensitive, simple substring match — good enough for autocomplete).
materialsRoutes.get("/", async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  const limit = clampInt(c.req.query("limit"), 1, 100, 20);

  const where = q
    ? {
        OR: [
          { cod: { contains: q } },
          { denumire: { contains: q } },
        ],
      }
    : {};

  const rows = await db.material.findMany({
    where,
    take: limit,
    orderBy: { denumire: "asc" },
    select: {
      id: true,
      cod: true,
      denumire: true,
      unitateMasura: true,
      caleCategorie: true,
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
