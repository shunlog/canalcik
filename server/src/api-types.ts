// The wire contract between the server and the frontend.
//
// The frontend consumes this as `@canalcik/server/api-types` with type-only
// imports, so nothing here may pull server code into the browser bundle. The
// one import below is types-only and imports nothing itself, which is why it is
// allowed; add no others. The zod schemas in schemas/ are pinned to these types
// with compile-time equality checks, so the two cannot drift.

import type { DataActDefectiune, DataComandaMateriale } from "../../templates/templateData.ts";

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
  nrInmatriculare: string;
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
  nrCart: string;
}

/** A bon as it appears in a list, or on a sofer/vehicul detail page. */
export interface BonRef {
  id: number;
  data: IsoDate;
  sofer: SoferRef;
  vehicul: VehiculRef;
  nrLinii: number;
  nrLiniiFaraLegatura: number;
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
  nrInmatriculare: string;
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
  anvelopeLuni: AnvelopaLuni[];
  anvelopeKm: AnvelopaKm[];
  acumulatoare: Acumulator[];
}

export type VehiculCreateBody = VehiculScalars;
export type VehiculUpdateBody = Partial<VehiculScalars>;
export interface SetSoferiBody {
  soferIds: number[];
}

// ---------------------------------------------------------------- anvelope

/** One physical tire replaced on a fixed calendar schedule ("anvelope_part1.csv"). */
export interface AnvelopaLuniScalars {
  model: string | null;
  dataInstalarii: IsoDate;
  normaLuni: number;
}

export interface AnvelopaLuni extends AnvelopaLuniScalars {
  id: number;
  updatedAt: string;
  /** Whole months left before replacement is due; negative once overdue. */
  luniRamase: number;
}

/** One physical tire replaced on a distance schedule ("anvelope_part2.csv"). */
export interface AnvelopaKmScalars {
  model: string | null;
  dataInstalarii: IsoDate;
  kmInstalare: number;
  normaKm: number;
}

export interface AnvelopaKm extends AnvelopaKmScalars {
  id: number;
  updatedAt: string;
  /** Km left before replacement is due; negative once overdue. null without a kmActuali reading. */
  kmRamasi: number | null;
  /** Wear, 0-100+; null without a kmActuali reading. */
  procenteUzura: number | null;
}

export interface AnvelopaLuniWrite {
  model: string | null;
  dataInstalarii: IsoDate;
  normaLuni: number;
}

export interface AnvelopaLuniUpdate extends Partial<AnvelopaLuniWrite> {
  id: number;
}

export interface AnvelopaKmWrite {
  model: string | null;
  dataInstalarii: IsoDate;
  kmInstalare: number;
  normaKm: number;
}

export interface AnvelopaKmUpdate extends Partial<AnvelopaKmWrite> {
  id: number;
}

/**
 * Per kind: `update` edits existing rows by id (any field may be omitted to
 * leave it as-is), `create` adds new physical tires, `delete` removes rows by
 * id. A key left out entirely means "no changes of that kind" — unlike a
 * bon's or a factura's lines, a tire row is also edited one field at a time
 * from the fleet-wide list page, so this endpoint takes targeted operations
 * rather than replacing the whole list on every save.
 */
export interface AnvelopeUpdateBody {
  anvelopeLuni?: { update?: AnvelopaLuniUpdate[]; create?: AnvelopaLuniWrite[]; delete?: number[] };
  anvelopeKm?: { update?: AnvelopaKmUpdate[]; create?: AnvelopaKmWrite[]; delete?: number[] };
}

/** A tire row as it appears on the fleet-wide "Anvelope" page, with the vehicul it is on. */
export interface AnvelopaLuniRef extends AnvelopaLuni {
  vehicul: VehiculRef;
}

export interface AnvelopaKmRef extends AnvelopaKm {
  vehicul: VehiculRef;
  kmActuali: number | null;
}

export interface AnvelopeList {
  luni: AnvelopaLuniRef[];
  km: AnvelopaKmRef[];
}

// -------------------------------------------------------------- acumulator

