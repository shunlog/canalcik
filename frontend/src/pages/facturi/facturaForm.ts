import type { FacturaCreateBody, FacturaDetail } from "@canalcik/server/api-types";
import { randomId } from "@mantine/hooks";
import { numOrZero, todayLocalIso } from "../../lib/forms.ts";

export interface FacturaMaterialRow {
  /**
   * Client-side only, for the same reason as on a bon row: PATCH replaces every
   * line, so the server's ids change on each save and keying React rows by them
   * makes inputs lose focus after a refetch.
   */
  key: string;
  materialId: number | null;
  cantitate: number | string;
  pretUnitar: number | string;
}

export interface FacturaFormValues {
  data: string | null;
  ramas: boolean;
  materiale: FacturaMaterialRow[];
}

export const newFacturaRow = (): FacturaMaterialRow => ({
  key: randomId(),
  materialId: null,
  cantitate: "",
  pretUnitar: "",
});

export const emptyFacturaForm = (): FacturaFormValues => ({
  data: todayLocalIso(),
  ramas: false,
  materiale: [newFacturaRow()],
});

export const toFacturaForm = (f: FacturaDetail): FacturaFormValues => ({
  data: f.data,
  ramas: f.ramas,
  materiale: f.materiale.map((m) => ({
    key: randomId(),
    materialId: m.materialId,
    cantitate: m.cantitate,
    pretUnitar: m.pretUnitar,
  })),
});

export const fromFacturaForm = (v: FacturaFormValues): FacturaCreateBody => ({
  data: v.data ?? todayLocalIso(),
  ramas: v.ramas,
  materiale: v.materiale.map((m) => ({
    materialId: m.materialId as number,
    cantitate: numOrZero(m.cantitate),
    pretUnitar: numOrZero(m.pretUnitar),
  })),
});

/**
 * The value of one line, or 0 while either half of it is still being typed.
 * Takes only the two fields it needs, so the same helper totals a form's rows
 * and a saved factura's lines.
 */
type Valued = Pick<FacturaMaterialRow, "cantitate" | "pretUnitar">;

export const lineValue = (m: Valued): number => numOrZero(m.cantitate) * numOrZero(m.pretUnitar);

/** Rounded like the server's total, so the two never disagree by a float's tail. */
export const facturaTotal = (rows: Valued[]): number =>
  Math.round(rows.reduce((sum, m) => sum + lineValue(m), 0) * 100) / 100;

export const facturaValidation = {
  data: (v: string | null) => (v ? null : "Data este obligatorie"),
  materiale: {
    materialId: (v: number | null) => (v === null ? "Alegeți un material" : null),
    cantitate: (v: number | string) =>
      v === "" || Number(v) <= 0 || Number.isNaN(Number(v)) ? "Cantitate invalidă" : null,
    pretUnitar: (v: number | string) =>
      v === "" || Number(v) < 0 || Number.isNaN(Number(v)) ? "Preț invalid" : null,
  },
};
