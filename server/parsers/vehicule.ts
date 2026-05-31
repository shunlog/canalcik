import fs from "node:fs";
import { parse } from "csv-parse/sync";

export type ParsedVehicul = {
  tip: string;            // Destinatia
  model: string;          // Marcă / Model
  nrInmatriculare: string;
  nrInventar: number;
  anProducere: number | null;
  drivers: string[];      // names from "Șofer curent", split on "/"
};

// Columns in sources/gestiune_flota_vehicule.csv (after one header row):
//   0  Nr. Garaj
//   1  Destinatia                   → tip
//   2  Marcă / Model                → model
//   3  Nr. înmatriculare (prefix)
//   4  Nr. înmatriculare (number)
//   5  Nr. înmatriculare (combined) → nrInmatriculare
//   6  Nr. Inventar                 → nrInventar
//   7  An fabricație                → anProducere
//   8  Km actuali
//   9  (p63 — location)
//  10  Șofer curent                 → drivers (split on "/")
//  11+ ...                          → ignored
export function parseVehicule(path: string): ParsedVehicul[] {
  const content = fs.readFileSync(path, "utf-8");
  const rows: string[][] = parse(content, {
    skip_empty_lines: true,
    from_line: 2, // drop the header
    relax_column_count: true,
  });

  const vehicles: ParsedVehicul[] = [];
  for (const row of rows) {
    const tip = (row[1] ?? "").trim();
    const model = (row[2] ?? "").trim();
    const nrInmatriculare = (row[5] ?? "").trim();
    const nrInventarStr = (row[6] ?? "").trim();
    const anStr = (row[7] ?? "").trim();
    const soferStr = (row[10] ?? "").trim();

    if (!nrInmatriculare || !nrInventarStr) continue;

    const nrInventar = Number(nrInventarStr);
    if (!Number.isFinite(nrInventar)) continue;

    const anProducere = anStr && /^\d+$/.test(anStr) ? Number(anStr) : null;

    const drivers = soferStr
      ? soferStr
          .split("/")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    vehicles.push({ tip, model, nrInmatriculare, nrInventar, anProducere, drivers });
  }

  return vehicles;
}
