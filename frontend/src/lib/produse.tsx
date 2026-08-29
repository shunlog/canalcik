import { Mark } from "@mantine/core";
import type { CategorieProduse } from "@canalcik/server/api-types";
import type { Result } from "fuzzysort";

export interface ProdusIndexat {
  cod: string;
  nume: string;
  unitate: string;
  cale: string[];
}

export function aplatizeaza(categorie: CategorieProduse, cale: string[]): ProdusIndexat[] {
  const caleCurenta = [...cale, categorie.nume];
  const produseProprii = (categorie.produse ?? []).map((p) => ({ ...p, cale: caleCurenta }));
  const produseCopii = (categorie.copii ?? []).flatMap((c) => aplatizeaza(c, caleCurenta));
  return [...produseProprii, ...produseCopii];
}

// When only one of the two keys matches, fuzzysort's Result for the other key
// carries an empty string as its `.target` rather than the original text, so
// `.highlight()` must be skipped in favor of the source value in that case.
export function evidentiaza(rezultat: Result, textOriginal: string) {
  if (rezultat.indexes.length === 0) return textOriginal;
  return rezultat.highlight((m, i) => <Mark key={i}>{m}</Mark>);
}
