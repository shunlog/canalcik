import { Hono } from "hono";
import {
  ACT_DEFECTIUNE_FOLDER,
  MIME,
  findOrCreateChildFolder,
  findOrCreateFolder,
  isAuthError,
  uploadBuffer,
} from "../../../utils/drive.ts";
import { hasToken } from "../../../utils/googleAuth.ts";
import { isoToDDMMYYYY } from "../../../utils/luni.ts";
import { renderActDefectiune } from "../../../templates/renderTemplates.ts";
import { TEMPLATES, loadTemplate } from "../../../templates/templateManifest.ts";
import type { ActDefectiuneCreateBody, ActDefectiuneDetail } from "../api-types.ts";
import { db } from "../db.ts";
import {
  actDefectiuneDetailSelect,
  actDefectiuneListSelect,
  toActDefectiuneDetail,
  toActDefectiuneListItem,
} from "../dto.ts";
import { badRef, driveNotConnected, notFound, templateMissing } from "../http/errors.ts";
import { optionalIdQuery, parseIdParam, readJson } from "../http/read.ts";
import { actDefectiuneCreate, actDefectiuneUpdate } from "../schemas/actDefectiune.ts";

export const acteDefectiune = new Hono();

const FUNCTIA_SOFER = "Sofer";
const FUNCTIA_MASINIST = "Masinist";
const vehicleType_to_functiaSofer = {
  "Autocamion": FUNCTIA_SOFER,
  "Automacara": FUNCTIA_SOFER,
  "Autoturn": FUNCTIA_SOFER,
  "Bara": FUNCTIA_MASINIST,
  "Basculantă": FUNCTIA_SOFER,
  "Duldozer": FUNCTIA_MASINIST,
  "Excavatoare": FUNCTIA_MASINIST,
  "Furgon": FUNCTIA_SOFER,
  "Manipulator": FUNCTIA_SOFER,
  "Pompă": FUNCTIA_MASINIST,
  "Remorcă": FUNCTIA_MASINIST,
  "Tractor": FUNCTIA_MASINIST,
  "Încărcător": FUNCTIA_MASINIST,
};


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

/**
 * The detail already carries the derived "Informatie activ" and the resolved
 * piesa lines, so the only translation left is the date: stored ISO, printed
 * "25.06.2026". Nothing here can be inconsistent the way a month's bonuri can
 * be, so unlike the fisa limita there is no precondition beyond the act
 * existing.
 */
acteDefectiune.post("/:id/generate", async (c) => {
  const id = parseIdParam(c);
  const row = await db.actDefectiuneData.findUnique({
    where: { id },
    select: actDefectiuneDetailSelect,
  });
  if (!row) throw notFound("Actul de defecțiune");
  const act = toActDefectiuneDetail(row);

  let template: Buffer;
  try {
    template = loadTemplate(TEMPLATES.actDefectiune);
  } catch {
    throw templateMissing();
  }
  // Field by field, not a spread: the renderer rejects any value no tag reads,
  // and the detail also carries id, vehicul and the document ref.
  const buffer = renderActDefectiune(template, {
    data: isoToDDMMYYYY(act.data),
    nrInventar: act.nrInventar,
    nrInregistrare: act.nrInregistrare,
    denumireVehicul: act.denumireVehicul,
    anProducerii: act.anProducerii,
    defectiuni: act.defectiuni,
    pieseSchimb: act.pieseSchimb,
    lucrari: act.lucrari,
  });
  const nume = numeFisierActDefectiune(act);

  // driveClient() throws a plain Error when token.json is absent, which
  // isAuthError() doesn't recognize — check up front so a never-authorized box
  // gets the same 409 as a dead token instead of a 500.
  if (!hasToken()) throw driveNotConnected();

  let uploaded: { id: string; webViewLink: string };
  try {
    const folder = await findOrCreateFolder();
    const child = await findOrCreateChildFolder(ACT_DEFECTIUNE_FOLDER, folder.id);
    uploaded = await uploadBuffer({ buffer, name: nume, mimeType: MIME.docx, folderId: child.id });
  } catch (err) {
    if (isAuthError(err)) throw driveNotConnected();
    throw err;
  }

  await db.actDefectiuneDoc.upsert({
    where: { actId: id },
    create: {
      act: { connect: { id } },
      document: {
        create: {
          kind: "actDefectiune",
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

  const updated = await db.actDefectiuneData.findUniqueOrThrow({
    where: { id },
    select: actDefectiuneDetailSelect,
  });
  return c.json(toActDefectiuneDetail(updated), 201);
});

acteDefectiune.delete("/:id", async (c) => {
  // ActDefectiuneDoc is onDelete: Cascade, so a generated document's row goes
  // with it; the file on Drive is not touched.
  await db.actDefectiuneData.delete({ where: { id: parseIdParam(c) } });
  return c.body(null, 204);
});

/** "2026-06-25_act_defectiune_CA-786.docx" — dated first so Drive sorts it. */
function numeFisierActDefectiune(act: ActDefectiuneDetail): string {
  const plate = act.nrInregistrare.trim().replace(/\s+/g, "-").replace(/[\\/]/g, "-");
  return `${act.data}_act_defectiune${plate ? `_${plate}` : ""}.docx`;
}
