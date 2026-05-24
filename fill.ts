import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const templatePath = path.resolve("sources/template_comanda_materiale.docx");
const outputPath = path.resolve("output.docx");

const content = fs.readFileSync(templatePath, "binary");
const zip = new PizZip(content);

const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
});

const material = {
        nume: "Test material",
        spec: "Spec",
        um: "buc",
        cantitate: "42",
        cod: "123456",
      }

const data: Record<string, any> = {
  materiale:
    [
      material, material, material, material, material, material, material, material, material,
    ]
};

doc.render(data);

const buf = doc.getZip().generate({ type: "nodebuffer" });
fs.writeFileSync(outputPath, buf);

console.log(`Wrote ${outputPath}`);
