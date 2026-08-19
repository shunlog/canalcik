-- CreateTable
CREATE TABLE "Vehicul" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "litere" TEXT NOT NULL,
    "cifre" TEXT NOT NULL,
    "nrInventar" INTEGER NOT NULL,
    "nrGaraj" INTEGER NOT NULL,
    "tip" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "anProducere" INTEGER,
    "kmActuali" INTEGER,
    "sector" TEXT,
    "utilajeAuxiliare" TEXT,
    "lucrariLunaViitoare" TEXT
);

-- CreateTable
CREATE TABLE "Sofer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cod" INTEGER NOT NULL,
    "nume" TEXT NOT NULL,
    "functie" TEXT,
    "telefon" TEXT,
    "sector" TEXT,
    "marimeHaina" TEXT,
    "marimeIncaltaminte" TEXT,
    "observatii" TEXT,
    "eipScurta" TEXT,
    "eipIncaltaminte" TEXT,
    "eipCostum" TEXT,
    "eipPantaloni" TEXT,
    "eipVestaAvertizare" TEXT
);

-- CreateTable
CREATE TABLE "BonEliberare" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" TEXT NOT NULL,
    "soferId" INTEGER NOT NULL,
    "vehiculId" INTEGER NOT NULL,
    CONSTRAINT "BonEliberare_soferId_fkey" FOREIGN KEY ("soferId") REFERENCES "Sofer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BonEliberare_vehiculId_fkey" FOREIGN KEY ("vehiculId") REFERENCES "Vehicul" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BonEliberareMaterial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bonId" INTEGER NOT NULL,
    "nrCart" TEXT,
    "nume" TEXT NOT NULL,
    "um" TEXT NOT NULL,
    "cantitate" REAL NOT NULL,
    CONSTRAINT "BonEliberareMaterial_bonId_fkey" FOREIGN KEY ("bonId") REFERENCES "BonEliberare" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_VehiculSofer" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_VehiculSofer_A_fkey" FOREIGN KEY ("A") REFERENCES "Sofer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_VehiculSofer_B_fkey" FOREIGN KEY ("B") REFERENCES "Vehicul" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicul_nrInventar_key" ON "Vehicul"("nrInventar");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicul_nrGaraj_key" ON "Vehicul"("nrGaraj");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicul_litere_cifre_key" ON "Vehicul"("litere", "cifre");

-- CreateIndex
CREATE UNIQUE INDEX "Sofer_cod_key" ON "Sofer"("cod");

-- CreateIndex
CREATE UNIQUE INDEX "_VehiculSofer_AB_unique" ON "_VehiculSofer"("A", "B");

-- CreateIndex
CREATE INDEX "_VehiculSofer_B_index" ON "_VehiculSofer"("B");

