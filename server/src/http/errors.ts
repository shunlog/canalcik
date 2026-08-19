import type { ApiErrorCode } from "../api-types.ts";

/** An error with a deliberate HTTP status. Anything else becomes a 500. */
export class ApiError extends Error {
  constructor(
    readonly status: 400 | 404 | 409,
    readonly code: ApiErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const notFound = (what: string) =>
  new ApiError(404, "NOT_FOUND", `${what} nu a fost găsit(ă)`);

export const badRef = (message: string) => new ApiError(400, "BAD_REF", message);

export const hasDependents = (message: string) =>
  new ApiError(409, "HAS_DEPENDENTS", message);
