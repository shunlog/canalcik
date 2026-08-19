import type { VehiculCreateBody, VehiculDetail } from "@canalcik/server/api-types";
import { emptyToNull, nullToEmpty, numOrNull, numOrZero } from "../../lib/forms.ts";

export interface VehiculFormValues {
  litere: string;
  /** A string, not a number: the source data contains plates like "f/n". */
  cifre: string;
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
  litere: "",
  cifre: "",
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
  litere: v.litere,
  cifre: v.cifre,
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
  litere: v.litere.trim(),
  cifre: v.cifre.trim(),
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
