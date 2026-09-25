import { Hono } from "hono";
import { db } from "../db.ts";
import { bonDetailSelect, bonRefSelect, toBonDetail, toBonRef } from "../dto.ts";
import { badRef, notFound } from "../http/errors.ts";
import { parseIdParam, readJson } from "../http/read.ts";
import { bonCreate, bonUpdate, type MaterialLineInput } from "../schemas/bon.ts";

export const bonuri = new Hono();

/**
 * A line either links an existing material by id, or is a scratchpad note
 * (free-typed text, no catalogue row) — a bon line never creates a
 * MaterialeIntretinere row itself; only a factura does that (see
 * routes/facturi.ts). schemas/bon.ts's refine guarantees exactly one of
 * `materialId`/`nota` is set.
 */
const toLineCreate = (lines: MaterialLineInput[]) =>
  lines.map(({ materialId, nota, ...line }) => ({
    ...line,
    materialId: materialId ?? null,
    nota: materialId ? null : (nota ?? "").trim(),
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
  const rows = await db.bonEliberare.findMany({
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
