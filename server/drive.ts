import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const TOKEN_PATH = path.resolve("token.json");
const CONFIG_PATH = path.resolve("drive-config.json");
const APP_FOLDER_NAME = "canalcik-data";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  throw new Error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in .env");
}

// Run `pnpm tsx drive-test.ts` once to perform interactive OAuth and produce
// token.json + drive-config.json. The server reads them directly.
const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
if (!fs.existsSync(TOKEN_PATH)) {
  throw new Error(`Missing ${TOKEN_PATH}. Run \`pnpm tsx drive-test.ts\` once to authorize.`);
}
oauth2.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8")));

const drive = google.drive({ version: "v3", auth: oauth2 });

let cachedFolderId: string | null = null;

async function getOrCreateAppFolder(): Promise<string> {
  if (cachedFolderId) return cachedFolderId;

  if (fs.existsSync(CONFIG_PATH)) {
    const { folderId } = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    try {
      const meta = await drive.files.get({ fileId: folderId, fields: "id, trashed" });
      if (meta.data.id && !meta.data.trashed) {
        cachedFolderId = meta.data.id;
        return cachedFolderId;
      }
    } catch {
      // fall through and recreate
    }
  }

  const created = await drive.files.create({
    requestBody: {
      name: APP_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id",
  });
  cachedFolderId = created.data.id!;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ folderId: cachedFolderId }, null, 2));
  return cachedFolderId;
}

export type UploadResult = {
  driveFileId: string;
  driveFileUrl: string | null;
};

export async function uploadDocx(filename: string, buffer: Buffer): Promise<UploadResult> {
  const folderId = await getOrCreateAppFolder();
  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    media: {
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      body: Readable.from(buffer),
    },
    fields: "id, webViewLink",
  });

  return {
    driveFileId: res.data.id!,
    driveFileUrl: res.data.webViewLink ?? null,
  };
}
