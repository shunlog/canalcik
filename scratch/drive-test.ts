import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { URL } from "node:url";
import { google } from "googleapis";

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const TOKEN_PATH = path.resolve("token.json");
const CONFIG_PATH = path.resolve("drive-config.json");
const APP_FOLDER_NAME = "canalcik-data";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

async function getAuthCodeViaBrowser(): Promise<string> {
  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("\nOpen this URL in your browser to authorize:\n");
  console.log(authUrl + "\n");

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url) return;
      const url = new URL(req.url, REDIRECT_URI);
      if (url.pathname !== "/oauth2callback") {
        res.writeHead(404).end();
        return;
      }
      const code = url.searchParams.get("code");
      const err = url.searchParams.get("error");
      res.writeHead(200, { "Content-Type": "text/plain" });
      if (err || !code) {
        res.end(`Auth failed: ${err ?? "no code"}`);
        server.close();
        reject(new Error(err ?? "no code"));
        return;
      }
      res.end("Auth complete. You can close this tab.");
      server.close();
      resolve(code);
    });
    server.listen(PORT);
  });
}

async function authorize() {
  if (fs.existsSync(TOKEN_PATH)) {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    oauth2.setCredentials(tokens);
    return;
  }
  const code = await getAuthCodeViaBrowser();
  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log(`Saved tokens to ${TOKEN_PATH}`);
}

type DriveClient = ReturnType<typeof google.drive>;

async function getOrCreateAppFolder(drive: DriveClient): Promise<string> {
  if (fs.existsSync(CONFIG_PATH)) {
    const { folderId } = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    try {
      const meta = await drive.files.get({ fileId: folderId, fields: "id, trashed" });
      if (meta.data.id && !meta.data.trashed) return meta.data.id;
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
  const folderId = created.data.id!;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ folderId }, null, 2));
  console.log(`Created app folder "${APP_FOLDER_NAME}" (${folderId})`);
  return folderId;
}

async function main() {
  await authorize();

  const drive = google.drive({ version: "v3", auth: oauth2 });
  const folderId = await getOrCreateAppFolder(drive);

  const filename = `canalcik-test-${Date.now()}.txt`;
  const res = await drive.files.create({
    requestBody: { name: filename, mimeType: "text/plain", parents: [folderId] },
    media: { mimeType: "text/plain", body: "Hello from canalcik!" },
    fields: "id, name, webViewLink",
  });

  console.log("Uploaded:", res.data);

  const list = await drive.files.list({
    fields: "files(id, name, mimeType, parents, trashed, ownedByMe)",
    pageSize: 1000,
  });
  console.log("\nAll files/dirs visible to this app:");
  for (const f of list.data.files ?? []) {
    const kind = f.mimeType === "application/vnd.google-apps.folder" ? "DIR " : "FILE";
    const inFolder = (f.parents ?? []).includes(folderId);
    const isAppFolder = f.id === folderId;
    const where = isAppFolder ? "[app folder]" : inFolder ? "[in app folder]" : "[stray]";
    const trashed = f.trashed ? " [trashed]" : "";
    console.log(`  ${kind}  ${where}  ${f.id}  ${f.name}${trashed}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
