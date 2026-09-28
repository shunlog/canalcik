import type { SoferListItem, VehiculListItem } from "@canalcik/server/api-types";
import { useMemo } from "react";
import { soferLabel, vehiculLabel } from "../lib/labels.ts";
import { useSoferi } from "./soferi.ts";
import { useVehicule } from "./vehicule.ts";

export interface CoupledField {
  options: { value: string; label: string }[];
  /** Undefined while unfiltered, so no dimmed line takes up space. */
  description: string | undefined;
  nothingFoundMessage: string;
}

export interface SoferVehiculCoupling {
  soferi: SoferListItem[];
  vehicule: VehiculListItem[];
  sofer: CoupledField;
  vehicul: CoupledField;
}

/**
 * Soferii and vehiculele are linked many-to-many. Once either side is picked,
 * the other is narrowed to what is linked to it, while the current value stays
 * visible even if it isn't linked — older records can hold such a pair.
 * (Keep in sync with "Filter related inputs" in CLAUDE.md.)
 */
export function useSoferVehiculCoupling({
  soferId,
  vehiculId,
}: {
  soferId: string | null;
  vehiculId: string | null;
}): SoferVehiculCoupling {
  const soferi = useSoferi();
  const vehicule = useVehicule();

  const allSoferi = soferi.data ?? [];
  const allVehicule = vehicule.data ?? [];

  const soferOptions = useMemo(() => {
    const id = vehiculId === null ? null : Number(vehiculId);
    return allSoferi
      .filter((s) => id === null || s.vehiculIds.includes(id) || String(s.id) === soferId)
      .map((s) => ({ value: String(s.id), label: soferLabel(s) }));
  }, [allSoferi, vehiculId, soferId]);

  const vehiculOptions = useMemo(() => {
    const id = soferId === null ? null : Number(soferId);
    return allVehicule
      .filter((v) => id === null || v.soferIds.includes(id) || String(v.id) === vehiculId)
      .map((v) => ({ value: String(v.id), label: vehiculLabel(v) }));
  }, [allVehicule, soferId, vehiculId]);

  return {
    soferi: allSoferi,
    vehicule: allVehicule,
    sofer: {
      options: soferOptions,
      description: vehiculId === null ? undefined : "Filtrat după vehiculul selectat",
      nothingFoundMessage:
        vehiculId === null ? "Niciun rezultat" : "Niciun șofer legat de acest vehicul",
    },
    vehicul: {
      options: vehiculOptions,
      description: soferId === null ? undefined : "Filtrat după șoferul selectat",
      nothingFoundMessage:
        soferId === null ? "Niciun rezultat" : "Niciun vehicul legat de acest șofer",
    },
  };
}
