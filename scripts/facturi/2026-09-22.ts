import type { FacturaExpeditie } from "../facturaExpeditieTypes.ts";

// factura fiscală AAZ 4298208, "data eliberării" 22.09.2026, transcribed from
// the paper invoice.
// totalTiparit not visible in the photo (page cropped below the last line);
// using the computed sum of the lines.
const factura: FacturaExpeditie = {
  data: "2026-09-22",
  totalTiparit: 2420.94,
  linii: [
    { nrCart: "2111017499", nume: "APA NATURALA AquaDor 1.5l", um: "BUC", cantitate: 168, pretUnitar: 5.6 },
    { nrCart: "2111051010", nume: "ELECTROADE D4.0", um: "KG", cantitate: 9, pretUnitar: 57.31 },
    { nrCart: "2111199880", nume: "SAPUN LICHID ANTIBACTERIAL", um: "L", cantitate: 5, pretUnitar: 6.67 },
    { nrCart: "2111209448", nume: "SAPUN LICHID ANTIBACTERIAL", um: "L", cantitate: 15, pretUnitar: 6.65 },
    { nrCart: "2113070931", nume: "GARNITURA CAPAC SUPAPA", um: "BUC", cantitate: 2, pretUnitar: 62.5 },
    { nrCart: "2113192569", nume: "SEMERING SEMIAXA", um: "BUC", cantitate: 1, pretUnitar: 91.67 },
    { nrCart: "2131131540", nume: "MANUSI SUDOR", um: "PER", cantitate: 1, pretUnitar: 49.58 },
    { nrCart: "2131131560", nume: "MANUSI TRICOTATE CU PICOURI", um: "PER", cantitate: 60, pretUnitar: 3.75 },
    { nrCart: "92111050692", nume: "ELECTROADE INOX D4MM", um: "KG", cantitate: 2, pretUnitar: 170.0 },
  ],
};

export default factura;
