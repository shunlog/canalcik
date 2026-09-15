import { z } from "zod";
import type { ComandaMaterialeCreateBody, ComandaMaterialeUpdateBody } from "../api-types.ts";
import { isoDate, requiredText, type Same } from "./common.ts";

// `cod` may name a catalogue product or nothing at all: a material the
// catalogue doesn't carry is still a valid line, entered by hand — the same
// rule as an act's nrNomenclator.
//
// The line has no `nr`: unlike an act's tables, these are rows, and the
// document numbers them by their order — see routes/comandaMateriale.ts.
const material = z.object({
  vehiculId: z.number().int().positive(),
  nume: requiredText("Denumirea materialului"),
  cod: z.string().trim(),
  um: requiredText("Unitatea de măsură"),
  cantitate: z.number().positive("Cantitatea trebuie să fie mai mare decât 0"),
});

// The UM is left as typed rather than upper-cased like a bon's: it comes off
// the produse catalogue ("buc", "set"), which nothing reconciles against a
// factura.
export const comandaMaterialeCreate = z.object({
  data: isoDate,
  acteDefectiuneIds: z.array(z.number().int().positive()).refine(
    (ids) => new Set(ids).size === ids.length,
    "Fiecare act de defecțiune poate fi selectat o singură dată",
  ),
  materiale: z.array(material),
});

// PUT-shaped rather than PATCH-shaped: the comanda is one form, saved whole, so
// there is no partial edit to express — see routes/comandaMateriale.ts.
export const comandaMaterialeUpdate = comandaMaterialeCreate;

export type MaterialComandaInput = z.infer<typeof material>;

const _createMatches: Same<z.infer<typeof comandaMaterialeCreate>, ComandaMaterialeCreateBody> =
  true;
const _updateMatches: Same<z.infer<typeof comandaMaterialeUpdate>, ComandaMaterialeUpdateBody> =
  true;
void _createMatches, _updateMatches;
