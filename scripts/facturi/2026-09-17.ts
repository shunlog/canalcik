import type { FacturaExpeditie } from "../facturaExpeditieTypes.ts";

// factura fiscală AAZ (serie/număr nevizibile în poză, antetul e tăiat din cadru),
// "data eliberării" 17.09.2026, transcribed from the paper invoice.
// totalTiparit not visible in the photo; using the computed sum of the lines.
const factura: FacturaExpeditie = {
  data: "2026-09-17",
  totalTiparit: 8257.9,
  linii: [
    { nrCart: "2111051010", nume: "ELECTROADE D4.0", um: "KG", cantitate: 4.5, pretUnitar: 57.31 },
    { nrCart: "2113021954", nume: "BULON", um: "BUC", cantitate: 50, pretUnitar: 135.0 },
    { nrCart: "2131034487", nume: "CHEIE", um: "BUC", cantitate: 1, pretUnitar: 1250.0 },
  ],
};

export default factura;
