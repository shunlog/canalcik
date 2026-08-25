import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { type Auth, google } from "googleapis";

// The OAuth plumbing shared by everything that touches Google Drive: the CLI
// flow (scripts/auth.ts), the template downloader (templates/) and the server's
// /api/drive routes. It reads GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET from the
// environment but never loads .env itself — the caller decides that (scripts do
// `import "dotenv/config"`, the server does it in server/src/env.ts).

// Resolved from this module, not process.cwd(): the server is started as
// `pnpm --filter @canalcik/server start`, whose cwd is server/. Same reason
// server/src/env.ts resolves .env this way.
//
// Note: `import.meta` means this module cannot be loaded by Jest (which
// transpiles to CommonJS). Tests mock it — see utils/drive.test.ts.
export const TOKEN_PATH = fileURLToPath(new URL("../token.json", import.meta.url));

export const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly", // find hand-made folders (see utils/drive.ts)
  "https://www.googleapis.com/auth/drive.file", // create/upload generated docs
];

export function readToken(): Auth.Credentials | null {
  if (!fs.existsSync(TOKEN_PATH)) return null;
  return JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8")) as Auth.Credentials;
}

/**
 * Persists tokens, merged over whatever is already on disk. Google only returns
 * a refresh_token on the first consent, and the refresh responses that arrive
 * later omit it — a blind overwrite would drop it and force a re-auth.
 */
export function writeToken(tokens: Auth.Credentials): void {
  const merged = { ...(readToken() ?? {}), ...tokens };
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(merged, null, 2));
}

export function hasToken(): boolean {
  return fs.existsSync(TOKEN_PATH);
}

/**
 * An OAuth2 client, pre-loaded with token.json when one exists. Pass
 * `redirectUri` only when running a consent flow; it must match one of the
 * authorized redirect URIs on the OAuth client in the Google Cloud console.
 */
export function oauthClient(redirectUri?: string): Auth.OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID sau GOOGLE_CLIENT_SECRET lipsește din .env");
  }

  const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const token = readToken();
  if (token) client.setCredentials(token);
  // Fires when the library silently refreshes the access token, so the next
  // process start doesn't have to refresh again.
  client.on("tokens", writeToken);
  return client;
}

export function authUrl(client: Auth.OAuth2Client, state?: string): string {
  return client.generateAuthUrl({
    access_type: "offline", // ask for a refresh token
    prompt: "consent", // force it even on re-auth
    scope: SCOPES,
    state,
  });
}

export async function exchangeCode(
  client: Auth.OAuth2Client,
  code: string,
): Promise<Auth.Credentials> {
  const { tokens } = await client.getToken(code);
  writeToken(tokens);
  client.setCredentials(tokens);
  return tokens;
}
