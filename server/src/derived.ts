import type {
  InfoVehicul,
  PiesaSchimbInput,
  PiesaSchimbLine,
  ProdusCategorie,
  VehiculRef,
  VehiculScalars,
} from "./api-types.ts";

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

/**
 * A stored piesa line as the document consumes it. A code the catalogue no
 * longer carries leaves the two fields blank rather than failing: writes reject
 * unknown codes, so this only happens if the CSV drops a product afterwards.
 */
export const piesaCompleta = (
  linie: PiesaSchimbInput,
  produs: ProdusCategorie | undefined,
): PiesaSchimbLine => ({
  ...linie,
  piesaSchimb: produs?.nume ?? "",
  um: produs?.unitate ?? "",
});
