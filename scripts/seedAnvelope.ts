import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

// Seeds AnvelopaLuni (anvelope_part1.csv, month-based tires) and AnvelopaKm
// (anvelope_part2.csv, distance-based tires):
//   pnpm run seed:anvelope
//
// Each CSV row is one physical tire currently mounted on a vehicle, looked up
// by "Nr. Garaj". Re-running replaces a vehicle's rows in the table its CSV
// feeds (deleted and reinserted from that file), so importing an updated
// export never duplicates tires.

const PART1_PATH = fileURLToPath(new URL("../data_source/anvelope_part1.csv", import.meta.url));
const PART2_PATH = fileURLToPath(new URL("../data_source/anvelope_part2.csv", import.meta.url));

const prisma = new PrismaClient();
const warnings: string[] = [];
const warn = (msg: string) => warnings.push(msg);

// The source prints "DD.MM.YYYY", including the Excel-epoch placeholder
// "31.12.1899" that a few part1 vehicles carry in place of a real install
// date (alongside a blank "model anvelopa"). Transcribed as-is — the table
// stores "YYYY-MM-DD" like every other date in the schema.
function toIsoDate(printed: string, where: string): string {
  const m = printed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) throw new Error(`${where}: unrecognized date ${JSON.stringify(printed)}`);
  const [, d, mo, y] = m;
  const parsed = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  if (parsed.getUTCMonth() !== Number(mo) - 1 || parsed.getUTCDate() !== Number(d)) {
    throw new Error(`${where}: invalid date ${JSON.stringify(printed)}`);
  }
  return `${y}-${mo}-${d}`;
}

function readCsv(path: string): Record<string, string>[] {
  const csv = readFileSync(path, "utf-8");
  return parse(csv, { columns: true, skip_empty_lines: true, trim: true });
}

const vehiculIdCache = new Map<number, number | null>();
async function vehiculIdByNrGaraj(nrGaraj: number): Promise<number | null> {
  if (!vehiculIdCache.has(nrGaraj)) {
    const v = await prisma.vehicul.findUnique({ where: { nrGaraj }, select: { id: true } });
    vehiculIdCache.set(nrGaraj, v?.id ?? null);
  }
  return vehiculIdCache.get(nrGaraj)!;
}

const parseModel = (raw: string): string | null => (raw.trim() === "" ? null : raw.trim());

async function seedLuni() {
  const byVehicul = new Map<
    number,
    { model: string | null; dataInstalarii: string; normaLuni: number }[]
  >();

  for (const row of readCsv(PART1_PATH)) {
    const nrGaraj = Number(row["Nr. Garaj"]);
    const where = `anvelope_part1.csv, Nr. Garaj ${nrGaraj}`;
    const vehiculId = await vehiculIdByNrGaraj(nrGaraj);
    if (vehiculId === null) {
      warn(`${where}: no vehicul with this Nr. Garaj, skipped`);
      continue;
    }
    const list = byVehicul.get(vehiculId) ?? [];
    list.push({
      model: parseModel(row["model anvelopa"]),
      dataInstalarii: toIsoDate(row["data instalarii"], where),
      normaLuni: Number(row["luni nominal"]),
    });
    byVehicul.set(vehiculId, list);
  }

  await prisma.anvelopaLuni.deleteMany({ where: { vehiculId: { in: [...byVehicul.keys()] } } });
  let n = 0;
  for (const [vehiculId, anvelope] of byVehicul) {
    await prisma.anvelopaLuni.createMany({ data: anvelope.map((a) => ({ ...a, vehiculId })) });
    n += anvelope.length;
  }
  console.log(`Seeded ${n} AnvelopaLuni rows for ${byVehicul.size} vehicule.`);
}

async function seedKm() {
  const byVehicul = new Map<
    number,
    { model: string | null; dataInstalarii: string; kmInstalare: number; normaKm: number }[]
  >();

  for (const row of readCsv(PART2_PATH)) {
    const nrGaraj = Number(row["Nr. Garaj"]);
    const where = `anvelope_part2.csv, Nr. Garaj ${nrGaraj}`;
    const vehiculId = await vehiculIdByNrGaraj(nrGaraj);
    if (vehiculId === null) {
      warn(`${where}: no vehicul with this Nr. Garaj, skipped`);
      continue;
    }
    const list = byVehicul.get(vehiculId) ?? [];
    list.push({
      model: parseModel(row["model anvelopa"]),
      dataInstalarii: toIsoDate(row["data instalarii"], where),
      kmInstalare: Number(row["Km la instalare"]),
      normaKm: Number(row["norma de uzura"]),
      // "kilometraj actual schimb" is not stored — it repeats Vehicul.kmActuali
      // on every row and is resolved on read instead, see server/src/derived.ts.
    });
    byVehicul.set(vehiculId, list);
  }

  await prisma.anvelopaKm.deleteMany({ where: { vehiculId: { in: [...byVehicul.keys()] } } });
  let n = 0;
  for (const [vehiculId, anvelope] of byVehicul) {
    await prisma.anvelopaKm.createMany({ data: anvelope.map((a) => ({ ...a, vehiculId })) });
    n += anvelope.length;
  }
  console.log(`Seeded ${n} AnvelopaKm rows for ${byVehicul.size} vehicule.`);
}

async function main() {
  await seedLuni();
  await seedKm();
  if (warnings.length > 0) {
    console.warn(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.warn(`  - ${w}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
