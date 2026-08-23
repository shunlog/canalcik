/*
  Replaces the (facturaId, nrCart) unique constraint on FacturaExpeditieMaterial
  with (facturaId, materialId): a bon line matches a factura line by materialId
  alone, so the invariant that actually needs enforcing is one line per
  material per factura, not one line per code per factura.

  Test data violated this (factura #3 carried two lines for one material under
  two different codes/prices) — deleted here, keeping the lowest id, per
  instruction that this was throwaway data, not a real invoice to reconcile.

  Hand-written, same reason as
  prisma/migrations/20260823180000_remove_bon_nrcart_unique_factura_nrcart/migration.sql:
  `prisma migrate dev` cannot run non-interactively to confirm data-loss prompts.
*/
DELETE FROM "FacturaExpeditieMaterial"
WHERE id NOT IN (
  SELECT MIN(id) FROM "FacturaExpeditieMaterial" GROUP BY "facturaId", "materialId"
);

DROP INDEX "FacturaExpeditieMaterial_facturaId_nrCart_key";

-- CreateIndex
CREATE UNIQUE INDEX "FacturaExpeditieMaterial_facturaId_materialId_key" ON "FacturaExpeditieMaterial"("facturaId", "materialId");
