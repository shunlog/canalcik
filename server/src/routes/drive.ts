import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import {
  checkAccess,
  findOrCreateFolder,
  isAuthError,
  resetFolderCache,
  uploadBuffer,
} from "../../../utils/drive.ts";
import { authUrl, exchangeCode, hasToken, oauthClient } from "../../../utils/googleAuth.ts";
import type { DriveStatusBody, DriveUploadBody } from "../api-types.ts";
import { GOOGLE_REDIRECT_URI } from "../env.ts";
import { ApiError, driveNotConnected } from "../http/errors.ts";

export const drive = new Hono();

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const STATE_TTL_MS = 10 * 60 * 1000;

// Single user, single process: an in-memory set is enough to keep a stray
// /callback hit from redeeming a code we never asked for.
const pendingStates = new Map<string, number>();

function newState(): string {
  const now = Date.now();
  for (const [state, expires] of pendingStates) {
    if (expires < now) pendingStates.delete(state);
  }
  const state = randomUUID();
  pendingStates.set(state, now + STATE_TTL_MS);
  return state;
}

function takeState(state: string | undefined): boolean {
  if (!state) return false;
  const expires = pendingStates.get(state);
  pendingStates.delete(state);
  return expires !== undefined && expires >= Date.now();
}

/**
 * The URI Google redirects back to. Derived from the request so the same build
 * works on :5173 (Vite proxies /api here) and behind Caddy; GOOGLE_REDIRECT_URI
 * overrides it. Must match an authorized redirect URI on the OAuth client.
 */
function redirectUri(requestUrl: string): string {
  if (GOOGLE_REDIRECT_URI) return GOOGLE_REDIRECT_URI;
  return `${new URL(requestUrl).origin}/api/drive/callback`;
}

drive.get("/status", async (c) => {
  if (!hasToken()) {
    const body: DriveStatusBody = { connected: false, reason: "missing" };
    return c.json(body);
  }

  try {
    const [email, folder] = await Promise.all([checkAccess(), findOrCreateFolder()]);
    const body: DriveStatusBody = { connected: true, email, folder };
    return c.json(body);
  } catch (err) {
    // A dead token is a normal state the UI has a button for, not a 500.
    if (isAuthError(err)) {
      const body: DriveStatusBody = { connected: false, reason: "revoked" };
      return c.json(body);
    }
    throw err;
  }
});

// A full-page navigation, not fetch: the consent screen is Google's own page.
drive.get("/auth", (c) => {
  const client = oauthClient(redirectUri(c.req.url));
  return c.redirect(authUrl(client, newState()), 302);
});

drive.get("/callback", async (c) => {
  const { code, error, state } = c.req.query();
  if (error || !code) return c.redirect(`/?drive=error`, 302);
  if (!takeState(state)) return c.redirect(`/?drive=state`, 302);

  const client = oauthClient(redirectUri(c.req.url));
  await exchangeCode(client, code);
  // The new token may belong to a different account, whose canalcik folder is a
  // different file.
  resetFolderCache();
  return c.redirect("/?drive=ok", 302);
});

drive.post("/upload", async (c) => {
  if (!hasToken()) throw driveNotConnected();

  const form = await c.req.formData().catch(() => {
    throw new ApiError(400, "VALIDATION", "Cererea nu conține un formular multipart");
  });

  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new ApiError(400, "VALIDATION", 'Lipsește câmpul "file"', { file: "Fișier obligatoriu" });
  }
  if (file.size === 0) {
    throw new ApiError(400, "VALIDATION", "Fișierul este gol", { file: "Fișierul este gol" });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError(400, "VALIDATION", `Fișierul depășește ${MAX_UPLOAD_BYTES / 1024 / 1024} MB`);
  }

  try {
    const folder = await findOrCreateFolder();
    const body: DriveUploadBody = await uploadBuffer({
      buffer: Buffer.from(await file.arrayBuffer()),
      name: file.name || "document",
      mimeType: file.type || "application/octet-stream",
      folderId: folder.id,
    });
    return c.json(body, 201);
  } catch (err) {
    // Same distinction /status makes: a dead token is something the user fixes
    // with the connect button, not a server fault.
    if (isAuthError(err)) throw driveNotConnected();
    throw err;
  }
});
