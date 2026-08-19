import { Prisma } from "@prisma/client";
import type {
  BonDetail,
  BonRef,
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
  syncedAt: true,
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

// syncedAt is a Date in Prisma but a string on the wire. Converting it here
// rather than leaning on JSON.stringify's implicit toJSON is what keeps
// api-types.ts an honest description of the response.
export const toSoferListItem = ({ _count, syncedAt, ...s }: SoferListRow): SoferListItem => ({
  ...s,
  syncedAt: syncedAt.toISOString(),
  nrVehicule: _count.vehicule,
  nrBonuri: _count.bonuri,
});

export const toSoferDetail = ({
  vehicule,
  bonuri,
  syncedAt,
  ...s
}: SoferDetailRow): SoferDetail => ({
  ...s,
  syncedAt: syncedAt.toISOString(),
  vehicule,
  bonuri: bonuri.map(toBonRef),
});

// -------------------------------------------------------------------- vehicul

const vehiculScalarSelect = {
  id: true,
  syncedAt: true,
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
  syncedAt,
  ...v
}: VehiculListRow): VehiculListItem => ({
  ...v,
  syncedAt: syncedAt.toISOString(),
  nrSoferi: _count.soferi,
  nrBonuri: _count.bonuri,
});

export const toVehiculDetail = ({
  soferi,
  bonuri,
  syncedAt,
  ...v
}: VehiculDetailRow): VehiculDetail => ({
  ...v,
  syncedAt: syncedAt.toISOString(),
  soferi,
  bonuri: bonuri.map(toBonRef),
});

// --------------------------------------------------------------- bonEliberare

export const bonDetailSelect = {
  id: true,
  syncedAt: true,
  data: true,
  soferId: true,
  vehiculId: true,
  sofer: { select: soferRefSelect },
  vehicul: { select: vehiculRefSelect },
  materiale: {
    select: { id: true, nrCart: true, nume: true, um: true, cantitate: true },
    orderBy: { id: "asc" },
  },
} satisfies Prisma.BonEliberareSelect;

type BonDetailRow = Prisma.BonEliberareGetPayload<{ select: typeof bonDetailSelect }>;

export const toBonDetail = ({ syncedAt, ...b }: BonDetailRow): BonDetail => ({
  ...b,
  syncedAt: syncedAt.toISOString(),
});
