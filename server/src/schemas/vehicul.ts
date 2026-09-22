import { z } from "zod";
import type {
  AcumulatoareUpdateBody,
  AnvelopeUpdateBody,
  SetSoferiBody,
  VehiculCreateBody,
  VehiculUpdateBody,
} from "../api-types.ts";
import { idList, isoDate, nullableInt, nullableText, requiredText, type Same } from "./common.ts";

export const vehiculCreate = z.object({
  nrInmatriculare: requiredText("Nr. înmatriculare"),
  nrInventar: z.number().int().positive("Nr. inventar este obligatoriu"),
  nrGaraj: z.number().int().positive("Nr. garaj este obligatoriu"),
  tip: requiredText("Destinația"),
  model: requiredText("Marca / modelul"),
  anProducere: nullableInt,
  kmActuali: nullableInt,
  sector: nullableText,
  utilajeAuxiliare: nullableText,
  lucrariLunaViitoare: nullableText,
});

export const vehiculUpdate = vehiculCreate.partial();

export const setSoferiBody = z.object({ soferIds: idList });

const anvelopaRow = z.object({ id: z.number().int().positive(), dataInstalarii: isoDate });

export const anvelopeUpdate = z.object({
  anvelopeLuni: z.array(anvelopaRow).optional(),
  anvelopeKm: z.array(anvelopaRow).optional(),
});

const acumulatorRow = z.object({ id: z.number().int().positive(), dataInstalarii: isoDate });

export const acumulatoareUpdate = z.object({
  acumulatoare: z.array(acumulatorRow),
});

const _createMatches: Same<z.infer<typeof vehiculCreate>, VehiculCreateBody> = true;
const _updateMatches: Same<z.infer<typeof vehiculUpdate>, VehiculUpdateBody> = true;
const _setMatches: Same<z.infer<typeof setSoferiBody>, SetSoferiBody> = true;
const _anvelopeMatches: Same<z.infer<typeof anvelopeUpdate>, AnvelopeUpdateBody> = true;
const _acumulatoareMatches: Same<z.infer<typeof acumulatoareUpdate>, AcumulatoareUpdateBody> = true;
void _createMatches, _updateMatches, _setMatches, _anvelopeMatches, _acumulatoareMatches;
