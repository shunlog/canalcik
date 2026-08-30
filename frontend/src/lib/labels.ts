import type { SoferRef, VehiculRef } from "@canalcik/server/api-types";
import { plate } from "@canalcik/server/derived";

export { plate };

export const vehiculLabel = (v: VehiculRef) => `${plate(v)} — ${v.model} (inv. ${v.nrInventar})`;

export const soferLabel = (s: SoferRef) => `${s.nume} (${s.cod})`;
