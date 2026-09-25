import { z } from "zod";
import type { FacturaCreateBody, FacturaUpdateBody } from "../api-types.ts";
import { isoDate, requiredText, type Same, unitateMasura } from "./common.ts";

// Same shape as a bon line, with two deliberate differences: `nrCart` exists
// at all (the factura is where the nomenclature code comes from — a bon line
// only names the material) and the line carries the price it was delivered at.
export const facturaLine = z.object({
  nrCart: requiredText("Codul nomenclator"),
  nume: requiredText("Denumirea materialului"),
  um: unitateMasura,
  cantitate: z.number().positive("Cantitatea trebuie să fie mai mare decât 0"),
  // Zero is allowed: a delivery can carry a free item, and refusing it would
  // block recording the factura as it was actually issued.
  pretUnitar: z.number().nonnegative("Prețul nu poate fi negativ"),
});

/** The routes map this to a nested Prisma create — see toLineCreate in routes/facturi.ts. */
export type FacturaLineInput = z.infer<typeof facturaLine>;

export const facturaCreate = z.object({
  data: isoDate,
  ramas: z.boolean(),
  materiale: z.array(facturaLine),
});

// As on a bon, `materiale` stays optional on PATCH: absent means "leave the
// lines alone", present means "these are now all the lines".
export const facturaUpdate = z.object({
  data: isoDate.optional(),
  ramas: z.boolean().optional(),
  materiale: z.array(facturaLine).optional(),
});

const _createMatches: Same<z.infer<typeof facturaCreate>, FacturaCreateBody> = true;
const _updateMatches: Same<z.infer<typeof facturaUpdate>, FacturaUpdateBody> = true;
void _createMatches, _updateMatches;
