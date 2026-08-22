import PizZip from "pizzip";
import XlsxTemplate from "xlsx-template";
import { findUnusedValues, type TagTree } from "./unusedValues.ts";

// Fills an .xlsx template with `data` and returns the rendered workbook as a
// Buffer. This is the spreadsheet counterpart to renderDocxBuf() in renderTemplates.ts.
//
// We use `xlsx-template` (free) rather than docxtemplater's paid XLSX module.
// Its placeholder syntax differs from the docx templates ({...}); in a sheet
// cell you write:
//   ${name}             a scalar value
//   ${arr[0]}           one element of an array
//   ${arr}              an array expanded across columns (cell must be alone)
//   ${table:arr.prop}   an array of objects expanded DOWN into one row each
//
// Like renderDocxBuf, the data type is the contract: every placeholder in the
// template must have a value. We enforce this ourselves — xlsx-template has no
// equivalent of docxtemplater's nullGetter and silently fills a missing key
// with an empty string, so a half-filled sheet would otherwise ship unnoticed.
// The contract runs both ways: a value in `data` that no placeholder uses is
// also an error (down to the fields of a ${table:...} row), since it usually
// means the template and the data type have drifted apart (a renamed or
// deleted placeholder).
export function renderXlsxBuf(
  templateBuf: Buffer,
  data: Record<string, any>,
  sheet: string | number = 1,
): Buffer {
  // xlsx-template mutates the buffer it's given, so hand it a private copy —
  // the caller may render the same template more than once.
  const template = new XlsxTemplate(Buffer.from(templateBuf));
  renderXlsxSheet(template, templateBuf, data, sheet);
  return template.generate({ type: "nodebuffer" }) as Buffer;
}

// Renders one copy of the template's first worksheet for each data item. The
// source worksheet is removed from the result, so every tab is a filled-in
// sheet rather than an unrendered template tab. Sheet names come from `name`;
// callers must provide one valid, unique Excel worksheet name per item.
export function renderXlsxTabs(
  templateBuf: Buffer,
  tabs: ReadonlyArray<{ name: string; data: Record<string, any> }>,
): Buffer {
  if (tabs.length === 0) {
    throw new Error("Cannot render an XLSX workbook without tabs");
  }

  // copySheet() preserves the complete worksheet structure (styles, merged
  // cells, print settings and sheet relationships), unlike recreating cells
  // in a new workbook would. Copy before substituting so every tab starts from
  // the untouched placeholder sheet.
  const template = new XlsxTemplate(Buffer.from(templateBuf));
  for (const { name } of tabs) template.copySheet(1, name);
  template.deleteSheet(1);

  for (const [index, { data }] of tabs.entries()) {
    renderXlsxSheet(template, templateBuf, data, index + 1);
  }
  return template.generate({ type: "nodebuffer" }) as Buffer;
}

// Shared rendering step for the public single-sheet and multi-tab APIs.
// Validation always reads the original source template: after a sheet has been
// rendered its placeholders no longer exist, but each data item must still be
// checked against the same template contract.
function renderXlsxSheet(
  template: XlsxTemplate,
  sourceTemplate: Buffer,
  data: Record<string, any>,
  sheet: string | number,
): void {
  validateXlsxData(sourceTemplate, data);
  template.substitute(sheet, data);
}

function validateXlsxData(templateBuf: Buffer, data: Record<string, any>): void {
  const placeholders = readPlaceholders(templateBuf);
  const missing = findMissingValues(placeholders, data);
  if (missing.length > 0) {
    throw new Error(`Missing template values: ${missing.join(", ")}`);
  }
  const unused = findUnusedValues(buildUsedTree(placeholders), data);
  if (unused.length > 0) {
    throw new Error(`Unused data values: ${unused.join(", ")}`);
  }
}

