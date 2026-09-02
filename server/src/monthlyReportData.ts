import type { DataFisaLimita, DataFisaLimitaSheet } from "../../templates/renderTemplates.ts";
import { isoToDDMMYYYY, lunaSiAnul } from "../../utils/luni.ts";

// This module is pure: no `../db.ts` (instantiates PrismaClient, demands
// DATABASE_URL) and no `utils/drive.ts` (reaches googleAuth.ts, whose
// import.meta explodes under @swc/jest). Only `import type` crosses either
// boundary, so the route does the querying and this does the mapping.


/** "YYYY-MM" for the current day, in local time (not UTC — see todayLocalIso in frontend/src/lib/forms.ts). */
export function currentMonth(): string {
  return new Date().toLocaleDateString("sv-SE").slice(0, 7);
}

const monthToKey = (month: string): number => {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return y * 12 + (m - 1);
};

const keyToMonth = (key: number): string => {
  const y = Math.floor(key / 12);
  const m = (key % 12) + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
};

/**
 * The inclusive range of months covering `months` and the current month,
 * oldest first. An empty input still yields one row (the current month), and
 * the top of the range extends past the current month when a future-dated
 * record exists, so it is never invisible or ungenerable.
 */
export function intervalMonths(months: string[]): string[] {
  const keys = [currentMonth(), ...months].map(monthToKey);
  const min = Math.min(...keys);
  const max = Math.max(...keys);
  const out: string[] = [];
  for (let k = min; k <= max; k++) out.push(keyToMonth(k));
  return out;
}

export function numeFisierFisaLimita(month: string): string {
  return `${month}_fisa_limita.xlsx`;
}

/**
 * Splits a lei amount into whole lei and a zero-padded bani string, rounding
 * once at the cent boundary. The padding is load-bearing: 24.6 must print
 * "24" / "60", not "24" / "6".
 */
export function baniSplit(n: number): { lei: number; bani: string } {
  const cents = Math.round(n * 100);
  const lei = Math.floor(cents / 100);
  const bani = String(cents % 100).padStart(2, "0");
  return { lei, bani };
}

/**
 * Rounds a quantity to 3 decimals — the scale the quantity inputs allow. Sums
 * of floats are the whole point: 0.1 + 0.2 must be 0.3, both so a difference
 * can be compared against 0 and so a spreadsheet cell never prints
 * 0.30000000000000004.
 */
export const roundQty = (n: number): number => Math.round(n * 1000) / 1000;

// ------------------------------------------------------------- input shapes

// Local plain types, not Prisma.*GetPayload, so the test can write literals
// without constructing real Prisma rows.

export type MonthlyReportBonLine = {
  id: number;
  materialId: number;
  materialNume: string;
  um: string;
  cantitate: number;
};

export type MonthlyReportBon = {
  id: number;
  data: string; // "YYYY-MM-DD"
  soferId: number;
  vehiculId: number;
  sofer: { nume: string; cod: number };
  vehicul: { litere: string; cifre: string; nrInventar: number };
  linii: MonthlyReportBonLine[];
};

export type MonthlyReportFacturaLine = {
  materialId: number;
  nrCart: string;
  pretUnitar: number;
};

export type BuildMonthlyReportInput = {
  /** The month being reported, "YYYY-MM" — printed on every sheet. */
  month: string;
  bonuri: MonthlyReportBon[];
  facturaLinii: MonthlyReportFacturaLine[];
};

/** Thrown when one or more bon lines cannot be priced. Collects every offender in one pass. */
export class UnmatchedMaterialeError extends Error {
  constructor(readonly materiale: string[]) {
    super(`Materiale fără linie pe factura lunii: ${materiale.join(", ")}`);
    this.name = "UnmatchedMaterialeError";
  }
}

/**
 * Resolves the factura line — and therefore the price and the printed
 * nr_cart — for one bon line, by materialId: the unique (facturaId,
 * materialId) constraint on FacturaExpeditieMaterial guarantees at most one
 * factura line per material, so a bon line (which only ever names the
 * material, never the code) always has at most one line to resolve to.
 */
function resolveFacturaLine(
  line: MonthlyReportBonLine,
  facturaByMaterial: Map<number, MonthlyReportFacturaLine>,
): { ok: true; line: MonthlyReportFacturaLine } | { ok: false; message: string } {
  const match = facturaByMaterial.get(line.materialId);
  if (!match) {
    return { ok: false, message: line.materialNume };
  }
  return { ok: true, line: match };
}

