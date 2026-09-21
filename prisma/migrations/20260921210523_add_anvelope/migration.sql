-- CreateTable
CREATE TABLE "AnvelopaLuni" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehiculId" INTEGER NOT NULL,
    "model" TEXT,
    "dataInstalarii" TEXT NOT NULL,
    "normaLuni" INTEGER NOT NULL,
    CONSTRAINT "AnvelopaLuni_vehiculId_fkey" FOREIGN KEY ("vehiculId") REFERENCES "Vehicul" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnvelopaKm" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehiculId" INTEGER NOT NULL,
    "model" TEXT,
    "dataInstalarii" TEXT NOT NULL,
    "kmInstalare" INTEGER NOT NULL,
    "normaKm" INTEGER NOT NULL,
    CONSTRAINT "AnvelopaKm_vehiculId_fkey" FOREIGN KEY ("vehiculId") REFERENCES "Vehicul" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
