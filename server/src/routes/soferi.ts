import { Hono } from "hono";
import { db } from "../db.ts";
import { soferDetailSelect, soferListSelect, toSoferDetail, toSoferListItem } from "../dto.ts";
import { badRef, hasDependents, notFound } from "../http/errors.ts";
import { parseIdParam, readJson } from "../http/read.ts";
import { setVehiculeBody, soferCreate, soferUpdate } from "../schemas/sofer.ts";

export const soferi = new Hono();

soferi.get("/", async (c) => {
  const q = c.req.query("q")?.trim();
  // SQLite's LIKE is already case-insensitive for ASCII, and Prisma's
  // `mode: "insensitive"` is unsupported on this provider — so a search for
  // "ion" finds "Ion" but not "Ioan"/"IOÁN" with diacritics. Good enough here.
  const numeric = q && /^\d+$/.test(q) ? Number(q) : undefined;
  const rows = await db.sofer.findMany({
    where: q
      ? { OR: [{ nume: { contains: q } }, ...(numeric === undefined ? [] : [{ cod: numeric }])] }
      : undefined,
    select: soferListSelect,
    orderBy: { nume: "asc" },
  });
  return c.json(rows.map(toSoferListItem));
});

soferi.post("/", async (c) => {
  const data = await readJson(c, soferCreate);
  const row = await db.sofer.create({ data, select: soferDetailSelect });
  return c.json(toSoferDetail(row), 201);
});

soferi.get("/:id", async (c) => {
  const row = await db.sofer.findUnique({
    where: { id: parseIdParam(c) },
    select: soferDetailSelect,
  });
  if (!row) throw notFound("Șoferul");
  return c.json(toSoferDetail(row));
});

soferi.patch("/:id", async (c) => {
  const data = await readJson(c, soferUpdate);
  const row = await db.sofer.update({
    where: { id: parseIdParam(c) },
    data, // absent keys are `undefined`, which Prisma leaves untouched
    select: soferDetailSelect,
  });
  return c.json(toSoferDetail(row));
});

soferi.delete("/:id", async (c) => {
  const id = parseIdParam(c);
  // BonEliberare.soferId is Restrict, so Prisma would throw anyway — but its
  // error can't say how many bonuri are in the way, and that count is the whole
  // point of the message.
  const n = await db.bonEliberare.count({ where: { soferId: id } });
  if (n > 0) {
    throw hasDependents(
      `Șoferul nu poate fi șters: are ${n} ${n === 1 ? "bon legat" : "bonuri legate"}. Ștergeți sau reatribuiți întâi bonurile.`,
    );
  }
  await db.sofer.delete({ where: { id } }); // P2025 -> 404 if it's already gone
  return c.body(null, 204);
});

// Replaces the whole link set. `set` is idempotent and does connect+disconnect
// in one statement — the same primitive scripts/importFlota.ts uses.
soferi.put("/:id/vehicule", async (c) => {
  const id = parseIdParam(c);
  const { vehiculIds } = await readJson(c, setVehiculeBody);
  const unique = [...new Set(vehiculIds)];

  // `set` with an unknown id throws a bare P2025 that can't name the culprit.
  const found = await db.vehicul.count({ where: { id: { in: unique } } });
  if (found !== unique.length) throw badRef("Unul dintre vehiculele selectate nu există");

  const row = await db.sofer.update({
    where: { id },
    data: { vehicule: { set: unique.map((vehiculId) => ({ id: vehiculId })) } },
    select: soferDetailSelect,
  });
  return c.json(toSoferDetail(row));
});
