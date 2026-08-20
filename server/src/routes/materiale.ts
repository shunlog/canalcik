import { Hono } from "hono";
import { db } from "../db.ts";
import {
  materialDetailSelect,
  materialListSelect,
  toMaterialDetail,
  toMaterialListItem,
} from "../dto.ts";
import { hasDependents, notFound } from "../http/errors.ts";
import { parseIdParam, readJson } from "../http/read.ts";
import { materialCreate, materialUpdate } from "../schemas/material.ts";

export const materiale = new Hono();

materiale.get("/", async (c) => {
  const q = c.req.query("q")?.trim();
  const rows = await db.materialeIntretinere.findMany({
    where: q ? { nume: { contains: q } } : undefined,
    select: materialListSelect,
    orderBy: { nume: "asc" },
  });
  return c.json(rows.map(toMaterialListItem));
});

// Creating a material up front is optional: writing a bon that names something
// new creates it too (see routes/bonuri.ts). This is for curating the
// catalogue — adding what will be needed before the first bon asks for it.
materiale.post("/", async (c) => {
  const data = await readJson(c, materialCreate);
  const row = await db.materialeIntretinere.create({ data, select: materialListSelect });
  return c.json(toMaterialListItem(row), 201);
});

materiale.get("/:id", async (c) => {
  const row = await db.materialeIntretinere.findUnique({
    where: { id: parseIdParam(c) },
    select: materialDetailSelect,
  });
  if (!row) throw notFound("Materialul");
  return c.json(toMaterialDetail(row));
});

// Renaming rewrites the name on every bon that points here — which is the
// point: fixing a typo once fixes it everywhere it was ever written.
materiale.patch("/:id", async (c) => {
  const data = await readJson(c, materialUpdate);
  const row = await db.materialeIntretinere.update({
    where: { id: parseIdParam(c) },
    data,
    select: materialListSelect,
  });
  return c.json(toMaterialListItem(row));
});

// Both kinds of line pin the material (no onDelete), so both have to be clear
// before it can go — and the message has to name whichever one is holding it,
// or the user is sent looking through the bonuri for a line that is on a factura.
materiale.delete("/:id", async (c) => {
  const id = parseIdParam(c);
  const [nBonuri, nFacturi] = await Promise.all([
    db.bonEliberareMaterial.count({ where: { materialId: id } }),
    db.facturaExpeditieMaterial.count({ where: { materialId: id } }),
  ]);
  if (nBonuri > 0 || nFacturi > 0) {
    const parts = [
      nBonuri > 0 && `${nBonuri} ${nBonuri === 1 ? "linie de bon" : "linii de bon"}`,
      nFacturi > 0 && `${nFacturi} ${nFacturi === 1 ? "linie de factură" : "linii de factură"}`,
    ].filter(Boolean);
    throw hasDependents(
      `Materialul nu poate fi șters: apare pe ${parts.join(" și ")}. Ștergeți sau modificați întâi acele linii.`,
    );
  }
  await db.materialeIntretinere.delete({ where: { id } });
  return c.body(null, 204);
});
