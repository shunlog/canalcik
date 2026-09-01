import type {
  ComandaMaterialeCreateBody,
  ComandaMaterialeDetail,
} from "@canalcik/server/api-types";
import { randomId } from "@mantine/hooks";
import { numOrZero, todayLocalIso } from "../../lib/forms.ts";

// The form holds only what the comanda stores. Each line's "Specificația
// materialului" is the plate of the vehicul it names, read off the vehicul
// record wherever it is shown — see derived.ts.

// ------------------------------------------------------------------ form values

export interface MaterialRow {
  /** Client-side only: keys the React row so an insert above it does not remount its inputs. */
  key: string;
  /** The vehicul the material is ordered for, as a Select value. */
  vehiculId: string | null;
  nume: string;
  /** The catalogue code, if the material was picked from the catalogue. */
  cod: string;
  um: string;
  cantitate: number | string;
}

export interface ComandaFormValues {
  data: string | null;
  materiale: MaterialRow[];
}

/**
 * A new line, on the vehicul the one above it named: a comanda gathers the
 * day's acte, so its lines come in runs of one vehicul at a time.
 */
export const newMaterialRow = (vehiculId: string | null = null): MaterialRow => ({
  key: randomId(),
  vehiculId,
  nume: "",
  cod: "",
  um: "",
  cantitate: "",
});

export const emptyComandaForm = (): ComandaFormValues => ({
  data: todayLocalIso(),
  materiale: [newMaterialRow()],
});

// ------------------------------------------------------------------ the wire

export const fromComandaForm = (v: ComandaFormValues): ComandaMaterialeCreateBody => ({
  data: v.data ?? todayLocalIso(),
  // No `nr`: the document numbers the rows by their order — see
  // routes/comandaMateriale.ts.
  materiale: v.materiale.map((m) => ({
    vehiculId: Number(m.vehiculId),
    nume: m.nume.trim(),
    cod: m.cod.trim(),
    um: m.um.trim(),
    cantitate: numOrZero(m.cantitate),
  })),
});

export const toComandaForm = (c: ComandaMaterialeDetail): ComandaFormValues => ({
  data: c.data,
  materiale: c.materiale.map((m) => ({
    key: randomId(),
    vehiculId: String(m.vehiculId),
    nume: m.nume,
    cod: m.cod,
    um: m.um,
    cantitate: m.cantitate,
  })),
});

// ----------------------------------------------------------------- validation

const required = (v: string) => (v.trim() === "" ? "Obligatoriu" : null);

const cantitateValida = (v: number | string) =>
  v === "" || Number.isNaN(Number(v)) || Number(v) <= 0 ? "Cantitate invalidă" : null;

export const comandaValidation = {
  data: (v: string | null) => (v ? null : "Data este obligatorie"),
  materiale: {
    vehiculId: (v: string | null) => (v ? null : "Obligatoriu"),
    nume: required,
    um: required,
    cantitate: cantitateValida,
  },
};
