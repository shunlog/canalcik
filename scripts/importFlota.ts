import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

// Loads the fleet master data (vehicles + drivers) from the CSVs exported out of
// the "Gestiune flota" Google Sheet into the Prisma database:
//   pnpm run import:flota
//
// Both CSVs are upserted on their natural keys (Vehicul.nrInventar,
// Sofer.cod), so re-running it refreshes existing rows instead of duplicating
// them. The driver↔vehicle links are rebuilt from scratch on every run: the
// soferi sheet has one row per (driver, vehicle) pair, and that sheet is the
// only source for the relation.

const VEHICULE_CSV = path.resolve("data/sources/gestiune_flota_vehicule.csv");
const SOFERI_CSV = path.resolve("data/sources/gestiune_flota_soferi.csv");

// Placeholder plate used in the soferi sheet for "no vehicle assigned".
const NO_VEHICLE = ["XXX", "999"];

const prisma = new PrismaClient();
const warnings: string[] = [];

function warn(msg: string) {
  warnings.push(msg);
}

// The sheets have duplicate header names ("Nr. înmatriculare" three times), so
// rows are read positionally and columns referenced by index.
function readRows(file: string): string[][] {
  const rows: string[][] = parse(fs.readFileSync(file), {
    bom: true,
    skipEmptyLines: true,
    relaxColumnCount: true,
  });
  return rows.slice(1); // drop the header row
}

const text = (v: string | undefined): string | null => {
  const s = (v ?? "").trim();
  return s === "" ? null : s;
};

function int(v: string | undefined, where: string): number | null {
  const s = text(v);
  if (s === null) return null;
  const n = Number(s.replace(/\s/g, ""));
  if (!Number.isInteger(n)) {
    warn(`${where}: not a whole number, imported as empty — ${JSON.stringify(s)}`);
    return null;
  }
  return n;
}

