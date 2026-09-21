import type { InfoSofer, InfoVehicul, SoferRef, VehiculRef, VehiculScalars } from "./api-types.ts";

// Fields no table stores, because another row already answers for them. Shared
// with the frontend (@canalcik/server/derived) so the form previews exactly what
// the document will print, from one definition rather than two.

// EIP validity is a business rule, rather than data belonging to a particular
// driver. Keep it here so both the API and the driver form use the same source
// of truth without persisting calculated expiry dates.
export const EIP_EXPIRY_MONTHS = {
  eipScurta: 36,
  eipIncaltaminte: 18,
  eipCostum: 12,
  eipPantaloni: 36,
  eipVestaAvertizare: null,
} as const;

export type EipEquipmentField = keyof typeof EIP_EXPIRY_MONTHS;

export const EIP_EQUIPMENT_FIELDS = Object.keys(EIP_EXPIRY_MONTHS) as EipEquipmentField[];

/**
 * Adds the equipment's calendar-month validity to an ISO calendar date.
 * The day is capped at the end of the target month (e.g. 29 February + 12
 * months is 28 February the following year), rather than overflowing into it.
 */
export const eipExpiryDate = (
  issueDate: string | null | undefined,
  equipment: EipEquipmentField,
): string | null => {
  const months = EIP_EXPIRY_MONTHS[equipment];
  if (!issueDate || months === null) return null;

  const [year, month, day] = issueDate.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const targetYear = target.getUTCFullYear();
  const targetMonth = target.getUTCMonth();
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();

  return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(
    Math.min(day, lastDay),
  ).padStart(2, "0")}`;
};

type VehiculInfoSursa = Pick<
  VehiculScalars,
  "nrInmatriculare" | "nrInventar" | "tip" | "model" | "anProducere"
>;

/** The act's "Informatie activ" block, read off the vehicul it names. */
export const infoVehicul = (v: VehiculInfoSursa): InfoVehicul => ({
  nrInventar: String(v.nrInventar),
  nrInregistrare: v.nrInmatriculare,
  denumireVehicul: `${v.tip} ${v.model}`,
  anProducerii: v.anProducere?.toString() ?? "",
});

// "Sofer" for a vehicle that is driven, "Masinist" for one that is operated —
// the fleet's `tip` decides, so the act prints the right word without anyone
// picking it. A type the map doesn't carry falls back to "Sofer".
const FUNCTIA_SOFER = "Șofer";
const FUNCTIA_MASINIST = "Mașinist";
const functiaDupaTip: Record<string, string> = {
  Autocamion: FUNCTIA_SOFER,
  Automacara: FUNCTIA_SOFER,
  Autoturn: FUNCTIA_SOFER,
  Bara: FUNCTIA_MASINIST,
  Basculantă: FUNCTIA_SOFER,
  Duldozer: FUNCTIA_MASINIST,
  Excavatoare: FUNCTIA_MASINIST,
  Furgon: FUNCTIA_SOFER,
  Manipulator: FUNCTIA_SOFER,
  Pompă: FUNCTIA_MASINIST,
  Remorcă: FUNCTIA_MASINIST,
  Tractor: FUNCTIA_MASINIST,
  Încărcător: FUNCTIA_MASINIST,
};

/** The act's "Avizat" line: the sofer it names, and what to call them. */
export const infoSofer = (
  sofer: Pick<SoferRef, "nume">,
  vehicul: Pick<VehiculRef, "tip">,
): InfoSofer => ({
  numeSofer: sofer.nume,
  functiaSofer: functiaDupaTip[vehicul.tip] ?? FUNCTIA_SOFER,
});

// --------------------------------------------------------------- anvelope

const ymAdd = (iso: string, months: number): { y: number; m: number } => {
  const [y, m] = iso.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  return { y: Math.floor(total / 12), m: (total % 12) + 1 };
};

/**
 * Whole months left before a month-based tire's replacement is due; negative
 * once it's overdue. Calendar-month granularity, matching `normaLuni`'s own
 * unit — the day of the month is not weighed.
 */
export const luniRamase = (dataInstalarii: string, normaLuni: number, today: string): number => {
  const target = ymAdd(dataInstalarii, normaLuni);
  const [ty, tm] = today.split("-").map(Number);
  return target.y * 12 + target.m - (ty * 12 + tm);
};

/** Km left before a distance-based tire's replacement is due; negative once overdue. */
export const kmRamasi = (kmInstalare: number, normaKm: number, kmActuali: number): number =>
  kmInstalare + normaKm - kmActuali;

/** Wear, 0-100+ — how much of the tire's norm has been driven since install. */
export const procenteUzura = (kmInstalare: number, normaKm: number, kmActuali: number): number =>
  Math.round(((kmActuali - kmInstalare) / normaKm) * 100);
