import { z } from "zod";

/**
 * Compile-time proof that a zod schema's output is exactly the hand-written
 * wire type in api-types.ts. Assign `true` to it; if the two drift, the file
 * stops compiling. See the `_check` constants at the bottom of each schema file.
 */
export type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

/**
 * A calendar date, "YYYY-MM-DD". Validated for real existence, not just shape,
 * so "2026-02-31" is rejected rather than silently stored.
 */
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format așteptat: AAAA-LL-ZZ")
  .refine((s) => {
    const [y, m, d] = s.split("-").map(Number) as [number, number, number];
    const dt = new Date(Date.UTC(y, m - 1, d));
    return (
      dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
    );
  }, "Dată inexistentă");

// A cleared input arrives as "" (or as an omitted key); both mean "no value",
// i.e. NULL. Normalising here is what keeps empty strings out of SQLite.
export const nullableText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s === "" ? null : s;
  });

export const nullableIsoDate = z
  .union([isoDate, z.literal(""), z.null()])
  .optional()
  .transform((v) => (v ? v : null));

export const nullableInt = z
  .union([z.number().int(), z.literal(""), z.null()])
  .optional()
  .transform((v) => (typeof v === "number" ? v : null));

export const requiredText = (label: string) => z.string().trim().min(1, `${label} este obligatoriu`);

export const idList = z.array(z.number().int().positive());
