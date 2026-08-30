-- Drops the "Informatie activ" copy of the vehicul's fields, and the name and
-- UM copied off each piesa's catalogue product. Both are now resolved on read
-- from vehiculId and from the piesa's nrNomenclator (see server/src/derived.ts).

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActDefectiuneData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "updatedAt" DATETIME NOT NULL,
    "data" TEXT NOT NULL,
    "vehiculId" INTEGER NOT NULL,
    "defectiuni" TEXT NOT NULL,
    "pieseSchimb" TEXT NOT NULL,
    "lucrari" TEXT NOT NULL,
    CONSTRAINT "ActDefectiuneData_vehiculId_fkey" FOREIGN KEY ("vehiculId") REFERENCES "Vehicul" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ActDefectiuneData" ("id", "updatedAt", "data", "vehiculId", "defectiuni", "pieseSchimb", "lucrari")
SELECT
    "id",
    "updatedAt",
    "data",
    "vehiculId",
    "defectiuni",
    -- Strip the two now-derived keys from every stored piesa line.
    (SELECT json_group_array(json_remove("value", '$.piesaSchimb', '$.um')) FROM json_each("pieseSchimb")),
    "lucrari"
FROM "ActDefectiuneData";
DROP TABLE "ActDefectiuneData";
ALTER TABLE "new_ActDefectiuneData" RENAME TO "ActDefectiuneData";
PRAGMA foreign_keys=ON;
