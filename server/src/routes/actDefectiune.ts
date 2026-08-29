import { Hono } from "hono";
import type { ActDefectiuneCreateBody } from "../api-types.ts";
import { db } from "../db.ts";
import {
  actDefectiuneDetailSelect,
  actDefectiuneListSelect,
  toActDefectiuneDetail,
  toActDefectiuneListItem,
} from "../dto.ts";
import { badRef, notFound } from "../http/errors.ts";
import { optionalIdQuery, parseIdParam, readJson } from "../http/read.ts";
import { actDefectiuneCreate, actDefectiuneUpdate } from "../schemas/actDefectiune.ts";

export const acteDefectiune = new Hono();

/** The three tables go in as JSON — see the note on parseLines in dto.ts. */
const toRow = ({ defectiuni, pieseSchimb, lucrari, ...scalars }: ActDefectiuneCreateBody) => ({
  ...scalars,
  defectiuni: JSON.stringify(defectiuni),
  pieseSchimb: JSON.stringify(pieseSchimb),
  lucrari: JSON.stringify(lucrari),
});

async function assertVehicul(vehiculId: number) {
  if ((await db.vehicul.count({ where: { id: vehiculId } })) === 0) {
    throw badRef("Vehiculul selectat nu există");
  }
}

acteDefectiune.get("/", async (c) => {
  const vehiculId = optionalIdQuery(c, "vehiculId");
  const from = c.req.query("from")?.trim() || undefined;
  const to = c.req.query("to")?.trim() || undefined;

  const rows = await db.actDefectiuneData.findMany({
    where: {
      vehiculId,
      // `data` is a "YYYY-MM-DD" string, which sorts and compares
      // chronologically as text — that is why the column is a string.
      data: from || to ? { gte: from, lte: to } : undefined,
    },
    select: actDefectiuneListSelect,
    orderBy: [{ data: "desc" }, { id: "desc" }],
  });
  return c.json(rows.map(toActDefectiuneListItem));
});

acteDefectiune.post("/", async (c) => {
  const body = await readJson(c, actDefectiuneCreate);
  await assertVehicul(body.vehiculId);

  const row = await db.actDefectiuneData.create({
    data: toRow(body),
    select: actDefectiuneDetailSelect,
  });
  return c.json(toActDefectiuneDetail(row), 201);
});

acteDefectiune.get("/:id", async (c) => {
  const row = await db.actDefectiuneData.findUnique({
    where: { id: parseIdParam(c) },
    select: actDefectiuneDetailSelect,
  });
  if (!row) throw notFound("Actul de defecțiune");
  return c.json(toActDefectiuneDetail(row));
});

// PUT, not PATCH: an act is one form and is saved whole, so a partial write has
// no meaning here — unlike a bon, where the lines can be left alone.
acteDefectiune.put("/:id", async (c) => {
  const body = await readJson(c, actDefectiuneUpdate);
  await assertVehicul(body.vehiculId);

  const row = await db.actDefectiuneData.update({
    where: { id: parseIdParam(c) },
    data: toRow(body),
    select: actDefectiuneDetailSelect,
  });
  return c.json(toActDefectiuneDetail(row));
});

acteDefectiune.delete("/:id", async (c) => {
  // ActDefectiuneDoc is onDelete: Cascade, so a generated document's row goes
  // with it; the file on Drive is not touched.
  await db.actDefectiuneData.delete({ where: { id: parseIdParam(c) } });
  return c.body(null, 204);
});
