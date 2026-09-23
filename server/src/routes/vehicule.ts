import { Hono } from "hono";
import { db } from "../db.ts";
import {
  toVehiculDetail,
  toVehiculListItem,
  vehiculDetailSelect,
  vehiculListSelect,
} from "../dto.ts";
import { badRef, hasDependents, notFound } from "../http/errors.ts";
import { parseIdParam, readJson } from "../http/read.ts";
import {
  acumulatoareUpdate,
  anvelopeUpdate,
  setSoferiBody,
  vehiculCreate,
  vehiculUpdate,
} from "../schemas/vehicul.ts";

export const vehicule = new Hono();

vehicule.get("/", async (c) => {
  const rows = await db.vehicul.findMany({
    select: vehiculListSelect,
    orderBy: { nrInmatriculare: "asc" },
  });
  return c.json(rows.map(toVehiculListItem));
});

vehicule.post("/", async (c) => {
  const data = await readJson(c, vehiculCreate);
  const row = await db.vehicul.create({ data, select: vehiculDetailSelect });
  return c.json(toVehiculDetail(row), 201);
});

vehicule.get("/:id", async (c) => {
  const row = await db.vehicul.findUnique({
    where: { id: parseIdParam(c) },
    select: vehiculDetailSelect,
  });
  if (!row) throw notFound("Vehiculul");
  return c.json(toVehiculDetail(row));
});

vehicule.patch("/:id", async (c) => {
  const data = await readJson(c, vehiculUpdate);
  const row = await db.vehicul.update({
    where: { id: parseIdParam(c) },
    data,
    select: vehiculDetailSelect,
  });
  return c.json(toVehiculDetail(row));
});

vehicule.delete("/:id", async (c) => {
  const id = parseIdParam(c);
  const n = await db.bonEliberare.count({ where: { vehiculId: id } });
  if (n > 0) {
    throw hasDependents(
      `Vehiculul nu poate fi șters: are ${n} ${n === 1 ? "bon legat" : "bonuri legate"}. Ștergeți sau reatribuiți întâi bonurile.`,
    );
  }
  await db.vehicul.delete({ where: { id } });
  return c.body(null, 204);
});

// Only the fields actually present on an `update` entry are written — an
// omitted key means "leave this field alone" (see AnvelopeUpdateBody's doc
// comment), so `id` aside, undefined values are dropped rather than applied.
export const pickDefined = <T extends object>(obj: T): Partial<T> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;

vehicule.patch("/:id/anvelope", async (c) => {
  const id = parseIdParam(c);
  const { anvelopeLuni, anvelopeKm } = await readJson(c, anvelopeUpdate);

  // updateMany/deleteMany (rather than update/delete, keyed only by the row's
  // own id) also check vehiculId, so a row cannot be edited, created under, or
  // deleted through the wrong vehicul's page.
  await db.$transaction([
    ...(anvelopeLuni?.update ?? []).map(({ id: rowId, ...fields }) =>
      db.anvelopaLuni.updateMany({
        where: { id: rowId, vehiculId: id },
        data: pickDefined(fields),
      }),
    ),
    ...(anvelopeLuni?.create ?? []).map((data) =>
      db.anvelopaLuni.create({ data: { ...data, vehiculId: id } }),
    ),
    ...(anvelopeLuni?.delete?.length
      ? [db.anvelopaLuni.deleteMany({ where: { id: { in: anvelopeLuni.delete }, vehiculId: id } })]
      : []),
    ...(anvelopeKm?.update ?? []).map(({ id: rowId, ...fields }) =>
      db.anvelopaKm.updateMany({
        where: { id: rowId, vehiculId: id },
        data: pickDefined(fields),
      }),
    ),
    ...(anvelopeKm?.create ?? []).map((data) =>
      db.anvelopaKm.create({ data: { ...data, vehiculId: id } }),
    ),
    ...(anvelopeKm?.delete?.length
      ? [db.anvelopaKm.deleteMany({ where: { id: { in: anvelopeKm.delete }, vehiculId: id } })]
      : []),
  ]);

  const row = await db.vehicul.findUnique({ where: { id }, select: vehiculDetailSelect });
  if (!row) throw notFound("Vehiculul");
  return c.json(toVehiculDetail(row));
});

vehicule.patch("/:id/acumulatoare", async (c) => {
  const id = parseIdParam(c);
  const { acumulatoare } = await readJson(c, acumulatoareUpdate);

  // Same reasoning as PATCH /:id/anvelope above.
  await db.$transaction([
    ...(acumulatoare?.update ?? []).map(({ id: rowId, ...fields }) =>
      db.acumulator.updateMany({
        where: { id: rowId, vehiculId: id },
        data: pickDefined(fields),
      }),
    ),
    ...(acumulatoare?.create ?? []).map((data) =>
      db.acumulator.create({ data: { ...data, vehiculId: id } }),
    ),
    ...(acumulatoare?.delete?.length
      ? [db.acumulator.deleteMany({ where: { id: { in: acumulatoare.delete }, vehiculId: id } })]
      : []),
  ]);

  const row = await db.vehicul.findUnique({ where: { id }, select: vehiculDetailSelect });
  if (!row) throw notFound("Vehiculul");
  return c.json(toVehiculDetail(row));
});

vehicule.put("/:id/soferi", async (c) => {
  const id = parseIdParam(c);
  const { soferIds } = await readJson(c, setSoferiBody);
  const unique = [...new Set(soferIds)];

  const found = await db.sofer.count({ where: { id: { in: unique } } });
  if (found !== unique.length) throw badRef("Unul dintre șoferii selectați nu există");

  const row = await db.vehicul.update({
    where: { id },
    data: { soferi: { set: unique.map((soferId) => ({ id: soferId })) } },
    select: vehiculDetailSelect,
  });
  return c.json(toVehiculDetail(row));
});
