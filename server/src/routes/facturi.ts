import { Hono } from "hono";
import { db } from "../db.ts";
import {
  facturaDetailSelect,
  facturaRefSelect,
  toFacturaDetail,
  toFacturaRef,
} from "../dto.ts";
import { notFound } from "../http/errors.ts";
import { parseIdParam, readJson } from "../http/read.ts";
import { facturaCreate, facturaUpdate, type FacturaLineInput } from "../schemas/factura.ts";

export const facturi = new Hono();

/**
 * Lines arrive carrying the material's `nrCart` — the invoice's nomenclature
 * code, which is the material's identity — so a delivery of something the
 * catalogue has never seen can still be recorded. connectOrCreate resolves
 * the code to a MaterialeIntretinere row inside the same transaction as the
 * factura. Matching by `nrCart` rather than `nume` is what lets two lines
 * that print the same name under different codes (different price, different
 * physical item) become two distinct materials instead of merging into one.
 * `nume`/`um` are only used on the `create` branch — an existing material's
 * name and unit are edited on its own page, not silently overwritten here.
 */
const toLineCreate = (lines: FacturaLineInput[]) =>
  lines.map(({ nrCart, nume, um, ...line }) => ({
    ...line,
    material: { connectOrCreate: { where: { nrCart }, create: { nrCart, nume, um } } },
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
