import type { BonCreateBody, BonDetail } from "@canalcik/server/api-types";
import { randomId } from "@mantine/hooks";
import { emptyToNull, numOrZero, todayLocalIso } from "../../lib/forms.ts";

export interface MaterialRow {
  /**
   * Client-side only. PATCH replaces every line, so the server's ids change on
   * each save — keying React rows by them makes inputs lose focus after a refetch.
   */
  key: string;
  nrCart: string;
  nume: string;
  um: string;
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
  nrCart: "",
  nume: "",
  um: "",
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
    nrCart: m.nrCart ?? "",
    nume: m.nume,
    um: m.um,
    cantitate: m.cantitate,
  })),
});

export const fromBonForm = (v: BonFormValues): BonCreateBody => ({
  data: v.data ?? todayLocalIso(),
  soferId: Number(v.soferId),
  vehiculId: Number(v.vehiculId),
  materiale: v.materiale.map((m) => ({
    nrCart: emptyToNull(m.nrCart),
    nume: m.nume.trim(),
    um: m.um.trim(),
    cantitate: numOrZero(m.cantitate),
  })),
});

export const bonValidation = {
  data: (v: string | null) => (v ? null : "Data este obligatorie"),
  soferId: (v: string | null) => (v ? null : "Șoferul este obligatoriu"),
  vehiculId: (v: string | null) => (v ? null : "Vehiculul este obligatoriu"),
  materiale: {
    nume: (v: string) => (v.trim() === "" ? "Obligatoriu" : null),
    um: (v: string) => (v.trim() === "" ? "Obligatoriu" : null),
    cantitate: (v: number | string) =>
      v === "" || Number(v) <= 0 || Number.isNaN(Number(v)) ? "Cantitate invalidă" : null,
  },
};
