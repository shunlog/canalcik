import { Hono } from "hono";
import type { AcumulatorRef } from "../api-types.ts";
import { db } from "../db.ts";
import { acumulatorListSelect, toAcumulatorRef, todayIso } from "../dto.ts";

export const acumulatoare = new Hono();

// The fleet-wide "Acumulatoare" page: every accumulator across every vehicul.
// Editing a row goes through PATCH /vehicule/:id/acumulatoare instead — there
// is no PATCH here.
acumulatoare.get("/", async (c) => {
  const today = todayIso();
  const rows = await db.acumulator.findMany({
    select: acumulatorListSelect,
    orderBy: { dataInstalarii: "asc" },
  });
  const body: AcumulatorRef[] = rows.map((a) => toAcumulatorRef(a, today));
  return c.json(body);
});
