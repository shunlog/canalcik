import type { FacturaExpeditie } from "../facturaExpeditieTypes.ts";

// factura fiscală AAZ 4298103, "data eliberării" 08.09.2026, transcribed from
// the paper invoice.
const factura: FacturaExpeditie = {
  data: "2026-09-08",
  totalTiparit: 21972.11,
  linii: [
    { nrCart: "2111051388", nume: "ERMETIC/70ML", um: "BUC", cantitate: 1, pretUnitar: 75.0 },
    { nrCart: "2113010798", nume: "ARIPA DIN FATA MTZ", um: "BUC", cantitate: 2, pretUnitar: 145.84 },
    { nrCart: "2113010799", nume: "ANTRENOR TIP-L 1/2 600X200MM", um: "BUC", cantitate: 1, pretUnitar: 300.0 },
    { nrCart: "2113021953", nume: "BULON IN ASORTIMENT", um: "BUC", cantitate: 2.28, pretUnitar: 50.0 },
    { nrCart: "2113032289", nume: "COLIER 12-20MMX12MM OTEL INOX", um: "BUC", cantitate: 4, pretUnitar: 9.17 },
    { nrCart: "2113032290", nume: "COLIER GALV.TIP MEGA SUPER W1", um: "BUC", cantitate: 8, pretUnitar: 17.5 },
    { nrCart: "2113032291", nume: "COLTAR DE MOTORINA METALIC", um: "BUC", cantitate: 4, pretUnitar: 15.0 },
    { nrCart: "2113032292", nume: "CONDUCTA DE C/D-8X13", um: "M", cantitate: 3, pretUnitar: 20.0 },
    { nrCart: "2113032293", nume: "CHEIE TUBULARA HEXAGONALA 30MM", um: "BUC", cantitate: 1, pretUnitar: 91.67 },
    { nrCart: "2113040700", nume: "DISC DE FRANA MTZ", um: "BUC", cantitate: 4, pretUnitar: 191.67 },
    { nrCart: "2113062766", nume: "FILTRU DE AER MTZ*IUMZ", um: "BUC", cantitate: 1, pretUnitar: 375.0 },
    { nrCart: "2113062767", nume: "FILTRU DE COMBUSTIBIL MTZ", um: "BUC", cantitate: 1, pretUnitar: 50.0 },
    { nrCart: "2113062768", nume: "FILTRU FIN DE COMBUSTIBIL MAZ", um: "BUC", cantitate: 2, pretUnitar: 54.17 },
    { nrCart: "2113062769", nume: "FILTRU DE ULEI IUMZ", um: "BUC", cantitate: 2, pretUnitar: 150.0 },
    { nrCart: "2113062770", nume: "FILTRU DE AER KAMAZ", um: "BUC", cantitate: 2, pretUnitar: 404.17 },
    { nrCart: "2113062771", nume: "FILTRU BRUT DE COMBUSTIBIL MAZ", um: "BUC", cantitate: 2, pretUnitar: 66.67 },
    { nrCart: "2113062772", nume: "FURTUN D-76MM", um: "M", cantitate: 1, pretUnitar: 433.33 },
    { nrCart: "2113062773", nume: "FURTUN DE AER CALD D42", um: "M", cantitate: 0.87, pretUnitar: 245.83 },
    { nrCart: "2113062774", nume: "FURTUN DE PRESIUNE MBS 10X18.5MM", um: "M", cantitate: 1, pretUnitar: 47.5 },
    { nrCart: "2113090481", nume: "INDICATOR t DE APA MTZ", um: "BUC", cantitate: 1, pretUnitar: 120.83 },
    { nrCart: "2113161653", nume: "POMPA DE MOTORINA UTN", um: "BUC", cantitate: 1, pretUnitar: 270.83 },
    { nrCart: "2113161654", nume: "PRELUNGITOR 3/4 200MM", um: "BUC", cantitate: 1, pretUnitar: 145.83 },
    { nrCart: "2113181497", nume: "RADIATOR APA MAZ", um: "BUC", cantitate: 1, pretUnitar: 7707.5 },
    {
      nrCart: "2113192562",
      nume: "SET PIESE CAUCIUC ANGRENAJ CILINDRIC MIC MTZ",
      um: "BUC",
      cantitate: 1,
      pretUnitar: 45.83,
    },
    { nrCart: "2113192563", nume: "SET CUZINETI PALIERE IUMZ-236", um: "BUC", cantitate: 1, pretUnitar: 1075.0 },
    { nrCart: "2113192564", nume: "SET CUZINETI BIELA IUMZ-236", um: "BUC", cantitate: 1, pretUnitar: 1237.5 },
    { nrCart: "2113192565", nume: "SEMIINEL A/COTIT MAZ", um: "BUC", cantitate: 4, pretUnitar: 491.67 },
    { nrCart: "2113192566", nume: "SIMERING 30X56 A M/A POMPEI", um: "BUC", cantitate: 2, pretUnitar: 33.34 },
    { nrCart: "2113192567", nume: "SAIBA ZN ALB GARNITURA/14X20/", um: "BUC", cantitate: 12, pretUnitar: 5.0 },
    {
      nrCart: "2113200463",
      nume: "TRADUCTOR A LICHIDULUI DE RACIRE TM-100",
      um: "BUC",
      cantitate: 1,
      pretUnitar: 37.5,
    },
    { nrCart: "2113200464", nume: "TROMPA SEMIAXULUI P/S MTZ", um: "BUC", cantitate: 1, pretUnitar: 4832.5 },
  ],
};

export default factura;
