import { Readable } from "node:stream";
import {
  GOOGLE_DOC_MIME,
  GOOGLE_SHEET_MIME,
  MIME,
  driveClient,
  escapeQueryValue,
  streamToBuffer,
} from "../utils/drive.ts";

// Native Google file types are exported to the matching Office format; anything
// else (e.g. an already-uploaded .docx/.xlsx) is downloaded as-is.
const EXPORT_MIME: Record<string, string> = {
  [GOOGLE_DOC_MIME]: MIME.docx,
  [GOOGLE_SHEET_MIME]: MIME.xlsx,
};

// Fetches a template from Drive and returns it as an Office-format Buffer.
// `driveName` is the Drive file name without extension (templates are native
// Google Docs/Sheets edited in Google's apps, e.g. "template_comanda_materiale").
// Google Docs export to .docx and Google Sheets to .xlsx; an already-uploaded
// .docx/.xlsx is downloaded as-is. Throws if it can't be read.
export async function downloadTemplate(driveName: string): Promise<Buffer> {
  const folderId = process.env.TEMPLATES_FOLDER_ID;
  if (!folderId) throw new Error("TEMPLATES_FOLDER_ID is not set");

  // Credentials, token.json and the "run `pnpm run auth`" hint all live in
  // utils/googleAuth.ts, which driveClient() goes through.
  const drive = driveClient();

  const list = await drive.files.list({
    q: `name = '${escapeQueryValue(driveName)}' and '${folderId}' in parents and trashed = false`,
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
