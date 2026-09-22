import { Prisma } from "@prisma/client";
import type {
  Acumulator,
  AcumulatorRef,
  ActDefectiuneDetail,
  ActDefectiuneListItem,
  AnvelopaKm,
  AnvelopaKmRef,
  AnvelopaLuni,
  AnvelopaLuniRef,
  BonDetail,
  BonRef,
  ComandaMaterialeDetail,
  ComandaMaterialeListItem,
  DefectiuneLine,
  LucrareLine,
  PiesaSchimbLine,
  FacturaDetail,
  FacturaRef,
  GeneratedDocRef,
  MaterialDetail,
  MaterialListItem,
  SoferDetail,
  SoferListItem,
  VehiculDetail,
  VehiculListItem,
} from "./api-types.ts";
import { infoSofer, infoVehicul, kmRamasi, luniRamase, procenteUzura } from "./derived.ts";

// Today as "YYYY-MM-DD" — used to resolve how much of a tire's schedule is
// left, the same way monthlyReportData resolves the current month.
export const todayIso = () => new Date().toLocaleDateString("sv-SE");

// Every query below uses an explicit `select`, so adding a column to
// schema.prisma never silently starts leaking it over the wire — the DTO and
// the query change together, in this one file.

export const vehiculRefSelect = {
  id: true,
  nrInmatriculare: true,
  nrInventar: true,
  tip: true,
  model: true,
} satisfies Prisma.VehiculSelect;

export const soferRefSelect = {
  id: true,
  cod: true,
  nume: true,
} satisfies Prisma.SoferSelect;

export const materialRefSelect = {
  id: true,
  nume: true,
} satisfies Prisma.MaterialeIntretinereSelect;

export const bonRefSelect = {
  id: true,
  data: true,
  sofer: { select: soferRefSelect },
  vehicul: { select: vehiculRefSelect },
  _count: { select: { materiale: true } },
} satisfies Prisma.BonEliberareSelect;

type BonRefRow = Prisma.BonEliberareGetPayload<{ select: typeof bonRefSelect }>;

export const toBonRef = (r: BonRefRow): BonRef => ({
  id: r.id,
  data: r.data,
  sofer: r.sofer,
  vehicul: r.vehicul,
  nrLinii: r._count.materiale,
});

// ---------------------------------------------------------------------- sofer

const soferScalarSelect = {
  id: true,
  updatedAt: true,
  cod: true,
  nume: true,
  functie: true,
  telefon: true,
  sector: true,
  marimeHaina: true,
  marimeIncaltaminte: true,
  observatii: true,
  eipScurta: true,
  eipIncaltaminte: true,
  eipCostum: true,
  eipPantaloni: true,
  eipVestaAvertizare: true,
} satisfies Prisma.SoferSelect;

export const soferListSelect = {
  ...soferScalarSelect,
  _count: { select: { vehicule: true, bonuri: true } },
} satisfies Prisma.SoferSelect;

export const soferDetailSelect = {
  ...soferScalarSelect,
  vehicule: { select: vehiculRefSelect, orderBy: { nrInmatriculare: "asc" } },
  bonuri: { select: bonRefSelect, orderBy: [{ data: "desc" }, { id: "desc" }] },
} satisfies Prisma.SoferSelect;

type SoferListRow = Prisma.SoferGetPayload<{ select: typeof soferListSelect }>;
type SoferDetailRow = Prisma.SoferGetPayload<{ select: typeof soferDetailSelect }>;

// updatedAt is a Date in Prisma but a string on the wire. Converting it here
// rather than leaning on JSON.stringify's implicit toJSON is what keeps
// api-types.ts an honest description of the response.
export const toSoferListItem = ({ _count, updatedAt, ...s }: SoferListRow): SoferListItem => ({
  ...s,
  updatedAt: updatedAt.toISOString(),
  nrVehicule: _count.vehicule,
  nrBonuri: _count.bonuri,
});

export const toSoferDetail = ({
  vehicule,
  bonuri,
  updatedAt,
  ...s
}: SoferDetailRow): SoferDetail => ({
  ...s,
  updatedAt: updatedAt.toISOString(),
  vehicule,
  bonuri: bonuri.map(toBonRef),
});

// -------------------------------------------------------------------- vehicul

const vehiculScalarSelect = {
  id: true,
  updatedAt: true,
  nrInmatriculare: true,
  nrInventar: true,
  nrGaraj: true,
  tip: true,
  model: true,
  anProducere: true,
  kmActuali: true,
  sector: true,
  utilajeAuxiliare: true,
  lucrariLunaViitoare: true,
} satisfies Prisma.VehiculSelect;

