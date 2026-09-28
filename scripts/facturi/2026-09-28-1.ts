import type { FacturaExpeditie } from "../facturaExpeditieTypes.ts";

// factura fiscală AAZ (antetul cu seria/numărul și data eliberării e tăiat din
// cadrul pozei), transcribed from the paper invoice. Date not visible, using
// today's date as a placeholder.
// totalTiparit not visible in the photo; using the computed sum of the lines.
const factura: FacturaExpeditie = {
  data: "2026-09-28",
  totalTiparit: 29766.12,
  linii: [
    { nrCart: "2111026556", nume: "BARA OTEL 45 HEXAGON 32MM", um: "KG", cantitate: 7, pretUnitar: 32.02 },
    { nrCart: "2113021959", nume: "BUTUC FATA KAMAZ", um: "BUC", cantitate: 2, pretUnitar: 1723.25 },
    { nrCart: "2113021960", nume: "BUTUC SPATE KAMAZ", um: "BUC", cantitate: 1, pretUnitar: 2681.42 },
    { nrCart: "2113021961", nume: "BULON TAMBUR FRANA KAMAZ", um: "BUC", cantitate: 5, pretUnitar: 27.79 },
    { nrCart: "2113021962", nume: "PIULITA TAMBUR FRANA KAMAZ", um: "BUC", cantitate: 5, pretUnitar: 18.21 },
    { nrCart: "2113021963", nume: "PIULITA ROATA KAMAZ", um: "BUC", cantitate: 5, pretUnitar: 18.21 },
    { nrCart: "2113021964", nume: "BEC", um: "BUC", cantitate: 6, pretUnitar: 7.67 },
    { nrCart: "2113032295", nume: "COMPRESOR MAZ", um: "BUC", cantitate: 1, pretUnitar: 3814.17 },
    { nrCart: "2113032296", nume: "CUREA MAZ 987.937", um: "BUC", cantitate: 1, pretUnitar: 93.92 },
    { nrCart: "2113032297", nume: "SET REPAR.COMPRESOR MAZ", um: "BUC", cantitate: 1, pretUnitar: 93.92 },
    { nrCart: "2113032298", nume: "SENSOR KAMAZ", um: "BUC", cantitate: 1, pretUnitar: 93.92 },
    { nrCart: "2113040703", nume: "DEMAROR KAMAZ", um: "BUC", cantitate: 1, pretUnitar: 4772.5 },
    { nrCart: "2113040704", nume: "DEMAROR KAMAZ", um: "BUC", cantitate: 1, pretUnitar: 4772.5 },
    { nrCart: "2113062781", nume: "FAR KAMAZ", um: "BUC", cantitate: 1, pretUnitar: 93.92 },
    { nrCart: "2113062782", nume: "FURTUN RIDICARE BENA", um: "BUC", cantitate: 2, pretUnitar: 237.67 },
    { nrCart: "2113070935", nume: "GARNITURA SEMIAX KAMAZ", um: "BUC", cantitate: 1, pretUnitar: 18.21 },
    { nrCart: "2113130733", nume: "MANER FRANA ZIL", um: "BUC", cantitate: 1, pretUnitar: 939.17 },
    { nrCart: "2113181501", nume: "RULMENT 7815", um: "BUC", cantitate: 1, pretUnitar: 668.92 },
    { nrCart: "2113181502", nume: "REDUCTOR ZIL", um: "BUC", cantitate: 1, pretUnitar: 6708.33 },
    { nrCart: "2113192577", nume: "SEMERING BUTUC FATA", um: "BUC", cantitate: 2, pretUnitar: 75.71 },
    { nrCart: "2113192578", nume: "SEMERING 142X168", um: "BUC", cantitate: 1, pretUnitar: 75.71 },
    { nrCart: "2113192579", nume: "SAIBA BUTUC SPATE KAMAZ", um: "BUC", cantitate: 1, pretUnitar: 37.37 },
    { nrCart: "2113192580", nume: "SET REPARATIE BUTUC KAMAZ", um: "BUC", cantitate: 1, pretUnitar: 237.67 },
  ],
};

export default factura;
