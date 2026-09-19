import { Hono } from "hono";
import { db } from "../db.ts";
import {
  facturaDetailSelect,
  facturaRefSelect,
  toFacturaDetail,
  toFacturaRef,
} from "../dto.ts";
import { ApiError, notFound } from "../http/errors.ts";
import { parseIdParam, readJson } from "../http/read.ts";
import { facturaCreate, facturaUpdate, type FacturaLineInput } from "../schemas/factura.ts";

export const facturi = new Hono();

/**
 * Pre-checked here for a message the operator can act on; `month`'s `@unique`
 * in the schema is the race backstop, not the primary guard.
 */
async function checkMonthUnique(month: string, excludeId?: number) {
  const existing = await db.facturaExpeditie.findFirst({
    where: { month, ...(excludeId !== undefined ? { id: { not: excludeId } } : {}) },
  });
  if (existing) {
    throw new ApiError(
      409,
      "DUPLICATE",
      `Există deja o factură de expediție pentru luna ${month}`,
      { data: "Există deja o factură pentru această lună" },
    );
  }
}

/**
 * Lines arrive carrying the material's *name*, so a delivery of something the
 * catalogue has never seen can still be recorded. connectOrCreate resolves the
 * name to a MaterialeIntretinere row inside the same transaction as the
 * factura — see the longer note on the identical helper in routes/bonuri.ts.
 */
const toLineCreate = (lines: FacturaLineInput[]) =>
  lines.map(({ nume, ...line }) => ({
    ...line,
    material: { connectOrCreate: { where: { nume }, create: { nume } } },
  }));

facturi.get("/", async (c) => {
  const rows = await db.facturaExpeditie.findMany({
    select: facturaRefSelect,
    orderBy: [{ data: "desc" }, { id: "desc" }],
  });
  return c.json(rows.map(toFacturaRef));
});

facturi.post("/", async (c) => {
  const { materiale, ...scalars } = await readJson(c, facturaCreate);
  const month = scalars.data.slice(0, 7);
  await checkMonthUnique(month);

  const row = await db.facturaExpeditie.create({
    data: { ...scalars, month, materiale: { create: toLineCreate(materiale) } },
    select: facturaDetailSelect,
  });
  return c.json(toFacturaDetail(row), 201);
});

facturi.get("/:id", async (c) => {
  const row = await db.facturaExpeditie.findUnique({
    where: { id: parseIdParam(c) },
    select: facturaDetailSelect,
  });
  if (!row) throw notFound("Factura");
  return c.json(toFacturaDetail(row));
});

facturi.patch("/:id", async (c) => {
  const id = parseIdParam(c);
  const { materiale, ...scalars } = await readJson(c, facturaUpdate);
  const month = scalars.data !== undefined ? scalars.data.slice(0, 7) : undefined;
  if (month !== undefined) await checkMonthUnique(month, id);

  const row = await db.facturaExpeditie.update({
    where: { id },
    data: {
      ...scalars, // undefined keys stay untouched
      ...(month !== undefined ? { month } : {}),
      // The lines are owned by the factura and nothing references their ids, so
      // the set is replaced wholesale, in one transaction — same trade-off as on
      // a bon: line ids are NOT stable across saves.
      ...(materiale ? { materiale: { deleteMany: {}, create: toLineCreate(materiale) } } : {}),
    },
    select: facturaDetailSelect,
  });
  return c.json(toFacturaDetail(row));
});

facturi.delete("/:id", async (c) => {
  // FacturaExpeditieMaterial is onDelete: Cascade, so the lines go with it.
  await db.facturaExpeditie.delete({ where: { id: parseIdParam(c) } });
  return c.body(null, 204);
});
