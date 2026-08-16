import PizZip from "pizzip";
import { describe, it, expect } from "@jest/globals";
import { renderDocxBuf } from "./renderDocx.ts";

// Tests for the generic renderDocxBuf() logic. They run against minimal
// documents built here rather than the real templates, so they don't depend on
// a fetched template. Tests for a specific template live in
// renderTemplates.test.ts.

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const PKG_NS = "http://schemas.openxmlformats.org/package/2006/relationships";
const DOC_NS =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const CT_NS = "http://schemas.openxmlformats.org/package/2006/content-types";

// Builds a .docx whose body is one paragraph per string.
function document(paragraphs: string[]): Buffer {
  const zip = new PizZip();
  zip.file(
    "[Content_Types].xml",
    `<Types xmlns="${CT_NS}">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
      `</Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<Relationships xmlns="${PKG_NS}"><Relationship Id="rId1" Type="${DOC_NS}/officeDocument" Target="word/document.xml"/></Relationships>`,
  );
  const body = paragraphs
    .map((p) => `<w:p><w:r><w:t xml:space="preserve">${p}</w:t></w:r></w:p>`)
    .join("");
  zip.file(
    "word/document.xml",
    `<w:document xmlns:w="${W_NS}"><w:body>${body}</w:body></w:document>`,
  );
  return zip.generate({ type: "nodebuffer" });
}

function renderedText(buf: Buffer): string {
  return new PizZip(buf).file("word/document.xml")!.asText();
}

describe("renderDocxBuf", () => {
  it("substitutes a scalar tag", () => {
    const buf = renderDocxBuf(document(["Sofer: {name}"]), {
      name: "Celpan Ion",
    });
    expect(renderedText(buf)).toContain("Sofer: Celpan Ion");
  });

  it("expands a loop over an array of objects", () => {
    const buf = renderDocxBuf(document(["{#rows}{nume}|{/rows}"]), {
      rows: [{ nume: "Motorina" }, { nume: "Antigel" }],
    });
    const text = renderedText(buf);
    expect(text).toContain("Motorina");
    expect(text).toContain("Antigel");
  });

  it("renders an empty loop without complaining about its inner tags", () => {
    expect(() =>
      renderDocxBuf(document(["{#rows}{nume}{/rows}"]), { rows: [] }),
    ).not.toThrow();
  });

  describe("missing values", () => {
    it("throws when a scalar tag has no value", () => {
      expect(() =>
        renderDocxBuf(document(["{name}", "{cod}"]), { name: "x" }),
      ).toThrow(/Missing template values: cod/);
    });

    it("throws when a tag inside a loop has no value", () => {
      expect(() =>
        renderDocxBuf(document(["{#rows}{nume}{/rows}"]), { rows: [{}] }),
      ).toThrow(/Missing template values: nume/);
    });

    it("reports every missing tag once", () => {
      expect(() => renderDocxBuf(document(["{a} {b} {a}"]), {})).toThrow(
        /Missing template values: a, b/,
      );
    });
  });

  describe("unused values", () => {
    it("throws when a key has no tag", () => {
      expect(() =>
        renderDocxBuf(document(["{name}"]), { name: "x", cod_vechi: "1234" }),
      ).toThrow(/Unused data values: cod_vechi/);
    });

    it("reports every unused key", () => {
      expect(() =>
        renderDocxBuf(document(["{name}"]), { name: "x", one: 1, two: 2 }),
      ).toThrow(/Unused data values: one, two/);
    });

    it("counts a key used only inside a loop as used", () => {
      expect(() =>
        renderDocxBuf(document(["{#rows}{nume}{/rows}"]), {
          rows: [{ nume: "Motorina" }],
        }),
      ).not.toThrow();
    });

    it("throws when a loop's row field has no tag", () => {
      expect(() =>
        renderDocxBuf(document(["{#rows}{nume}{/rows}"]), {
          rows: [{ nume: "Motorina" }, { nume: "Antigel", cod: "120673" }],
        }),
      ).toThrow(/Unused data values: rows\.cod/);
    });

    it("reports a field missing from every row only once", () => {
      expect(() =>
        renderDocxBuf(document(["{#rows}{nume}{/rows}"]), {
          rows: [{ nume: "Motorina", cod: "1" }, { nume: "Antigel", cod: "2" }],
        }),
      ).toThrow(/Unused data values: rows\.cod$/);
    });

    it("checks fields of a nested loop", () => {
      expect(() =>
        renderDocxBuf(document(["{#a}{#b}{c}{/b}{/a}"]), {
          a: [{ b: [{ c: 1, d: 2 }] }],
        }),
      ).toThrow(/Unused data values: a\.b\.d/);
    });

    it("counts a whole element as used when the loop renders it with {.}", () => {
      expect(() =>
        renderDocxBuf(document(["{#list}{.}{/list}"]), { list: ["a", "b"] }),
      ).not.toThrow();
    });

    it("counts a key used only as a condition as used", () => {
      expect(() =>
        renderDocxBuf(document(["{#flag}yes{/flag}"]), { flag: true }),
      ).not.toThrow();
    });

    it("counts a key whose loop is empty as used", () => {
      expect(() =>
        renderDocxBuf(document(["{#rows}{nume}{/rows}"]), { rows: [] }),
      ).not.toThrow();
    });

    it("reports missing values before unused ones", () => {
      expect(() =>
        renderDocxBuf(document(["{name}"]), { cod_vechi: "1234" }),
      ).toThrow(/Missing template values: name/);
    });
  });
});