/** One physical accumulator replaced on a fixed calendar schedule ("acumulatoare.csv"). */
export interface AcumulatorScalars {
  model: string | null;
  dataInstalarii: IsoDate;
  normaLuni: number;
}

export interface Acumulator extends AcumulatorScalars {
  id: number;
  updatedAt: string;
  /** Whole months left before replacement is due; negative once overdue. */
  luniRamase: number;
}

export interface AcumulatorWrite {
  model: string | null;
  dataInstalarii: IsoDate;
  normaLuni: number;
}

export interface AcumulatorUpdate extends Partial<AcumulatorWrite> {
  id: number;
}

/** Same shape and reasoning as AnvelopeUpdateBody — see its comment. */
export interface AcumulatoareUpdateBody {
  acumulatoare?: { update?: AcumulatorUpdate[]; create?: AcumulatorWrite[]; delete?: number[] };
}

/** An accumulator row as it appears on the fleet-wide "Acumulatoare" page, with the vehicul it is on. */
export interface AcumulatorRef extends Acumulator {
  vehicul: VehiculRef;
}

// --------------------------------------------------------------- bonEliberare

/**
 * One line on a bon, as sent by the client. Lines are owned by the bon.
 * Exactly one of `materialId`/`nota` is set: `materialId` links an existing,
 * invoiced material (picked from the catalogue); `nota` is a scratchpad
 * note — free-typed text for a material the catalogue doesn't have yet.
 * Neither a bon line nor a factura line creates a catalogue row; that is
 * done only through routes/materiale.ts.
 */
export interface BonLine {
  materialId?: number;
  nota?: string;
  cantitate: number;
}

/**
 * A line as stored. `id` is informational only: PATCH replaces the whole set,
 * so line ids are NOT stable across saves — never key React rows by them.
 * `materialId`/`nrCart`/`nume`/`um` are null together on a scratchpad note
 * line — the unit of measure lives on the material, so an unlinked line has
 * none yet; `nota` is null on a linked line.
 */
export interface BonLineOut {
  id: number;
  materialId: number | null;
  nrCart: string | null;
  nume: string | null;
  nota: string | null;
  um: string | null;
  cantitate: number;
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
  materiale: BonLineOut[];
}

export interface BonCreateBody {
  data: IsoDate;
  soferId: number;
  vehiculId: number;
  materiale: BonLine[];
}

export interface BonUpdateBody {
  data?: IsoDate;
  soferId?: number;
  vehiculId?: number;
  /** If present, replaces every line on the bon. If absent, lines are untouched. */
  materiale?: BonLine[];
}

// ------------------------------------------------------ materialeIntretinere

/** A material in the catalogue, with how many bon and factura lines point at it. */
export interface MaterialListItem extends MaterialRef {
  /** Unit of measure — the material's, and therefore every line's that links it. */
  um: string;
  updatedAt: string;
  nrLinii: number;
  nrLiniiFactura: number;
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
  cantitate: number;
}

/**
 * One factura line that names a material, with the factura it sits on. Like
 * MaterialUsage this is per line; a factura carries a material at most once
 * (the (facturaId, materialId) constraint), so it is effectively per factura.
 * `lineId` is a React key, nothing more.
 */
export interface MaterialFacturaUsage {
  lineId: number;
  factura: Pick<FacturaRef, "id" | "data">;
  cantitate: number;
}

export interface MaterialDetail extends MaterialRef {
  um: string;
  updatedAt: string;
  utilizari: MaterialUsage[];
  facturi: MaterialFacturaUsage[];
}

export interface MaterialCreateBody {
  nume: string;
  nrCart: string;
  um: string;
}

export type MaterialUpdateBody = Partial<MaterialCreateBody>;

// ------------------------------------------------------------------ produse

/**
 * A leaf product within a category. Demo data only for now, hardcoded on the
 * server — the real catalogue will come from importing
 * data_source/categorii_produse.csv into SQLite.
 */
export interface ProdusCategorie {
  cod: string;
  nume: string;
  unitate: string;
}

/** One node of the product category tree. A leaf node carries `produse`; others carry `copii`. */
export interface CategorieProduse {
  nume: string;
  copii?: CategorieProduse[];
  produse?: ProdusCategorie[];
}

