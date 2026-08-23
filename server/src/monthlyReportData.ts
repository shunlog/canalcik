import type { DataFisaLimita, DataFisaLimitaSheet } from "../../templates/renderTemplates.ts";

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

const isoToDDMMYYYY = (iso: string): string => {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};

// ------------------------------------------------------------- input shapes

// Local plain types, not Prisma.*GetPayload, so the test can write literals
// without constructing real Prisma rows.

export type MonthlyReportBonLine = {
  id: number;
  materialId: number;
  materialNume: string;
  nrCart: string | null;
  um: string;
  cantitate: number;
};

export type MonthlyReportBon = {
  id: number;
  data: string; // "YYYY-MM-DD"
  soferId: number;
  vehiculId: number;
  sofer: { nume: string; cod: number };
  vehicul: { litere: string; cifre: string };
  linii: MonthlyReportBonLine[];
};

export type MonthlyReportFacturaLine = {
  materialId: number;
  nrCart: string;
  pretUnitar: number;
};

export type BuildMonthlyReportInput = {
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
 * nr_cart — for one bon line.
 *
 * Keyed by `materialId|nrCart`, not by materialId alone: the schema comment
 * on BonEliberareMaterial.nrCart notes the same material can be delivered
 * under different codes, so one factura may legally carry two lines for one
 * material. The bon's nrCart, when present, is the match key; with none, the
 * factura's lines for that material must be unambiguous.
 */
function resolveFacturaLine(
  line: MonthlyReportBonLine,
  facturaByExactKey: Map<string, MonthlyReportFacturaLine>,
  facturaByMaterial: Map<number, MonthlyReportFacturaLine[]>,
): { ok: true; line: MonthlyReportFacturaLine } | { ok: false; message: string } {
  if (line.nrCart) {
    const exact = facturaByExactKey.get(`${line.materialId}|${line.nrCart}`);
    if (!exact) {
      return {
        ok: false,
        message: `${line.materialNume} (nr. cartelă ${line.nrCart})`,
      };
    }
    return { ok: true, line: exact };
  }

  const candidates = facturaByMaterial.get(line.materialId) ?? [];
  if (candidates.length === 0) {
    return { ok: false, message: line.materialNume };
  }
  if (candidates.length > 1) {
    const codes = candidates.map((f) => f.nrCart).join(", ");
    return {
      ok: false,
      message: `${line.materialNume} (ambiguu, coduri posibile: ${codes})`,
    };
  }
  return { ok: true, line: candidates[0] };
}

/**
 * Builds the per-vehicle-and-driver sheets for one month's monthly report from
 * that month's bonuri and the month's factura. Throws UnmatchedMaterialeError,
 * naming every offending material at once, if any bon line cannot be priced.
 */
export function buildMonthlyReport(input: BuildMonthlyReportInput): DataFisaLimita {
  const facturaByExactKey = new Map<string, MonthlyReportFacturaLine>();
  const facturaByMaterial = new Map<number, MonthlyReportFacturaLine[]>();
  for (const f of input.facturaLinii) {
    facturaByExactKey.set(`${f.materialId}|${f.nrCart}`, f);
    const list = facturaByMaterial.get(f.materialId) ?? [];
    list.push(f);
    facturaByMaterial.set(f.materialId, list);
  }

  type Group = {
    key: string;
    litere: string;
    cifre: string;
    numeSofer: string;
    codSofer: number;
    rows: Array<{
      data: string;
      bonId: number;
      lineId: number;
      nrCart: string;
      nume: string;
      unit: string;
      cant: number;
      pretUnitar: number;
    }>;
  };
  const groups = new Map<string, Group>();
  const unmatched: string[] = [];

  for (const bon of input.bonuri) {
    const key = `${bon.vehiculId}|${bon.soferId}`;
    for (const line of bon.linii) {
      const resolved = resolveFacturaLine(line, facturaByExactKey, facturaByMaterial);
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
          numeSofer: bon.sofer.nume,
          codSofer: bon.sofer.cod,
          rows: [],
        };
        groups.set(key, group);
      }
      group.rows.push({
        data: bon.data,
        bonId: bon.id,
        lineId: line.id,
        nrCart: resolved.line.nrCart,
        nume: line.materialNume,
        unit: line.um,
        cant: line.cantitate,
        pretUnitar: resolved.line.pretUnitar,
      });
    }
  }

  if (unmatched.length > 0) {
    throw new UnmatchedMaterialeError(unmatched);
  }

  const sortedGroups = [...groups.values()]
    // Drop groups left with no rows (a bon with zero lines passes bonCreate).
    .filter((g) => g.rows.length > 0)
    .sort((a, b) =>
      a.litere !== b.litere
        ? a.litere.localeCompare(b.litere)
        : a.cifre !== b.cifre
          ? a.cifre.localeCompare(b.cifre)
          : a.numeSofer.localeCompare(b.numeSofer),
    );

  return sortedGroups.map((g): DataFisaLimitaSheet => {
    const rows = [...g.rows].sort((a, b) =>
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
