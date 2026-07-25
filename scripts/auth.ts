import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { URL } from "node:url";
import { google } from "googleapis";

// Generates token.json — the OAuth credentials the app uses to reach the user's
// Google Drive. Run once (and again if you add scopes or the refresh token is
// revoked): `pnpm run auth`. Pass --force to overwrite an existing token.json.
//
// It opens a local server on PORT to catch Google's redirect, so add
// http://localhost:53682/oauth2callback as an authorized redirect URI on the
// OAuth client in the Google Cloud console.

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly", // read user-created template docs
  "https://www.googleapis.com/auth/drive.file", // create/upload generated docs
];
const TOKEN_PATH = path.resolve("token.json");

const force = process.argv.slice(2).some((a) => a === "--force" || a === "-f");

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

// Opens the consent URL, then waits for Google to redirect back to our local
// server with the one-time auth code.
function getAuthCodeViaBrowser(): Promise<string> {
  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline", // ask for a refresh token
    prompt: "consent", // force it even on re-auth
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

async function main() {
  if (fs.existsSync(TOKEN_PATH) && !force) {
    console.log(
      `${TOKEN_PATH} already exists. Delete it or run \`pnpm run auth --force\` to regenerate.`,
    );
    return;
  }

  const code = await getAuthCodeViaBrowser();
  const { tokens } = await oauth2.getToken(code);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log(`Saved tokens to ${TOKEN_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