// Cells come in as "M/D/YYYY" (Sheets' US export) or "DD.MM.YYYY" (hand-typed).
// Empty, "NU E NEVOE" (not needed), "#VALUE!" and the 1900-epoch zero dates
// Excel leaves behind all mean "no date".
function date(v: string | undefined, where: string): Date | null {
  const s = text(v);
  if (s === null || /^#/.test(s) || /^nu e nevo/i.test(s)) return null;

  let y: number, m: number, d: number;
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const dot = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (slash) [, m, d, y] = slash.map(Number) as unknown as number[];
  else if (dot) [, d, m, y] = dot.map(Number) as unknown as number[];
  else {
    warn(`${where}: unrecognized date, imported as empty — ${JSON.stringify(s)}`);
    return null;
  }

  if (y < 1950) return null; // Excel epoch leftovers, e.g. 12/30/1904
  const parsed = new Date(Date.UTC(y, m - 1, d));
  if (parsed.getUTCMonth() !== m - 1 || parsed.getUTCDate() !== d) {
    warn(`${where}: invalid date, imported as empty — ${JSON.stringify(s)}`);
    return null;
  }
  return parsed;
}

// Columns of gestiune_flota_vehicule.csv
const V = {
  nrGaraj: 0,
  destinatia: 1,
  model: 2,
  litere: 3,
  cifre: 4,
  // 5 is a third "Nr. înmatriculare" column, a hand-written display form
  // ("M 040 RZ") that disagrees with litere+cifre on a dozen rows — ignored.
  nrInventar: 6,
  anFabricatie: 7,
  kmActuali: 8,
  sector: 9,
  // 10 is "Șofer curent", free text naming the assigned drivers — the
  // relation is built from the soferi sheet instead, so it is ignored.
  utilajeAuxiliare: 11,
  lucrari: 12,
} as const;

// Columns of gestiune_flota_soferi.csv
const S = {
  nume: 0,
  cod: 1,
  functie: 2,
  telefon: 3,
  litere: 4,
  cifre: 5,
  sector: 6,
  marimeHaina: 7,
  marimeIncaltaminte: 8,
  scurta: 9,
  incaltaminte: 10,
  costum: 11,
  pantaloni: 12,
  vestaAvertizare: 13,
  // 14..18 are the computed "Urm. <item>" columns, 19 the computed "EIP complet?"
  observatii: 20,
} as const;

async function importVehicule() {
  const rows = readRows(VEHICULE_CSV);
  // Maps "litere|cifre" (how the soferi sheet points at a vehicle) to the row id.
  const byPlate = new Map<string, number>();

  for (const [i, row] of rows.entries()) {
    const where = `vehicule.csv:${i + 2}`;
    const nrInventar = int(row[V.nrInventar], `${where} Nr. Inventar`);
    const nrGaraj = int(row[V.nrGaraj], `${where} Nr. Garaj`);
    const litere = text(row[V.litere]);
    const cifre = text(row[V.cifre]);
    const tip = text(row[V.destinatia]);
    const model = text(row[V.model]);

    if (nrInventar === null || nrGaraj === null || !litere || !cifre || !tip || !model) {
      warn(`${where}: skipped, missing a required field`);
      continue;
    }

    const data = {
      litere,
      cifre,
      nrGaraj,
      tip,
      model,
      anProducere: int(row[V.anFabricatie], `${where} An fabricație`),
      kmActuali: int(row[V.kmActuali], `${where} Km actuali`),
      sector: text(row[V.sector]),
      utilajeAuxiliare: text(row[V.utilajeAuxiliare]),
      lucrariLunaViitoare: text(row[V.lucrari]),
      syncedAt: new Date(),
    };

    const vehicul = await prisma.vehicul.upsert({
      where: { nrInventar },
      create: { nrInventar, ...data },
      update: data,
    });
    byPlate.set(`${litere}|${cifre}`, vehicul.id);
  }

  console.log(`Vehicule: ${byPlate.size} of ${rows.length} rows imported`);
  return byPlate;
}

async function importSoferi(byPlate: Map<string, number>) {
  const rows = readRows(SOFERI_CSV);
  // One driver can appear on several rows, one per assigned vehicle.
  const vehiculeByCod = new Map<number, Set<number>>();
  const seen = new Set<number>();

  for (const [i, row] of rows.entries()) {
    const where = `soferi.csv:${i + 2}`;
    const cod = int(row[S.cod], `${where} Nr. de pontaj`);
    const nume = text(row[S.nume]);
    if (cod === null || !nume) {
      warn(`${where}: skipped, missing "Nume Prenume" or "Nr. de pontaj"`);
      continue;
    }

    if (!seen.has(cod)) {
      const data = {
        nume,
        functie: text(row[S.functie]),
        telefon: text(row[S.telefon]),
        sector: text(row[S.sector]),
        marimeHaina: text(row[S.marimeHaina]),
        marimeIncaltaminte: text(row[S.marimeIncaltaminte]),
        observatii: text(row[S.observatii]),
        eipScurta: date(row[S.scurta], `${where} Scurtă`),
        eipIncaltaminte: date(row[S.incaltaminte], `${where} Încălțăminte`),
        eipCostum: date(row[S.costum], `${where} Costum`),
        eipPantaloni: date(row[S.pantaloni], `${where} Pantaloni`),
        eipVestaAvertizare: date(row[S.vestaAvertizare], `${where} Vestă avertizare`),
        syncedAt: new Date(),
      };
      await prisma.sofer.upsert({
        where: { cod },
        create: { cod, ...data },
        update: data,
      });
      seen.add(cod);
      vehiculeByCod.set(cod, new Set());
    }

    const litere = text(row[S.litere]);
    const cifre = text(row[S.cifre]);
    if (!litere || !cifre) continue;
    if (litere === NO_VEHICLE[0] && cifre === NO_VEHICLE[1]) continue; // no vehicle assigned

    const vehiculId = byPlate.get(`${litere}|${cifre}`);
    if (vehiculId === undefined) {
      warn(`${where}: vehicle "${litere} ${cifre}" is not in vehicule.csv, link skipped`);
      continue;
    }
    vehiculeByCod.get(cod)!.add(vehiculId);
  }

  // Rewrite the links so vehicles dropped from the sheet stop being assigned.
  let links = 0;
  for (const [cod, vehiculIds] of vehiculeByCod) {
    await prisma.sofer.update({
      where: { cod },
      data: { vehicule: { set: [...vehiculIds].map((id) => ({ id })) } },
    });
    links += vehiculIds.size;
  }

  console.log(`Șoferi: ${seen.size} imported from ${rows.length} rows, ${links} vehicle links`);
}

async function main() {
  const byPlate = await importVehicule();
  await importSoferi(byPlate);

  if (warnings.length) {
    console.warn(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.warn(`  ${w}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
