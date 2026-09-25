import type { FacturaExpeditie } from "../facturaExpeditieTypes.ts";

// Not a delivery invoice — this is "Lista de sold a depozitului (gestionar)",
// Cont 2131 "Obiecte de mica valoare si scurta durata in stoc", printed
// 10-SEP-26, as of "01 Septembrie anul 2026", transcribed from the paper
// printout.
const factura: FacturaExpeditie = {
  data: "2026-09-01",
  totalTiparit: 5831.34,
  ramas: true,
  linii: [
    { nrCart: "2131022022", nume: "BOCANCI UZ GENERAL", um: "PER", cantitate: 1, pretUnitar: 242.5 },
    { nrCart: "2131131560", nume: "MANUSI TRICOTATE CU PICOURI", um: "PER", cantitate: 12, pretUnitar: 3.75 },
    { nrCart: "2131162541", nume: "PANTALONI TERMOIZOLANTI", um: "PER", cantitate: 4, pretUnitar: 245.83 },
    { nrCart: "2131162933", nume: "PISTOL SILICON", um: "BUC", cantitate: 1, pretUnitar: 112.99 },
    { nrCart: "2131191918", nume: "SCURTA TERMOIZOLANTA", um: "BUC", cantitate: 10, pretUnitar: 441.67 },
    { nrCart: "2131220263", nume: "VESTA DE AVERTIZARE", um: "BUC", cantitate: 1, pretUnitar: 30.83 },
  ],
};

export default factura;
