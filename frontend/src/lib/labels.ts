import type { SoferRef, VehiculRef } from "@canalcik/server/api-types";

export const vehiculLabel = (v: VehiculRef) =>
  `${v.nrInmatriculare} — ${v.model} (inv. ${v.nrInventar})`;

export const vehiculShortLabel = (v: VehiculRef) => v.nrInmatriculare;

export const soferLabel = (s: SoferRef) => `${s.nume} (${s.cod})`;
