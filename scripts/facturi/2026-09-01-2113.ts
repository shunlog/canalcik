import type { FacturaExpeditie } from "../facturaExpeditieTypes.ts";

// Not a delivery invoice — this is "Lista de sold a depozitului (gestionar)",
// Cont 2113 "Piese de schimb", printed 10-SEP-26, as of "01 Septembrie anul
// 2026", transcribed from the paper printout.
//
// UNVERIFIED: summing cantitate*pretUnitar below gives 138516.24, which is
// 712.50 more than the printed "Total pe pagina" (137803.74). Both are 27
// entries and every value below was read directly off the same printed row
// as its name, but I couldn't identify which single value accounts for the
// gap from the photo alone — worth checking against the paper original.
const factura: FacturaExpeditie = {
  data: "2026-09-01",
  totalTiparit: 137803.74,
  ramas: true,
  linii: [
    { nrCart: "2113010750", nume: "ARIPA CABINA FATA STINGA", um: "BUC", cantitate: 1, pretUnitar: 712.5 },
    { nrCart: "2113010751", nume: "ARIPA CABINA FATA DREAPTA", um: "BUC", cantitate: 1, pretUnitar: 712.5 },
    { nrCart: "2113010752", nume: "ARIPA CABINEI KAMAZ", um: "BUC", cantitate: 1, pretUnitar: 712.5 },
    { nrCart: "2113031562", nume: "CUREA MOTOR JCB", um: "BUC", cantitate: 1, pretUnitar: 1581.67 },
    { nrCart: "2113032253", nume: "CUREA DE STINGERE 12M", um: "SET", cantitate: 3, pretUnitar: 250.0 },
    { nrCart: "2113061863", nume: "FILTRU AER JCB", um: "BUC", cantitate: 2, pretUnitar: 291.67 },
    { nrCart: "2113061864", nume: "FILTRU DE ULEI JCB", um: "SET", cantitate: 3, pretUnitar: 1061.0 },
    { nrCart: "2113061870", nume: "FILTRU DE AER", um: "BUC", cantitate: 5, pretUnitar: 142.0 },
    { nrCart: "2113062581", nume: "FURTUN AER 9MM", um: "BUC", cantitate: 6, pretUnitar: 400.0 },
    { nrCart: "2113062682", nume: "FILTRU,SISTEM HIDRAULIC PRIMAR", um: "M", cantitate: 20, pretUnitar: 19.17 },
    { nrCart: "2113062697", nume: "FILTRU ULEI MOTOR", um: "BUC", cantitate: 2, pretUnitar: 791.67 },
    { nrCart: "2113062763", nume: "FILTRU DE AER", um: "BUC", cantitate: 1, pretUnitar: 326.67 },
    { nrCart: "2113062764", nume: "FILTRU AER EX", um: "BUC", cantitate: 1, pretUnitar: 1545.83 },
    { nrCart: "2113062765", nume: "FILTRU AER IN", um: "BUC", cantitate: 1, pretUnitar: 700.0 },
    { nrCart: "2113070877", nume: "STERGATOR PARBRIZ", um: "BUC", cantitate: 1, pretUnitar: 420.0 },
    { nrCart: "2113070887", nume: "GARNITURA TOBEI ESAPAMENT", um: "BUC", cantitate: 1, pretUnitar: 80.84 },
    { nrCart: "2113090464", nume: "INEL TOBA DE ESAPAMENT", um: "BUC", cantitate: 2, pretUnitar: 20.83 },
    { nrCart: "2113090471", nume: "FURTUN PGU KAMAZ", um: "BUC", cantitate: 2, pretUnitar: 25.0 },
    { nrCart: "2113090479", nume: "INTRERUPATOR", um: "BUC", cantitate: 1, pretUnitar: 142.79 },
    { nrCart: "2113150027", nume: "OSII PENTRU REMORCI", um: "BUC", cantitate: 1, pretUnitar: 2083.33 },
    { nrCart: "2113161104", nume: "POMPA CU ROTI DINTATE JCB", um: "BUC", cantitate: 1, pretUnitar: 22916.67 },
    { nrCart: "2113181488", nume: "PRELUNJITOR ACUMULATOR", um: "BUC", cantitate: 1, pretUnitar: 5417.0 },
    { nrCart: "2113192360", nume: "SENILA IN ANSAMBLU DT-75", um: "SET", cantitate: 1, pretUnitar: 495.83 },
    { nrCart: "2113192500", nume: "COMPRESOR KAMAZ", um: "BUC", cantitate: 1, pretUnitar: 76666.67 },
    { nrCart: "92113191125", nume: "SEMIAX P/S ZIL-130", um: "BUC", cantitate: 1, pretUnitar: 6750.0 },
    { nrCart: "92113191126", nume: "SEMIAX P/S ZIL-130", um: "BUC", cantitate: 1, pretUnitar: 1625.0 },
    { nrCart: "92115835394", nume: "STELUTA Z11 (DEPRECIAT)", um: "BUC", cantitate: 1, pretUnitar: 1541.7 },
  ],
};

export default factura;
