import { z } from "zod";
import type { BonCreateBody, BonUpdateBody } from "../api-types.ts";
import { isoDate, requiredText, type Same } from "./common.ts";

// A line either links an existing, invoiced material (`materialId`, picked
// from the catalogue) or is a scratchpad note (`nota`, free-typed text for
// something the catalogue doesn't have yet) — never both, never neither.
export const materialLine = z
  .object({
    materialId: z.number().int().positive().optional(),
    nota: z.string().optional(),
    cantitate: z.number().positive("Cantitatea trebuie să fie mai mare decât 0"),
  })
  .refine((v) => v.materialId !== undefined || (v.nota ?? "").trim() !== "", {
    message: "Alegeți un material din listă sau introduceți o notă",
    path: ["nota"],
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
