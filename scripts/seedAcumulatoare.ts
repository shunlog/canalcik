import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

// Seeds Acumulator (acumulatoare.csv):
//   pnpm run seed:acumulatoare
//
// Each CSV row is one physical accumulator currently installed on a vehicle,
// looked up by "Nr. Garaj". Re-running replaces a vehicle's rows, so
// importing an updated export never duplicates accumulators.

const CSV_PATH = fileURLToPath(new URL("../data_source/acumulatoare.csv", import.meta.url));

const prisma = new PrismaClient();
const warnings: string[] = [];
const warn = (msg: string) => warnings.push(msg);

// The source mostly prints "DD.MM.YYYY", including the Excel-epoch
// placeholder "30.12.1899" that a couple of vehicles carry in place of a real
// install date (alongside a blank "model acum") — same convention as
// anvelope_part1.csv. One row prints "M/D/YYYY" instead; both are accepted
// and transcribed as-is, since the table stores "YYYY-MM-DD" like every
// other date in the schema.
function toIsoDate(printed: string, where: string): string {
  const dot = printed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dot) {
    const [, d, mo, y] = dot;
    const parsed = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
    if (parsed.getUTCMonth() !== Number(mo) - 1 || parsed.getUTCDate() !== Number(d)) {
      throw new Error(`${where}: invalid date ${JSON.stringify(printed)}`);
    }
    return `${y}-${mo}-${d}`;
  }

  const slash = printed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, mo, d, y] = slash;
    const parsed = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
    if (parsed.getUTCMonth() !== Number(mo) - 1 || parsed.getUTCDate() !== Number(d)) {
      throw new Error(`${where}: invalid date ${JSON.stringify(printed)}`);
    }
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  throw new Error(`${where}: unrecognized date ${JSON.stringify(printed)}`);
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

async function seedAcumulatoare() {
  const byVehicul = new Map<
    number,
    { model: string | null; dataInstalarii: string; normaLuni: number }[]
  >();

  for (const row of readCsv(CSV_PATH)) {
    const nrGaraj = Number(row["Nr. Garaj"]);
    const where = `acumulatoare.csv, Nr. Garaj ${nrGaraj}`;
    const vehiculId = await vehiculIdByNrGaraj(nrGaraj);
    if (vehiculId === null) {
      warn(`${where}: no vehicul with this Nr. Garaj, skipped`);
      continue;
    }
    const list = byVehicul.get(vehiculId) ?? [];
    list.push({
      model: parseModel(row["model acum"]),
      dataInstalarii: toIsoDate(row["data instalarii"], where),
      normaLuni: Number(row["luni nominal"]),
    });
    byVehicul.set(vehiculId, list);
  }

  await prisma.acumulator.deleteMany({ where: { vehiculId: { in: [...byVehicul.keys()] } } });
  let n = 0;
  for (const [vehiculId, acumulatoare] of byVehicul) {
    await prisma.acumulator.createMany({ data: acumulatoare.map((a) => ({ ...a, vehiculId })) });
    n += acumulatoare.length;
  }
  console.log(`Seeded ${n} Acumulator rows for ${byVehicul.size} vehicule.`);
}

async function main() {
  await seedAcumulatoare();
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
