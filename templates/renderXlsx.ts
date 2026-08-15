import PizZip from "pizzip";
import XlsxTemplate from "xlsx-template";

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
// also an error, since it usually means the template and the data type have
// drifted apart (a renamed or deleted placeholder).
export function renderXlsxBuf(
  templateBuf: Buffer,
  data: Record<string, any>,
  sheet: string | number = 1,
): Buffer {
  const placeholders = readPlaceholders(templateBuf);
  const missing = findMissingValues(placeholders, data);
  if (missing.length > 0) {
    throw new Error(`Missing template values: ${missing.join(", ")}`);
  }
  const unused = findUnusedValues(placeholders, data);
  if (unused.length > 0) {
    throw new Error(`Unused data values: ${unused.join(", ")}`);
  }
  // xlsx-template mutates the buffer it's given, so hand it a private copy —
  // the caller may render the same template more than once.
  const template = new XlsxTemplate(Buffer.from(templateBuf));
  template.substitute(sheet, data);
  return template.generate({ type: "nodebuffer" }) as Buffer;
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

// The mirror of findMissingValues: reports keys of `data` that no placeholder
// refers to, so a renamed placeholder or a stale field can't pass unnoticed.
// Only top-level keys are checked — a placeholder that reaches into a key
// (${a.b}, ${table:rows.prop}) counts that whole key as used, since we can't
// tell which nested fields a template legitimately leaves out.
function findUnusedValues(
  placeholders: string[],
  data: Record<string, any>,
): string[] {
  const used = new Set<string>();
  for (const inner of placeholders) {
    const expr = inner.startsWith("table:")
      ? splitTableExpr(inner).arrName
      : inner;
    used.add(rootName(expr));
  }
  return Object.keys(data).filter((key) => !used.has(key));
}

// "table:arr.prop" -> the array's name and the (possibly empty) row property.
function splitTableExpr(inner: string): { arrName: string; prop: string } {
  const expr = inner.slice("table:".length);
  const dot = expr.indexOf(".");
  return dot === -1
    ? { arrName: expr, prop: "" }
    : { arrName: expr.slice(0, dot), prop: expr.slice(dot + 1) };
}

// The top-level key a path starts at: "a.b" -> "a", "rows[0].name" -> "rows".
function rootName(path: string): string {
  return path.split(/[.[]/)[0];
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
  const parts = path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}