export const vehiculListSelect = {
  ...vehiculScalarSelect,
  _count: { select: { soferi: true, bonuri: true } },
} satisfies Prisma.VehiculSelect;

const anvelopaLuniSelect = {
  id: true,
  updatedAt: true,
  model: true,
  dataInstalarii: true,
  normaLuni: true,
} satisfies Prisma.AnvelopaLuniSelect;

const anvelopaKmSelect = {
  id: true,
  updatedAt: true,
  model: true,
  dataInstalarii: true,
  kmInstalare: true,
  normaKm: true,
} satisfies Prisma.AnvelopaKmSelect;

type AnvelopaLuniRow = Prisma.AnvelopaLuniGetPayload<{ select: typeof anvelopaLuniSelect }>;
type AnvelopaKmRow = Prisma.AnvelopaKmGetPayload<{ select: typeof anvelopaKmSelect }>;

const toAnvelopaLuni = ({ updatedAt, ...a }: AnvelopaLuniRow, today: string): AnvelopaLuni => ({
  ...a,
  updatedAt: updatedAt.toISOString(),
  luniRamase: luniRamase(a.dataInstalarii, a.normaLuni, today),
});

const toAnvelopaKm = ({ updatedAt, ...a }: AnvelopaKmRow, kmActuali: number | null): AnvelopaKm => ({
  ...a,
  updatedAt: updatedAt.toISOString(),
  kmRamasi: kmActuali === null ? null : kmRamasi(a.kmInstalare, a.normaKm, kmActuali),
  procenteUzura: kmActuali === null ? null : procenteUzura(a.kmInstalare, a.normaKm, kmActuali),
});

// The fleet-wide "Anvelope" page reads every tire across every vehicul, so
// each row carries its own vehicul ref rather than being nested under one.
export const anvelopaLuniListSelect = {
  ...anvelopaLuniSelect,
  vehicul: { select: vehiculRefSelect },
} satisfies Prisma.AnvelopaLuniSelect;

// kmActuali rides along to resolve kmRamasi/procenteUzura per row, and is
// also surfaced as its own field on AnvelopaKmRef (not nested under vehicul).
export const anvelopaKmListSelect = {
  ...anvelopaKmSelect,
  vehicul: { select: { ...vehiculRefSelect, kmActuali: true } },
} satisfies Prisma.AnvelopaKmSelect;

type AnvelopaLuniListRow = Prisma.AnvelopaLuniGetPayload<{ select: typeof anvelopaLuniListSelect }>;
type AnvelopaKmListRow = Prisma.AnvelopaKmGetPayload<{ select: typeof anvelopaKmListSelect }>;

export const toAnvelopaLuniRef = (
  { vehicul, ...a }: AnvelopaLuniListRow,
  today: string,
): AnvelopaLuniRef => ({
  ...toAnvelopaLuni(a, today),
  vehicul,
});

export const toAnvelopaKmRef = ({ vehicul, ...a }: AnvelopaKmListRow): AnvelopaKmRef => {
  const { kmActuali, ...vehiculRef } = vehicul;
  return { ...toAnvelopaKm(a, kmActuali), vehicul: vehiculRef, kmActuali };
};

const acumulatorSelect = {
  id: true,
  updatedAt: true,
  model: true,
  dataInstalarii: true,
  normaLuni: true,
} satisfies Prisma.AcumulatorSelect;

type AcumulatorRow = Prisma.AcumulatorGetPayload<{ select: typeof acumulatorSelect }>;

const toAcumulator = ({ updatedAt, ...a }: AcumulatorRow, today: string): Acumulator => ({
  ...a,
  updatedAt: updatedAt.toISOString(),
  luniRamase: luniRamase(a.dataInstalarii, a.normaLuni, today),
});

// The fleet-wide "Acumulatoare" page reads every accumulator across every
// vehicul, so each row carries its own vehicul ref rather than being nested
// under one.
export const acumulatorListSelect = {
  ...acumulatorSelect,
  vehicul: { select: vehiculRefSelect },
} satisfies Prisma.AcumulatorSelect;

type AcumulatorListRow = Prisma.AcumulatorGetPayload<{ select: typeof acumulatorListSelect }>;

export const toAcumulatorRef = (
  { vehicul, ...a }: AcumulatorListRow,
  today: string,
): AcumulatorRef => ({
  ...toAcumulator(a, today),
  vehicul,
});

