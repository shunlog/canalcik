import { z } from "zod";
import type { MaterialCreateBody, MaterialUpdateBody } from "../api-types.ts";
import { requiredText, type Same } from "./common.ts";

// The name is the material's identity — it is what a bon line resolves against
// — so it is trimmed here and unique in the database. Two catalogue entries
// differing only by surrounding whitespace would be indistinguishable on screen.
export const materialCreate = z.object({
  nume: requiredText("Denumirea materialului"),
});

export const materialUpdate = materialCreate.partial();

const _createMatches: Same<z.infer<typeof materialCreate>, MaterialCreateBody> = true;
const _updateMatches: Same<z.infer<typeof materialUpdate>, MaterialUpdateBody> = true;
void _createMatches, _updateMatches;
