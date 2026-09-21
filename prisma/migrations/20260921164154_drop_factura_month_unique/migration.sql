-- DropIndex
DROP INDEX "FacturaExpeditie_month_key";

-- CreateIndex
CREATE INDEX "FacturaExpeditie_month_idx" ON "FacturaExpeditie"("month");
