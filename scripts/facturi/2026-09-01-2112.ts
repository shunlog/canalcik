import type { FacturaExpeditie } from "../facturaExpeditieTypes.ts";

// Not a delivery invoice — this is "Lista de sold a depozitului (gestionar)",
// Cont 2112 "Materiale auxiliare (unelte, lemne, carbune)", printed 09-SEP-26,
// as of "01 Septembrie anul 2026", transcribed from the paper printout.
const factura: FacturaExpeditie = {
  data: "2026-09-01",
  totalTiparit: 2990.0,
  ramas: true,
  linii: [
    { nrCart: "2112210865", nume: "UNSOARE WOLVER ULTRON/O 4KG", um: "KG", cantitate: 20.8, pretUnitar: 143.75 },
  ],
};

export default factura;
