-- CreateTable
CREATE TABLE "ComandaMaterialeData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ComandaMaterialeMaterial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "comandaId" INTEGER NOT NULL,
    "vehiculId" INTEGER NOT NULL,
    "nr" INTEGER NOT NULL,
    "nume" TEXT NOT NULL,
    "cod" TEXT NOT NULL,
    "um" TEXT NOT NULL,
    "cantitate" REAL NOT NULL,
    CONSTRAINT "ComandaMaterialeMaterial_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "ComandaMaterialeData" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComandaMaterialeMaterial_vehiculId_fkey" FOREIGN KEY ("vehiculId") REFERENCES "Vehicul" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComandaMaterialeDoc" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "comandaId" INTEGER NOT NULL,
    "documentId" INTEGER NOT NULL,
    CONSTRAINT "ComandaMaterialeDoc_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "ComandaMaterialeData" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComandaMaterialeDoc_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GeneratedDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
-- Unrelated to the comanda: the hand-written 20260830150000 migration left
-- ActDefectiuneData.updatedAt without the DEFAULT the schema's @default(now())
-- asks for, and this is the column catching up. No data changes.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActDefectiuneData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" TEXT NOT NULL,
    "vehiculId" INTEGER NOT NULL,
    "defectiuni" TEXT NOT NULL,
    "pieseSchimb" TEXT NOT NULL,
    "lucrari" TEXT NOT NULL,
    CONSTRAINT "ActDefectiuneData_vehiculId_fkey" FOREIGN KEY ("vehiculId") REFERENCES "Vehicul" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ActDefectiuneData" ("data", "defectiuni", "id", "lucrari", "pieseSchimb", "updatedAt", "vehiculId") SELECT "data", "defectiuni", "id", "lucrari", "pieseSchimb", "updatedAt", "vehiculId" FROM "ActDefectiuneData";
DROP TABLE "ActDefectiuneData";
ALTER TABLE "new_ActDefectiuneData" RENAME TO "ActDefectiuneData";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ComandaMaterialeDoc_comandaId_key" ON "ComandaMaterialeDoc"("comandaId");

-- CreateIndex
CREATE UNIQUE INDEX "ComandaMaterialeDoc_documentId_key" ON "ComandaMaterialeDoc"("documentId");
