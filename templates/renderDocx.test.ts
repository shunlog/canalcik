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
    expect(() =>
      renderDocxBuf(document(["{a} {b} {a}"]), {})).toThrow(
      /Missing template values: a, b/,
    );
  });
});
