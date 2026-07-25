import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import XlsxTemplate from "xlsx-template";

function renderFromBuffer(templateBuf: Buffer, data: Record<string, any>): Buffer {
  const zip = new PizZip(templateBuf);
  const missing = new Set<string>();
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: (part) => {
      if (!part.module) missing.add(part.value);
      return "";
    },
  });
  doc.render(data);
  if (missing.size > 0) {
    throw new Error(`Missing template values: ${[...missing].join(", ")}`);
  }
  return doc.getZip().generate({ type: "nodebuffer" });
}

export type DataComandaMateriale = {
  data: string;
  materiale: Array<{
    nr: number;
    nume: string;
    spec: string;
    um: string;
    cantitate: string;
    cod: string;
  }>;
};

export function renderComandaMateriale(
  template: Buffer,
  data: DataComandaMateriale,
): Buffer {
  return renderFromBuffer(template, data);
}

export type DataActDefectiune = {
  data: string;
  nrInventar: string;
  nrInregistrare: string;
  denumireVehicul: string;
  anProducerii: string;
  defectiuni: Array<{
    defectiunea: string;
    cauze: string;
  }>;
  pieseSchimb: Array<{
    nrNomenclator: string;
    piesaSchimb: string;
    um: string;
    cantitate: number;
    cauza: number;
    necesitaInlocuire: "da" | "nu";
  }>;
  lucrari: Array<{
    denumirea: string;
    um: string;
    cantitate: number;
    cauza: number;
  }>;
};

export function renderActDefectiune(
  template: Buffer,
  data: DataActDefectiune,
): Buffer {
  return renderFromBuffer(template, data);
}

// --- Spreadsheet (.xlsx) templates -------------------------------------------

// Fills an .xlsx template with `data` and returns the rendered workbook as a
// Buffer. This is the spreadsheet counterpart to renderFromBuffer() above.
//
// We use `xlsx-template` (free) rather than docxtemplater's paid XLSX module.
// Its placeholder syntax differs from the docx templates ({...}); in a sheet
// cell you write:
//   ${name}             a scalar value
//   ${arr[0]}           one element of an array
//   ${arr}              an array expanded across columns (cell must be alone)
//   ${table:arr.prop}   an array of objects expanded DOWN into one row each
//
// Like renderFromBuffer, the data type is the contract: every placeholder in
// the template must have a value. We enforce this ourselves — xlsx-template has
// no equivalent of docxtemplater's nullGetter and silently fills a missing key
// with an empty string, so a half-filled sheet would otherwise ship unnoticed.
function renderFromXlsx(
  templateBuf: Buffer,
  data: Record<string, any>,
  sheet: string | number = 1,
): Buffer {
  const missing = findMissingValues(templateBuf, data);
  if (missing.length > 0) {
    throw new Error(`Missing template values: ${missing.join(", ")}`);
  }
  // xlsx-template mutates the buffer it's given, so hand it a private copy —
  // the caller may render the same template more than once.
  const template = new XlsxTemplate(Buffer.from(templateBuf));
  template.substitute(sheet, data);
  return template.generate({ type: "nodebuffer" }) as Buffer;
}

// Reads every placeholder out of the template and checks that `data` supplies a
// value for it, returning the names of those that don't resolve. Placeholders
// live in the shared-strings table (where Excel/Sheets keep cell text) and, for
// some producers, in inline strings on the worksheet — we read both.
function findMissingValues(
  templateBuf: Buffer,
  data: Record<string, any>,
): string[] {
  const zip = new PizZip(templateBuf);
  const texts = parseSharedStrings(zip.file("xl/sharedStrings.xml")?.asText());
  for (const f of zip.file(/^xl\/worksheets\/.*\.xml$/)) {
    for (const m of f.asText().matchAll(/<is>([\s\S]*?)<\/is>/g)) {
      texts.push(textOf(m[1]));
    }
  }

  const missing = new Set<string>();
  for (const text of texts) {
    for (const m of text.matchAll(/\$\{([^}]+)\}/g)) {
      const inner = m[1].trim();
      if (inner.startsWith("table:")) {
        // ${table:arr.prop} — arr must be an array, and every row must have prop.
        const expr = inner.slice("table:".length);
        const dot = expr.indexOf(".");
        const arrName = dot === -1 ? expr : expr.slice(0, dot);
        const prop = dot === -1 ? "" : expr.slice(dot + 1);
        const arr = resolvePath(data, arrName);
        if (!Array.isArray(arr)) missing.add(arrName);
        else if (prop && arr.some((row) => resolvePath(row, prop) === undefined))
          missing.add(`${arrName}.${prop}`);
      } else if (resolvePath(data, inner) === undefined) {
        // ${name}, ${name[0]}, ${a.b} — scalar or column array.
        missing.add(inner);
      }
    }
  }
  return [...missing];
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

// "Fisa limita" — the end-of-month per-vehicle sheet. The template is a Google
// Sheet (driveName "template_fisa_limita", kind "xlsx" in templateManifest.ts)
// using the ${...} syntax above. Keys must match the template placeholders
// exactly. Numeric columns accept a string too, so you can pre-format them (as
// the docx renderer does for its numbers).
type Num = string | number;

export type DataFisaLimita = {
  nr_inregistrare: string; // registration nr, e.g. "CBE 276"
  nume_sofer: string; // driver full name, e.g. "Celpan Ion"
  cod_sofer: string; // driver code, e.g. "4984"
  tbl: Array<{
    data: string; // date, e.g. "26.05.2026"
    nr_cart: string; // card / material code
    nume: string; // material name
    nr: Num; // row / item number
    unit: string; // unit of measurement, e.g. "l", "buc"
    cant: Num; // quantity
    pret_lei: Num; // unit price, lei part
    pret_bani: Num; // unit price, bani part
    suma_lei: Num; // total, lei part
    suma_bani: Num; // total, bani part
  }>;
};

export function renderFisaLimita(
  template: Buffer,
  data: DataFisaLimita,
): Buffer {
  return renderFromXlsx(template, data);
}
