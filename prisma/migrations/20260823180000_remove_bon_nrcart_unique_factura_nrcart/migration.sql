/*
  Drops BonEliberareMaterial.nrCart: a bon line's code was always unknown
  until matched against a factura at month end, so it never carried
  information the factura line didn't already have. Matching now happens by
  materialId alone.

  Adds a unique (facturaId, nrCart) constraint on FacturaExpeditieMaterial so
  that materialId is enough to resolve a match: two lines for the same
  material in one factura would otherwise be indistinguishable without the
  nrCart a bon line no longer carries.

  Hand-written: `prisma migrate dev` cannot run non-interactively to confirm
  the "you are about to drop a column with data" prompt, so this mirrors what
  it would generate — same RedefineTables convention as
  prisma/migrations/20260819210000_extract_materiale_intretinere/migration.sql.
*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BonEliberareMaterial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bonId" INTEGER NOT NULL,
    "materialId" INTEGER NOT NULL,
    "um" TEXT NOT NULL,
    "cantitate" REAL NOT NULL,
    CONSTRAINT "BonEliberareMaterial_bonId_fkey" FOREIGN KEY ("bonId") REFERENCES "BonEliberare" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BonEliberareMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MaterialeIntretinere" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BonEliberareMaterial" ("id", "bonId", "materialId", "um", "cantitate")
SELECT "id", "bonId", "materialId", "um", "cantitate" FROM "BonEliberareMaterial";
DROP TABLE "BonEliberareMaterial";
ALTER TABLE "new_BonEliberareMaterial" RENAME TO "BonEliberareMaterial";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "FacturaExpeditieMaterial_facturaId_nrCart_key" ON "FacturaExpeditieMaterial"("facturaId", "nrCart");
