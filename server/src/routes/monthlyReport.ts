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
import type { FisaLimitaDocRef, MonthlyReport } from "../api-types.ts";
import { db } from "../db.ts";
import { fisaLimitaDocSelect, toFisaLimitaDocRef } from "../dto.ts";
import {
  UnmatchedMaterialeError,
  buildMonthlyReport,
  intervalMonths,
  numeFisierFisaLimita,
} from "../monthlyReportData.ts";
import { ApiError, driveNotConnected, hasDependents, templateMissing } from "../http/errors.ts";
import { parseMonthParam } from "../http/read.ts";

export const monthlyReport = new Hono();

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
    db.facturaExpeditie.findMany({ select: { id: true, data: true, month: true } }),
    db.fisaLimitaDoc.findMany({
      select: { month: true, document: { select: fisaLimitaDocSelect } },
    }),
  ]);

  const bonuriByMonth = new Map<string, number>();
  for (const { data, _count } of bonuriByData) {
    const month = data.slice(0, 7);
    bonuriByMonth.set(month, (bonuriByMonth.get(month) ?? 0) + _count._all);
  }

  const facturaByMonth = new Map<string, { id: number; data: string }>();
  for (const f of facturi) facturaByMonth.set(f.month, { id: f.id, data: f.data });

  const docByMonth = new Map<string, FisaLimitaDocRef>();
  for (const d of docs) docByMonth.set(d.month, toFisaLimitaDocRef(d.document));

  return { bonuriByMonth, facturaByMonth, docByMonth };
}

function monthlyReportRow(
  month: string,
  data: Awaited<ReturnType<typeof loadMonthsData>>,
): MonthlyReport {
  return {
    month,
    nrBonuri: data.bonuriByMonth.get(month) ?? 0,
    factura: data.facturaByMonth.get(month) ?? null,
    document: data.docByMonth.get(month) ?? null,
  };
}

monthlyReport.get("/", async (c) => {
  const data = await loadMonthsData();
  const months = intervalMonths([
    ...data.bonuriByMonth.keys(),
    ...data.facturaByMonth.keys(),
    ...data.docByMonth.keys(),
  ]);
  const rows = months.map((month) => monthlyReportRow(month, data)).reverse(); // newest first
  return c.json(rows);
});

monthlyReport.post("/:month/generate", async (c) => {
  const month = parseMonthParam(c);

  const [bonuri, factura] = await Promise.all([
    db.bonEliberare.findMany({
      // `data` is a "YYYY-MM-DD" string, chronological because the column is
      // a string — a string range is enough to select one calendar month.
      where: { data: { gte: `${month}-01`, lte: `${month}-31` } },
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
      where: { month },
      select: { materiale: { select: { materialId: true, nrCart: true, pretUnitar: true } } },
    }),
  ]);

  if (bonuri.length === 0) {
    throw new ApiError(400, "VALIDATION", `Luna ${month} nu are niciun bon de eliberare`);
  }
  if (!factura) {
    throw new ApiError(400, "VALIDATION", `Luna ${month} nu are o factură de expediție`);
  }

  let sheets: ReturnType<typeof buildMonthlyReport>;
  try {
    sheets = buildMonthlyReport({
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
    throw new ApiError(400, "VALIDATION", `Luna ${month} nu are linii de bon eligibile`);
  }

  let template: Buffer;
  try {
    template = loadTemplate(TEMPLATES.fisaLimita);
  } catch {
    throw templateMissing();
  }
  const buffer = renderFisaLimita(template, sheets);
  const nume = numeFisierFisaLimita(month);

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
    where: { month },
    create: {
      month,
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
  return c.json(monthlyReportRow(month, data), 201);
});
