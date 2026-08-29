import type { VehiculListItem } from "@canalcik/server/api-types";
import { randomId } from "@mantine/hooks";
import { formatIsoDate, numOrZero, todayLocalIso } from "../../lib/forms.ts";
import { plate } from "../../lib/labels.ts";
import type { DataActDefectiune } from "../../../../templates/templateData.ts";
import type { ProdusIndexat } from "../../lib/produse.tsx";

// ------------------------------------------------------------- auto-fill state

export type StatusCamp = "auto" | "manual" | null;

/** What the catalogue put in a row's fields, kept so an edit can be told from it. */
export interface ProdusAuto {
  nrNomenclator: string;
  piesaSchimb: string;
  um: string;
}

export interface VehiculAuto {
  nrInventar: string;
  nrInregistrare: string;
  denumireVehicul: string;
  anProducerii: string;
}

export const produsAuto = (p: ProdusIndexat): ProdusAuto => ({
  nrNomenclator: p.cod,
  piesaSchimb: p.nume,
  um: p.unitate,
});

export const vehiculAuto = (v: VehiculListItem): VehiculAuto => ({
  nrInventar: String(v.nrInventar),
  nrInregistrare: plate(v),
  denumireVehicul: `${v.tip} ${v.model}`,
  anProducerii: v.anProducere?.toString() ?? "",
});

export const statusCamp = (auto: string | undefined, value: string): StatusCamp => {
  if (auto === undefined) return null;
  return value === auto ? "auto" : "manual";
};

// ------------------------------------------------------------------ form values

export interface DefectiuneRow {
  /** Client-side only: keys the React row so an insert above it does not remount its inputs. */
  key: string;
  defectiunea: string;
  cauze: string;
}

export interface PiesaRow {
  key: string;
  auto: ProdusAuto | null;
  nrNomenclator: string;
  piesaSchimb: string;
  um: string;
  cantitate: number | string;
  /** "Cauza (rând din tab. 1)": a row number in the defectiuni table. */
  cauza: number | string;
  necesitaInlocuire: "da" | "nu";
}

export interface LucrareRow {
  key: string;
  denumire: string;
  um: string;
  cantitate: number | string;
  cauza: number | string;
}

export interface ActFormValues {
  data: string | null;
  vehiculId: string | null;
  autoVehicul: VehiculAuto | null;
  nrInventar: string;
  nrInregistrare: string;
  denumireVehicul: string;
  anProducerii: string;
  defectiuni: DefectiuneRow[];
  pieseSchimb: PiesaRow[];
  lucrari: LucrareRow[];
}

export const newDefectiuneRow = (): DefectiuneRow => ({
  key: randomId(),
  defectiunea: "",
  cauze: "",
});

export const newPiesaRow = (): PiesaRow => ({
  key: randomId(),
  auto: null,
  nrNomenclator: "",
  piesaSchimb: "",
  um: "",
  cantitate: "",
  cauza: "",
  necesitaInlocuire: "da",
});

export const newLucrareRow = (): LucrareRow => ({
  key: randomId(),
  denumire: "",
  um: "",
  cantitate: "",
  cauza: "",
});

/** The tab-2 defaults tab 3 documents: "de inlocuit <piesa>", same UM, quantity and cause. */
export const lucrareDinPiesa = (p: PiesaRow): LucrareRow => ({
  key: randomId(),
  denumire: `de inlocuit ${p.piesaSchimb.trim()}`,
  um: p.um,
  cantitate: p.cantitate,
  cauza: p.cauza,
});

export const emptyActForm = (): ActFormValues => ({
  data: todayLocalIso(),
  vehiculId: null,
  autoVehicul: null,
  nrInventar: "",
  nrInregistrare: "",
  denumireVehicul: "",
  anProducerii: "",
  defectiuni: [newDefectiuneRow()],
  pieseSchimb: [newPiesaRow()],
  lucrari: [newLucrareRow()],
});

// ----------------------------------------------------------------- to the doc

export const fromActForm = (v: ActFormValues): DataActDefectiune => ({
  data: formatIsoDate(v.data ?? todayLocalIso()),
  nrInventar: v.nrInventar.trim(),
  nrInregistrare: v.nrInregistrare.trim(),
  denumireVehicul: v.denumireVehicul.trim(),
  anProducerii: v.anProducerii.trim(),
  defectiuni: v.defectiuni.map((d, i) => ({
    nr: i + 1,
    defectiunea: d.defectiunea.trim(),
    cauze: d.cauze.trim(),
  })),
  pieseSchimb: v.pieseSchimb.map((p, i) => ({
    nr: i + 1,
    nrNomenclator: p.nrNomenclator.trim(),
    piesaSchimb: p.piesaSchimb.trim(),
    um: p.um.trim(),
    cantitate: numOrZero(p.cantitate),
    cauza: numOrZero(p.cauza),
    necesitaInlocuire: p.necesitaInlocuire,
  })),
  lucrari: v.lucrari.map((l, i) => ({
    nr: i + 1,
    denumire: l.denumire.trim(),
    um: l.um.trim(),
    cantitate: numOrZero(l.cantitate),
    cauza: numOrZero(l.cauza),
  })),
});

// ----------------------------------------------------------------- validation

const required = (v: string) => (v.trim() === "" ? "Obligatoriu" : null);

const cantitateValida = (v: number | string) =>
  v === "" || Number.isNaN(Number(v)) || Number(v) <= 0 ? "Cantitate invalidă" : null;

const cauzaValida = (v: number | string) =>
  v === "" || !Number.isInteger(Number(v)) || Number(v) < 1 ? "Rând invalid" : null;

export const actValidation = {
  data: (v: string | null) => (v ? null : "Data este obligatorie"),
  nrInventar: required,
  nrInregistrare: required,
  denumireVehicul: required,
  defectiuni: {
    defectiunea: required,
  },
  pieseSchimb: {
    piesaSchimb: required,
    um: required,
    cantitate: cantitateValida,
    cauza: cauzaValida,
  },
  lucrari: {
    denumire: required,
    um: required,
    cantitate: cantitateValida,
    cauza: cauzaValida,
  },
};
