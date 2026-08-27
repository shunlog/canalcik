import "dotenv/config";
import fs from "node:fs";
import http from "node:http";
import { URL } from "node:url";
import { TOKEN_PATH, authUrl, exchangeCode, oauthClient } from "../utils/googleAuth.ts";

// Generates token.json — the OAuth credentials the app uses to reach the user's
// Google Drive.
//
// It opens a local server on PORT to catch Google's redirect, so add
// http://localhost:53682/oauth2callback as an authorized redirect URI on the
// OAuth client in the Google Cloud console.

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const force = process.argv.slice(2).some((a) => a === "--force" || a === "-f");

// Opens the consent URL, then waits for Google to redirect back to our local
// server with the one-time auth code.
function getAuthCodeViaBrowser(url: string): Promise<string> {
  console.log("\nOpen this URL in your browser to authorize:\n");
  console.log(url + "\n");

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url) return;
      const reqUrl = new URL(req.url, REDIRECT_URI);
      if (reqUrl.pathname !== "/oauth2callback") {
        res.writeHead(404).end();
        return;
      }
      const code = reqUrl.searchParams.get("code");
      const err = reqUrl.searchParams.get("error");
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

  const client = oauthClient(REDIRECT_URI);
  const code = await getAuthCodeViaBrowser(authUrl(client));
  await exchangeCode(client, code);
  console.log(`Saved tokens to ${TOKEN_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