export const vehiculDetailSelect = {
  ...vehiculScalarSelect,
  soferi: { select: soferRefSelect, orderBy: { nume: "asc" } },
  bonuri: { select: bonRefSelect, orderBy: [{ data: "desc" }, { id: "desc" }] },
  anvelopeLuni: { select: anvelopaLuniSelect, orderBy: { dataInstalarii: "desc" } },
  anvelopeKm: { select: anvelopaKmSelect, orderBy: { dataInstalarii: "desc" } },
  acumulatoare: { select: acumulatorSelect, orderBy: { dataInstalarii: "desc" } },
} satisfies Prisma.VehiculSelect;

type VehiculListRow = Prisma.VehiculGetPayload<{ select: typeof vehiculListSelect }>;
type VehiculDetailRow = Prisma.VehiculGetPayload<{ select: typeof vehiculDetailSelect }>;

export const toVehiculListItem = ({
  _count,
  updatedAt,
  ...v
}: VehiculListRow): VehiculListItem => ({
  ...v,
  updatedAt: updatedAt.toISOString(),
  nrSoferi: _count.soferi,
  nrBonuri: _count.bonuri,
});

export const toVehiculDetail = ({
  soferi,
  bonuri,
  anvelopeLuni,
  anvelopeKm,
  acumulatoare,
  updatedAt,
  ...v
}: VehiculDetailRow): VehiculDetail => {
  const today = todayIso();
  return {
    ...v,
    updatedAt: updatedAt.toISOString(),
    soferi,
    bonuri: bonuri.map(toBonRef),
    anvelopeLuni: anvelopeLuni.map((a) => toAnvelopaLuni(a, today)),
    anvelopeKm: anvelopeKm.map((a) => toAnvelopaKm(a, v.kmActuali)),
    acumulatoare: acumulatoare.map((a) => toAcumulator(a, today)),
  };
};

// --------------------------------------------------------------- bonEliberare

export const bonDetailSelect = {
  id: true,
  updatedAt: true,
  data: true,
  soferId: true,
  vehiculId: true,
  sofer: { select: soferRefSelect },
  vehicul: { select: vehiculRefSelect },
  materiale: {
    select: {
      id: true,
      materialId: true,
      material: { select: { nume: true } },
      um: true,
      cantitate: true,
    },
    orderBy: { id: "asc" },
  },
} satisfies Prisma.BonEliberareSelect;

type BonDetailRow = Prisma.BonEliberareGetPayload<{ select: typeof bonDetailSelect }>;

// A line's name lives on the material it points at, but the wire type keeps it
// flat: the client edits lines by name and never has to hold an id it can't
// have yet for a material that doesn't exist.
export const toBonDetail = ({ updatedAt, materiale, ...b }: BonDetailRow): BonDetail => ({
  ...b,
  updatedAt: updatedAt.toISOString(),
  materiale: materiale.map(({ material, ...m }) => ({ ...m, nume: material.nume })),
});

// ------------------------------------------------------ materialeIntretinere

export const materialListSelect = {
  ...materialRefSelect,
  updatedAt: true,
  _count: { select: { bonuri: true } },
} satisfies Prisma.MaterialeIntretinereSelect;

type MaterialListRow = Prisma.MaterialeIntretinereGetPayload<{
  select: typeof materialListSelect;
}>;

export const toMaterialListItem = ({
  _count,
  updatedAt,
  ...m
}: MaterialListRow): MaterialListItem => ({
  ...m,
  updatedAt: updatedAt.toISOString(),
  nrLinii: _count.bonuri,
});

// `bonuri` here is the *lines* pointing at the material, each carrying the bon
// it sits on — a material can appear twice on one bon, so the page lists lines.
export const materialDetailSelect = {
  ...materialRefSelect,
  updatedAt: true,
  bonuri: {
    select: { id: true, um: true, cantitate: true, bon: { select: bonRefSelect } },
    orderBy: [{ bon: { data: "desc" } }, { id: "desc" }],
  },
} satisfies Prisma.MaterialeIntretinereSelect;

type MaterialDetailRow = Prisma.MaterialeIntretinereGetPayload<{
  select: typeof materialDetailSelect;
}>;

export const toMaterialDetail = ({
  bonuri,
  updatedAt,
  ...m
}: MaterialDetailRow): MaterialDetail => ({
  ...m,
  updatedAt: updatedAt.toISOString(),
  utilizari: bonuri.map(({ id, bon, ...line }) => ({ lineId: id, bon: toBonRef(bon), ...line })),
});

// ----------------------------------------------------- facturaExpeditie

