import { Readable } from "node:stream";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import {
  FOLDER_MIME,
  findOrCreateChildFolder,
  findOrCreateFolder,
  resetFolderCache,
  uploadBuffer,
} from "./drive.ts";

// googleAuth.ts reads token.json via import.meta.url, which @swc/jest can't
// transpile to CommonJS — and the tests must not touch a real token anyway. The
// mock stands in for the whole module (swc hoists it above the imports), so the
// real one is never parsed.
jest.mock("./googleAuth.ts", () => ({
  TOKEN_PATH: "/tmp/token.json",
  hasToken: () => true,
  oauthClient: () => ({}),
}));

/** A recorded stub: keeps the request bodies so the tests can assert on them. */
function stub(response: unknown) {
  const calls: Record<string, unknown>[] = [];
  const fn = async (args: Record<string, unknown>) => {
    calls.push(args);
    return response;
  };
  return Object.assign(fn, { calls });
}

// The slice of drive_v3.Drive that these two functions use.
function fakeDrive(files: { list?: unknown; create?: unknown; get?: unknown }) {
  const list = stub(files.list ?? { data: { files: [] } });
  const create = stub(files.create ?? { data: {} });
  const get = stub(files.get ?? { data: {} });
  // biome-ignore lint/suspicious/noExplicitAny: a hand-rolled stub of the client
  return { drive: { files: { list, create, get } } as any, list, create, get };
}

beforeEach(() => {
  resetFolderCache();
  delete process.env.GOOGLE_FOLDER_ID;
});

describe("uploadBuffer", () => {
  test("uploads into the given folder as a stream", async () => {
    const { drive, create } = fakeDrive({
      create: { data: { id: "f1", name: "raport.xlsx", webViewLink: "https://drive/f1" } },
    });

    const result = await uploadBuffer({
      buffer: Buffer.from("hello"),
      name: "raport.xlsx",
      mimeType: "application/vnd.ms-excel",
      folderId: "folder-1",
      drive,
    });

    expect(result).toEqual({ id: "f1", name: "raport.xlsx", webViewLink: "https://drive/f1" });

    const args = create.calls[0] as unknown as {
      requestBody: { name: string; parents: string[] };
      media: { mimeType: string; body: unknown };
    };
    expect(args.requestBody).toEqual({ name: "raport.xlsx", parents: ["folder-1"] });
    expect(args.media.mimeType).toBe("application/vnd.ms-excel");
    // A raw Buffer would be uploaded as its JSON representation.
    expect(args.media.body).toBeInstanceOf(Readable);
  });

  test("falls back to a constructed link when Drive omits webViewLink", async () => {
    const { drive } = fakeDrive({ create: { data: { id: "f2" } } });
    const result = await uploadBuffer({
      buffer: Buffer.from("x"),
      name: "a.pdf",
      mimeType: "application/pdf",
      folderId: "folder-1",
      drive,
    });
    expect(result.webViewLink).toBe("https://drive.google.com/file/d/f2/view");
  });

  test("throws when Drive returns no id", async () => {
    const { drive } = fakeDrive({ create: { data: {} } });
    await expect(
      uploadBuffer({
        buffer: Buffer.from("x"),
        name: "a.pdf",
        mimeType: "application/pdf",
        folderId: "folder-1",
        drive,
      }),
    ).rejects.toThrow(/a eșuat/);
  });
});

