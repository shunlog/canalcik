import { Hono } from "hono";
import {
  COMANDA_MATERIALE_FOLDER,
  MIME,
  findOrCreateChildFolder,
  findOrCreateFolder,
  isAuthError,
  uploadBuffer,
} from "../../../utils/drive.ts";
import { hasToken } from "../../../utils/googleAuth.ts";
import { isoToDDMMYYYY } from "../../../utils/luni.ts";
import { renderComandaMateriale } from "../../../templates/renderTemplates.ts";
import { TEMPLATES, loadTemplate } from "../../../templates/templateManifest.ts";
import { db } from "../db.ts";
import {
  comandaMaterialeDetailSelect,
  comandaMaterialeListSelect,
  toComandaMaterialeDetail,
  toComandaMaterialeListItem,
} from "../dto.ts";
import { badRef, driveNotConnected, notFound, templateMissing } from "../http/errors.ts";
import { optionalIdQuery, parseIdParam, readJson } from "../http/read.ts";
import {
  comandaMaterialeCreate,
  comandaMaterialeUpdate,
  type MaterialComandaInput,
} from "../schemas/comandaMateriale.ts";

export const comenziMateriale = new Hono();

/**
 * `nr` is the row's number in the document's table, taken from the order the
 * lines arrive in — the client sends them in the order it shows them, and
 * nothing else records that order: Prisma's nested create does not hand the row
 * ids out in input order.
 */
const toLineCreate = (lines: MaterialComandaInput[]) =>
  lines.map(({ vehiculId, ...line }, i) => ({
    ...line,
    nr: i + 1,
    vehicul: { connect: { id: vehiculId } },
  }));

/** The vehicul is a required FK on every line, so a bad id must be caught before the write. */
async function assertVehicule(lines: MaterialComandaInput[]) {
  const ids = [...new Set(lines.map((l) => l.vehiculId))];
  if (ids.length === 0) return;
  if ((await db.vehicul.count({ where: { id: { in: ids } } })) !== ids.length) {
    throw badRef("Unul dintre vehiculele selectate nu există");
  }
}

comenziMateriale.get("/", async (c) => {
  const vehiculId = optionalIdQuery(c, "vehiculId");
  const from = c.req.query("from")?.trim() || undefined;
  const to = c.req.query("to")?.trim() || undefined;

  const rows = await db.comandaMaterialeData.findMany({
    where: {
      // The vehicul is on the lines, so the filter is "has a line for it".
      materiale: vehiculId ? { some: { vehiculId } } : undefined,
      // `data` is a "YYYY-MM-DD" string, which sorts and compares
      // chronologically as text — that is why the column is a string.
      data: from || to ? { gte: from, lte: to } : undefined,
    },
    select: comandaMaterialeListSelect,
    orderBy: [{ data: "desc" }, { id: "desc" }],
  });
  return c.json(rows.map(toComandaMaterialeListItem));
});

comenziMateriale.post("/", async (c) => {
  const { materiale, ...scalars } = await readJson(c, comandaMaterialeCreate);
  await assertVehicule(materiale);

  const row = await db.comandaMaterialeData.create({
    data: { ...scalars, materiale: { create: toLineCreate(materiale) } },
    select: comandaMaterialeDetailSelect,
  });
  return c.json(toComandaMaterialeDetail(row), 201);
});

comenziMateriale.get("/:id", async (c) => {
  const row = await db.comandaMaterialeData.findUnique({
    where: { id: parseIdParam(c) },
    select: comandaMaterialeDetailSelect,
  });
  if (!row) throw notFound("Comanda de materiale");
  return c.json(toComandaMaterialeDetail(row));
});

// PUT, not PATCH: a comanda is one form and is saved whole, so a partial write
// has no meaning here — the same reasoning as for an act de defectiune.
comenziMateriale.put("/:id", async (c) => {
  const { materiale, ...scalars } = await readJson(c, comandaMaterialeUpdate);
  await assertVehicule(materiale);

  const row = await db.comandaMaterialeData.update({
    where: { id: parseIdParam(c) },
    data: {
      ...scalars,
      // The lines are owned by the comanda and nothing references their ids, so
      // the set is replaced wholesale — as on a bon. Consequence: line ids are
      // NOT stable across saves.
      materiale: { deleteMany: {}, create: toLineCreate(materiale) },
    },
    select: comandaMaterialeDetailSelect,
  });
  return c.json(toComandaMaterialeDetail(row));
});

/**
 * The detail already carries each line's resolved `spec`, so the only
 * translations left are the date (stored ISO, printed "25.06.2026"), the row
 * numbers and the quantity, which the template prints as text.
 */
comenziMateriale.post("/:id/generate", async (c) => {
  const id = parseIdParam(c);
  const row = await db.comandaMaterialeData.findUnique({
    where: { id },
    select: comandaMaterialeDetailSelect,
  });
  if (!row) throw notFound("Comanda de materiale");
  const comanda = toComandaMaterialeDetail(row);

  let template: Buffer;
  try {
    template = loadTemplate(TEMPLATES.comandaMateriale);
  } catch {
    throw templateMissing();
  }
  // Field by field, not a spread: the renderer rejects any value no tag reads,
  // and the detail also carries ids, the vehicul and the document ref.
  const buffer = renderComandaMateriale(template, {
    data: isoToDDMMYYYY(comanda.data),
    materiale: comanda.materiale.map((m) => ({
      nr: m.nr,
      nume: m.nume,
      spec: m.spec,
      um: m.um,
      cantitate: String(m.cantitate),
      cod: m.cod,
    })),
  });
  const nume = `${comanda.data}_comanda_materiale.docx`;

  // driveClient() throws a plain Error when token.json is absent, which
  // isAuthError() doesn't recognize — check up front so a never-authorized box
  // gets the same 409 as a dead token instead of a 500.
  if (!hasToken()) throw driveNotConnected();

  let uploaded: { id: string; webViewLink: string };
  try {
    const folder = await findOrCreateFolder();
    const child = await findOrCreateChildFolder(COMANDA_MATERIALE_FOLDER, folder.id);
    uploaded = await uploadBuffer({ buffer, name: nume, mimeType: MIME.docx, folderId: child.id });
  } catch (err) {
    if (isAuthError(err)) throw driveNotConnected();
    throw err;
  }

  await db.comandaMaterialeDoc.upsert({
    where: { comandaId: id },
    create: {
      comanda: { connect: { id } },
      document: {
        create: {
          kind: "comandaMateriale",
          nume,
          driveFileId: uploaded.id,
          driveUrl: uploaded.webViewLink,
        },
      },
    },
    update: {
      document: {
        update: {
          nume,
          driveFileId: uploaded.id,
          driveUrl: uploaded.webViewLink,
          createdAt: new Date(),
        },
      },
    },
  });

  const updated = await db.comandaMaterialeData.findUniqueOrThrow({
    where: { id },
    select: comandaMaterialeDetailSelect,
  });
  return c.json(toComandaMaterialeDetail(updated), 201);
});

comenziMateriale.delete("/:id", async (c) => {
  // Both the lines and ComandaMaterialeDoc are onDelete: Cascade, so a
  // generated document's row goes with it; the file on Drive is not touched.
  await db.comandaMaterialeData.delete({ where: { id: parseIdParam(c) } });
  return c.body(null, 204);
});
