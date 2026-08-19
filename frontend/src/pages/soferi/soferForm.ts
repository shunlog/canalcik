import type { SoferCreateBody, SoferDetail } from "@canalcik/server/api-types";
import { emptyToNull, nullToEmpty, numOrZero } from "../../lib/forms.ts";

export interface SoferFormValues {
  cod: number | string;
  nume: string;
  functie: string;
  telefon: string;
  sector: string;
  marimeHaina: string;
  marimeIncaltaminte: string;
  observatii: string;
  // DateInput speaks "YYYY-MM-DD" | null in Mantine 8 — the same shape the API
  // and the database use, so these need no conversion in either direction.
  eipScurta: string | null;
  eipIncaltaminte: string | null;
  eipCostum: string | null;
  eipPantaloni: string | null;
  eipVestaAvertizare: string | null;
}

export const emptySoferForm: SoferFormValues = {
  cod: "",
  nume: "",
  functie: "",
  telefon: "",
  sector: "",
  marimeHaina: "",
  marimeIncaltaminte: "",
  observatii: "",
  eipScurta: null,
  eipIncaltaminte: null,
  eipCostum: null,
  eipPantaloni: null,
  eipVestaAvertizare: null,
};

export const toSoferForm = (s: SoferDetail): SoferFormValues => ({
  cod: s.cod,
  nume: s.nume,
  functie: nullToEmpty(s.functie),
  telefon: nullToEmpty(s.telefon),
  sector: nullToEmpty(s.sector),
  marimeHaina: nullToEmpty(s.marimeHaina),
  marimeIncaltaminte: nullToEmpty(s.marimeIncaltaminte),
  observatii: nullToEmpty(s.observatii),
  eipScurta: s.eipScurta,
  eipIncaltaminte: s.eipIncaltaminte,
  eipCostum: s.eipCostum,
  eipPantaloni: s.eipPantaloni,
  eipVestaAvertizare: s.eipVestaAvertizare,
});

export const fromSoferForm = (v: SoferFormValues): SoferCreateBody => ({
  cod: numOrZero(v.cod),
  nume: v.nume.trim(),
  functie: emptyToNull(v.functie),
  telefon: emptyToNull(v.telefon),
  sector: emptyToNull(v.sector),
  marimeHaina: emptyToNull(v.marimeHaina),
  marimeIncaltaminte: emptyToNull(v.marimeIncaltaminte),
  observatii: emptyToNull(v.observatii),
  eipScurta: v.eipScurta,
  eipIncaltaminte: v.eipIncaltaminte,
  eipCostum: v.eipCostum,
  eipPantaloni: v.eipPantaloni,
  eipVestaAvertizare: v.eipVestaAvertizare,
});
