-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FacturaExpeditie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "ramas" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_FacturaExpeditie" ("data", "id", "month", "updatedAt") SELECT "data", "id", "month", "updatedAt" FROM "FacturaExpeditie";
DROP TABLE "FacturaExpeditie";
ALTER TABLE "new_FacturaExpeditie" RENAME TO "FacturaExpeditie";
CREATE INDEX "FacturaExpeditie_month_idx" ON "FacturaExpeditie"("month");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
