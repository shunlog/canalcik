import { z } from "zod";
import type { SetVehiculeBody, SoferCreateBody, SoferUpdateBody } from "../api-types.ts";
import {
  idList,
  nullableIsoDate,
  nullableText,
  requiredText,
  type Same,
} from "./common.ts";

export const soferCreate = z.object({
  cod: z.number().int().positive("Numărul de pontaj este obligatoriu"),
  nume: requiredText("Numele"),
  functie: nullableText,
  telefon: nullableText,
  sector: nullableText,
  marimeHaina: nullableText,
  marimeIncaltaminte: nullableText,
  observatii: nullableText,
  eipScurta: nullableIsoDate,
  eipIncaltaminte: nullableIsoDate,
  eipCostum: nullableIsoDate,
  eipPantaloni: nullableIsoDate,
  eipVestaAvertizare: nullableIsoDate,
});

// PATCH semantics: an absent key is left untouched. .partial() wraps each field
// in ZodOptional, which short-circuits on undefined *before* the nullable
// transforms above would turn it into null.
export const soferUpdate = soferCreate.partial();

export const setVehiculeBody = z.object({ vehiculIds: idList });

const _createMatches: Same<z.infer<typeof soferCreate>, SoferCreateBody> = true;
const _updateMatches: Same<z.infer<typeof soferUpdate>, SoferUpdateBody> = true;
const _setMatches: Same<z.infer<typeof setVehiculeBody>, SetVehiculeBody> = true;
void _createMatches, _updateMatches, _setMatches;
