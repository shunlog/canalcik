import { Prisma } from "@prisma/client";
import type { ErrorHandler } from "hono";
import { ZodError } from "zod";
import type { ApiErrorBody, ApiErrorCode } from "../api-types.ts";
import { ApiError } from "./errors.ts";

const body = (
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string>,
): ApiErrorBody => ({ error: { code, message, fields } });

/**
 * The single place where anything thrown by a route becomes a JSON response.
 * Handlers can therefore just throw instead of threading status codes around.
 */
export const onError: ErrorHandler = (err, c) => {
  if (err instanceof ApiError) {
    return c.json(body(err.code, err.message, err.fields), err.status);
  }

  if (err instanceof ZodError) {
    // Keyed by field path so the client can hand it straight to form.setErrors().
    const fields: Record<string, string> = {};
    for (const issue of err.issues) fields[issue.path.join(".")] = issue.message;
    return c.json(body("VALIDATION", "Datele trimise nu sunt valide", fields), 400);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      // update/delete/connect against a row that isn't there
      case "P2025":
        return c.json(body("NOT_FOUND", "Înregistrarea nu a fost găsită"), 404);

      // Sofer.cod, Vehicul.nrInventar, Vehicul.nrGaraj, @@unique([litere, cifre])
      // are all editable from the UI, so this one will fire in normal use.
      case "P2002": {
        const target = (err.meta?.target as string[] | undefined)?.join(", ");
        return c.json(
          body(
            "DUPLICATE",
            `Există deja o înregistrare cu aceeași valoare${target ? ` pentru: ${target}` : ""}`,
          ),
          409,
        );
      }

      // A foreign key would be violated. The DELETE handlers pre-check and give
      // a far better message; this is the backstop for races and every other path.
      case "P2003":
      case "P2014":
        return c.json(
          body("HAS_DEPENDENTS", "Operația ar rupe o legătură — există înregistrări dependente"),
          409,
        );
    }
  }

  console.error(err);
  return c.json(body("INTERNAL", "Eroare internă a serverului"), 500);
};
