import type {
  BonRef,
  ComandaMaterialeListItem,
  FacturaRef,
  IsoDate,
  MaterialRef,
  MonthlyReport,
  SoferRef,
  VehiculRef,
} from "@canalcik/server/api-types";
import type { EipEquipmentField } from "@canalcik/server/derived";
import { formatIsoDate, formatMonth } from "./forms.ts";

export const vehiculLabel = (v: VehiculRef) =>
  `${v.nrInmatriculare} — ${v.model}`;

export const vehiculShortLabel = (v: VehiculRef) => v.nrInmatriculare;

export const soferLabel = (s: SoferRef) => `${s.nume}`;

export const bonLabel = (b: Pick<BonRef, "data">) => formatIsoDate(b.data);

export const materialLabel = (m: MaterialRef) => (m.nrCart ? `${m.nume} (${m.nrCart})` : m.nume);

export const facturaLabel = (f: Pick<FacturaRef, "data">) => formatIsoDate(f.data);

/** An act is identified by its date plus vehicul: several acts can share a date. */
export const actDefectiuneLabel = (a: { data: IsoDate; vehicul: VehiculRef }) =>
  `${formatIsoDate(a.data)} - ${vehiculShortLabel(a.vehicul)}`;

export const comandaMaterialeLabel = (c: Pick<ComandaMaterialeListItem, "data">) =>
  formatIsoDate(c.data);

export const monthlyReportLabel = (r: Pick<MonthlyReport, "month">) => formatMonth(r.month);

export const EIP_LABELS: Record<EipEquipmentField, string> = {
  eipScurta: "Scurtă",
  eipIncaltaminte: "Încălțăminte",
  eipCostum: "Costum",
  eipPantaloni: "Pantaloni",
  eipVestaAvertizare: "Vestă avertizare",
};
