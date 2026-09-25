import type { FacturaExpeditie } from "../facturaExpeditieTypes.ts";

// Not a delivery invoice — this is "Lista de sold a depozitului (gestionar)",
// Cont 2114 "Combustibil", printed 10-SEP-26, as of "01 Septembrie anul
// 2026", transcribed from the paper printout.
const factura: FacturaExpeditie = {
  data: "2026-09-01",
  totalTiparit: 224.8,
  ramas: true,
  linii: [{ nrCart: "2114070571", nume: "GAZ GPL AUTO", um: "L", cantitate: 16, pretUnitar: 14.05 }],
};

export default factura;
