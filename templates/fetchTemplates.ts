import "dotenv/config";
import fs from "node:fs";
import { downloadTemplate } from "./driveTemplates.ts";
import { TEMPLATES, TEMPLATES_DIR, templatePath } from "./templateManifest.ts";

// Pulls each template from Drive into data/templates/. Run via `pnpm run fetch`.
// Runs in plain Node (not Jest's vm sandbox), so googleapis works normally.
async function main() {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
  for (const spec of Object.values(TEMPLATES)) {
    const buf = await downloadTemplate(spec.driveName);
    const out = templatePath(spec);
    fs.writeFileSync(out, buf);
    console.log(`Fetched "${spec.driveName}" -> ${out}`);
  }
}

main().catch((err) => {
  console.error(err);
  console.error("You might need to run `pnpm run auth`");
  process.exit(1);
});
