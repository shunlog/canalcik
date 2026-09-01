import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import type { CategorieProduse } from "./api-types.ts";

const CSV_PATH = fileURLToPath(new URL("../../data_source/categorii_produse.csv", import.meta.url));

// Every leaf-category row in the pivot export repeats this fixed dimension
// label before the actual category name, e.g.
// "50010101 Piese/accesorii vehicule, Bara auto fata".
const LEAF_PREFIX = "Piese/accesorii vehicule, ";

/**
 * Parses data_source/categorii_produse.csv — an Excel pivot-table export —
 * into the category tree the frontend renders. The row label column nests
 * four levels by code length (2/4/6/8 digits); the file has a single 2-digit
 * root ("50 Piese si accesorii pt vehicule") covering everything, so it is
 * dropped and the 4-digit categories become the top level. Each pivot
 * category also gets an auto-generated "Итог" (subtotal) row and the file
 * ends with an "Общий итог" (grand total) row — both carry no data and are
 * skipped.
 */
export function loadCategoriiProduse(): CategorieProduse[] {
  const csv = readFileSync(CSV_PATH, "utf-8");
  const rows: string[][] = parse(csv, { relax_column_count: true });

  const radacini: CategorieProduse[] = [];
  let categorie4: CategorieProduse | null = null;
  let categorie6: CategorieProduse | null = null;
  let categorie8: CategorieProduse | null = null;

  for (const [rawCol1, rawCol2] of rows) {
    const col1 = (rawCol1 ?? "").trim();
    const col2 = (rawCol2 ?? "").trim();

    if (col1 === "") {
      // A continuation row: another product under the current leaf category.
      if (categorie8 && col2 !== "") adaugaProdus(categorie8, col2);
      continue;
    }
    if (col1.endsWith("Итог")) continue;

    const potrivire = col1.match(/^(\d+)\s+(.*)$/);
    if (!potrivire) continue; // pivot-table title/header rows above the data
    const [, cod, rest] = potrivire;

    switch (cod.length) {
      case 4:
        categorie4 = { nume: rest };
        radacini.push(categorie4);
        categorie6 = null;
        categorie8 = null;
        break;
      case 6:
        if (!categorie4) continue;
        categorie6 = { nume: rest };
        (categorie4.copii ??= []).push(categorie6);
        categorie8 = null;
        break;
      case 8: {
        if (!categorie6) continue;
        const nume = rest.startsWith(LEAF_PREFIX) ? rest.slice(LEAF_PREFIX.length) : rest;
        categorie8 = { nume };
        (categorie6.copii ??= []).push(categorie8);
        if (col2 !== "") adaugaProdus(categorie8, col2);
        break;
      }
      // The 2-digit root and anything else are not part of the tree.
    }
  }

  return radacini;
}

// A product cell reads "<cod> - <nume> - <unitate>", e.g.
// "115212 - Bara auto fata _ - buc". A leaf category with no real products
// carries a placeholder cell instead, e.g. " -  - " (cod "-", no nume).
function adaugaProdus(categorie: CategorieProduse, raw: string) {
  const parti = raw.split(" - ");
  if (parti.length < 3) return;
  const cod = parti[0].trim();
  const unitate = parti[parti.length - 1].trim();
  const nume = parti.slice(1, -1).join(" - ").trim();
  if (cod === "-" || nume === "") return;
  (categorie.produse ??= []).push({ cod, nume, unitate });
}

// Parsed once on first use: the source CSV does not change at runtime.
let categorii: CategorieProduse[] | null = null;

export const categoriiProduse = (): CategorieProduse[] => (categorii ??= loadCategoriiProduse());