describe("findOrCreateFolder", () => {
  test("returns an existing folder without creating one", async () => {
    const { drive, list, create } = fakeDrive({
      list: { data: { files: [{ id: "d1", name: "canalcik", webViewLink: "https://drive/d1" }] } },
    });

    const folder = await findOrCreateFolder("canalcik", drive);

    expect(folder).toEqual({ id: "d1", name: "canalcik", webViewLink: "https://drive/d1" });
    expect(create.calls).toHaveLength(0);
    expect((list.calls[0] as { q: string }).q).toContain(`mimeType = '${FOLDER_MIME}'`);
  });

  test("creates the folder when the search comes back empty", async () => {
    const { drive, create } = fakeDrive({
      list: { data: { files: [] } },
      create: { data: { id: "d2", name: "canalcik" } },
    });

    const folder = await findOrCreateFolder("canalcik", drive);

    expect((create.calls[0] as { requestBody: unknown }).requestBody).toEqual({
      name: "canalcik",
      mimeType: FOLDER_MIME,
    });
    expect(folder.webViewLink).toBe("https://drive.google.com/drive/folders/d2");
  });

  test("memoizes, so the second call hits no API", async () => {
    const { drive, list } = fakeDrive({
      list: { data: { files: [{ id: "d1", name: "canalcik" }] } },
    });

    await findOrCreateFolder("canalcik", drive);
    await findOrCreateFolder("canalcik", drive);

    expect(list.calls).toHaveLength(1);
  });

  test("GOOGLE_FOLDER_ID short-circuits the search", async () => {
    process.env.GOOGLE_FOLDER_ID = "configured-id";
    const { drive, list, get } = fakeDrive({
      get: { data: { id: "configured-id", name: "documente", webViewLink: "https://drive/cfg" } },
    });

    const folder = await findOrCreateFolder("canalcik", drive);

    expect(list.calls).toHaveLength(0);
    expect(get.calls).toHaveLength(1);
    expect(folder).toEqual({
      id: "configured-id",
      name: "documente",
      webViewLink: "https://drive/cfg",
    });
  });

  test("escapes quotes in the folder name", async () => {
    const { drive, list } = fakeDrive({ create: { data: { id: "d3" } } });
    await findOrCreateFolder("it's mine", drive);
    expect((list.calls[0] as { q: string }).q).toContain("name = 'it\\'s mine'");
  });
});

describe("findOrCreateChildFolder", () => {
  test("returns an existing child folder without creating one", async () => {
    const { drive, list, create } = fakeDrive({
      list: {
        data: { files: [{ id: "c1", name: "fisa_limita", webViewLink: "https://drive/c1" }] },
      },
    });

    const folder = await findOrCreateChildFolder("fisa_limita", "parent-1", drive);

    expect(folder).toEqual({ id: "c1", name: "fisa_limita", webViewLink: "https://drive/c1" });
    expect(create.calls).toHaveLength(0);
    const q = (list.calls[0] as { q: string }).q;
    expect(q).toContain(`mimeType = '${FOLDER_MIME}'`);
    expect(q).toContain("'parent-1' in parents");
  });

  test("creates the child folder inside the parent when the search comes back empty", async () => {
    const { drive, create } = fakeDrive({
      list: { data: { files: [] } },
      create: { data: { id: "c2", name: "fisa_limita" } },
    });

    const folder = await findOrCreateChildFolder("fisa_limita", "parent-1", drive);

    expect((create.calls[0] as { requestBody: unknown }).requestBody).toEqual({
      name: "fisa_limita",
      mimeType: FOLDER_MIME,
      parents: ["parent-1"],
    });
    expect(folder.webViewLink).toBe("https://drive.google.com/drive/folders/c2");
  });

  test("memoizes per parent+name, so a second call for the same pair hits no API", async () => {
    const { drive, list } = fakeDrive({
      list: { data: { files: [{ id: "c1", name: "fisa_limita" }] } },
    });

    await findOrCreateChildFolder("fisa_limita", "parent-1", drive);
    await findOrCreateChildFolder("fisa_limita", "parent-1", drive);

    expect(list.calls).toHaveLength(1);
  });

  test("resetFolderCache also clears child-folder memoization", async () => {
    const { drive, list } = fakeDrive({
      list: { data: { files: [{ id: "c1", name: "fisa_limita" }] } },
    });

    await findOrCreateChildFolder("fisa_limita", "parent-1", drive);
    resetFolderCache();
    await findOrCreateChildFolder("fisa_limita", "parent-1", drive);

    expect(list.calls).toHaveLength(2);
  });
});
