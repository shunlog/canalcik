import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";

const TOKEN_PATH = path.resolve("token.json");
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  throw new Error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in .env");
}
if (!fs.existsSync(TOKEN_PATH)) {
  throw new Error(
    `Missing ${TOKEN_PATH}. Run \`pnpm tsx scratch/drive-test.ts\` once to authorize.`,
  );
}

const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
oauth2.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8")));
const drive = google.drive({ version: "v3", auth: oauth2 });

export type UploadResult = {
  id: string;
  webViewLink: string | null;
};

// Uploads a .docx Buffer to Drive as a new file. If `folderId` is given the file
// is placed in that folder, otherwise it lands in My Drive root. Needs the
// `drive.file` scope (see SCOPES in scratch/drive-test.ts).
export async function uploadDocxBuffer(
  name: string,
  buffer: Buffer,
  folderId?: string,
): Promise<UploadResult> {
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: DOCX_MIME,
      ...(folderId ? { parents: [folderId] } : {}),
    },
    media: { mimeType: DOCX_MIME, body: Readable.from(buffer) },
    fields: "id, webViewLink",
  });
  return { id: res.data.id!, webViewLink: res.data.webViewLink ?? null };
}

// Demo: `pnpm tsx scratch/driveWrite.ts [localPath]` uploads a local .docx
// (default test-output/comanda.docx) to Drive. Set DOCS_FOLDER_ID to target a folder.
async function main() {
  const src = process.argv[2] ?? "test-output/comanda.docx";
  const buffer = fs.readFileSync(path.resolve(src));
  const result = await uploadDocxBuffer(
    path.basename(src),
    buffer,
    process.env.DOCS_FOLDER_ID,
  );
  console.log("Uploaded:", result);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
