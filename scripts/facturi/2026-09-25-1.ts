import type { FacturaExpeditie } from "../facturaExpeditieTypes.ts";

// factura fiscală AAZ (serie/număr nevizibile în poză, antetul e tăiat din cadru),
// "data eliberării" 25.09.2026, transcribed from the paper invoice.
const factura: FacturaExpeditie = {
  data: "2026-09-25",
  totalTiparit: 3641.67,
  linii: [
    {
      nrCart: "2625300771",
      nume: "ACUMULATOR 950A 110Ah 12V DREPT",
      um: "BUC",
      cantitate: 1,
      pretUnitar: 3641.67,
    },
  ],
};

export default factura;
