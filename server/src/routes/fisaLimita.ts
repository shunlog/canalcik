import { Hono } from "hono";
import {
  FISA_LIMITA_FOLDER,
  MIME,
  findOrCreateChildFolder,
  findOrCreateFolder,
  isAuthError,
  uploadBuffer,
} from "../../../utils/drive.ts";
import { loadTemplate, TEMPLATES } from "../../../templates/templateManifest.ts";
import { renderFisaLimita } from "../../../templates/renderTemplates.ts";
import type { FisaLimitaDocRef, FisaLimitaMonth } from "../api-types.ts";
import { db } from "../db.ts";
import { fisaLimitaDocSelect, toFisaLimitaDocRef } from "../dto.ts";
import {
  UnmatchedMaterialeError,
  buildFisaLimita,
  intervalLuni,
  numeFisierFisaLimita,
} from "../fisaLimitaData.ts";
import { ApiError, driveNotConnected, hasDependents, templateMissing } from "../http/errors.ts";
import { parseLunaParam } from "../http/read.ts";

export const fisaLimita = new Hono();

const bonuriLinesSelect = {
  select: {
    id: true,
    materialId: true,
    material: { select: { nume: true } },
    nrCart: true,
    um: true,
    cantitate: true,
  },
} satisfies { select: Record<string, unknown> };

/** The three cheap reads behind both the month list and one month's own row. */
async function loadMonthsData() {
  const [bonuriByData, facturi, docs] = await Promise.all([
    db.bonEliberare.groupBy({ by: ["data"], _count: { _all: true } }),
    db.facturaExpeditie.findMany({ select: { id: true, data: true, luna: true } }),
    db.fisaLimitaDoc.findMany({
      select: { luna: true, document: { select: fisaLimitaDocSelect } },
    }),
  ]);

  const bonuriByLuna = new Map<string, number>();
  for (const { data, _count } of bonuriByData) {
    const luna = data.slice(0, 7);
    bonuriByLuna.set(luna, (bonuriByLuna.get(luna) ?? 0) + _count._all);
  }

  const facturaByLuna = new Map<string, { id: number; data: string }>();
  for (const f of facturi) facturaByLuna.set(f.luna, { id: f.id, data: f.data });

  const docByLuna = new Map<string, FisaLimitaDocRef>();
  for (const d of docs) docByLuna.set(d.luna, toFisaLimitaDocRef(d.document));

  return { bonuriByLuna, facturaByLuna, docByLuna };
}

function monthRow(
  luna: string,
  data: Awaited<ReturnType<typeof loadMonthsData>>,
): FisaLimitaMonth {
  return {
    luna,
    nrBonuri: data.bonuriByLuna.get(luna) ?? 0,
    factura: data.facturaByLuna.get(luna) ?? null,
    document: data.docByLuna.get(luna) ?? null,
  };
}

fisaLimita.get("/", async (c) => {
  const data = await loadMonthsData();
  const luni = intervalLuni([
    ...data.bonuriByLuna.keys(),
    ...data.facturaByLuna.keys(),
    ...data.docByLuna.keys(),
  ]);
  const rows = luni.map((luna) => monthRow(luna, data)).reverse(); // newest first
  return c.json(rows);
});

fisaLimita.post("/:luna/genereaza", async (c) => {
  const luna = parseLunaParam(c);

  const [bonuri, factura] = await Promise.all([
    db.bonEliberare.findMany({
      // `data` is a "YYYY-MM-DD" string, chronological because the column is
      // a string — a string range is enough to select one calendar month.
      where: { data: { gte: `${luna}-01`, lte: `${luna}-31` } },
      select: {
        id: true,
        data: true,
        soferId: true,
        vehiculId: true,
        sofer: { select: { nume: true, cod: true } },
        vehicul: { select: { litere: true, cifre: true } },
        materiale: bonuriLinesSelect,
      },
    }),
    db.facturaExpeditie.findFirst({
      where: { luna },
      select: { materiale: { select: { materialId: true, nrCart: true, pretUnitar: true } } },
    }),
  ]);

  if (bonuri.length === 0) {
    throw new ApiError(400, "VALIDATION", `Luna ${luna} nu are niciun bon de eliberare`);
  }
  if (!factura) {
    throw new ApiError(400, "VALIDATION", `Luna ${luna} nu are o factură de expediție`);
  }

  let sheets: ReturnType<typeof buildFisaLimita>;
  try {
    sheets = buildFisaLimita({
      bonuri: bonuri.map((b) => ({
        id: b.id,
        data: b.data,
        soferId: b.soferId,
        vehiculId: b.vehiculId,
        sofer: b.sofer,
        vehicul: b.vehicul,
        linii: b.materiale.map((m) => ({
          id: m.id,
          materialId: m.materialId,
          materialNume: m.material.nume,
          nrCart: m.nrCart,
          um: m.um,
          cantitate: m.cantitate,
        })),
      })),
      facturaLinii: factura.materiale,
    });
  } catch (err) {
    if (err instanceof UnmatchedMaterialeError) {
      throw hasDependents(`${err.message}. Completează factura și încearcă din nou.`);
    }
    throw err;
  }

  if (sheets.length === 0) {
    throw new ApiError(400, "VALIDATION", `Luna ${luna} nu are linii de bon eligibile`);
  }

  let template: Buffer;
  try {
    template = loadTemplate(TEMPLATES.fisaLimita);
  } catch {
    throw templateMissing();
  }
  const buffer = renderFisaLimita(template, sheets);
  const nume = numeFisierFisaLimita(luna);

  let uploaded: { id: string; webViewLink: string };
  try {
    const folder = await findOrCreateFolder();
    const child = await findOrCreateChildFolder(FISA_LIMITA_FOLDER, folder.id);
    uploaded = await uploadBuffer({ buffer, name: nume, mimeType: MIME.xlsx, folderId: child.id });
  } catch (err) {
    if (isAuthError(err)) throw driveNotConnected();
    throw err;
  }

  await db.fisaLimitaDoc.upsert({
    where: { luna },
    create: {
      luna,
      document: {
        create: {
          kind: "fisaLimita",
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

  const data = await loadMonthsData();
  return c.json(monthRow(luna, data), 201);
});
