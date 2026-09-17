/*
  Store the registration number exactly as the application previously printed
  it: the former two columns separated by one space. Rebuilding the SQLite
  table is required to remove non-null columns.
*/
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Vehicul" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nrInmatriculare" TEXT NOT NULL,
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

INSERT INTO "new_Vehicul" (
    "id", "updatedAt", "nrInmatriculare", "nrInventar", "nrGaraj", "tip", "model",
    "anProducere", "kmActuali", "sector", "utilajeAuxiliare", "lucrariLunaViitoare"
)
SELECT
    "id", "updatedAt", "litere" || ' ' || "cifre", "nrInventar", "nrGaraj", "tip", "model",
    "anProducere", "kmActuali", "sector", "utilajeAuxiliare", "lucrariLunaViitoare"
FROM "Vehicul";

DROP TABLE "Vehicul";
ALTER TABLE "new_Vehicul" RENAME TO "Vehicul";

CREATE UNIQUE INDEX "Vehicul_nrInmatriculare_key" ON "Vehicul"("nrInmatriculare");
CREATE UNIQUE INDEX "Vehicul_nrInventar_key" ON "Vehicul"("nrInventar");
CREATE UNIQUE INDEX "Vehicul_nrGaraj_key" ON "Vehicul"("nrGaraj");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
