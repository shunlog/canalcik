/*
  A material can appear at most once per bon.

  Pre-existing duplicates are collapsed into the lowest-id row with their
  cantitate summed — unlike
  prisma/migrations/20260823190000_unique_factura_material/migration.sql, which
  simply deleted them. On a bon the cantitate is what the "fisa limita" totals
  per material/month, so dropping a row would silently reduce the amount
  recorded as issued. `um` is taken from the surviving row; every duplicate
  group in the dev DB carried a single um.

  Hand-written, same reason as the migration above: `prisma migrate dev` cannot
  run non-interactively to confirm data-loss prompts.
*/
UPDATE "BonEliberareMaterial"
SET "cantitate" = (
  SELECT SUM(d."cantitate")
  FROM "BonEliberareMaterial" d
  WHERE d."bonId" = "BonEliberareMaterial"."bonId"
    AND d."materialId" = "BonEliberareMaterial"."materialId"
)
WHERE "id" IN (
  SELECT MIN("id") FROM "BonEliberareMaterial"
  GROUP BY "bonId", "materialId" HAVING COUNT(*) > 1
);

DELETE FROM "BonEliberareMaterial"
WHERE "id" NOT IN (
  SELECT MIN("id") FROM "BonEliberareMaterial" GROUP BY "bonId", "materialId"
);

-- CreateIndex
CREATE UNIQUE INDEX "BonEliberareMaterial_bonId_materialId_key" ON "BonEliberareMaterial"("bonId", "materialId");
