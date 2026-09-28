import type { BonCreateBody, BonDetail } from "@canalcik/server/api-types";
import { randomId } from "@mantine/hooks";
import { numOrZero, todayLocalIso } from "../../lib/forms.ts";
import { materialPickerLabel } from "../../lib/labels.ts";

export interface MaterialRow {
  /**
   * Client-side only. PATCH replaces every line, so the server's ids change on
   * each save — keying React rows by them makes inputs lose focus after a refetch.
   */
  key: string;
  /** Links an existing, invoiced material. null means this row is a scratchpad note. */
  materialId: number | null;
  /**
   * The combobox's current text. For a linked row this is only a fallback
   * (the editor recomputes the label live from the catalogue); for an
   * unlinked row it *is* the scratchpad note.
   */
  nota: string;
  cantitate: number | string;
}

export interface BonFormValues {
  data: string | null;
  soferId: string | null;
  vehiculId: string | null;
  materiale: MaterialRow[];
}

export const newMaterialRow = (): MaterialRow => ({
  key: randomId(),
  materialId: null,
  nota: "",
  cantitate: "",
});

export const emptyBonForm = (): BonFormValues => ({
  data: todayLocalIso(),
  soferId: null,
  vehiculId: null,
  materiale: [newMaterialRow()],
});

export const toBonForm = (b: BonDetail): BonFormValues => ({
  data: b.data,
  soferId: String(b.soferId),
  vehiculId: String(b.vehiculId),
  materiale: b.materiale.map((m) => ({
    key: randomId(),
    materialId: m.materialId,
    // Seeded from the bon's own response so the field never shows blank
    // before useMateriale() has loaded — the editor recomputes this live
    // once it has.
    nota: m.materialId !== null ? materialPickerLabel({ nume: m.nume ?? "", nrCart: m.nrCart ?? "" }) : (m.nota ?? ""),
    cantitate: m.cantitate,
  })),
});

export const fromBonForm = (v: BonFormValues): BonCreateBody => ({
  data: v.data ?? todayLocalIso(),
  soferId: Number(v.soferId),
  vehiculId: Number(v.vehiculId),
  materiale: v.materiale.map((m) => ({
    ...(m.materialId !== null
      ? { materialId: m.materialId }
      : { nota: m.nota.trim() }),
    cantitate: numOrZero(m.cantitate),
  })),
});

export const bonValidation = {
  data: (v: string | null) => (v ? null : "Data este obligatorie"),
  soferId: (v: string | null) => (v ? null : "Șoferul este obligatoriu"),
  vehiculId: (v: string | null) => (v ? null : "Vehiculul este obligatoriu"),
  materiale: {
    nota: (v: string, values: BonFormValues, path: string) => {
      const idx = Number(path.split(".")[1]);
      const row = values.materiale[idx];
      if (row?.materialId !== null) return null;
      return v.trim() === "" ? "Alegeți un material din listă sau introduceți o notă" : null;
    },
    cantitate: (v: number | string) =>
      v === "" || Number(v) <= 0 || Number.isNaN(Number(v)) ? "Cantitate invalidă" : null,
  },
};
