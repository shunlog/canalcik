import fs from "node:fs";
import path from "node:path";
import { Hono } from "hono";
import { fetchTemplates } from "../../../templates/fetchTemplates.ts";
import {
  TEMPLATES,
  type TemplateSpec,
  templatePath,
} from "../../../templates/templateManifest.ts";
import type { TemplateInfo } from "../api-types.ts";
import { ApiError } from "../http/errors.ts";

export const templates = new Hono();

function templateInfo(key: string, spec: TemplateSpec): TemplateInfo {
  const file = templatePath(spec);
  const stat = fs.statSync(file, { throwIfNoEntry: false });
  return {
    key,
    driveName: spec.driveName,
    driveUrl: process.env[spec.urlEnv] ?? null,
    fileName: path.basename(file),
    // mtime, not birthtime: a re-fetch overwrites the file in place, which
    // leaves birthtime at the very first download on most filesystems.
    fetchedAt: stat ? stat.mtime.toISOString() : null,
  };
}

const listTemplates = (): TemplateInfo[] =>
  Object.entries(TEMPLATES).map(([key, spec]) => templateInfo(key, spec));

templates.get("/", (c) => c.json(listTemplates()));

// Re-downloads every template from Drive and answers with the refreshed list,
// so the client gets the new timestamps without a second round-trip.
templates.post("/sync", async (c) => {
  try {
    await fetchTemplates();
  } catch (err) {
    // A misconfigured .env variable or a template that is no longer shared is
    // the user's to fix, so the message travels to the UI rather than a 500.
    throw new ApiError(
      409,
      "TEMPLATE_FETCH_FAILED",
      err instanceof Error ? err.message : "Descărcarea șabloanelor a eșuat",
    );
  }
  return c.json(listTemplates());
});
