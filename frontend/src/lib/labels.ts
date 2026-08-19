import type { SoferRef, VehiculRef } from "@canalcik/server/api-types";

export const plate = (v: Pick<VehiculRef, "litere" | "cifre">) => `${v.litere} ${v.cifre}`;

export const vehiculLabel = (v: VehiculRef) => `${plate(v)} — ${v.model} (inv. ${v.nrInventar})`;

export const soferLabel = (s: SoferRef) => `${s.nume} (${s.cod})`;
