import "dotenv/config";
import { fetchTemplates } from "../templates/fetchTemplates.ts";

// Pulls each template from Drive into data/templates/. Run via `pnpm run fetch`.
fetchTemplates()
  .then((paths) => {
    for (const p of paths) console.log(`Fetched -> ${p}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
