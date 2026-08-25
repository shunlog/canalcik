import fs from "node:fs";
import { GOOGLE_DOC_MIME, GOOGLE_SHEET_MIME, MIME } from "../utils/drive.ts";
import {
  TEMPLATES,
  type TemplateKind,
  type TemplateSpec,
  templatePath,
  templatesDir,
} from "./templateManifest.ts";

// Downloads the templates from Drive into TEMPLATES_DIR (data/templates by
// default). No OAuth involved: each template is a native Google Doc/Sheet
// shared with "anyone with the link" and addressed by its URL in .env. The CLI
// entry point is scripts/fetchTemplates.ts (`pnpm run fetch`); the server can
// call these same functions to refresh the templates on demand.

// The source Google file type per template kind, and the Office format it is
// exported to.
const SOURCE_MIME: Record<string, string> = {
  docx: GOOGLE_DOC_MIME,
  xlsx: GOOGLE_SHEET_MIME,
};
const EXPORT_MIME: Record<string, string> = {
  docx: MIME.docx,
  xlsx: MIME.xlsx,
};

// The editor host each kind lives under, used by the keyless export URL below.
const DOCS_PATH: Record<string, string> = {
  docx: "document",
  xlsx: "spreadsheets",
};

/**
 * The URL a template is exported from. Both endpoints serve a link-shared file
 * without any user credentials:
 *
 * - with GOOGLE_API_KEY set, the Drive API's files.export;
 * - without one, docs.google.com's export endpoint, which needs no key at all.
 *
 * The API key must have no HTTP-referrer restriction — a browser-restricted key
 * answers 403 API_KEY_HTTP_REFERRER_BLOCKED to a request from Node.
 */
function exportUrl(fileId: string, kind: TemplateKind): URL {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return new URL(
      `https://docs.google.com/${DOCS_PATH[kind]}/d/${fileId}/export?format=${kind}`,
    );
  }
  const url = new URL(
    `https://www.googleapis.com/drive/v3/files/${fileId}/export`,
  );
  url.searchParams.set("mimeType", EXPORT_MIME[kind]);
  url.searchParams.set("key", apiKey);
  return url;
}

/** The Drive file id in a share URL, e.g. https://docs.google.com/document/d/<id>/edit. */
export function fileIdFromUrl(url: string): string {
  const fromPath = url.match(/\/d\/([A-Za-z0-9_-]+)/)?.[1];
  if (fromPath) return fromPath;
  // Older-style links carry the id in a query parameter instead.
  const fromQuery = url.match(/[?&]id=([A-Za-z0-9_-]+)/)?.[1];
  if (fromQuery) return fromQuery;
  throw new Error(`Nu s-a găsit un id de fișier Drive în URL-ul "${url}"`);
}

/** The Drive file id a template is configured with, from its .env variable. */
export function templateFileId(spec: TemplateSpec): string {
  const url = process.env[spec.urlEnv];
  if (!url) throw new Error(`${spec.urlEnv} lipsește din .env`);
  return fileIdFromUrl(url);
}

/**
 * Fetches one template from Drive and returns it as an Office-format Buffer:
 * a Google Doc exported to .docx, a Google Sheet to .xlsx.
 *
 * The file has to be readable by "anyone with the link" — an API key carries
 * no user identity, so a private file answers 404.
 */
export async function downloadTemplate(spec: TemplateSpec): Promise<Buffer> {
  const kind = spec.kind ?? "docx";
  const fileId = templateFileId(spec);

  const res = await fetch(exportUrl(fileId, kind), { redirect: "follow" });
  if (!res.ok) {
    const body = (await res.text().catch(() => "")).slice(0, 500);
    throw new Error(
      `Descărcarea template-ului "${spec.driveName}" (${fileId}) a eșuat: ` +
        `${res.status} ${res.statusText}. ${body}\n` +
        `Verifică ${spec.urlEnv} și că fișierul este un ${SOURCE_MIME[kind]} ` +
        `partajat cu oricine are linkul.`,
    );
  }

  return Buffer.from(await res.arrayBuffer());
}

/**
 * Downloads every template into templatesDir(), creating it if needed, and
 * returns the paths written. Safe to call at runtime to refresh them.
 */
export async function fetchTemplates(): Promise<string[]> {
  fs.mkdirSync(templatesDir(), { recursive: true });
  const specs = Object.values(TEMPLATES) as TemplateSpec[];
  const buffers = await Promise.all(specs.map(downloadTemplate));
  return specs.map((spec, i) => {
    const out = templatePath(spec);
    fs.writeFileSync(out, buffers[i]);
    return out;
  });
}
