/*
  Renames the "luna" column to "month" on FacturaExpeditie and FisaLimitaDoc.
  Hand-written: `prisma migrate dev` cannot run non-interactively to confirm
  the "renamed column" prompt, so this mirrors what it would generate — a
  plain column rename (SQLite 3.25+ propagates it into dependent indexes),
  plus renaming the unique index itself to match Prisma's naming convention.
*/
-- RenameColumn
ALTER TABLE "FacturaExpeditie" RENAME COLUMN "luna" TO "month";
DROP INDEX "FacturaExpeditie_luna_key";
CREATE UNIQUE INDEX "FacturaExpeditie_month_key" ON "FacturaExpeditie"("month");

-- RenameColumn
ALTER TABLE "FisaLimitaDoc" RENAME COLUMN "luna" TO "month";
DROP INDEX "FisaLimitaDoc_luna_key";
CREATE UNIQUE INDEX "FisaLimitaDoc_month_key" ON "FisaLimitaDoc"("month");
