import { Hono } from "hono";
import { findOrCreateFolder, isAuthError } from "../../../utils/drive.ts";
import { hasToken } from "../../../utils/googleAuth.ts";
import type { DriveStatusBody } from "../api-types.ts";

export const drive = new Hono();

// Read-only: authorization happens once from the terminal (`pnpm run auth`),
// and the server just uses the token.json it leaves behind.
drive.get("/status", async (c) => {
  if (!hasToken()) {
    const body: DriveStatusBody = { connected: false };
    return c.json(body);
  }

  try {
    // Creates the app folder on the first call — this is what puts "canalcik"
    // on the Drive, so that later lookups find it under drive.file.
    const folder = await findOrCreateFolder();
    const body: DriveStatusBody = { connected: true, folder };
    return c.json(body);
  } catch (err) {
    // A dead token is a normal state the UI reports, not a 500.
    if (isAuthError(err)) {
      const body: DriveStatusBody = { connected: false };
      return c.json(body);
    }
    throw err;
  }
});
