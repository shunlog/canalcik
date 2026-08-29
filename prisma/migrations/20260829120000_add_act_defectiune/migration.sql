-- CreateTable
CREATE TABLE "ActDefectiuneData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "updatedAt" DATETIME NOT NULL,
    "data" TEXT NOT NULL,
    "vehiculId" INTEGER NOT NULL,
    "nrInventar" TEXT NOT NULL,
    "nrInregistrare" TEXT NOT NULL,
    "denumireVehicul" TEXT NOT NULL,
    "anProducerii" TEXT NOT NULL,
    "defectiuni" TEXT NOT NULL,
    "pieseSchimb" TEXT NOT NULL,
    "lucrari" TEXT NOT NULL,
    CONSTRAINT "ActDefectiuneData_vehiculId_fkey" FOREIGN KEY ("vehiculId") REFERENCES "Vehicul" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActDefectiuneDoc" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "actId" INTEGER NOT NULL,
    "documentId" INTEGER NOT NULL,
    CONSTRAINT "ActDefectiuneDoc_actId_fkey" FOREIGN KEY ("actId") REFERENCES "ActDefectiuneData" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActDefectiuneDoc_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GeneratedDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ActDefectiuneDoc_actId_key" ON "ActDefectiuneDoc"("actId");

-- CreateIndex
CREATE UNIQUE INDEX "ActDefectiuneDoc_documentId_key" ON "ActDefectiuneDoc"("documentId");
