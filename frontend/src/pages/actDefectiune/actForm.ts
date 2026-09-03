import type { ActDefectiuneCreateBody, ActDefectiuneDetail } from "@canalcik/server/api-types";
import { randomId } from "@mantine/hooks";
import { numOrZero, todayLocalIso } from "../../lib/forms.ts";

// The form holds only what the act stores. The vehicul's four fields and the
// sofer's "funcția" are read off those records wherever they are shown — see
// derived.ts

// ------------------------------------------------------------------ form values

export interface DefectiuneRow {
  /** Client-side only: keys the React row so an insert above it does not remount its inputs. */
  key: string;
  defectiunea: string;
  cauze: string;
}

export interface PiesaRow {
  key: string;
  /** The catalogue code, if the piesa was picked from the catalogue — informational only. */
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
  soferId: string | null;
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

/**
 * The tab-2 defaults tab 3 documents: "de inlocuit <piesa>", same UM, quantity
 * and cause. A lucrare's own denumire and UM are free text once seeded — they
 * describe work, not a catalogue product — so this copies rather than derives.
 */
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
  soferId: null,
  defectiuni: [newDefectiuneRow()],
  pieseSchimb: [newPiesaRow()],
  lucrari: [newLucrareRow()],
});

// ------------------------------------------------------------------ the wire

// The three tables are sent in the document's own shape, `nr` included, so the
// server stores what the template will consume — see api-types.ts.
export const fromActForm = (v: ActFormValues): ActDefectiuneCreateBody => ({
  data: v.data ?? todayLocalIso(),
  vehiculId: Number(v.vehiculId),
  soferId: Number(v.soferId),
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
  vehiculId: (v: string | null) => (v ? null : "Vehiculul este obligatoriu"),
  soferId: (v: string | null) => (v ? null : "Șoferul este obligatoriu"),
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

export const toActForm = (a: ActDefectiuneDetail): ActFormValues => ({
  data: a.data,
  vehiculId: String(a.vehiculId),
  soferId: String(a.soferId),
  // `nr` is dropped: it is the row's position, which fromActForm derives again.
  defectiuni: a.defectiuni.map((d) => ({
    key: randomId(),
    defectiunea: d.defectiunea,
    cauze: d.cauze,
  })),
  pieseSchimb: a.pieseSchimb.map((p) => ({
    key: randomId(),
    nrNomenclator: p.nrNomenclator,
    piesaSchimb: p.piesaSchimb,
    um: p.um,
    cantitate: p.cantitate,
    cauza: p.cauza,
    necesitaInlocuire: p.necesitaInlocuire,
  })),
  lucrari: a.lucrari.map((l) => ({
    key: randomId(),
    denumire: l.denumire,
    um: l.um,
    cantitate: l.cantitate,
    cauza: l.cauza,
  })),
});
