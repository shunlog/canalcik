import "dotenv/config";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";
import type { FacturaExpeditie } from "./facturaExpeditieTypes.ts";

// Seeds the database with a "factura de expeditie" from a data file, e.g.:
//   pnpm run seed:factura -- scripts/facturi/2026-09.ts
//
// Re-running replaces the factura for the same month rather than duplicating
// it — FacturaExpeditie.month is unique, one factura per month. The
// MaterialeIntretinere rows the lines point at are reused when they already
// exist and are never deleted — the catalogue outlives the facturi.

const prisma = new PrismaClient();

async function loadFactura(filePath: string): Promise<FacturaExpeditie> {
  const module = await import(pathToFileURL(path.resolve(filePath)).href);
  return module.default as FacturaExpeditie;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: pnpm run seed:factura -- <path-to-factura-file>");
    process.exitCode = 1;
    return;
  }

  const { data, totalTiparit, linii } = await loadFactura(filePath);
  const month = data.slice(0, 7);

  const total = linii.reduce((sum, l) => sum + l.cantitate * l.pretUnitar, 0);
  if (Math.abs(total - totalTiparit) > 0.05) {
    console.warn(
      `Total calculat ${total.toFixed(2)} diferă de totalul tipărit pe factură ${totalTiparit.toFixed(2)}`,
    );
  }

  await prisma.facturaExpeditie.deleteMany({ where: { month } });
  const factura = await prisma.facturaExpeditie.create({
    data: {
      data,
      month,
      materiale: {
        create: linii.map(({ nume, ...line }) => ({
          ...line,
          // Same connectOrCreate-by-nume pattern as routes/facturi.ts and
          // seedBonuri.ts: the catalogue fills itself in as the factura names
          // things, matched exactly.
          material: { connectOrCreate: { where: { nume }, create: { nume } } },
        })),
      },
    },
    include: { materiale: true },
  });

  console.log(`Seeded factura (id ${factura.id}) for ${month} with ${factura.materiale.length} lines.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
