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

vehicule.patch("/:id/anvelope", async (c) => {
  const id = parseIdParam(c);
  const { anvelopeLuni = [], anvelopeKm = [] } = await readJson(c, anvelopeUpdate);

  // updateMany (rather than update, keyed only by the row's own id) also
  // checks vehiculId, so a row cannot be edited through the wrong vehicul's page.
  await db.$transaction([
    ...anvelopeLuni.map((a) =>
      db.anvelopaLuni.updateMany({
        where: { id: a.id, vehiculId: id },
        data: { dataInstalarii: a.dataInstalarii },
      }),
    ),
    ...anvelopeKm.map((a) =>
      db.anvelopaKm.updateMany({
        where: { id: a.id, vehiculId: id },
        data: { dataInstalarii: a.dataInstalarii },
      }),
    ),
  ]);

  const row = await db.vehicul.findUnique({ where: { id }, select: vehiculDetailSelect });
  if (!row) throw notFound("Vehiculul");
  return c.json(toVehiculDetail(row));
});

vehicule.patch("/:id/acumulatoare", async (c) => {
  const id = parseIdParam(c);
  const { acumulatoare } = await readJson(c, acumulatoareUpdate);

  // updateMany (rather than update, keyed only by the row's own id) also
  // checks vehiculId, so a row cannot be edited through the wrong vehicul's page.
  await db.$transaction(
    acumulatoare.map((a) =>
      db.acumulator.updateMany({
        where: { id: a.id, vehiculId: id },
        data: { dataInstalarii: a.dataInstalarii },
      }),
    ),
  );

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
