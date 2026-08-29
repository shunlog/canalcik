import { Hono } from "hono";
import {
  FISA_LIMITA_FOLDER,
  MIME,
  findOrCreateChildFolder,
  findOrCreateFolder,
  isAuthError,
  uploadBuffer,
} from "../../../utils/drive.ts";
import { hasToken } from "../../../utils/googleAuth.ts";
import { loadTemplate, TEMPLATES } from "../../../templates/templateManifest.ts";
import { renderFisaLimita } from "../../../templates/renderTemplates.ts";
import type { GeneratedDocRef, MonthlyReport, MonthlyReportDetail } from "../api-types.ts";
import { db } from "../db.ts";
import { generatedDocSelect, toGeneratedDocRef } from "../dto.ts";
import {
  type ReconcilereLinie,
  UnmatchedMaterialeError,
  buildMonthlyReport,
  buildReconciliere,
  intervalMonths,
  liniiCuDiferente,
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
    um: true,
    cantitate: true,
  },
} satisfies { select: Record<string, unknown> };

const facturaLinesSelect = {
  select: {
    materialId: true,
    material: { select: { nume: true } },
    nrCart: true,
    um: true,
    cantitate: true,
  },
} satisfies { select: Record<string, unknown> };

/**
 * The three reads behind both the month list and one month's own row.
 *
 * This pulls every bon line and every factura line, not just per-month counts:
 * a row's `nrDiferente` is a comparison of the two, and the list shows one row
 * per month. The dataset is one company's maintenance log — a few hundred lines
 * a year — so a full read costs less than the per-month round-trips that would
 * avoid it.
 */
async function loadMonthsData() {
  const [bonuri, facturi, docs] = await Promise.all([
    db.bonEliberare.findMany({
      select: { id: true, data: true, materiale: bonuriLinesSelect },
    }),
    db.facturaExpeditie.findMany({
      select: {
        id: true,
        data: true,
        month: true,
        materiale: facturaLinesSelect,
      },
    }),
    db.fisaLimitaDoc.findMany({
      select: { month: true, document: { select: generatedDocSelect } },
    }),
  ]);

  const bonuriByMonth = new Map<string, typeof bonuri>();
  for (const b of bonuri) {
    // `data` is "YYYY-MM-DD", so the month is its first 7 characters.
    const month = b.data.slice(0, 7);
    const list = bonuriByMonth.get(month) ?? [];
    list.push(b);
    bonuriByMonth.set(month, list);
  }

  const facturaByMonth = new Map<string, (typeof facturi)[number]>();
  for (const f of facturi) facturaByMonth.set(f.month, f);

  const docByMonth = new Map<string, GeneratedDocRef>();
  for (const d of docs) docByMonth.set(d.month, toGeneratedDocRef(d.document));

  return { bonuriByMonth, facturaByMonth, docByMonth };
}

type MonthsData = Awaited<ReturnType<typeof loadMonthsData>>;

/** Maps the loaded rows onto the shape buildReconciliere takes. */
function reconciliereFor(month: string, data: MonthsData): ReconcilereLinie[] {
  const bonuri = data.bonuriByMonth.get(month) ?? [];
  const factura = data.facturaByMonth.get(month);
  if (bonuri.length === 0 || !factura) return [];

  return buildReconciliere({
    bonuri: bonuri.map((b) => ({
      id: b.id,
      data: b.data,
      linii: b.materiale.map((m) => ({
        id: m.id,
        materialId: m.materialId,
        materialNume: m.material.nume,
        um: m.um,
        cantitate: m.cantitate,
      })),
    })),
    facturaLinii: factura.materiale.map((m) => ({
      materialId: m.materialId,
      materialNume: m.material.nume,
      nrCart: m.nrCart,
      um: m.um,
      cantitate: m.cantitate,
    })),
  });
}

function monthlyReportRow(month: string, data: MonthsData): MonthlyReport {
  const bonuri = data.bonuriByMonth.get(month) ?? [];
  const factura = data.facturaByMonth.get(month);
  return {
    month,
    nrBonuri: bonuri.length,
    factura: factura ? { id: factura.id, data: factura.data } : null,
    document: data.docByMonth.get(month) ?? null,
    // null, not 0, when there is nothing to compare: the client shows "no
    // bonuri" / "no factura" rather than "inconsistent" for those months.
    nrDiferente:
      bonuri.length === 0 || !factura
        ? null
        : liniiCuDiferente(reconciliereFor(month, data)).length,
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

/**
 * One month's report, with the bonuri-vs-factura comparison. No 404: every
 * valid month is a legitimate report, even an empty one — the same reason the
 * list covers a continuous interval rather than only months holding records.
 */
monthlyReport.get("/:month", async (c) => {
  const month = parseMonthParam(c);
  const data = await loadMonthsData();
  const body: MonthlyReportDetail = {
    ...monthlyReportRow(month, data),
    linii: reconciliereFor(month, data),
  };
  return c.json(body);
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
        vehicul: { select: { litere: true, cifre: true, nrInventar: true } },
        materiale: bonuriLinesSelect,
      },
    }),
    db.facturaExpeditie.findFirst({
      where: { month },
      select: {
        materiale: {
          select: {
            materialId: true,
            material: { select: { nume: true } },
            nrCart: true,
            um: true,
            cantitate: true,
            pretUnitar: true,
          },
        },
      },
    }),
  ]);

  if (bonuri.length === 0) {
    throw new ApiError(400, "VALIDATION", `Luna ${month} nu are niciun bon de eliberare`);
  }
  if (!factura) {
    throw new ApiError(400, "VALIDATION", `Luna ${month} nu are o factură de expediție`);
  }

  const bonuriPentruLuna = bonuri.map((b) => ({
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
      um: m.um,
      cantitate: m.cantitate,
    })),
  }));

  // The factura is what the partner recorded and cannot be edited, so the month
  // is only reportable once our bonuri add up to it. Enforced here and not only
  // behind the disabled button: a page loaded before the last edit would
  // otherwise still produce a wrong spreadsheet.
  const diferente = liniiCuDiferente(
    buildReconciliere({
      bonuri: bonuriPentruLuna,
      facturaLinii: factura.materiale.map((m) => ({
        materialId: m.materialId,
        materialNume: m.material.nume,
        nrCart: m.nrCart,
        um: m.um,
        cantitate: m.cantitate,
      })),
    }),
  );
  if (diferente.length > 0) {
    const descriere = diferente
      .map((l) => `${l.nume} (${l.diferenta > 0 ? "+" : "−"}${Math.abs(l.diferenta)} ${l.um})`)
      .join(", ");
    throw hasDependents(
      `Datele din bonuri nu coincid cu datele din factura de expediție: ${descriere}. ` +
        `Corectează bonurile lunii și încearcă din nou.`,
    );
  }

  let sheets: ReturnType<typeof buildMonthlyReport>;
  try {
    sheets = buildMonthlyReport({
      month,
      bonuri: bonuriPentruLuna,
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

  // driveClient() throws a plain Error when token.json is absent, which
  // isAuthError() doesn't recognize — check up front so a never-authorized box
  // gets the same 409 as a dead token instead of a 500.
  if (!hasToken()) throw driveNotConnected();

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
