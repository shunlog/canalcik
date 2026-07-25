import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { google } from "googleapis";

const TOKEN_PATH = path.resolve("token.json");

const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";
const GOOGLE_SHEET_MIME = "application/vnd.google-apps.spreadsheet";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Native Google file types are exported to the matching Office format; anything
// else (e.g. an already-uploaded .docx/.xlsx) is downloaded as-is.
const EXPORT_MIME: Record<string, string> = {
  [GOOGLE_DOC_MIME]: DOCX_MIME,
  [GOOGLE_SHEET_MIME]: XLSX_MIME,
};

function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

// Fetches a template from Drive and returns it as an Office-format Buffer.
// `driveName` is the Drive file name without extension (templates are native
// Google Docs/Sheets edited in Google's apps, e.g. "template_comanda_materiale").
// Google Docs export to .docx and Google Sheets to .xlsx; an already-uploaded
// .docx/.xlsx is downloaded as-is. Throws if it can't be read.
export async function downloadTemplate(driveName: string): Promise<Buffer> {
  const folderId = process.env.TEMPLATES_FOLDER_ID;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!folderId) throw new Error("TEMPLATES_FOLDER_ID is not set");
  if (!clientId || !clientSecret) throw new Error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set");
  if (!fs.existsSync(TOKEN_PATH)) throw new Error(`${TOKEN_PATH} not found. Run \`pnpm run auth\` once to authorize.`);

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8")));
  const drive = google.drive({ version: "v3", auth: oauth2 });

  const list = await drive.files.list({
    q: `name = '${driveName}' and '${folderId}' in parents and trashed = false`,
    fields: "files(id, name, mimeType)",
    pageSize: 1,
  });

  const file = list.data.files?.[0];
  if (!file) {
    throw new Error(`"${driveName}" not found in Drive folder ${folderId}`);
  }

  const exportMime = EXPORT_MIME[file.mimeType ?? ""];
  const res = exportMime
    ? await drive.files.export(
        { fileId: file.id!, mimeType: exportMime },
        { responseType: "stream" },
      )
    : await drive.files.get(
        { fileId: file.id!, alt: "media" },
        { responseType: "stream" },
      );

  return streamToBuffer(res.data as Readable);
}
