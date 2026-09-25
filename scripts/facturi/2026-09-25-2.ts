import type { FacturaExpeditie } from "../facturaExpeditieTypes.ts";

// factura fiscală AAZ (antetul cu seria/numărul și data eliberării e tăiat
// din cadrul pozei), transcribed from the paper invoice. Date not visible,
// using today's date as a placeholder.
// totalTiparit not visible in the photo; using the computed sum of the lines.
const factura: FacturaExpeditie = {
  data: "2026-09-25",
  totalTiparit: 49193.32,
  linii: [
    { nrCart: "2622302193", nume: "ANVELOPE SATOYA 9.00R20 PR16", um: "BUC", cantitate: 1, pretUnitar: 2925.0 },
    { nrCart: "2622302194", nume: "ANVELOPE SATOYA 9.00R20 PR16", um: "BUC", cantitate: 1, pretUnitar: 2925.0 },
    { nrCart: "2622302195", nume: "ANVELOPE SATOYA 9.00R20 PR16", um: "BUC", cantitate: 1, pretUnitar: 2925.0 },
    { nrCart: "2622302196", nume: "ANVELOPE SATOYA 9.00R20 PR16", um: "BUC", cantitate: 1, pretUnitar: 2925.0 },
    { nrCart: "2622302197", nume: "ANVELOPE SATOYA 9.00R20 PR16", um: "BUC", cantitate: 1, pretUnitar: 2925.0 },
    { nrCart: "2622302198", nume: "ANVELOPE SATOYA 9.00R20 PR16", um: "BUC", cantitate: 1, pretUnitar: 2925.0 },
    { nrCart: "2622302199", nume: "ANVELOPE SATOYA 9.00R20 PR16", um: "BUC", cantitate: 1, pretUnitar: 2925.0 },
    { nrCart: "2622302200", nume: "ANVELOPE SATOYA 9.00R20 PR16", um: "BUC", cantitate: 1, pretUnitar: 2925.0 },
    {
      nrCart: "2622302304",
      nume: "ANVELOPE FORERUNNER AGR 16.5/70-18",
      um: "BUC",
      cantitate: 1,
      pretUnitar: 4745.83,
    },
    {
      nrCart: "2622302305",
      nume: "ANVELOPE FORERUNNER AGR 16.5/70-18",
      um: "BUC",
      cantitate: 1,
      pretUnitar: 4745.83,
    },
    {
      nrCart: "2622302306",
      nume: "ANVELOPE FORERUNNER AGR 16.5/70-18",
      um: "BUC",
      cantitate: 1,
      pretUnitar: 4745.83,
    },
    {
      nrCart: "2622302307",
      nume: "ANVELOPE FORERUNNER AGR 16.5/70-18",
      um: "BUC",
      cantitate: 1,
      pretUnitar: 4745.83,
    },
    { nrCart: "2625300759", nume: "ACUMULATOR AUTO 6ST-75R MONBAT", um: "BUC", cantitate: 1, pretUnitar: 910.0 },
    {
      nrCart: "2625300766",
      nume: "ACUMULATOR PERION G100R,830A,100AH,12V DREPT",
      um: "BUC",
      cantitate: 1,
      pretUnitar: 1475.0,
    },
    {
      nrCart: "2625300767",
      nume: "ACUMULATOR PERION G100R,830A,100AH,12V DREPT",
      um: "BUC",
      cantitate: 1,
      pretUnitar: 1475.0,
    },
    {
      nrCart: "2625300768",
      nume: "ACUMULATOR PERION G100R,830A,100AH,12V DREPT",
      um: "BUC",
      cantitate: 1,
      pretUnitar: 1475.0,
    },
    {
      nrCart: "2625300769",
      nume: "ACUMULATOR PERION G100R,830A,100AH,12V DREPT",
      um: "BUC",
      cantitate: 1,
      pretUnitar: 1475.0,
    },
  ],
};

export default factura;
