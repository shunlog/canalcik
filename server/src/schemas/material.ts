import { z } from "zod";
import type { MaterialCreateBody, MaterialUpdateBody } from "../api-types.ts";
import { requiredText, type Same } from "./common.ts";

// `nrCart` ("cod nomenclator") is the material's identity — trimmed here and
// unique in the database, since two lines can otherwise print the same name
// under two different codes. `nume` is no longer unique, just descriptive.
export const materialCreate = z.object({
  nume: requiredText("Denumirea materialului"),
  nrCart: requiredText("Codul nomenclator"),
});

export const materialUpdate = materialCreate.partial();

const _createMatches: Same<z.infer<typeof materialCreate>, MaterialCreateBody> = true;
const _updateMatches: Same<z.infer<typeof materialUpdate>, MaterialUpdateBody> = true;
void _createMatches, _updateMatches;
