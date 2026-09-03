-- Adds the sofer an act names ("Avizat" on the document). Existing acts predate
-- the column, so each is backfilled with a sofer assigned to its vehicul (the
-- lowest id of the ones linked, arbitrary where a vehicul has several) — a
-- vehicul with no sofer at all falls back to the first sofer on file, so the
-- five rows written before this all need a look in the UI.

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActDefectiuneData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" TEXT NOT NULL,
    "vehiculId" INTEGER NOT NULL,
    "soferId" INTEGER NOT NULL,
    "defectiuni" TEXT NOT NULL,
    "pieseSchimb" TEXT NOT NULL,
    "lucrari" TEXT NOT NULL,
    CONSTRAINT "ActDefectiuneData_vehiculId_fkey" FOREIGN KEY ("vehiculId") REFERENCES "Vehicul" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActDefectiuneData_soferId_fkey" FOREIGN KEY ("soferId") REFERENCES "Sofer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ActDefectiuneData" ("id", "updatedAt", "data", "vehiculId", "soferId", "defectiuni", "pieseSchimb", "lucrari")
SELECT
    "id",
    "updatedAt",
    "data",
    "vehiculId",
    COALESCE(
        (SELECT MIN("A") FROM "_VehiculSofer" WHERE "B" = "vehiculId"),
        (SELECT MIN("id") FROM "Sofer")
    ),
    "defectiuni",
    "pieseSchimb",
    "lucrari"
FROM "ActDefectiuneData";
DROP TABLE "ActDefectiuneData";
ALTER TABLE "new_ActDefectiuneData" RENAME TO "ActDefectiuneData";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
