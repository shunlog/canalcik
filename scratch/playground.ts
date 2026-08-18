import fs from "node:fs";
import {
  renderComandaMateriale,
  renderActDefectiune,
  type DataActDefectiune,
  DataFisaLimita,
  renderFisaLimita,
} from "../templates/renderTemplates.ts";

type DataFacturaExpeditie = {
  data: string; // date, e.g. "26.05.2026"
  materiale: Array<{
    nr_cart: string; // "cod nomenclator", e.g. "2111121795"
    nume: string; // material name, e.g. "Ulei motor 10W40"
    um: string; // measurement unit, e.g. "l", "buc"
    cantitate: number; // quantity
    pret_unitar: number; // unit price
  }>;
}

const factura1 : DataFacturaExpeditie = {
  data: "29.05.2026",
  materiale: [
    { nr_cart: "2111017178", nume: "ANTIGEL ALBASTRU -40C", um: "L", cantitate: 5, pret_unitar: 20.00 },
    { nr_cart: "2111121795", nume: "LICHID DE FRANA DOT-4", um: "L", cantitate: 6, pret_unitar: 31.06 },
    { nr_cart: "2112210737", nume: "ULEI MOTOR 10W40 CI-4/SL", um: "L", cantitate: 15, pret_unitar: 33.25 },
    { nr_cart: "2112210752", nume: "ULEI TRANSMISIONAL TAD-17", um: "L", cantitate: 30, pret_unitar: 30.83 },
    { nr_cart: "2112210775", nume: "UNSOARE LITOL-24", um: "KG", cantitate: 26, pret_unitar: 55.67 },
    { nr_cart: "2112210779", nume: "ULEI MOTOR 5W30 SN/CF", um: "L", cantitate: 10, pret_unitar: 31.33 },
    { nr_cart: "2112210834", nume: "ULEI MOTOR DIZEL M10G2K", um: "L", cantitate: 165, pret_unitar: 24.60 },
    { nr_cart: "2112210836", nume: "ULEI HIDRAULIC HLP-46", um: "L", cantitate: 24, pret_unitar: 25.70 },
    { nr_cart: "2112210837", nume: "LUBRIFIANT MULTIFUNCTIONAL,VD-60,SPREI", um: "L", cantitate: 2, pret_unitar: 65.00 },
    { nr_cart: "2112210848", nume: "ULEI INDUSTRIAL I-40", um: "L", cantitate: 129, pret_unitar: 24.00 },
    { nr_cart: "2112210860", nume: "ULEI 15W40 SG/SD MAXIMUM GUARDMAX", um: "L", cantitate: 46, pret_unitar: 27.00 },
  ]
};


function DocFisaLimita(
  vehicul_id: number,
  sofer_id: number,
  month: number,
  year: number,
): DataFisaLimita {
}

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