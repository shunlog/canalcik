// The wire contract between the server and the frontend.
//
// This file must not import anything: the frontend consumes it as
// `@canalcik/server/api-types` with type-only imports, so nothing here may pull
// server code into the browser bundle. The zod schemas in schemas/ are pinned
// to these types with compile-time equality checks, so the two cannot drift.

/** A calendar date, "YYYY-MM-DD". Never an instant — see the comment in schema.prisma. */
export type IsoDate = string;

export type ApiErrorCode =
  | "VALIDATION"
  | "BAD_JSON"
  | "BAD_REF"
  | "NOT_FOUND"
  | "DUPLICATE"
  | "HAS_DEPENDENTS"
  | "INTERNAL";

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    /** Per-field messages, keyed by form field path. Present on VALIDATION. */
    fields?: Record<string, string>;
  };
}

export interface HealthBody {
  ok: true;
  counts: { soferi: number; vehicule: number; bonuri: number };
}

// ---------------------------------------------------------------- references

export interface VehiculRef {
  id: number;
  litere: string;
  cifre: string;
  nrInventar: number;
  tip: string;
  model: string;
}

export interface SoferRef {
  id: number;
  cod: number;
  nume: string;
}

export interface MaterialRef {
  id: number;
  nume: string;
}

/** A bon as it appears in a list, or on a sofer/vehicul detail page. */
export interface BonRef {
  id: number;
  data: IsoDate;
  sofer: SoferRef;
  vehicul: VehiculRef;
  nrLinii: number;
}

// ---------------------------------------------------------------------- sofer

export interface SoferScalars {
  cod: number;
  nume: string;
  functie: string | null;
  telefon: string | null;
  sector: string | null;
  marimeHaina: string | null;
  marimeIncaltaminte: string | null;
  observatii: string | null;
  eipScurta: IsoDate | null;
  eipIncaltaminte: IsoDate | null;
  eipCostum: IsoDate | null;
  eipPantaloni: IsoDate | null;
  eipVestaAvertizare: IsoDate | null;
}

export interface SoferListItem extends SoferScalars {
  id: number;
  syncedAt: string;
  nrVehicule: number;
  nrBonuri: number;
}

export interface SoferDetail extends SoferScalars {
  id: number;
  syncedAt: string;
  vehicule: VehiculRef[];
  bonuri: BonRef[];
}

export type SoferCreateBody = SoferScalars;
export type SoferUpdateBody = Partial<SoferScalars>;
export interface SetVehiculeBody {
  vehiculIds: number[];
}

// -------------------------------------------------------------------- vehicul

export interface VehiculScalars {
  litere: string;
  cifre: string;
  nrInventar: number;
  nrGaraj: number;
  tip: string;
  model: string;
  anProducere: number | null;
  kmActuali: number | null;
  sector: string | null;
  utilajeAuxiliare: string | null;
  lucrariLunaViitoare: string | null;
}

export interface VehiculListItem extends VehiculScalars {
  id: number;
  syncedAt: string;
  nrSoferi: number;
  nrBonuri: number;
}

export interface VehiculDetail extends VehiculScalars {
  id: number;
  syncedAt: string;
  soferi: SoferRef[];
  bonuri: BonRef[];
}

export type VehiculCreateBody = VehiculScalars;
export type VehiculUpdateBody = Partial<VehiculScalars>;
export interface SetSoferiBody {
  soferIds: number[];
}

// --------------------------------------------------------------- bonEliberare

/** One line on a bon, as sent by the client. Lines are owned by the bon. */
export interface MaterialLine {
  nrCart: string | null;
  /**
   * The material's name, not its id. The server resolves it against
   * MaterialeIntretinere and creates the row when no material carries that
   * name yet — so a bon can always be written, even for something new.
   */
  nume: string;
  um: string;
  cantitate: number;
}

/**
 * A line as stored. `id` is informational only: PATCH replaces the whole set,
 * so line ids are NOT stable across saves — never key React rows by them.
 * `materialId` is stable: it identifies the catalogue row `nume` resolved to.
 */
export interface MaterialLineOut extends MaterialLine {
  id: number;
  materialId: number;
}

export type BonListItem = BonRef;

export interface BonDetail {
  id: number;
  syncedAt: string;
  data: IsoDate;
  soferId: number;
  vehiculId: number;
  sofer: SoferRef;
  vehicul: VehiculRef;
  materiale: MaterialLineOut[];
}

export interface BonCreateBody {
  data: IsoDate;
  soferId: number;
  vehiculId: number;
  materiale: MaterialLine[];
}

export interface BonUpdateBody {
  data?: IsoDate;
  soferId?: number;
  vehiculId?: number;
  /** If present, replaces every line on the bon. If absent, lines are untouched. */
  materiale?: MaterialLine[];
}

// ------------------------------------------------------ materialeIntretinere

/** A material in the catalogue, with how many bon lines point at it. */
export interface MaterialListItem extends MaterialRef {
  syncedAt: string;
  nrLinii: number;
}

/**
 * One bon line that uses a material, with the bon it sits on. A material can
 * appear on the same bon more than once (two lines, two nomenclature codes),
 * so this is per line, not per bon. `lineId` is a React key, nothing more:
 * a bon PATCH replaces its lines, so it does not survive an edit.
 */
export interface MaterialUsage {
  lineId: number;
  bon: BonRef;
  nrCart: string | null;
  um: string;
  cantitate: number;
}

export interface MaterialDetail extends MaterialRef {
  syncedAt: string;
  utilizari: MaterialUsage[];
}

export interface MaterialCreateBody {
  nume: string;
}

export type MaterialUpdateBody = Partial<MaterialCreateBody>;
