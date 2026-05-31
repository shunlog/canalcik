import fs from "node:fs";
import { parse } from "csv-parse/sync";

export type ParsedMaterial = {
  cod: string;
  denumire: string;
  unitateMasura: string | null;
  caleCategorie: string | null;
};

// Parses the pivot-table export at sources/categorii_produse.csv into a flat
// list of materials. The CSV has:
//   - 4 header rows (translation/pivot metadata)
//   - Category rows: col 1 = "<digits> <name>", col 2 empty
//   - Material rows: col 1 may carry the deepest category path or be empty
//                    (in which case the previous category sticks),
//                    col 2 = "<cod> - <denumire> [_ ]- <um>"
//   - "Итог" (subtotal) rows ending in "Итог" — skipped
//   - Empty material rows like " -  - " — skipped
//   - Final "Общий итог" (grand total) row — stops parsing
export function parseCategorii(path: string): ParsedMaterial[] {
  const content = fs.readFileSync(path, "utf-8");
  const rows: string[][] = parse(content, {
    skip_empty_lines: false,
    relax_column_count: true,
  });

  const materials: ParsedMaterial[] = [];
  let currentCategory: string | null = null;

  // skip the 4 header rows
  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    const col1 = (row[0] ?? "").trim();
    const col2 = (row[1] ?? "").trim();

    if (col1 === "Общий итог") break;
    if (col1.endsWith("Итог")) continue;

    // category row: col1 starts with digits and there's no material in col2
    if (col1 && /^\d+\s/.test(col1)) {
      currentCategory = col1;
    }

    if (!col2) continue;

    const material = parseMaterialString(col2);
    if (!material) continue;

    materials.push({ ...material, caleCategorie: currentCategory });
  }

  return materials;
}

// "115212 - Bara auto fata _ - buc"   → { cod: "115212", denumire: "Bara auto fata", um: "buc" }
// "120315 - Angrenaj de blocare (st) KAMAZ - buc"
// " -  - "  → null (empty placeholder)
function parseMaterialString(s: string): Omit<ParsedMaterial, "caleCategorie"> | null {
  const parts = s.split(" - ");
  if (parts.length < 3) return null;

  const cod = parts[0].trim();
  const um = parts[parts.length - 1].trim();
  const denumire = parts
    .slice(1, -1)
    .join(" - ")
    .replace(/[\s_]+$/u, "")
    .trim();

  if (!cod || !/^\d+$/.test(cod)) return null;
  if (!denumire) return null;

  return { cod, denumire, unitateMasura: um || null };
}
