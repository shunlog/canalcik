import { Hono } from "hono";
import { db } from "../db.ts";
import { bonDetailSelect, bonRefSelect, toBonDetail, toBonRef } from "../dto.ts";
import { badRef, notFound } from "../http/errors.ts";
import { optionalIdQuery, parseIdParam, readJson } from "../http/read.ts";
import { bonCreate, bonUpdate, type MaterialLineInput } from "../schemas/bon.ts";

export const bonuri = new Hono();

/**
 * Lines arrive carrying the material's *name*, so the client can write a bon
 * for something the catalogue has never seen. connectOrCreate turns that name
 * into a MaterialeIntretinere row — reusing the existing one when there is a
 * match, adding it when there isn't — inside the same transaction as the bon,
 * so a failed write leaves no half-built catalogue behind.
 */
const toLineCreate = (lines: MaterialLineInput[]) =>
  lines.map(({ nume, ...line }) => ({
    ...line,
    material: { connectOrCreate: { where: { nume }, create: { nume } } },
  }));

/** Both FKs are required, so a bad id must be caught before the write. */
async function assertRefs(soferId?: number, vehiculId?: number) {
  if (soferId !== undefined && (await db.sofer.count({ where: { id: soferId } })) === 0) {
    throw badRef("Șoferul selectat nu există");
  }
  if (vehiculId !== undefined && (await db.vehicul.count({ where: { id: vehiculId } })) === 0) {
    throw badRef("Vehiculul selectat nu există");
  }
}

bonuri.get("/", async (c) => {
  const soferId = optionalIdQuery(c, "soferId");
  const vehiculId = optionalIdQuery(c, "vehiculId");
  const from = c.req.query("from")?.trim() || undefined;
  const to = c.req.query("to")?.trim() || undefined;

  const rows = await db.bonEliberare.findMany({
    where: {
      soferId,
      vehiculId,
      // `data` is a "YYYY-MM-DD" string, which sorts and compares
      // chronologically as text — that is why the column is a string.
      data: from || to ? { gte: from, lte: to } : undefined,
    },
    select: bonRefSelect,
    orderBy: [{ data: "desc" }, { id: "desc" }],
  });
  return c.json(rows.map(toBonRef));
});

bonuri.post("/", async (c) => {
  const { materiale, ...scalars } = await readJson(c, bonCreate);
  await assertRefs(scalars.soferId, scalars.vehiculId);

  const row = await db.bonEliberare.create({
    data: { ...scalars, materiale: { create: toLineCreate(materiale) } },
    select: bonDetailSelect,
  });
  return c.json(toBonDetail(row), 201);
});

bonuri.get("/:id", async (c) => {
  const row = await db.bonEliberare.findUnique({
    where: { id: parseIdParam(c) },
    select: bonDetailSelect,
  });
  if (!row) throw notFound("Bonul");
  return c.json(toBonDetail(row));
});

bonuri.patch("/:id", async (c) => {
  const { materiale, ...scalars } = await readJson(c, bonUpdate);
  await assertRefs(scalars.soferId, scalars.vehiculId);

  const row = await db.bonEliberare.update({
    where: { id: parseIdParam(c) },
    data: {
      ...scalars, // undefined keys stay untouched
      // The lines are owned by the bon and nothing references their ids, so the
      // set is replaced wholesale. Prisma runs the nested deleteMany and create
      // inside one transaction, so the bon is never observed empty.
      // Consequence: line ids are NOT stable across saves.
      ...(materiale ? { materiale: { deleteMany: {}, create: toLineCreate(materiale) } } : {}),
    },
    select: bonDetailSelect,
  });
  return c.json(toBonDetail(row));
});

bonuri.delete("/:id", async (c) => {
  // BonEliberareMaterial is onDelete: Cascade, so the lines go with it.
  await db.bonEliberare.delete({ where: { id: parseIdParam(c) } });
  return c.body(null, 204);
});