// The lines are read just to total the factura: an invoice is read by its value
// as much as by its date, and the total is per line (cantitate × pretUnitar),
// so there is no column to sum in SQL.
export const facturaRefSelect = {
  id: true,
  data: true,
  _count: { select: { materiale: true } },
  materiale: { select: { cantitate: true, pretUnitar: true } },
} satisfies Prisma.FacturaExpeditieSelect;

type FacturaRefRow = Prisma.FacturaExpeditieGetPayload<{ select: typeof facturaRefSelect }>;

/** Money, from a sum of floats — rounded so 20.000000000000004 never ships. */
const toBani = (n: number) => Math.round(n * 100) / 100;

export const toFacturaRef = (r: FacturaRefRow): FacturaRef => ({
  id: r.id,
  data: r.data,
  nrLinii: r._count.materiale,
  total: toBani(r.materiale.reduce((sum, m) => sum + m.cantitate * m.pretUnitar, 0)),
});

export const facturaDetailSelect = {
  id: true,
  updatedAt: true,
  data: true,
  materiale: {
    select: {
      id: true,
      materialId: true,
      material: { select: { nume: true } },
      nrCart: true,
      um: true,
      cantitate: true,
      pretUnitar: true,
    },
    orderBy: { id: "asc" },
  },
} satisfies Prisma.FacturaExpeditieSelect;

type FacturaDetailRow = Prisma.FacturaExpeditieGetPayload<{ select: typeof facturaDetailSelect }>;

// Flattened the same way as a bon line, and for the same reason: the client
// edits lines by name and never holds an id for a material that doesn't exist yet.
export const toFacturaDetail = ({
  updatedAt,
  materiale,
  ...f
}: FacturaDetailRow): FacturaDetail => ({
  ...f,
  updatedAt: updatedAt.toISOString(),
  materiale: materiale.map(({ material, ...m }) => ({ ...m, nume: material.nume })),
});

// --------------------------------------------------------- generatedDocument

export const generatedDocSelect = {
  nume: true,
  driveUrl: true,
  createdAt: true,
} satisfies Prisma.GeneratedDocumentSelect;

type GeneratedDocRow = Prisma.GeneratedDocumentGetPayload<{ select: typeof generatedDocSelect }>;

export const toGeneratedDocRef = ({ createdAt, ...d }: GeneratedDocRow): GeneratedDocRef => ({
  ...d,
  createdAt: createdAt.toISOString(),
});

// ------------------------------------------------------------- actDefectiune

/**
 * The act's three tables are one JSON column each — this is the only place they
 * are read back, so the cast lives here and nowhere else. What went in was
 * validated by schemas/actDefectiune.ts, so the shape is the wire type's.
 */
const parseLines = <T>(json: string): T[] => JSON.parse(json) as T[];

export const actDefectiuneListSelect = {
  id: true,
  data: true,
  vehicul: { select: vehiculRefSelect },
  sofer: { select: soferRefSelect },
  defectiuni: true,
  pieseSchimb: true,
  doc: { select: { document: { select: generatedDocSelect } } },
} satisfies Prisma.ActDefectiuneDataSelect;

type ActDefectiuneListRow = Prisma.ActDefectiuneDataGetPayload<{
  select: typeof actDefectiuneListSelect;
}>;

// The two counts come from parsing rather than from a _count: the lines are not
// rows. The list is one company's acts, so the parse is cheaper than the tables
// it would take to make `_count` possible.
export const toActDefectiuneListItem = (r: ActDefectiuneListRow): ActDefectiuneListItem => ({
  id: r.id,
  data: r.data,
  vehicul: r.vehicul,
  sofer: r.sofer,
  nrDefectiuni: parseLines<DefectiuneLine>(r.defectiuni).length,
  nrPieseSchimb: parseLines<PiesaSchimbLine>(r.pieseSchimb).length,
  pieseSchimb: parseLines<PiesaSchimbLine>(r.pieseSchimb),
  document: r.doc ? toGeneratedDocRef(r.doc.document) : null,
});

// anProducere rides along only to feed infoVehicul; it is stripped below rather
// than widening VehiculRef, which every other endpoint shares.
export const actDefectiuneDetailSelect = {
  id: true,
  updatedAt: true,
  data: true,
  vehiculId: true,
  vehicul: { select: { ...vehiculRefSelect, anProducere: true } },
  soferId: true,
  sofer: { select: soferRefSelect },
  defectiuni: true,
  pieseSchimb: true,
  lucrari: true,
  doc: { select: { document: { select: generatedDocSelect } } },
} satisfies Prisma.ActDefectiuneDataSelect;

