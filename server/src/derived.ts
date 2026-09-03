import type { InfoSofer, InfoVehicul, SoferRef, VehiculRef, VehiculScalars } from "./api-types.ts";

// Fields no table stores, because another row already answers for them. Shared
// with the frontend (@canalcik/server/derived) so the form previews exactly what
// the document will print, from one definition rather than two.

/** "MRZ 40" — the plate as the documents print it, from its two stored halves. */
export const plate = (v: Pick<VehiculRef, "litere" | "cifre">) => `${v.litere} ${v.cifre}`;

type VehiculInfoSursa = Pick<
  VehiculScalars,
  "litere" | "cifre" | "nrInventar" | "tip" | "model" | "anProducere"
>;

/** The act's "Informatie activ" block, read off the vehicul it names. */
export const infoVehicul = (v: VehiculInfoSursa): InfoVehicul => ({
  nrInventar: String(v.nrInventar),
  nrInregistrare: plate(v),
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
