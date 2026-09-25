import type { FacturaExpeditie } from "../facturaExpeditieTypes.ts";

// Not a delivery invoice — this is "Lista de sold a depozitului (gestionar)",
// Cont 2111 "Materiale prime si materiale de baza", printed 09-SEP-26, as of
// "01 Septembrie anul 2026", transcribed from the paper printout. Using the
// balance date as `data` since there's no single delivery date on this
// document. totalTiparit is the printed "Total pe pagina" / "Total pe
// contul" (they match, single page).
const factura: FacturaExpeditie = {
  data: "2026-09-01",
  totalTiparit: 22785.43,
  ramas: true,
  linii: [
    { nrCart: "2111048010", nume: "LUBRIFIANT SPRAY WD-60", um: "L", cantitate: 2, pretUnitar: 65.0 },
    { nrCart: "2111049517", nume: "DILUANT 646", um: "L", cantitate: 5, pretUnitar: 37.6 },
    { nrCart: "2111049518", nume: "DILUANT INLOCUITOR WHITE-SPIRIT", um: "L", cantitate: 12, pretUnitar: 36.8 },
    {
      nrCart: "2111049524",
      nume: "VOPSEA EMAIL ALCHIDIC NOVARLUS NEGRU",
      um: "KG",
      cantitate: 27,
      pretUnitar: 54.81,
    },
    { nrCart: "2111051010", nume: "ELECTROADE D4.0", um: "KG", cantitate: 1, pretUnitar: 57.31 },
    { nrCart: "2111121759", nume: "LICHID DE PARBRIZ,-20", um: "L", cantitate: 20, pretUnitar: 5.45 },
    { nrCart: "2111121795", nume: "LICHID DE FRANA DOT-4", um: "L", cantitate: 1.5, pretUnitar: 31.06 },
    { nrCart: "2111150798", nume: "OXIGEN GAZ TEHNIC", um: "M3", cantitate: 6.3, pretUnitar: 53.57 },
    { nrCart: "2111170100", nume: "PIETRIS 20/40/AGREGATE SORT 16-32", um: "T", cantitate: 4, pretUnitar: 366.67 },
    { nrCart: "2111199028", nume: "SET DE MEDICAMENTE", um: "SET", cantitate: 32, pretUnitar: 144.48 },
    { nrCart: "2111199286", nume: "ROLA ABRAZIVA 100MM*5.0H P220", um: "BUC", cantitate: 8, pretUnitar: 51.57 },
    { nrCart: "2111199287", nume: "ROLA ABRAZIVA 100MM*5.0H P400", um: "BUC", cantitate: 4, pretUnitar: 43.98 },
    { nrCart: "2111199881", nume: "SAPUN LICHID ANTIBACTERIAL", um: "L", cantitate: 27.2, pretUnitar: 6.66 },
    { nrCart: "2111208344", nume: "TRUSA MEDICALA AUTO", um: "BUC", cantitate: 25, pretUnitar: 245.08 },
    {
      nrCart: "2111222878",
      nume: "VOPSEA EMAIL ALCHIDIC SAVANA GALBEN",
      um: "KG",
      cantitate: 1.5,
      pretUnitar: 204.45,
    },
    { nrCart: "2111223046", nume: "VOPSEA EMAIL ALCHIDIC NEGRU", um: "KG", cantitate: 0.3, pretUnitar: 42.65 },
    {
      nrCart: "2111223047",
      nume: "VOPSEA EMAIL ALCHIDIC GRI-DESCHIS",
      um: "KG",
      cantitate: 2.8,
      pretUnitar: 43.52,
    },
    {
      nrCart: "2111223152",
      nume: "VOPSEA EMAIL ALCHIDIC BRILIANT ROSU-APRINS",
      um: "KG",
      cantitate: 2.5,
      pretUnitar: 104.39,
    },
    { nrCart: "2111223302", nume: "VAR HIDRATAT USCAT", um: "KG", cantitate: 40, pretUnitar: 4.96 },
    {
      nrCart: "2111223319",
      nume: "VOPSEA EMAIL ALCHIDIC RULAX GALBEN",
      um: "KG",
      cantitate: 27.6,
      pretUnitar: 69.14,
    },
    {
      nrCart: "2111223320",
      nume: "VOPSEA EMAIL ALCHIDIC RULAX AZURIU DESCHIS",
      um: "KG",
      cantitate: 14,
      pretUnitar: 60.15,
    },
    { nrCart: "2111223321", nume: "VOPSEA EMAIL ALCHIDIC RULAX ROSU", um: "KG", cantitate: 5.6, pretUnitar: 69.14 },
    { nrCart: "2111223322", nume: "VOPSEA EMAIL ALCHIDIC RULAX VERDE", um: "KG", cantitate: 5.9, pretUnitar: 60.15 },
    { nrCart: "2111223323", nume: "VOPSEA EMAIL ALCHIDIC AUTOLUX ALB", um: "L", cantitate: 3, pretUnitar: 228.73 },
    { nrCart: "2111223325", nume: "VOPSEA EMAIL ALCHIDIC AUTOLUX GRI", um: "L", cantitate: 5, pretUnitar: 228.73 },
    {
      nrCart: "2111223334",
      nume: "VOPSEA EMAIL ALCHIDIC RULAX AZURIU STRALUCITOR",
      um: "KG",
      cantitate: 6,
      pretUnitar: 60.15,
    },
    { nrCart: "92111023310", nume: "BARA OTEL D100 MM (DEPRECIAT)", um: "KG", cantitate: 30, pretUnitar: 14.17 },
  ],
};

export default factura;
