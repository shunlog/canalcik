import { Prisma } from "@prisma/client";
import type {
  BonDetail,
  BonRef,
  FacturaDetail,
  FacturaRef,
  FisaLimitaDocRef,
  MaterialDetail,
  MaterialListItem,
  SoferDetail,
  SoferListItem,
  VehiculDetail,
  VehiculListItem,
} from "./api-types.ts";

// Every query below uses an explicit `select`, so adding a column to
// schema.prisma never silently starts leaking it over the wire — the DTO and
// the query change together, in this one file.

export const vehiculRefSelect = {
  id: true,
  litere: true,
  cifre: true,
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
  vehicule: { select: vehiculRefSelect, orderBy: [{ litere: "asc" }, { cifre: "asc" }] },
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
  litere: true,
  cifre: true,
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

export const vehiculDetailSelect = {
  ...vehiculScalarSelect,
  soferi: { select: soferRefSelect, orderBy: { nume: "asc" } },
  bonuri: { select: bonRefSelect, orderBy: [{ data: "desc" }, { id: "desc" }] },
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
  updatedAt,
  ...v
}: VehiculDetailRow): VehiculDetail => ({
  ...v,
  updatedAt: updatedAt.toISOString(),
  soferi,
  bonuri: bonuri.map(toBonRef),
});

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

// ------------------------------------------------------------- fisaLimitaDoc

export const fisaLimitaDocSelect = {
  nume: true,
  driveUrl: true,
  createdAt: true,
} satisfies Prisma.GeneratedDocumentSelect;

type FisaLimitaDocRow = Prisma.GeneratedDocumentGetPayload<{ select: typeof fisaLimitaDocSelect }>;

export const toFisaLimitaDocRef = ({ createdAt, ...d }: FisaLimitaDocRow): FisaLimitaDocRef => ({
  ...d,
  createdAt: createdAt.toISOString(),
});
