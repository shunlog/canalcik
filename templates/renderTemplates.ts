import { renderDocxBuf } from "./renderDocx.ts";
import { renderXlsxBuf, renderXlsxTabs } from "./renderXlsx.ts";

// --- Data types (one per template; the module's contract) --------------------

// "Comanda de materiale" — the ~daily materials order. Created about once a day
// and tied to 2-3 "act defectiune" documents.
export type DataComandaMateriale = {
  data: string; // date
  materiale: Array<{
    nr: number; // row number
    nume: string; // "Denumirea materialului": material name, e.g. "Bara reactiva K-3 MAZ 5337"
    spec: string; // "Specificația materialului": registration nr, e.g. "CA 786"
    um: string; // "UM": measurement unit, e.g. "buc", "set", "l"
    cantitate: string; // "Cantitatea": number
    cod: string; // "Nomenclator D365": material code, e.g. "120673"
  }>;
};

// "Act de constatare a defectiunilor" — the defect-report document.
export type DataActDefectiune = {
  data: string; // date
  // "Informatie activ" section:
  nrInventar: string; // "Nr. inventar": inventory nr, e.g. "42691696"
  nrInregistrare: string; // "nr. de înregistrare": registration nr, e.g. "CA 786"
  denumireVehicul: string; // "Denumire conform datelor contabile": vehicle type + model, e.g. "Tractor MTZ-82"
  anProducerii: string; // "Anul producerii": year
  // "Lista defecțiunilor" (tab 1) table:
  defectiuni: Array<{
    nr: number; // row number
    defectiunea: string; // "Defecțiunea": str
    cauze: string; // "Cauzele probabile ale defecțiunilor": str
  }>;
  // "Lista pieselor de schimb" (tab 2) table:
  pieseSchimb: Array<{
    nr: number; // row number
    nrNomenclator: string; // "Nr. nomenclator": material code, e.g. "120673"
    piesaSchimb: string; // material name, e.g. "Bara reactiva K-3 MAZ 5337"
    um: string; // "UM": measurement unit, e.g. "buc", "set", "l"
    cantitate: number; // number
    cauza: number; // "Cauza (rând din tab. 1)": row index from tab 1
    necesitaInlocuire: "da" | "nu"; // "Necesită înlocuire": "da" or "nu"
  }>;
  // "Lista lucrărilor de reparații necesare" table:
  lucrari: Array<{
    nr: number; // row number
    denumire: string; // "Denumirea lucrărilor": str, e.g. "de inlocuit <material name>"
    um: string; // "UM": measurement unit (default: same as in tab 2)
    cantitate: number; // "Cantitate": number (default: same as in tab 2)
    cauza: number; // "Cauza (rând din tab. 1)": row index from tab 1
  }>;
};

// "Fisa limita" — the end-of-month per-vehicle sheet. The template is a Google
// Sheet (driveName "template_fisa_limita", kind "xlsx" in templateManifest.ts)
// using the ${...} placeholder syntax (documented on renderXlsxBuf in
// renderXlsx.ts).
// Keys must match the template placeholders exactly. Numeric columns accept a
// string too, so you can pre-format them (as the docx renderer does for its
// numbers).
type Num = string | number;

export type DataFisaLimitaSheet = {
  nr_inregistrare: string; // "Nr inregistrare": registration nr, e.g. "CBE 276"
  nume_sofer: string; // "Numele soferului": driver full name, e.g. "Celpan Ion"
  cod_sofer: string; // "Nr. soferului": driver code, e.g. "4984"
  nr_inventar: string; // "Nr inventar": inventory number of the vehicle, e.g. "12345"
  luna: string; // "Luna": month in romanian, e.g. "Mai"
  anul: string; // "An": year, e.g. "2026"
  tbl: Array<{
    data: string; // "Data": date, e.g. "26.05.2026"
    nr_cart: string; // "Nr. cartelei": material code, e.g. "2111121795" 
    // "cod nomenclator" from the bill "Factura de expeditie", not the internal one
    nume: string; // material name, e.g. "Bara reactiva K-3 MAZ 5337"
    unit: string; // measurement unit, e.g. "l", "buc"
    cant: Num; // quantity
    pret_lei: Num; // unit price, lei part
    pret_bani: Num; // unit price, bani part
    suma_lei: Num; // total, lei part
    suma_bani: Num; // total, bani part
  }>;
};

export type DataFisaLimita = Array<DataFisaLimitaSheet>;

// --- Public API --------------------------------------------------------------

export function renderComandaMateriale(
  template: Buffer,
  data: DataComandaMateriale,
): Buffer {
  return renderDocxBuf(template, data);
}

export function renderActDefectiune(
  template: Buffer,
  data: DataActDefectiune,
): Buffer {
  return renderDocxBuf(template, data);
}

// Renders a spreadsheet with multiple tabs named "<registration plate>-<driver name>"
// it is normalized to Excel's naming rules and made unique if necessary.
export function renderFisaLimita(
  template: Buffer,
  data: DataFisaLimita,
): Buffer {
  const names = fisaLimitaTabNames(data);
  return renderXlsxTabs(
    template,
    data.map((fisa, index) => ({
      name: names[index],
      data: fisa,
    })),
  );
}

function fisaLimitaTabNames(data: DataFisaLimita): string[] {
  const used = new Set<string>();
  return data.map((fisa, index) => {
    const base = (
      fisa.nr_inregistrare.trim() && fisa.nume_sofer.trim()
        ? `${fisa.nr_inregistrare}-${fisa.nume_sofer}`
        : `Fisa ${index + 1}`
    )
      .replace(/[\\/*?:\[\]]/g, "-")
      .replace(/^'+|'+$/g, "")
      .slice(0, 31) || `Fisa ${index + 1}`;
    if (!used.has(base.toLocaleLowerCase())) {
      used.add(base.toLocaleLowerCase());
      return base;
    }

    let suffix = 2;
    let name = base;
    do {
      const ending = ` (${suffix++})`;
      name = `${base.slice(0, 31 - ending.length)}${ending}`;
    } while (used.has(name.toLocaleLowerCase()));
    used.add(name.toLocaleLowerCase());
    return name;
  });
}
