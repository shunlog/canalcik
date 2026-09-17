import { z } from "zod";
import type { SetSoferiBody, VehiculCreateBody, VehiculUpdateBody } from "../api-types.ts";
import { idList, nullableInt, nullableText, requiredText, type Same } from "./common.ts";

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

const _createMatches: Same<z.infer<typeof vehiculCreate>, VehiculCreateBody> = true;
const _updateMatches: Same<z.infer<typeof vehiculUpdate>, VehiculUpdateBody> = true;
const _setMatches: Same<z.infer<typeof setSoferiBody>, SetSoferiBody> = true;
void _createMatches, _updateMatches, _setMatches;
