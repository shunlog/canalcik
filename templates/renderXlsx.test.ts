import PizZip from "pizzip";
import { describe, it, expect } from "@jest/globals";
import { renderXlsxBuf } from "./renderXlsx.ts";

// Tests for the generic renderXlsxBuf() logic. They run against minimal
// workbooks built here rather than the real templates, so they don't depend on
// a fetched template and can exercise placeholder shapes the real ones lack.
// Tests for a specific template live in renderTemplates.test.ts.

// Builds a one-sheet .xlsx whose cells hold `strings` (one per row, column A),
// stored the way Excel/Sheets store text: in the shared-strings table.
function sharedStringSheet(strings: string[]): Buffer {
  const sst = strings.map((s) => `<si><t>${s}</t></si>`).join("");
  const rows = strings
    .map(
      (_, i) =>
        `<row r="${i + 1}"><c r="A${i + 1}" t="s"><v>${i}</v></c></row>`,
    )
    .join("");
  return workbook(
    `<sst xmlns="${MAIN_NS}" count="${strings.length}" uniqueCount="${strings.length}">${sst}</sst>`,
    rows,
  );
}

// The same, but with the text kept inline on the worksheet (t="inlineStr"),
// as some non-Excel producers write it — the other place we scan.
function inlineStringSheet(strings: string[]): Buffer {
  const rows = strings
    .map(
      (s, i) =>
        `<row r="${i + 1}"><c r="A${i + 1}" t="inlineStr"><is><t>${s}</t></is></c></row>`,
    )
    .join("");
  return workbook(`<sst xmlns="${MAIN_NS}" count="0" uniqueCount="0"/>`, rows);
}

const MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const PKG_NS = "http://schemas.openxmlformats.org/package/2006/relationships";
const DOC_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const CT_NS = "http://schemas.openxmlformats.org/package/2006/content-types";
const SHEET_CT =
  "application/vnd.openxmlformats-officedocument.spreadsheetml";

function workbook(sharedStringsXml: string, sheetRows: string): Buffer {
  const zip = new PizZip();
  zip.file(
    "[Content_Types].xml",
    `<Types xmlns="${CT_NS}">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="${SHEET_CT}.sheet.main+xml"/>` +
      `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="${SHEET_CT}.worksheet+xml"/>` +
      `<Override PartName="/xl/sharedStrings.xml" ContentType="${SHEET_CT}.sharedStrings+xml"/>` +
      `</Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<Relationships xmlns="${PKG_NS}"><Relationship Id="rId1" Type="${DOC_NS}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  );
  zip.file(
    "xl/workbook.xml",
    `<workbook xmlns="${MAIN_NS}" xmlns:r="${DOC_NS}"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  );
  zip.file(
    "xl/_rels/workbook.xml.rels",
    `<Relationships xmlns="${PKG_NS}">` +
      `<Relationship Id="rId1" Type="${DOC_NS}/worksheet" Target="worksheets/sheet1.xml"/>` +
      `<Relationship Id="rId2" Type="${DOC_NS}/sharedStrings" Target="sharedStrings.xml"/>` +
      `</Relationships>`,
  );
  zip.file("xl/sharedStrings.xml", sharedStringsXml);
  zip.file(
    "xl/worksheets/sheet1.xml",
    `<worksheet xmlns="${MAIN_NS}"><sheetData>${sheetRows}</sheetData></worksheet>`,
  );
  return zip.generate({ type: "nodebuffer" });
}

// All text the rendered workbook shows, so a test can assert what was filled in.
function renderedText(buf: Buffer): string {
  const zip = new PizZip(buf);
  return [
    zip.file("xl/sharedStrings.xml")?.asText() ?? "",
    ...zip.file(/^xl\/worksheets\/.*\.xml$/).map((f) => f.asText()),
  ].join("");
}