/**
 * Builds the per-vehicle-and-driver sheets for one month's monthly report from
 * that month's bonuri and the month's factura. Throws UnmatchedMaterialeError,
 * naming every offending material at once, if any bon line cannot be priced.
 */
export function buildMonthlyReport(input: BuildMonthlyReportInput): DataFisaLimita {
  const facturaByMaterial = new Map<number, MonthlyReportFacturaLine>();
  for (const f of input.facturaLinii) {
    facturaByMaterial.set(f.materialId, f);
  }

  type Row = {
    data: string;
    /** First (bonId, lineId) merged into this row — only the row-order tiebreak. */
    bonId: number;
    lineId: number;
    nrCart: string;
    nume: string;
    unit: string;
    cant: number;
    pretUnitar: number;
  };
  type Group = {
    key: string;
    litere: string;
    cifre: string;
    nrInventar: number;
    numeSofer: string;
    codSofer: number;
    /**
     * Keyed `materialId|unit`, so every issuance of a material (on any date,
     * from any bon) is one row of the summed quantity, dated by the oldest
     * bon — not one row per date. The unit is in the key so two genuinely
     * different units are never added together.
     */
    rows: Map<string, Row>;
  };
  const groups = new Map<string, Group>();
  const unmatched: string[] = [];

  for (const bon of input.bonuri) {
    const key = `${bon.vehiculId}|${bon.soferId}`;
    for (const line of bon.linii) {
      const resolved = resolveFacturaLine(line, facturaByMaterial);
      if (!resolved.ok) {
        unmatched.push(resolved.message);
        continue;
      }
      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          litere: bon.vehicul.litere,
          cifre: bon.vehicul.cifre,
          nrInventar: bon.vehicul.nrInventar,
          numeSofer: bon.sofer.nume,
          codSofer: bon.sofer.cod,
          rows: new Map(),
        };
        groups.set(key, group);
      }
      const rowKey = `${line.materialId}|${line.um}`;
      const existing = group.rows.get(rowKey);
      if (existing) {
        existing.cant = roundQty(existing.cant + line.cantitate);
        if (bon.data < existing.data) {
          existing.data = bon.data;
          existing.bonId = bon.id;
          existing.lineId = line.id;
        }
        continue;
      }
      group.rows.set(rowKey, {
        data: bon.data,
        bonId: bon.id,
        lineId: line.id,
        nrCart: resolved.line.nrCart,
        nume: line.materialNume,
        unit: line.um,
        cant: roundQty(line.cantitate),
        pretUnitar: resolved.line.pretUnitar,
      });
    }
  }

  if (unmatched.length > 0) {
    throw new UnmatchedMaterialeError(unmatched);
  }

  const sortedGroups = [...groups.values()]
    // Drop groups left with no rows (a bon with zero lines passes bonCreate).
    .filter((g) => g.rows.size > 0)
    .sort((a, b) =>
      a.litere !== b.litere
        ? a.litere.localeCompare(b.litere)
        : a.cifre !== b.cifre
          ? a.cifre.localeCompare(b.cifre)
          : a.numeSofer.localeCompare(b.numeSofer),
    );

  const { luna, anul } = lunaSiAnul(input.month);

  return sortedGroups.map((g): DataFisaLimitaSheet => {
    const rows = [...g.rows.values()].sort((a, b) =>
      a.data !== b.data
        ? a.data.localeCompare(b.data)
        : a.bonId !== b.bonId
          ? a.bonId - b.bonId
          : a.lineId - b.lineId,
    );
    return {
      nr_inregistrare: `${g.litere} ${g.cifre}`,
      nume_sofer: g.numeSofer,
      cod_sofer: String(g.codSofer),
      nr_inventar: String(g.nrInventar),
      luna,
      anul,
      tbl: rows.map((r) => {
        const pretSplit = baniSplit(r.pretUnitar);
        // Rounded once, from the raw product — not from an already-rounded
        // pretUnitar, which would round twice.
        const sumaCents = Math.round(r.cant * r.pretUnitar * 100);
        const sumaSplit = {
          lei: Math.floor(sumaCents / 100),
          bani: String(sumaCents % 100).padStart(2, "0"),
        };
        return {
          data: isoToDDMMYYYY(r.data),
          nr_cart: r.nrCart,
          nume: r.nume,
          unit: r.unit,
          cant: r.cant,
          pret_lei: pretSplit.lei,
          pret_bani: pretSplit.bani,
          suma_lei: sumaSplit.lei,
          suma_bani: sumaSplit.bani,
        };
      }),
    };
  });
}

