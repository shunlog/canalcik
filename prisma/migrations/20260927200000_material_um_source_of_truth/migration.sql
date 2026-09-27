/*
  MaterialeIntretinere becomes the single source of truth for a material's
  unit of measure: `um` moves onto it, and is removed from both
  BonEliberareMaterial (which had its own free-typed `um` per line) and
  FacturaExpeditieMaterial (which also duplicated `nrCart` — already the
  material's own identity, so that goes too, leaving `materialId` as the only
  link). Every material in the dev DB currently agrees on its own unit across
  every bon and factura line naming it, so the backfill below is unambiguous.

  Hand-written, same reason as the other migrations here: SQLite's lack of
  ALTER TABLE ... ALTER COLUMN / DROP COLUMN forces a table rebuild for each of
  the three tables, which `prisma migrate dev` cannot script without a
  data-loss prompt.
*/

-- Step 1: add MaterialeIntretinere.um, nullable for now so it can be backfilled.
ALTER TABLE "MaterialeIntretinere" ADD COLUMN "um" TEXT;

-- Backfill from whichever line named it first — a factura line if one exists
-- (a material is always named by a factura before it can be delivered),
-- otherwise a bon line's own `um`, for any material added straight from a bon.
UPDATE "MaterialeIntretinere"
SET "um" = COALESCE(
  (SELECT "um" FROM "FacturaExpeditieMaterial" WHERE "materialId" = "MaterialeIntretinere"."id" LIMIT 1),
  (SELECT "um" FROM "BonEliberareMaterial" WHERE "materialId" = "MaterialeIntretinere"."id" LIMIT 1)
);

-- Step 2: rebuild MaterialeIntretinere with `um` NOT NULL.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MaterialeIntretinere" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nume" TEXT NOT NULL,
    "nrCart" TEXT NOT NULL,
    "um" TEXT NOT NULL
);
INSERT INTO "new_MaterialeIntretinere" ("id", "updatedAt", "nume", "nrCart", "um")
SELECT "id", "updatedAt", "nume", "nrCart", "um" FROM "MaterialeIntretinere";
DROP TABLE "MaterialeIntretinere";
ALTER TABLE "new_MaterialeIntretinere" RENAME TO "MaterialeIntretinere";
CREATE UNIQUE INDEX "MaterialeIntretinere_nrCart_key" ON "MaterialeIntretinere"("nrCart");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Step 3: drop BonEliberareMaterial.um.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BonEliberareMaterial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bonId" INTEGER NOT NULL,
    "materialId" INTEGER,
    "nota" TEXT,
    "cantitate" REAL NOT NULL,
    CONSTRAINT "BonEliberareMaterial_bonId_fkey" FOREIGN KEY ("bonId") REFERENCES "BonEliberare" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BonEliberareMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MaterialeIntretinere" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BonEliberareMaterial" ("id", "bonId", "materialId", "nota", "cantitate")
SELECT "id", "bonId", "materialId", "nota", "cantitate" FROM "BonEliberareMaterial";
DROP TABLE "BonEliberareMaterial";
ALTER TABLE "new_BonEliberareMaterial" RENAME TO "BonEliberareMaterial";
CREATE UNIQUE INDEX "BonEliberareMaterial_bonId_materialId_key" ON "BonEliberareMaterial"("bonId", "materialId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Step 4: drop FacturaExpeditieMaterial.nrCart and .um.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FacturaExpeditieMaterial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "facturaId" INTEGER NOT NULL,
    "materialId" INTEGER NOT NULL,
    "cantitate" REAL NOT NULL,
    "pretUnitar" REAL NOT NULL,
    CONSTRAINT "FacturaExpeditieMaterial_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "FacturaExpeditie" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FacturaExpeditieMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MaterialeIntretinere" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FacturaExpeditieMaterial" ("id", "facturaId", "materialId", "cantitate", "pretUnitar")
SELECT "id", "facturaId", "materialId", "cantitate", "pretUnitar" FROM "FacturaExpeditieMaterial";
DROP TABLE "FacturaExpeditieMaterial";
ALTER TABLE "new_FacturaExpeditieMaterial" RENAME TO "FacturaExpeditieMaterial";
CREATE UNIQUE INDEX "FacturaExpeditieMaterial_facturaId_materialId_key" ON "FacturaExpeditieMaterial"("facturaId", "materialId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
