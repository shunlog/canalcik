import { z } from "zod";
import type { BonCreateBody, BonUpdateBody } from "../api-types.ts";
import { isoDate, nullableText, requiredText, type Same, unitateMasura } from "./common.ts";

export const materialLine = z.object({
  nrCart: nullableText,
  nume: requiredText("Denumirea materialului"),
  um: unitateMasura,
  cantitate: z.number().positive("Cantitatea trebuie să fie mai mare decât 0"),
});

/** The routes map this to a nested Prisma create — see toLineCreate in routes/bonuri.ts. */
export type MaterialLineInput = z.infer<typeof materialLine>;

export const bonCreate = z.object({
  data: isoDate,
  soferId: z.number().int().positive(),
  vehiculId: z.number().int().positive(),
  materiale: z.array(materialLine),
});

// `materiale` stays optional on PATCH: absent means "leave the lines alone",
// present means "these are now all the lines".
export const bonUpdate = z.object({
  data: isoDate.optional(),
  soferId: z.number().int().positive().optional(),
  vehiculId: z.number().int().positive().optional(),
  materiale: z.array(materialLine).optional(),
});

const _createMatches: Same<z.infer<typeof bonCreate>, BonCreateBody> = true;
const _updateMatches: Same<z.infer<typeof bonUpdate>, BonUpdateBody> = true;
void _createMatches, _updateMatches;
