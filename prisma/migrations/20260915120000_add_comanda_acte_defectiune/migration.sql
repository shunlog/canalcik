-- A comanda can gather materials from zero or more acte de defecțiune.
-- This is Prisma's implicit many-to-many join table; deleting either document
-- removes only its link, never the other document or its manually entered rows.
CREATE TABLE "_ActDefectiuneDataToComandaMaterialeData" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ActDefectiuneDataToComandaMaterialeData_A_fkey"
      FOREIGN KEY ("A") REFERENCES "ActDefectiuneData" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ActDefectiuneDataToComandaMaterialeData_B_fkey"
      FOREIGN KEY ("B") REFERENCES "ComandaMaterialeData" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "_ActDefectiuneDataToComandaMaterialeData_AB_unique"
  ON "_ActDefectiuneDataToComandaMaterialeData"("A", "B");

CREATE INDEX "_ActDefectiuneDataToComandaMaterialeData_B_index"
  ON "_ActDefectiuneDataToComandaMaterialeData"("B");
