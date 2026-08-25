import fs from "node:fs";
import path from "node:path";

// Template .docx files live here, put there by `pnpm run fetch` (or manually).
// This is runtime data, kept out of the source tree and gitignored — see .gitignore.
// TEMPLATES_DIR is an absolute path from .env. A function, not a const, so it
// is read after .env has been loaded rather than at import time.
export const templatesDir = () => {
  const dir = process.env.TEMPLATES_DIR;
  if (!dir) throw new Error("TEMPLATES_DIR lipsește din .env");
  return dir;
};

// "docx" templates are native Google Docs, "xlsx" are native Google Sheets;
// both are exported to the matching Office format on fetch (see fetchTemplates).
export type TemplateKind = "docx" | "xlsx";

export type TemplateSpec = {
  driveName: string; // local base file name; also the Drive document's name
  urlEnv: string; // .env variable holding the Drive share URL of the source doc
  kind?: TemplateKind; // defaults to "docx"
};

export const TEMPLATES = {
  comandaMateriale: {
    driveName: "template_comanda_materiale",
    urlEnv: "TEMPLATE_URL_COMANDA_MATERIALE",
  },
  actDefectiune: {
    driveName: "template_act_defectiune",
    urlEnv: "TEMPLATE_URL_ACT_DEFECTIUNE",
  },
  fisaLimita: {
    driveName: "template_fisa_limita",
    urlEnv: "TEMPLATE_URL_FISA_LIMITA",
    kind: "xlsx",
  },
} satisfies Record<string, TemplateSpec>;

export function templatePath(spec: TemplateSpec): string {
  const ext = spec.kind ?? "docx";
  return path.join(templatesDir(), `${spec.driveName}.${ext}`);
}

// Reads a template from templates/. Throws a clear error if it's missing — the
// test flow assumes templates are already present (run `pnpm run fetch` first).
export function loadTemplate(spec: TemplateSpec): Buffer {
  const p = templatePath(spec);
  if (!fs.existsSync(p)) {
    throw new Error(
      `Template "${path.basename(p)}" not found in ${templatesDir()}. Run \`pnpm run fetch\` to download it from Drive.`,
    );
  }
  return fs.readFileSync(p);
}
