-- CreateTable
CREATE TABLE "FacturaExpeditie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "FacturaExpeditieMaterial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "facturaId" INTEGER NOT NULL,
    "materialId" INTEGER NOT NULL,
    "nrCart" TEXT NOT NULL,
    "um" TEXT NOT NULL,
    "cantitate" REAL NOT NULL,
    "pretUnitar" REAL NOT NULL,
    CONSTRAINT "FacturaExpeditieMaterial_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "FacturaExpeditie" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FacturaExpeditieMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MaterialeIntretinere" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