// ----------------------------------------------------- facturaExpeditie

/**
 * One line on a factura, as sent by the client. Lines are owned by the factura.
 */
export interface FacturaLine {
  materialId: number;
  cantitate: number;
  /** Price for one unit of the material's `um`. */
  pretUnitar: number;
}

/**
 * A line as stored. As on a bon, `id` is informational only: PATCH replaces the
 * whole set, so line ids are NOT stable across saves. `materialId` is stable;
 * `nume`/`nrCart`/`um` are the linked material's current values, read back for
 * display only — the client never edits them through a factura.
 */
export interface FacturaLineOut extends FacturaLine {
  id: number;
  nume: string;
  nrCart: string;
  um: string;
}

/** A factura as it appears in a list. `total` is Σ cantitate × pretUnitar. */
export interface FacturaRef {
  id: number;
  data: IsoDate;
  /** Ramas la depozit de lunile precedente, nu o livrare din luna curentă. */
  ramas: boolean;
  nrLinii: number;
  total: number;
}

export type FacturaListItem = FacturaRef;

export interface FacturaDetail {
  id: number;
  updatedAt: string;
  data: IsoDate;
  /** Ramas la depozit de lunile precedente, nu o livrare din luna curentă. */
  ramas: boolean;
  materiale: FacturaLineOut[];
}

export interface FacturaCreateBody {
  data: IsoDate;
  ramas: boolean;
  materiale: FacturaLine[];
}

export interface FacturaUpdateBody {
  data?: IsoDate;
  ramas?: boolean;
  /** If present, replaces every line on the factura. If absent, lines are untouched. */
  materiale?: FacturaLine[];
}

// ---------------------------------------------------- generated documents

/** A document the app generated, as it points at its file on Drive. */
export interface GeneratedDocRef {
  nume: string;
  driveUrl: string;
  createdAt: string;
}

// --------------------------------------------------------- monthly report

/**
 * One row of the monthly report list. `month` carries the raw "YYYY-MM"; the
 * client formats it, the same split as `data`/`formatIsoDate` everywhere else.
 */
export interface MonthlyReport {
  month: IsoMonth;
  nrBonuri: number;
  /** A month can hold more than one factura de expeditie; empty when it has none. */
  facturi: Array<{ id: number; data: IsoDate }>;
  document: GeneratedDocRef | null;
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
  /** null for a row built entirely from scratchpad notes — no real material. */
  materialId: number | null;
  nume: string;
  /** null only on an orphan row — a bon group that matched no factura line. */
  nrCart: string | null;
  um: string;
  /** null when no factura line matches at all — an orphan bon group. */
  cantitateFactura: number | null;
  /** The matched factura's `ramas`; false on an orphan row. */
  ramas: boolean;
  cantitateBonuri: number;
  /** cantitateBonuri − (cantitateFactura ?? 0). */
  diferenta: number;
  /** Every bon of the month carrying this code, oldest first. */
  bonuri: Array<{ id: number; data: IsoDate }>;
  /** Every factura of the month carrying this material, oldest first. */
  facturi: Array<{ id: number; data: IsoDate }>;
}

/** One month's report, with the row-by-row comparison behind `nrDiferente`. */
export interface MonthlyReportDetail extends MonthlyReport {
  linii: MonthlyReportLine[];
}

// -------------------------------------------------------------- actDefectiune

// The three tables are stored and sent exactly as the template consumes them,
// so generating a document is a field rename away and the two cannot drift.
export type DefectiuneLine = DataActDefectiune["defectiuni"][number];
export type PiesaSchimbLine = DataActDefectiune["pieseSchimb"][number];
export type LucrareLine = DataActDefectiune["lucrari"][number];

/**
 * "Informatie activ". Read off the vehicul every time rather than stored, so an
 * act cannot disagree with the fleet record — see infoVehicul in derived.ts.
 */
export type InfoVehicul = Pick<
  DataActDefectiune,
  "nrInventar" | "nrInregistrare" | "denumireVehicul" | "anProducerii"
>;