// ------------------------------------------------------------ reconciliation

/** Just what reconciliation needs from a bon. A `MonthlyReportBon` satisfies it. */
export type ReconcilereBon = Pick<MonthlyReportBon, "id" | "data" | "linii">;

/**
 * A factura line as reconciliation sees it. Separate from
 * MonthlyReportFacturaLine, which is the pricing shape buildMonthlyReport
 * matches against: this one needs the quantity and unit and not the price.
 */
export type ReconcilereFacturaLine = {
  materialId: number;
  materialNume: string;
  nrCart: string;
  um: string;
  cantitate: number;
};

/**
 * One material, as invoiced against as issued. `diferenta` is what the
 * operator acts on: the factura is authoritative and cannot be edited, so a
 * non-zero difference means the month's bonuri need correcting.
 */
export type ReconcilereLinie = {
  materialId: number;
  nume: string;
  /** null only on an orphan row — a bon group that matched no factura line. */
  nrCart: string | null;
  um: string;
  /** null when no factura line matches at all — an orphan bon group. */
  cantitateFactura: number | null;
  cantitateBonuri: number;
  /** cantitateBonuri − (cantitateFactura ?? 0). */
  diferenta: number;
  bonuri: Array<{ id: number; data: string }>;
};

/**
 * Compares one month's bonuri against that month's factura, one row per
 * material.
 *
 * A bon line whose material has no factura line at all becomes its own row
 * with `cantitateFactura: null`, which is how the UnmatchedMaterialeError
 * cases become visible and fixable rather than only surfacing as an error on
 * generate.
 */
export function buildReconciliere(input: {
  bonuri: ReconcilereBon[];
  facturaLinii: ReconcilereFacturaLine[];
}): ReconcilereLinie[] {
  const rows = new Map<number, ReconcilereLinie>();
  // Which bonuri are already listed on a row, so a bon carrying two lines for
  // one material is linked once.
  const bonuriSeen = new Map<number, Set<number>>();

  for (const f of input.facturaLinii) {
    rows.set(f.materialId, {
      materialId: f.materialId,
      nume: f.materialNume,
      nrCart: f.nrCart,
      um: f.um,
      cantitateFactura: roundQty(f.cantitate),
      cantitateBonuri: 0,
      diferenta: 0,
      bonuri: [],
    });
    bonuriSeen.set(f.materialId, new Set());
  }

  for (const bon of input.bonuri) {
    for (const line of bon.linii) {
      let row = rows.get(line.materialId);
      if (!row) {
        row = {
          materialId: line.materialId,
          nume: line.materialNume,
          nrCart: null,
          um: line.um,
          cantitateFactura: null,
          cantitateBonuri: 0,
          diferenta: 0,
          bonuri: [],
        };
        rows.set(line.materialId, row);
        bonuriSeen.set(line.materialId, new Set());
      }

      row.cantitateBonuri = roundQty(row.cantitateBonuri + line.cantitate);
      const seen = bonuriSeen.get(line.materialId)!;
      if (!seen.has(bon.id)) {
        seen.add(bon.id);
        row.bonuri.push({ id: bon.id, data: bon.data });
      }
    }
  }

  const out = [...rows.values()];
  for (const row of out) {
    row.diferenta = roundQty(row.cantitateBonuri - (row.cantitateFactura ?? 0));
    row.bonuri.sort((a, b) => (a.data !== b.data ? a.data.localeCompare(b.data) : a.id - b.id));
  }
  return out.sort((a, b) =>
    a.nume !== b.nume ? a.nume.localeCompare(b.nume) : (a.nrCart ?? "").localeCompare(b.nrCart ?? ""),
  );
}

/** The rows an operator must fix before the month can be generated. */
export const liniiCuDiferente = (linii: ReconcilereLinie[]): ReconcilereLinie[] =>
  linii.filter((l) => l.diferenta !== 0);
