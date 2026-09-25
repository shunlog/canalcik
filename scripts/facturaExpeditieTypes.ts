export type FacturaLine = {
  nrCart: string;
  nume: string;
  um: string;
  cantitate: number;
  pretUnitar: number;
};

export type FacturaExpeditie = {
  data: string; // "data eliberării", format YYYY-MM-DD
  totalTiparit: number; // "TOTAL (pe factura fiscală)", fără TVA
  /** Ramas la depozit de lunile precedente, nu o livrare din luna curentă. Implicit false. */
  ramas?: boolean;
  linii: FacturaLine[];
};
