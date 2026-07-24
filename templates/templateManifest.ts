import fs from "node:fs";
import path from "node:path";

// Template .docx files live here, put there by `pnpm run fetch` (or manually).
// This is runtime data, kept out of the source tree and gitignored — see .gitignore.
export const TEMPLATES_DIR = path.resolve("data/templates");

export type TemplateSpec = {
  driveName: string; // Drive file name (native Google Doc, no extension)
};

export const TEMPLATES = {
  comandaMateriale: { driveName: "template_comanda_materiale" },
} satisfies Record<string, TemplateSpec>;

export function templatePath(spec: TemplateSpec): string {
  return path.join(TEMPLATES_DIR, `${spec.driveName}.docx`);
}

// Reads a template from templates/. Throws a clear error if it's missing — the
// test flow assumes templates are already present (run `pnpm run fetch` first).
export function loadTemplate(spec: TemplateSpec): Buffer {
  const p = templatePath(spec);
  if (!fs.existsSync(p)) {
    throw new Error(
      `Template "${spec.driveName}.docx" not found in data/templates/. Run \`pnpm run fetch\` to download it from Drive.`,
    );
  }
  return fs.readFileSync(p);
}
