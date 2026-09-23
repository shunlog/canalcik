import { z } from "zod";
import type {
  AcumulatoareUpdateBody,
  AnvelopeUpdateBody,
  SetSoferiBody,
  VehiculCreateBody,
  VehiculUpdateBody,
} from "../api-types.ts";
import {
  idList,
  isoDate,
  nullableInt,
  nullableText,
  optionalNullableText,
  requiredText,
  type Same,
} from "./common.ts";

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

const anvelopaLuniWrite = z.object({
  model: nullableText,
  dataInstalarii: isoDate,
  normaLuni: z.number().int().positive("Norma (luni) trebuie să fie un număr pozitiv"),
});

const anvelopaLuniUpdate = z.object({
  id: z.number().int().positive(),
  model: optionalNullableText,
  dataInstalarii: isoDate.optional(),
  normaLuni: z.number().int().positive("Norma (luni) trebuie să fie un număr pozitiv").optional(),
});

const anvelopaKmWrite = z.object({
  model: nullableText,
  dataInstalarii: isoDate,
  kmInstalare: z.number().int().nonnegative("Km la instalare nu poate fi negativ"),
  normaKm: z.number().int().positive("Norma (km) trebuie să fie un număr pozitiv"),
});

const anvelopaKmUpdate = z.object({
  id: z.number().int().positive(),
  model: optionalNullableText,
  dataInstalarii: isoDate.optional(),
  kmInstalare: z.number().int().nonnegative("Km la instalare nu poate fi negativ").optional(),
  normaKm: z.number().int().positive("Norma (km) trebuie să fie un număr pozitiv").optional(),
});

export const anvelopeUpdate = z.object({
  anvelopeLuni: z
    .object({
      update: z.array(anvelopaLuniUpdate).optional(),
      create: z.array(anvelopaLuniWrite).optional(),
      delete: idList.optional(),
    })
    .optional(),
  anvelopeKm: z
    .object({
      update: z.array(anvelopaKmUpdate).optional(),
      create: z.array(anvelopaKmWrite).optional(),
      delete: idList.optional(),
    })
    .optional(),
});

const acumulatorWrite = z.object({
  model: nullableText,
  dataInstalarii: isoDate,
  normaLuni: z.number().int().positive("Norma (luni) trebuie să fie un număr pozitiv"),
});

const acumulatorUpdate = z.object({
  id: z.number().int().positive(),
  model: optionalNullableText,
  dataInstalarii: isoDate.optional(),
  normaLuni: z.number().int().positive("Norma (luni) trebuie să fie un număr pozitiv").optional(),
});

export const acumulatoareUpdate = z.object({
  acumulatoare: z
    .object({
      update: z.array(acumulatorUpdate).optional(),
      create: z.array(acumulatorWrite).optional(),
      delete: idList.optional(),
    })
    .optional(),
});

const _createMatches: Same<z.infer<typeof vehiculCreate>, VehiculCreateBody> = true;
const _updateMatches: Same<z.infer<typeof vehiculUpdate>, VehiculUpdateBody> = true;
const _setMatches: Same<z.infer<typeof setSoferiBody>, SetSoferiBody> = true;
const _anvelopeMatches: Same<z.infer<typeof anvelopeUpdate>, AnvelopeUpdateBody> = true;
const _acumulatoareMatches: Same<z.infer<typeof acumulatoareUpdate>, AcumulatoareUpdateBody> = true;
void _createMatches, _updateMatches, _setMatches, _anvelopeMatches, _acumulatoareMatches;
