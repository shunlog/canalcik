import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

// Fills a .docx template with `data` and returns the rendered document as a
// Buffer. Placeholders use docxtemplater's {...} syntax.
//
// The data type is the contract: every placeholder in the template must have a
// value, so an unresolved one is an error rather than a silent blank.
export function renderDocxBuf(
  templateBuf: Buffer,
  data: Record<string, any>,
): Buffer {
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
