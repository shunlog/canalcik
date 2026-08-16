import fs from "node:fs";
import {
  renderComandaMateriale,
  renderActDefectiune,
  type DataActDefectiune,
  DataFisaLimita,
  renderFisaLimita,
} from "../templates/renderTemplates.ts";

const template = fs.readFileSync("data/templates/template_comanda_materiale.docx");

const material = { nr: 1, nume: "Bara reactiva K-3 MAZ 5337", spec: "CA 786", um: "buc", cantitate: "2", cod: "120673" };

const out = renderComandaMateriale(template, {
  data: "2026-08-15",
  materiale: [
    material, material, material, material, material, material, material, material, material, material,
  ],
});

fs.writeFileSync("test-output/playground.docx", out);
console.log("wrote test-output/playground.docx", out.length, "bytes");


const lucrare = (nr: number) => ({
      nr,
      denumire: "de inlocuit Bara reactiva K-3 MAZ 5337",
      um: "buc",
      cantitate: 2,
      cauza: 1,
    });

const ACT_DEFECTIUNE_DATA: DataActDefectiune = {
  data: "25.06.2026",
  nrInventar: "42691696",
  nrInregistrare: "CA 786",
  denumireVehicul: "Tractor MTZ-82",
  anProducerii: "2015",
  defectiuni: [
    {
      nr: 1,
      defectiunea: "Bara reactiva rupta",
      cauze: "Uzura in exploatare",
    },
    {
      nr: 2,
      defectiunea: "Scurgere ulei motor",
      cauze: "Garnitura deteriorata",
    },
  ],
  pieseSchimb: [
    {
      nr: 1,
      nrNomenclator: "120673",
      piesaSchimb: "Bara reactiva K-3 MAZ 5337",
      um: "buc",
      cantitate: 2,
      cauza: 1,
      necesitaInlocuire: "da",
    },
  ],
  lucrari: Array.from({ length: 10 }, (_, i) => lucrare(i + 1)),
};

const templateAct = fs.readFileSync("data/templates/template_act_defectiune.docx");
const outAct = renderActDefectiune(templateAct, ACT_DEFECTIUNE_DATA);

fs.writeFileSync("test-output/playground_act_defectiune.docx", outAct);
console.log("wrote test-output/playground_act_defectiune.docx", outAct.length, "bytes");


const fisaRow = (data: string, nr_cart: string, nume: string) => ({
  data,
  nr_cart,
  nume,
  nr: 1,
  unit: "l",
  cant: "10",
  pret_lei: "20",
  pret_bani: "50",
  suma_lei: "205",
  suma_bani: "00",
});

const FISA_DATA: DataFisaLimita = {
  nr_inregistrare: "CBE 276",
  nume_sofer: "Celpan Ion",
  cod_sofer: "4984",
  tbl: [
    fisaRow("26.05.2026", "2111121795", "Motorina"),
    fisaRow("27.05.2026", "2111121796", "Ulei motor"),
    fisaRow("28.05.2026", "2111121797", "Antigel"),
  ],
};


const templateFisa = fs.readFileSync("data/templates/template_fisa_limita.xlsx");
const outFisa = renderFisaLimita(templateFisa, FISA_DATA);

fs.writeFileSync("test-output/playground_fisa_limita.xlsx", outFisa);
console.log("wrote test-output/playground_fisa_limita.xlsx", outFisa.length, "bytes");