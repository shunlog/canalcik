import type { VehiculCreateBody, VehiculDetail } from "@canalcik/server/api-types";
import { emptyToNull, nullToEmpty, numOrNull, numOrZero } from "../../lib/forms.ts";

export interface VehiculFormValues {
  nrInmatriculare: string;
  nrInventar: number | string;
  nrGaraj: number | string;
  tip: string;
  model: string;
  anProducere: number | string;
  kmActuali: number | string;
  sector: string;
  utilajeAuxiliare: string;
  lucrariLunaViitoare: string;
}

export const emptyVehiculForm: VehiculFormValues = {
  nrInmatriculare: "",
  nrInventar: "",
  nrGaraj: "",
  tip: "",
  model: "",
  anProducere: "",
  kmActuali: "",
  sector: "",
  utilajeAuxiliare: "",
  lucrariLunaViitoare: "",
};

export const toVehiculForm = (v: VehiculDetail): VehiculFormValues => ({
  nrInmatriculare: v.nrInmatriculare,
  nrInventar: v.nrInventar,
  nrGaraj: v.nrGaraj,
  tip: v.tip,
  model: v.model,
  anProducere: v.anProducere ?? "",
  kmActuali: v.kmActuali ?? "",
  sector: nullToEmpty(v.sector),
  utilajeAuxiliare: nullToEmpty(v.utilajeAuxiliare),
  lucrariLunaViitoare: nullToEmpty(v.lucrariLunaViitoare),
});

export const fromVehiculForm = (v: VehiculFormValues): VehiculCreateBody => ({
  nrInmatriculare: v.nrInmatriculare.trim(),
  nrInventar: numOrZero(v.nrInventar),
  nrGaraj: numOrZero(v.nrGaraj),
  tip: v.tip.trim(),
  model: v.model.trim(),
  anProducere: numOrNull(v.anProducere),
  kmActuali: numOrNull(v.kmActuali),
  sector: emptyToNull(v.sector),
  utilajeAuxiliare: emptyToNull(v.utilajeAuxiliare),
  lucrariLunaViitoare: emptyToNull(v.lucrariLunaViitoare),
});
