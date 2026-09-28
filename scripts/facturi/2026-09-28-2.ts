import type { FacturaExpeditie } from "../facturaExpeditieTypes.ts";

// factura fiscală AAZ (seria/numărul și data eliberării nu sunt vizibile în poză),
// transcribed from the paper invoice. Date not visible, using today's date as a
// placeholder.
// totalTiparit not visible in the photo; using the computed sum of the lines.
const factura: FacturaExpeditie = {
  data: "2026-09-28",
  totalTiparit: 16631.94,
  linii: [
    { nrCart: "2113040702", nume: "DISTRIBUITOR APRINDERE CON", um: "BUC", cantitate: 1, pretUnitar: 1816.67 },
    { nrCart: "2113200468", nume: "TABLOU DE BORD KP-205", um: "BUC", cantitate: 1, pretUnitar: 1100.0 },
    { nrCart: "2131022126", nume: "BOCANCI UZ GENERAL", um: "PER", cantitate: 1, pretUnitar: 242.5 },
    { nrCart: "2131034313", nume: "COSTUM REZISTENT LA UZURA", um: "SET", cantitate: 31, pretUnitar: 325.0 },
    { nrCart: "2131162822", nume: "PANTALONI TERMOIZOLANTI", um: "PER", cantitate: 11, pretUnitar: 204.72 },
    { nrCart: "2131162871", nume: "PANTALONI TERMOIZOLANTI", um: "PER", cantitate: 5, pretUnitar: 229.17 },
  ],
};

export default factura;
