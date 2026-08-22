import { Readable } from "node:stream";
import { type Auth, type drive_v3, google } from "googleapis";
import { TOKEN_PATH, hasToken, oauthClient } from "./googleAuth.ts";

export const FOLDER_MIME = "application/vnd.google-apps.folder";
export const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";
export const GOOGLE_SHEET_MIME = "application/vnd.google-apps.spreadsheet";

export const MIME = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
  bin: "application/octet-stream",
} as const;

/** The app's folder on the user's Drive, as described in the README. */
export const APP_FOLDER_NAME = "canalcik";

export interface DriveFolder {
  id: string;
  name: string;
  webViewLink: string;
}

export interface DriveFile {
  id: string;
  name: string;
  webViewLink: string;
}

/** A Drive client. With no argument it uses the credentials in token.json. */
export function driveClient(auth?: Auth.OAuth2Client): drive_v3.Drive {
  if (!auth && !hasToken()) {
    throw new Error(`${TOKEN_PATH} nu există. Rulează \`pnpm run auth\` o dată pentru autorizare.`);
  }
  return google.drive({ version: "v3", auth: auth ?? oauthClient() });
}

export function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

/** Single quotes are the string delimiter in Drive's query language. */
export function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

const folderLink = (id: string, webViewLink?: string | null) =>
  webViewLink ?? `https://drive.google.com/drive/folders/${id}`;

let cachedFolder: DriveFolder | null = null;
const cachedChildFolders = new Map<string, DriveFolder>();

/** Forgets the memoized folders — call after the credentials change. */
export function resetFolderCache(): void {
  cachedFolder = null;
  cachedChildFolders.clear();
}

/**
 * Resolves the folder that generated documents go into, creating it on first
 * use. GOOGLE_FOLDER_ID short-circuits the lookup when it is set.
 *
 * Note on scopes: the name search only sees a hand-made folder because
 * scripts/auth.ts also requests drive.readonly. Under drive.file alone,
 * files.list returns nothing but app-created files, so the first run would
 * create its own folder instead of finding an existing one.
 */
export async function findOrCreateFolder(
  name: string = APP_FOLDER_NAME,
  client?: drive_v3.Drive,
): Promise<DriveFolder> {
  if (cachedFolder) return cachedFolder;
  const drive = client ?? driveClient();

  const configured = process.env.GOOGLE_FOLDER_ID;
  if (configured) {
    const res = await drive.files.get({
      fileId: configured,
      fields: "id,name,webViewLink",
    });
    cachedFolder = {
      id: configured,
      name: res.data.name ?? name,
      webViewLink: folderLink(configured, res.data.webViewLink),
    };
    return cachedFolder;
  }

  const list = await drive.files.list({
    q: `mimeType = '${FOLDER_MIME}' and name = '${escapeQueryValue(name)}' and trashed = false`,
    fields: "files(id,name,webViewLink)",
    pageSize: 1,
  });

  const found = list.data.files?.[0];
  if (found?.id) {
    cachedFolder = {
      id: found.id,
      name: found.name ?? name,
      webViewLink: folderLink(found.id, found.webViewLink),
    };
    return cachedFolder;
  }

  const created = await drive.files.create({
    requestBody: { name, mimeType: FOLDER_MIME },
    fields: "id,name,webViewLink",
  });
  if (!created.data.id) throw new Error(`Nu s-a putut crea folderul "${name}" pe Drive`);

  cachedFolder = {
    id: created.data.id,
    name: created.data.name ?? name,
    webViewLink: folderLink(created.data.id, created.data.webViewLink),
  };
  return cachedFolder;
}

/** The subfolder generated "fisa limita" documents are uploaded into. */
export const FISA_LIMITA_FOLDER = "fisa_limita";

/**
 * Resolves a subfolder of `parentId` by name, creating it on first use. Keyed
 * by `${parentId}/${name}` since, unlike the app's root folder, there can be
 * more than one of these.
 *
 * Note on scopes: the name search only sees a hand-made folder because
 * scripts/auth.ts also requests drive.readonly. Under drive.file alone,
 * files.list returns nothing but app-created files, so the first run would
 * create its own folder instead of finding an existing one.
 */
export async function findOrCreateChildFolder(
  name: string,
  parentId: string,
  client?: drive_v3.Drive,
): Promise<DriveFolder> {
  const cacheKey = `${parentId}/${name}`;
  const cached = cachedChildFolders.get(cacheKey);
  if (cached) return cached;
  const drive = client ?? driveClient();

  const list = await drive.files.list({
    q: `mimeType = '${FOLDER_MIME}' and name = '${escapeQueryValue(name)}' and '${parentId}' in parents and trashed = false`,
    fields: "files(id,name,webViewLink)",
    pageSize: 1,
  });

  const found = list.data.files?.[0];
  if (found?.id) {
    const folder = {
      id: found.id,
      name: found.name ?? name,
      webViewLink: folderLink(found.id, found.webViewLink),
    };
    cachedChildFolders.set(cacheKey, folder);
    return folder;
  }

  const created = await drive.files.create({
    requestBody: { name, mimeType: FOLDER_MIME, parents: [parentId] },
    fields: "id,name,webViewLink",
  });
  if (!created.data.id) throw new Error(`Nu s-a putut crea folderul "${name}" pe Drive`);

  const folder = {
    id: created.data.id,
    name: created.data.name ?? name,
    webViewLink: folderLink(created.data.id, created.data.webViewLink),
  };
  cachedChildFolders.set(cacheKey, folder);
  return folder;
}

/**
 * Uploads a Buffer as a new file in `folderId`. The rendering pipeline in
 * templates/ produces Buffers, never paths, so this is the shape everything
 * uploads through.
 */
export async function uploadBuffer(opts: {
  buffer: Buffer;
  name: string;
  mimeType: string;
  folderId: string;
  /** Defaults to the credentials in token.json. */
  auth?: Auth.OAuth2Client;
  drive?: drive_v3.Drive;
}): Promise<DriveFile> {
  const drive = opts.drive ?? driveClient(opts.auth);
  const res = await drive.files.create({
    requestBody: { name: opts.name, parents: [opts.folderId] },
    media: {
      mimeType: opts.mimeType,
      // googleapis wants a stream or a string here; a raw Buffer is uploaded
      // as its JSON representation.
      body: Readable.from(opts.buffer),
    },
    fields: "id,name,webViewLink",
  });

  if (!res.data.id) throw new Error(`Încărcarea "${opts.name}" pe Drive a eșuat`);
  return {
    id: res.data.id,
    name: res.data.name ?? opts.name,
    webViewLink: res.data.webViewLink ?? `https://drive.google.com/file/d/${res.data.id}/view`,
  };
}

/** The account the current token belongs to. Throws if it is missing or revoked. */
export async function checkAccess(drive: drive_v3.Drive = driveClient()): Promise<string> {
  const res = await drive.about.get({ fields: "user(emailAddress)" });
  return res.data.user?.emailAddress ?? "";
}

/** True for the errors that mean "re-authorize", as opposed to a real failure. */
export function isAuthError(err: unknown): boolean {
  const e = err as { code?: unknown; status?: unknown; message?: unknown };
  const status = typeof e?.code === "number" ? e.code : typeof e?.status === "number" ? e.status : 0;
  if (status === 401 || status === 403) return true;
  return typeof e?.message === "string" && /invalid_grant|invalid_token/i.test(e.message);
}
