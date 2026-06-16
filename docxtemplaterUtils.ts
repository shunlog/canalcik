import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export function render(
  templatePath: string,
  data: Record<string, any>,
  outputPath?: string,
): Buffer | void {
  const content = fs.readFileSync(path.resolve(templatePath), "binary");
  const zip = new PizZip(content);

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

  const buf = doc.getZip().generate({ type: "nodebuffer" });
  if (outputPath === undefined) {
    return buf;
  }

  const resolved = path.resolve(outputPath);
  fs.writeFileSync(resolved, buf);
  console.log(`Wrote ${resolved}`);
}
