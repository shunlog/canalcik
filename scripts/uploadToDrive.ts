import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { MIME, findOrCreateFolder, uploadBuffer } from "../utils/drive.ts";

// Uploads a local file into the app's Drive folder: `pnpm run upload:drive <file>`.
// A thin wrapper over utils/drive.ts, so it doubles as the manual smoke test for
// the same code path the server uses.

const MIME_BY_EXT: Record<string, string> = {
  ".docx": MIME.docx,
  ".xlsx": MIME.xlsx,
  ".pdf": MIME.pdf,
};

async function main(): Promise<void> {
  const source = process.argv[2];
  if (!source || source === "--help" || source === "-h") {
    console.log("Usage: pnpm run upload:drive <file>");
    process.exitCode = source ? 0 : 1;
    return;
  }

  const sourcePath = path.resolve(source);
  if (!fs.existsSync(sourcePath)) throw new Error(`File not found: ${sourcePath}`);
  if (!fs.statSync(sourcePath).isFile()) throw new Error(`Not a file: ${sourcePath}`);

  const folder = await findOrCreateFolder();
  const file = await uploadBuffer({
    buffer: fs.readFileSync(sourcePath),
    name: path.basename(sourcePath),
    mimeType: MIME_BY_EXT[path.extname(sourcePath).toLowerCase()] ?? MIME.bin,
    folderId: folder.id,
  });

  console.log(`Uploaded ${file.name} to "${folder.name}" (ID: ${file.id})`);
  console.log(file.webViewLink);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
