/*
  A material is now identified by `nrCart` ("cod nomenclator"), not `nume`:
  real invoices showed the same name printed under different codes, prices and
  units (e.g. two "SAPUN LICHID ANTIBACTERIAL" lines, 8 serialized "ANVELOPE
  SATOYA..." lines) — matching by name would have silently merged them.

  `MaterialeIntretinere.nrCart` becomes NOT NULL UNIQUE, and `nume` stops
  being unique. `BonEliberareMaterial.materialId` becomes nullable, with a new
  `nota` column: a bon line can now be a scratchpad note (free-typed text, no
  catalogue row at all) instead of always creating one on save. 12 of the 47
  materials in the dev DB were never named on any factura (plain consumables
  added straight from a bon, e.g. "ULEI MOTOR...", "antifreez rosu") — under
  the new model these were never real catalogue entries, so their bon lines
  are converted into notes and the 12 rows are deleted.

  Hand-written: `prisma migrate dev` cannot run non-interactively to confirm
  the data-loss prompts SQLite's lack of ALTER TABLE ... ALTER COLUMN forces
  here (same reason as the other hand-written migrations in this project).
*/

-- Step 1: relax BonEliberareMaterial.materialId to nullable, add `nota`.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BonEliberareMaterial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bonId" INTEGER NOT NULL,
    "materialId" INTEGER,
    "nota" TEXT,
    "um" TEXT NOT NULL,
    "cantitate" REAL NOT NULL,
    CONSTRAINT "BonEliberareMaterial_bonId_fkey" FOREIGN KEY ("bonId") REFERENCES "BonEliberare" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BonEliberareMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MaterialeIntretinere" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BonEliberareMaterial" ("id", "bonId", "materialId", "um", "cantitate")
SELECT "id", "bonId", "materialId", "um", "cantitate" FROM "BonEliberareMaterial";
DROP TABLE "BonEliberareMaterial";
ALTER TABLE "new_BonEliberareMaterial" RENAME TO "BonEliberareMaterial";
CREATE UNIQUE INDEX "BonEliberareMaterial_bonId_materialId_key" ON "BonEliberareMaterial"("bonId", "materialId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Step 2: bon lines pointing at a never-invoiced material become scratchpad
-- notes — copy the name into `nota` before nulling the link.
UPDATE "BonEliberareMaterial"
SET "nota" = (SELECT "nume" FROM "MaterialeIntretinere" WHERE "id" = "BonEliberareMaterial"."materialId")
WHERE "materialId" IN (
  SELECT m."id" FROM "MaterialeIntretinere" m
  LEFT JOIN "FacturaExpeditieMaterial" f ON f."materialId" = m."id"
  WHERE f."id" IS NULL
);

UPDATE "BonEliberareMaterial"
SET "materialId" = NULL
WHERE "materialId" IN (
  SELECT m."id" FROM "MaterialeIntretinere" m
  LEFT JOIN "FacturaExpeditieMaterial" f ON f."materialId" = m."id"
  WHERE f."id" IS NULL
);

-- Step 3: the now-unreferenced, never-invoiced materials are deleted.
DELETE FROM "MaterialeIntretinere"
WHERE "id" NOT IN (SELECT DISTINCT "materialId" FROM "FacturaExpeditieMaterial");

-- Step 4: give every remaining material its nrCart (backfilled from its
-- factura line — unambiguous, since no name currently spans two codes), make
-- it NOT NULL UNIQUE, and drop the unique constraint on `nume`.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MaterialeIntretinere" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nume" TEXT NOT NULL,
    "nrCart" TEXT NOT NULL
);
INSERT INTO "new_MaterialeIntretinere" ("id", "updatedAt", "nume", "nrCart")
SELECT m."id", m."updatedAt", m."nume",
  (SELECT f."nrCart" FROM "FacturaExpeditieMaterial" f WHERE f."materialId" = m."id" LIMIT 1)
FROM "MaterialeIntretinere" m;
DROP TABLE "MaterialeIntretinere";
ALTER TABLE "new_MaterialeIntretinere" RENAME TO "MaterialeIntretinere";
CREATE UNIQUE INDEX "MaterialeIntretinere_nrCart_key" ON "MaterialeIntretinere"("nrCart");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