// Reads every placeholder expression (the text between ${ and }) out of the
// template. Placeholders live in the shared-strings table (where Excel/Sheets
// keep cell text) and, for some producers, in inline strings on the worksheet —
// we read both.
function readPlaceholders(templateBuf: Buffer): string[] {
  const zip = new PizZip(templateBuf);
  const texts = parseSharedStrings(zip.file("xl/sharedStrings.xml")?.asText());
  for (const f of zip.file(/^xl\/worksheets\/.*\.xml$/)) {
    for (const m of f.asText().matchAll(/<is>([\s\S]*?)<\/is>/g)) {
      texts.push(textOf(m[1]));
    }
  }

  const placeholders: string[] = [];
  for (const text of texts) {
    for (const m of text.matchAll(/\$\{([^}]+)\}/g)) {
      placeholders.push(m[1].trim());
    }
  }
  return placeholders;
}

// Checks that `data` supplies a value for every placeholder, returning the
// names of those that don't resolve.
function findMissingValues(
  placeholders: string[],
  data: Record<string, any>,
): string[] {
  const missing = new Set<string>();
  for (const inner of placeholders) {
    if (inner.startsWith("table:")) {
      // ${table:arr.prop} — arr must be an array, and every row must have prop.
      const { arrName, prop } = splitTableExpr(inner);
      const arr = resolvePath(data, arrName);
      if (!Array.isArray(arr)) missing.add(arrName);
      else if (prop && arr.some((row) => resolvePath(row, prop) === undefined))
        missing.add(`${arrName}.${prop}`);
    } else if (resolvePath(data, inner) === undefined) {
      // ${name}, ${name[0]}, ${a.b} — scalar or column array.
      missing.add(inner);
    }
  }
  return [...missing];
}

// Turns the placeholders into the tree of paths the template reads, the shape
// findUnusedValues() walks `data` against. ${a.b} nests, ${table:rows.prop}
// nests one level under the array, and a plain ${name} is a leaf (empty tree =
// the whole value is used).
//
// Array indices are dropped: ${tbl[0]} and ${tbl[1]} both read "an element of
// tbl", so the tree describes one element and every element is checked against
// it. That means we don't report elements a template has no slot for — a
// 3-row sheet given 4 rows silently drops one. Catching that needs the count,
// not the shape, so it's a separate check.
function buildUsedTree(placeholders: string[]): TagTree {
  const tree: TagTree = {};
  for (const inner of placeholders) {
    const { arrName, prop } = inner.startsWith("table:")
      ? splitTableExpr(inner)
      : { arrName: inner, prop: "" };
    const parts = [...pathParts(arrName), ...pathParts(prop)];
    let node = tree;
    for (const part of parts) {
      node[part] ??= {};
      node = node[part];
    }
  }
  return tree;
}

// "table:arr.prop" -> the array's name and the (possibly empty) row property.
function splitTableExpr(inner: string): { arrName: string; prop: string } {
  const expr = inner.slice("table:".length);
  const dot = expr.indexOf(".");
  return dot === -1
    ? { arrName: expr, prop: "" }
    : { arrName: expr.slice(0, dot), prop: expr.slice(dot + 1) };
}

// Splits a dotted / indexed path into its steps, indices included:
// "rows[0].name" -> ["rows", "0", "name"].
function splitPath(path: string): string[] {
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);
}

// The same, minus the indices — the steps that name a field.
function pathParts(path: string): string[] {
  return splitPath(path).filter((p) => !/^\d+$/.test(p));
}

// Turns the shared-strings XML into an index -> text array. A shared string may
// be plain (<t>) or rich text split across runs (<r><t>...); we join all <t>.
function parseSharedStrings(xml: string | undefined): string[] {
  if (!xml) return [];
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]));
}

function textOf(fragment: string): string {
  return [...fragment.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
    .map((m) => m[1])
    .join("");
}

// Follows a dotted / indexed path (e.g. "a.b", "rows[0].name") into `obj`,
// returning undefined if any step is missing.
function resolvePath(obj: any, path: string): any {
  let cur = obj;
  for (const p of splitPath(path)) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}
