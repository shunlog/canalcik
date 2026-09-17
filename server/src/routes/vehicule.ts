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
import { setSoferiBody, vehiculCreate, vehiculUpdate } from "../schemas/vehicul.ts";

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
