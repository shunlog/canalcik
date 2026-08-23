/*
  Upper-cases every unit of measure already stored.

  A factura was written "L"/"KG" and a bon "l"/"buc" for the same thing, and the
  monthly reconciliation compares a factura quantity against a bon quantity — so
  two spellings of one unit would silently split a row in two. `unitateMasura`
  in server/src/schemas/common.ts normalises new writes; this fixes the rows
  written before it.

  Data-only, so `prisma migrate dev` does not generate it — hand-written, and
  applied with `prisma migrate deploy`. SQLite's UPPER is ASCII-only, which is
  all these values ever are ("l", "kg", "buc").
*/
-- UpdateData
UPDATE "BonEliberareMaterial" SET "um" = UPPER("um") WHERE "um" <> UPPER("um");
UPDATE "FacturaExpeditieMaterial" SET "um" = UPPER("um") WHERE "um" <> UPPER("um");
