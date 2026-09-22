-- CreateTable
CREATE TABLE "Acumulator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehiculId" INTEGER NOT NULL,
    "model" TEXT,
    "dataInstalarii" TEXT NOT NULL,
    "normaLuni" INTEGER NOT NULL,
    CONSTRAINT "Acumulator_vehiculId_fkey" FOREIGN KEY ("vehiculId") REFERENCES "Vehicul" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