type ActDefectiuneDetailRow = Prisma.ActDefectiuneDataGetPayload<{
  select: typeof actDefectiuneDetailSelect;
}>;

export const toActDefectiuneDetail = ({
  updatedAt,
  vehicul,
  sofer,
  defectiuni,
  pieseSchimb,
  lucrari,
  doc,
  ...a
}: ActDefectiuneDetailRow): ActDefectiuneDetail => {
  const { anProducere, ...ref } = vehicul;
  return {
    ...a,
    ...infoVehicul(vehicul),
    ...infoSofer(sofer, vehicul),
    vehicul: ref,
    sofer,
    updatedAt: updatedAt.toISOString(),
    defectiuni: parseLines<DefectiuneLine>(defectiuni),
    pieseSchimb: parseLines<PiesaSchimbLine>(pieseSchimb),
    lucrari: parseLines<LucrareLine>(lucrari),
    document: doc ? toGeneratedDocRef(doc.document) : null,
  };
};

// ---------------------------------------------------------- comandaMateriale

export const comandaMaterialeListSelect = {
  id: true,
  data: true,
  _count: { select: { materiale: true } },
  acteDefectiune: {
    select: {
      id: true,
      data: true,
      vehicul: { select: vehiculRefSelect },
      pieseSchimb: true,
    },
    orderBy: [{ data: "asc" }, { id: "asc" }],
  },
  materiale: { select: { vehicul: { select: vehiculRefSelect } }, orderBy: { nr: "asc" } },
  doc: { select: { document: { select: generatedDocSelect } } },
} satisfies Prisma.ComandaMaterialeDataSelect;

type ComandaMaterialeListRow = Prisma.ComandaMaterialeDataGetPayload<{
  select: typeof comandaMaterialeListSelect;
}>;

const nrPieseDinActe = (acte: Array<{ pieseSchimb: string }>) =>
  acte.reduce((total, act) => total + parseLines<PiesaSchimbLine>(act.pieseSchimb).length, 0);

// A comanda covers the day's 2-3 acte, so the list names the vehicles rather
// than counting them — deduplicated here, since a vehicul usually has several
// lines and the list would otherwise repeat its plate.
export const toComandaMaterialeListItem = (r: ComandaMaterialeListRow): ComandaMaterialeListItem => {
  const vehicule = new Map(r.materiale.map((m) => [m.vehicul.id, m.vehicul]));
  return {
    id: r.id,
    data: r.data,
    nrMateriale: r._count.materiale + nrPieseDinActe(r.acteDefectiune),
    vehicule: [...vehicule.values()],
    acteDefectiune: r.acteDefectiune.map(({ id, data, vehicul }) => ({ id, data, vehicul })),
    document: r.doc ? toGeneratedDocRef(r.doc.document) : null,
  };
};

export const comandaMaterialeDetailSelect = {
  id: true,
  updatedAt: true,
  data: true,
  acteDefectiune: {
    select: {
      id: true,
      data: true,
      vehicul: { select: vehiculRefSelect },
      pieseSchimb: true,
    },
    orderBy: [{ data: "asc" }, { id: "asc" }],
  },
  materiale: {
    select: {
      id: true,
      nr: true,
      vehiculId: true,
      vehicul: { select: vehiculRefSelect },
      nume: true,
      cod: true,
      um: true,
      cantitate: true,
    },
    orderBy: { nr: "asc" },
  },
  doc: { select: { document: { select: generatedDocSelect } } },
} satisfies Prisma.ComandaMaterialeDataSelect;

type ComandaMaterialeDetailRow = Prisma.ComandaMaterialeDataGetPayload<{
  select: typeof comandaMaterialeDetailSelect;
}>;

// `spec` is the plate, resolved off the vehicul on every read rather than
// stored — so a comanda cannot disagree with the fleet record.
export const toComandaMaterialeDetail = ({
  updatedAt,
  acteDefectiune,
  materiale,
  doc,
  ...c
}: ComandaMaterialeDetailRow): ComandaMaterialeDetail => {
  const acte = acteDefectiune.map((a) => ({
    ...a,
    pieseSchimb: parseLines<PiesaSchimbLine>(a.pieseSchimb),
  }));
  return {
    ...c,
    updatedAt: updatedAt.toISOString(),
    nrMateriale: materiale.length + acte.reduce((total, act) => total + act.pieseSchimb.length, 0),
    acteDefectiune: acte,
    materiale: materiale.map((m) => ({ ...m, spec: m.vehicul.nrInmatriculare })),
    document: doc ? toGeneratedDocRef(doc.document) : null,
  };
};
