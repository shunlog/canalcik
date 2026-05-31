import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const TEMPLATE_COMANDA = path.resolve("sources/template_comanda_materiale.docx");

export type ComandaRenderRow = {
  nr: number;         // 1-based row index
  nume: string;       // material denumire
  cod: string;        // material cod
  spec: string;       // nr. de înregistrare (registration nr)
  um: string;         // unitateMasura
  cantitate: string;  // rendered to string to control formatting
};

export type ComandaRenderInput = {
  data: string;       // already formatted (e.g. "31.05.2026")
  materiale: ComandaRenderRow[];
};

// Renders sources/template_comanda_materiale.docx. The template uses
// {data} at the top, then a {#materiale}{/materiale} loop with
// {nr} {nume} {cod} {spec} {um} {cantitate} per row.
//
// `nullGetter` makes any missing/null/undefined value render as an empty
// string instead of the literal word "undefined" (docxtemplater's default).
export function renderComandaMateriale(input: ComandaRenderInput): Buffer {
  const content = fs.readFileSync(TEMPLATE_COMANDA, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true
  });
  doc.render(input);
  return doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
}
