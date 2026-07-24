import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

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
