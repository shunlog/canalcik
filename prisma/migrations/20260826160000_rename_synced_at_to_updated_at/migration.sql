/*
  Rename syncedAt to updatedAt on all tables.

  The field represents when the record was last updated, not when it was synced.
  updatedAt aligns with Prisma's @updatedAt directive semantics.
*/
-- Rename columns on all affected tables
ALTER TABLE "Vehicul" RENAME COLUMN "syncedAt" TO "updatedAt";
ALTER TABLE "Sofer" RENAME COLUMN "syncedAt" TO "updatedAt";
ALTER TABLE "BonEliberare" RENAME COLUMN "syncedAt" TO "updatedAt";
ALTER TABLE "MaterialeIntretinere" RENAME COLUMN "syncedAt" TO "updatedAt";
ALTER TABLE "FacturaExpeditie" RENAME COLUMN "syncedAt" TO "updatedAt";
