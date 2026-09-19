import type { Context } from "hono";
import type { ZodType } from "zod";
import { isoMonth } from "../schemas/common.ts";
import { ApiError } from "./errors.ts";

/**
 * Parse and validate a JSON body. A plain function rather than a Hono validator
 * middleware: the middleware's Variables generics have to be threaded through
 * every app.route() boundary, and this keeps full inference for free.
 * A ZodError bubbles up to onError, which turns it into a 400 with per-field messages.
 */
export async function readJson<T>(c: Context, schema: ZodType<T>): Promise<T> {
  const raw = await c.req.json().catch(() => {
    throw new ApiError(400, "BAD_JSON", "Corp JSON invalid");
  });
  return schema.parse(raw);
}

export function parseIdParam(c: Context, name = "id"): number {
  const n = Number(c.req.param(name));
  if (!Number.isInteger(n) || n <= 0) {
    throw new ApiError(400, "VALIDATION", `Parametrul "${name}" nu este un id valid`);
  }
  return n;
}

/**
 * Parses the `:month` route param, "YYYY-MM". Not just `isoMonth.parse` inline:
 * a ZodError from a bare string has `issue.path === []`, i.e. a `fields` key
 * of `""`, which is useless to the client.
 */
export function parseMonthParam(c: Context, name = "month"): string {
  const raw = c.req.param(name);
  const result = isoMonth.safeParse(raw);
  if (!result.success) {
    throw new ApiError(400, "VALIDATION", `Parametrul "${name}" nu este o lună validă`);
  }
  return result.data;
}

