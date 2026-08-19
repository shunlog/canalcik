import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Seeds the database with demo "bonuri de eliberare", transcribed from the
// Mai 2026 "fisa-limita" PDFs (one per vehicle):
//   pnpm run seed:bonuri
//
// A fisa-limita is the monthly roll-up of one vehicle's issue slips, so each
// PDF row is one bon line and rows sharing a date belong to the same bon. The
// slips carry the driver's pontaj code and the vehicle's inventory number
// alongside their names, so those are the lookup keys — the printed names are
// only checked against the database and reported when they disagree (the PDFs
// spell out "Goreanu Anatolie" where the fleet sheet has "Goreanu Anatol").
//
// Re-running replaces the bonuri of the (sofer, vehicul, data) triples it
// seeds rather than duplicating them; other bonuri are left alone. The
// MaterialeIntretinere rows the lines point at are reused when they already
// exist and are never deleted — the catalogue outlives the bonuri.

type FisaRow = {
  data: string; // as printed, "DD.MM.YYYY"
  nrCart: string;
  nume: string;
  um: string;
  cantitate: number;
};

type Fisa = {
  // Printed on the slip; the codes are the lookup keys, the names a check.
  nrInventar: number;
  vehicul: string;
  cod: number;
  sofer: string;
  rows: FisaRow[];
};

const FISE: Fisa[] = [
  {
    nrInventar: 45251200,
    vehicul: "CBE 276",
    cod: 8981,
    sofer: "Apavaloae Gheorghe",
    rows: [
      { data: "26.05.2026", nrCart: "2111121795", nume: "LICHID DE FRANA DOT-4", um: "L", cantitate: 2 },
      { data: "22.05.2026", nrCart: "2112210775", nume: "UNSOARE LITOL-24", um: "KG", cantitate: 3 },
      { data: "04.05.2026", nrCart: "2111017178", nume: "ANTIGEL ALBASTRU -40C", um: "L", cantitate: 5 },
      { data: "18.05.2026", nrCart: "2112210834", nume: "ULEI MOTOR DIZEL M10G2K", um: "L", cantitate: 12 },
      { data: "22.05.2026", nrCart: "2112210848", nume: "ULEI INDUSTRIAL I-40", um: "L", cantitate: 13 },
    ],
  },
  {
    nrInventar: 45325700,
    vehicul: "CBE 284",
    cod: 8913,
    sofer: "Goreanu Anatolie",
    rows: [
      { data: "18.05.2026", nrCart: "2112210848", nume: "ULEI INDUSTRIAL I-40", um: "L", cantitate: 5 },
      { data: "18.05.2026", nrCart: "2112210860", nume: "ULEI 15W40 SG/SD MAXIMUM GUARDMAX", um: "L", cantitate: 5 },
    ],
  },
  {
    nrInventar: 41333100,
    vehicul: "329 TBN",
    cod: 8222,
    sofer: "Matei Fiodor",
    rows: [
      { data: "04.05.2026", nrCart: "2112210737", nume: "ULEI MOTOR 10W40 CI-4/SL", um: "L", cantitate: 5 },
    ],
  },
  {
    nrInventar: 50055500,
    vehicul: "CHN 349",
    cod: 8988,
    sofer: "David Ivan",
    rows: [
      { data: "05.05.2026", nrCart: "2112210812", nume: "ULEI MOTOR 10W40 DIZEL SEMISINTETIC", um: "L", cantitate: 5 },
    ],
  },
  {
    nrInventar: 42492600,
    vehicul: "437 CA",
    cod: 9492,
    sofer: "Zatic Valeriu",
    rows: [
      { data: "05.05.2026", nrCart: "2112210848", nume: "ULEI INDUSTRIAL I-40", um: "L", cantitate: 25 },
      { data: "05.05.2026", nrCart: "2112210834", nume: "ULEI MOTOR DIZEL M10G2K", um: "L", cantitate: 25 },
    ],
  },
];

const prisma = new PrismaClient();
const warnings: string[] = [];

function warn(msg: string) {
  warnings.push(msg);
}

// The slips print "DD.MM.YYYY"; BonEliberare.data is a "YYYY-MM-DD" calendar
// string, same convention as Sofer's EIP dates.
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

// Names are compared loosely — the slips and the fleet sheet differ in
// diacritics, spacing and the odd name ending — so only real mismatches warn.
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

async function main() {
  let bonuri = 0;
  let linii = 0;

  for (const fisa of FISE) {
    const where = `fisa ${fisa.vehicul}`;

    const vehicul = await prisma.vehicul.findUnique({
      where: { nrInventar: fisa.nrInventar },
      select: { id: true, litere: true, cifre: true },
    });
    if (!vehicul) {
      warn(`${where}: no vehicul with nrInventar ${fisa.nrInventar}, skipped`);
      continue;
    }
    const plate = `${vehicul.litere} ${vehicul.cifre}`;
    if (normalize(plate) !== normalize(fisa.vehicul) && normalize(`${vehicul.cifre} ${vehicul.litere}`) !== normalize(fisa.vehicul)) {
      warn(`${where}: plate on the slip differs from the database — ${plate}`);
    }

    const sofer = await prisma.sofer.findUnique({
      where: { cod: fisa.cod },
      select: { id: true, nume: true },
    });
    if (!sofer) {
      warn(`${where}: no sofer with cod ${fisa.cod}, skipped`);
      continue;
    }
    if (normalize(sofer.nume) !== normalize(fisa.sofer)) {
      warn(`${where}: name on the slip differs from the database — ${sofer.nume}`);
    }

    // Rows sharing a date were handed over together, so they form one bon.
    const perDate = new Map<string, FisaRow[]>();
    for (const row of fisa.rows) {
      const data = toIsoDate(row.data, `${where}, ${row.nume}`);
      const rows = perDate.get(data) ?? [];
      rows.push(row);
      perDate.set(data, rows);
    }

    for (const [data, rows] of [...perDate].sort(([a], [b]) => a.localeCompare(b))) {
      await prisma.bonEliberare.deleteMany({
        where: { soferId: sofer.id, vehiculId: vehicul.id, data },
      });
      await prisma.bonEliberare.create({
        data: {
          data,
          soferId: sofer.id,
          vehiculId: vehicul.id,
          materiale: {
            create: rows.map(({ nrCart, nume, um, cantitate }) => ({
              nrCart,
              um,
              cantitate,
              // The material name is a reference now, so the catalogue fills
              // itself in as the slips name things — same as a bon written in
              // the app. Names are matched exactly, so the spelling in FISE is
              // what ends up in MaterialeIntretinere.
              material: { connectOrCreate: { where: { nume }, create: { nume } } },
            })),
          },
        },
      });
      bonuri++;
      linii += rows.length;
    }
  }

  const materiale = await prisma.materialeIntretinere.count();
  console.log(
    `Seeded ${bonuri} bonuri with ${linii} lines from ${FISE.length} fise; ` +
      `${materiale} materiale in the catalogue.`,
  );
  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  - ${w}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
