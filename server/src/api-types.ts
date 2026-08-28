// The wire contract between the server and the frontend.
//
// This file must not import anything: the frontend consumes it as
// `@canalcik/server/api-types` with type-only imports, so nothing here may pull
// server code into the browser bundle. The zod schemas in schemas/ are pinned
// to these types with compile-time equality checks, so the two cannot drift.

/** A calendar date, "YYYY-MM-DD". Never an instant — see the comment in schema.prisma. */
export type IsoDate = string;

/** A calendar month, "YYYY-MM". */
export type IsoMonth = string;

export type ApiErrorCode =
  | "VALIDATION"
  | "BAD_JSON"
  | "BAD_REF"
  | "NOT_FOUND"
  | "DUPLICATE"
  | "HAS_DEPENDENTS"
  /** Google Drive was never authorized, or the token is dead — see routes/monthlyReport.ts. */
  | "DRIVE_NOT_CONNECTED"
  /** data/templates/ has not been fetched from Drive yet — see routes/monthlyReport.ts. */
  | "TEMPLATE_MISSING"
  /** Re-downloading the templates from Drive failed — see routes/templates.ts. */
  | "TEMPLATE_FETCH_FAILED"
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

// ------------------------------------------------------------------ drive

/**
 * Whether token.json is present and still good, plus the app folder generated
 * documents go into. Not connected means `pnpm run auth` has to be re-run on
 * the server — the web app has no consent flow of its own.
 */
export interface DriveStatusBody {
  connected: boolean;
  /** Set when connected is true. */
  folder?: { id: string; name: string; webViewLink: string };
}

// -------------------------------------------------------------- templates

/**
 * One document template: where it comes from on Drive, and how fresh the local
 * copy under TEMPLATES_DIR is.
 */
export interface TemplateInfo {
  /** Its key in the manifest, e.g. "fisaLimita". */
  key: string;
  /** The document's name on Drive, which is also the local base file name. */
  driveName: string;
  /** The Drive share URL it is downloaded from; null when its .env variable is unset. */
  driveUrl: string | null;
  /** The local file name, e.g. "template_fisa_limita.xlsx". */
  fileName: string;
  /** When the local copy was last downloaded; null when it is missing. */
  fetchedAt: string | null;
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
  updatedAt: string;
  nrVehicule: number;
  nrBonuri: number;
}

export interface SoferDetail extends SoferScalars {
  id: number;
  updatedAt: string;
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
  updatedAt: string;
  nrSoferi: number;
  nrBonuri: number;
}

export interface VehiculDetail extends VehiculScalars {
  id: number;
  updatedAt: string;
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
  updatedAt: string;
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
  updatedAt: string;
  nrLinii: number;
}

/**
 * One bon line that uses a material, with the bon it sits on. A material can
 * appear on the same bon more than once (two separate lines), so this is per
 * line, not per bon. `lineId` is a React key, nothing more: a bon PATCH
 * replaces its lines, so it does not survive an edit.
 */
export interface MaterialUsage {
  lineId: number;
  bon: BonRef;
  um: string;
  cantitate: number;
}

export interface MaterialDetail extends MaterialRef {
  updatedAt: string;
  utilizari: MaterialUsage[];
}

export interface MaterialCreateBody {
  nume: string;
}

export type MaterialUpdateBody = Partial<MaterialCreateBody>;

// ----------------------------------------------------- facturaExpeditie

/**
 * One line on a factura, as sent by the client. Lines are owned by the factura.
 * Unlike a bon line, `nrCart` is required: the factura is where the code comes
 * from, and matching a bon against it is the whole point of storing one.
 */
export interface FacturaLine {
  nrCart: string;
  /**
   * The material's name, not its id — resolved and created on the server
   * exactly as for a bon line, so a delivery of something new can be recorded.
   */
  nume: string;
  um: string;
  cantitate: number;
  /** Price for one `um`. */
  pretUnitar: number;
}

/**
 * A line as stored. As on a bon, `id` is informational only: PATCH replaces the
 * whole set, so line ids are NOT stable across saves. `materialId` is stable.
 */
export interface FacturaLineOut extends FacturaLine {
  id: number;
  materialId: number;
}

/** A factura as it appears in a list. `total` is Σ cantitate × pretUnitar. */
export interface FacturaRef {
  id: number;
  data: IsoDate;
  nrLinii: number;
  total: number;
}

export type FacturaListItem = FacturaRef;

export interface FacturaDetail {
  id: number;
  updatedAt: string;
  data: IsoDate;
  materiale: FacturaLineOut[];
}

export interface FacturaCreateBody {
  data: IsoDate;
  materiale: FacturaLine[];
}

export interface FacturaUpdateBody {
  data?: IsoDate;
  /** If present, replaces every line on the factura. If absent, lines are untouched. */
  materiale?: FacturaLine[];
}

// --------------------------------------------------------- monthly report

/** A generated "fisa limita" document as it points at a Drive file. */
export interface FisaLimitaDocRef {
  nume: string;
  driveUrl: string;
  createdAt: string;
}

/**
 * One row of the monthly report list. `month` carries the raw "YYYY-MM"; the
 * client formats it, the same split as `data`/`formatIsoDate` everywhere else.
 */
export interface MonthlyReport {
  month: IsoMonth;
  nrBonuri: number;
  factura: { id: number; data: IsoDate } | null;
  document: FisaLimitaDocRef | null;
  /**
   * How many reconciliation rows disagree with the factura. null when there is
   * nothing to compare — no bonuri, or no factura — so the client's "not enough
   * data" reason keeps precedence over "the data is inconsistent".
   */
  nrDiferente: number | null;
}

/**
 * One reconciliation row: one material, as invoiced against as issued. The
 * factura is authoritative and cannot be edited, so a non-zero `diferenta`
 * means the month's bonuri need correcting.
 */
export interface MonthlyReportLine {
  materialId: number;
  nume: string;
  /** null only on an orphan row — a bon group that matched no factura line. */
  nrCart: string | null;
  um: string;
  /** null when no factura line matches at all — an orphan bon group. */
  cantitateFactura: number | null;
  cantitateBonuri: number;
  /** cantitateBonuri − (cantitateFactura ?? 0). */
  diferenta: number;
  /** Every bon of the month carrying this code, oldest first. */
  bonuri: Array<{ id: number; data: IsoDate }>;
}

/** One month's report, with the row-by-row comparison behind `nrDiferente`. */
export interface MonthlyReportDetail extends MonthlyReport {
  linii: MonthlyReportLine[];
}
