-- The material name moves off the bon line and becomes a row in its own table,
-- so the same thing is spelled the same way everywhere. Written by hand rather
-- than generated: the generated version drops `nume` and adds a NOT NULL
-- `materialId` with no default, which would lose every existing line.

-- CreateTable
CREATE TABLE "MaterialeIntretinere" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nume" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "MaterialeIntretinere_nume_key" ON "MaterialeIntretinere"("nume");

-- Seed the catalogue with the distinct names already written on bon lines.
INSERT INTO "MaterialeIntretinere" ("nume")
SELECT DISTINCT "nume" FROM "BonEliberareMaterial";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BonEliberareMaterial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bonId" INTEGER NOT NULL,
    "materialId" INTEGER NOT NULL,
    "nrCart" TEXT,
    "um" TEXT NOT NULL,
    "cantitate" REAL NOT NULL,
    CONSTRAINT "BonEliberareMaterial_bonId_fkey" FOREIGN KEY ("bonId") REFERENCES "BonEliberare" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BonEliberareMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MaterialeIntretinere" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BonEliberareMaterial" ("id", "bonId", "materialId", "nrCart", "um", "cantitate")
SELECT m."id", m."bonId", mi."id", m."nrCart", m."um", m."cantitate"
FROM "BonEliberareMaterial" m
JOIN "MaterialeIntretinere" mi ON mi."nume" = m."nume";
DROP TABLE "BonEliberareMaterial";
ALTER TABLE "new_BonEliberareMaterial" RENAME TO "BonEliberareMaterial";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
