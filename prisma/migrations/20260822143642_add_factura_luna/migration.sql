/*
  Warnings:

  - Added the required column `luna` to the `FacturaExpeditie` table without a default value. This is not possible if the table is not empty.

  Hand-edited: Prisma's generated RedefineTables step drops `luna` from the
  INSERT ... SELECT (it has no source column), which violates the NOT NULL
  constraint on the new table. Backfilled from `data` instead — same
  convention as
  prisma/migrations/20260819210000_extract_materiale_intretinere/migration.sql.
*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FacturaExpeditie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" TEXT NOT NULL,
    "luna" TEXT NOT NULL
);
INSERT INTO "new_FacturaExpeditie" ("data", "id", "syncedAt", "luna") SELECT "data", "id", "syncedAt", substr("data", 1, 7) FROM "FacturaExpeditie";
DROP TABLE "FacturaExpeditie";
ALTER TABLE "new_FacturaExpeditie" RENAME TO "FacturaExpeditie";
CREATE UNIQUE INDEX "FacturaExpeditie_luna_key" ON "FacturaExpeditie"("luna");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