describe("renderXlsxBuf", () => {
  it("substitutes a scalar placeholder", () => {
    const buf = renderXlsxBuf(sharedStringSheet(["Sofer: ${name}"]), {
      name: "Celpan Ion",
    });
    expect(renderedText(buf)).toContain("Sofer: Celpan Ion");
  });

  it("leaves the caller's template buffer untouched", () => {
    const template = sharedStringSheet(["${name}"]);
    const before = Buffer.from(template);
    renderXlsxBuf(template, { name: "x" });
    expect(template.equals(before)).toBe(true);
  });

  it("expands ${table:...} into one row per array element", () => {
    const buf = renderXlsxBuf(
      sharedStringSheet(["${table:rows.nume}", "${table:rows.cant}"]),
      { rows: [{ nume: "Motorina", cant: 10 }, { nume: "Antigel", cant: 5 }] },
    );
    const text = renderedText(buf);
    expect(text).toContain("Motorina");
    expect(text).toContain("Antigel");
  });

  describe("missing values", () => {
    it("throws when a scalar has no value", () => {
      expect(() =>
        renderXlsxBuf(sharedStringSheet(["${name}", "${cod}"]), {
          name: "x",
          cod: undefined,
        }),
      ).toThrow(/Missing template values: cod/);
    });

    it("throws when a nested path doesn't resolve", () => {
      expect(() =>
        renderXlsxBuf(sharedStringSheet(["${sofer.nume}"]), { sofer: {} }),
      ).toThrow(/Missing template values: sofer\.nume/);
    });

    it("throws when a ${table:...} array is not an array", () => {
      expect(() =>
        renderXlsxBuf(sharedStringSheet(["${table:rows.a}"]), { rows: {} }),
      ).toThrow(/Missing template values: rows/);
    });

    it("throws when one table row lacks the property", () => {
      expect(() =>
        renderXlsxBuf(sharedStringSheet(["${table:rows.a}"]), {
          rows: [{ a: 1 }, {}],
        }),
      ).toThrow(/Missing template values: rows\.a/);
    });

    it("finds placeholders in inline strings too", () => {
      expect(() =>
        renderXlsxBuf(inlineStringSheet(["${name}"]), {}),
      ).toThrow(/Missing template values: name/);
    });

    it("accepts empty string, 0 and null as values", () => {
      expect(() =>
        renderXlsxBuf(sharedStringSheet(["${a}", "${b}", "${c}"]), {
          a: "",
          b: 0,
          c: null,
        }),
      ).not.toThrow();
    });
  });

  describe("unused values", () => {
    it("throws when a key has no placeholder", () => {
      expect(() =>
        renderXlsxBuf(sharedStringSheet(["${name}"]), {
          name: "x",
          cod_vechi: "1234",
        }),
      ).toThrow(/Unused data values: cod_vechi/);
    });

    it("counts a key reached by a nested or indexed path as used", () => {
      expect(() =>
        renderXlsxBuf(
          sharedStringSheet(["${sofer.nume}", "${tbl[0]}", "${table:rows.a}"]),
          { sofer: { nume: "x" }, tbl: ["one"], rows: [{ a: 1 }] },
        ),
      ).not.toThrow();
    });

    it("throws when a nested field has no placeholder", () => {
      expect(() =>
        renderXlsxBuf(sharedStringSheet(["${sofer.nume}"]), {
          sofer: { nume: "x", cod: "4984" },
        }),
      ).toThrow(/Unused data values: sofer\.cod/);
    });

    it("throws when a ${table:...} row field has no placeholder", () => {
      expect(() =>
        renderXlsxBuf(sharedStringSheet(["${table:rows.a}"]), {
          rows: [{ a: 1 }, { a: 2, b: 3 }],
        }),
      ).toThrow(/Unused data values: rows\.b/);
    });

    it("reports a field missing from every row only once", () => {
      expect(() =>
        renderXlsxBuf(sharedStringSheet(["${table:rows.a}"]), {
          rows: [{ a: 1, b: 3 }, { a: 2, b: 4 }],
        }),
      ).toThrow(/Unused data values: rows\.b$/);
    });

    it("treats an index as any element, so extra elements are not unused", () => {
      expect(() =>
        renderXlsxBuf(sharedStringSheet(["${tbl[0].a}"]), {
          tbl: [{ a: 1 }, { a: 2 }, { a: 3 }],
        }),
      ).not.toThrow();
    });

    it("reports every unused key", () => {
      expect(() =>
        renderXlsxBuf(sharedStringSheet(["${name}"]), {
          name: "x",
          one: 1,
          two: 2,
        }),
      ).toThrow(/Unused data values: one, two/);
    });
  });
});