/**
 * The "Avizat" line. `numeSofer` is the sofer's own name and `functiaSofer` is
 * read off the vehicul's `tip`, so neither is stored — see infoSofer in
 * derived.ts.
 */
export type InfoSofer = Pick<DataActDefectiune, "numeSofer" | "functiaSofer">;

export interface ActDefectiuneScalars {
  data: IsoDate;
  vehiculId: number;
  soferId: number;
}

/** An act as it appears in the list. */
export interface ActDefectiuneListItem {
  id: number;
  data: IsoDate;
  vehicul: VehiculRef;
  sofer: SoferRef;
  nrDefectiuni: number;
  nrPieseSchimb: number;
  /** Included so a comanda can immediately preview a selected act's materials. */
  pieseSchimb: PiesaSchimbLine[];
  document: GeneratedDocRef | null;
}

/** Everything derived is resolved here, so a reader never has to look it up. */
export interface ActDefectiuneDetail extends ActDefectiuneScalars, InfoVehicul, InfoSofer {
  id: number;
  updatedAt: string;
  vehicul: VehiculRef;
  sofer: SoferRef;
  defectiuni: DefectiuneLine[];
  pieseSchimb: PiesaSchimbLine[];
  lucrari: LucrareLine[];
  document: GeneratedDocRef | null;
}

export interface ActDefectiuneCreateBody extends ActDefectiuneScalars {
  defectiuni: DefectiuneLine[];
  pieseSchimb: PiesaSchimbLine[];
  lucrari: LucrareLine[];
}

export type ActDefectiuneUpdateBody = ActDefectiuneCreateBody;

// ---------------------------------------------------------- comandaMateriale

/** One row of the document's materials table, as the template consumes it. */
type MaterialComanda = DataComandaMateriale["materiale"][number];

/**
 * One line on a comanda, as sent by the client. It carries the document's own
 * fields except the two nothing has to store — `nr` is the row's position and
 * `spec` the plate of the vehicul below — and holds `cantitate` as a number,
 * which the document prints as text.
 */
export interface ComandaMaterialLine extends Omit<MaterialComanda, "nr" | "spec" | "cantitate"> {
  /**
   * The vehicul the material is ordered for. Per line, not per document: one
   * comanda covers the 2-3 acte written that day — see schema.prisma.
   */
  vehiculId: number;
  cantitate: number;
}

/**
 * A line as stored. As on a bon, `id` is informational only: a save replaces
 * the whole set, so line ids are NOT stable across saves.
 */
export interface ComandaMaterialLineOut extends ComandaMaterialLine {
  id: number;
  /** The row's number in the document's table, assigned from the order sent. */
  nr: number;
  vehicul: VehiculRef;
  /** "CA 786" — the vehicul's plate, as the document prints it. */
  spec: string;
}

/** A linked act and the material rows it contributes to a comanda. */
export interface ComandaActDefectiune {
  id: number;
  data: IsoDate;
  vehicul: VehiculRef;
  pieseSchimb: PiesaSchimbLine[];
}

/** A comanda as it appears in the list. */
export interface ComandaMaterialeListItem {
  id: number;
  data: IsoDate;
  /** All document rows: linked acts' pieces plus manually entered materials. */
  nrMateriale: number;
  /** The vehicles its lines name, each once, in line order. */
  vehicule: VehiculRef[];
  /** The defect reports whose pieces are included in this comanda. */
  acteDefectiune: Array<Pick<ComandaActDefectiune, "id" | "data" | "vehicul">>;
  document: GeneratedDocRef | null;
}

/** Everything derived is resolved here, so a reader never has to look it up. */
export interface ComandaMaterialeDetail {
  id: number;
  updatedAt: string;
  data: IsoDate;
  /** All document rows: linked acts' pieces plus manually entered materials. */
  nrMateriale: number;
  acteDefectiune: ComandaActDefectiune[];
  materiale: ComandaMaterialLineOut[];
  document: GeneratedDocRef | null;
}

export interface ComandaMaterialeCreateBody {
  data: IsoDate;
  acteDefectiuneIds: number[];
  materiale: ComandaMaterialLine[];
}

export type ComandaMaterialeUpdateBody = ComandaMaterialeCreateBody;
