import fs from "node:fs";
import {
  renderComandaMateriale,
  renderActDefectiune,
  type DataActDefectiune,
} from "../templates/renderTemplates.ts";

const template = fs.readFileSync("data/templates/template_comanda_materiale.docx");

const out = renderComandaMateriale(template, {
  data: "2026-08-15",
  materiale: [
    { nr: 1, nume: "Bara reactiva K-3 MAZ 5337", spec: "CA 786", um: "buc", cantitate: "2", cod: "120673" },
  ],
});

fs.writeFileSync("test-output/playground.docx", out);
console.log("wrote test-output/playground.docx", out.length, "bytes");



const ACT_DEFECTIUNE_DATA: DataActDefectiune = {
  data: "25.06.2026",
  nrInventar: "42691696",
  nrInregistrare: "CA 786",
  denumireVehicul: "Tractor MTZ-82",
  anProducerii: "2015",
  defectiuni: [
    {
      defectiunea: "Bara reactiva rupta",
      cauze: "Uzura in exploatare",
    },
    {
      defectiunea: "Scurgere ulei motor",
      cauze: "Garnitura deteriorata",
    },
  ],
  pieseSchimb: [
    {
      nrNomenclator: "120673",
      piesaSchimb: "Bara reactiva K-3 MAZ 5337",
      um: "buc",
      cantitate: 2,
      cauza: 1,
      necesitaInlocuire: "da",
    },
  ],
  lucrari: [
    {
      denumirea: "de inlocuit Bara reactiva K-3 MAZ 5337",
      um: "buc",
      cantitate: 2,
      cauza: 1,
    },
  ],
};

const templateAct = fs.readFileSync("data/templates/template_act_defectiune.docx");
const outAct = renderActDefectiune(templateAct, ACT_DEFECTIUNE_DATA);

fs.writeFileSync("test-output/playground_act_defectiune.docx", outAct);
console.log("wrote test-output/playground_act_defectiune.docx", outAct.length, "bytes");