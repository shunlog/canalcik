-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "driveFileId" TEXT NOT NULL,
    "driveUrl" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "FisaLimitaDoc" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "luna" TEXT NOT NULL,
    "documentId" INTEGER NOT NULL,
    CONSTRAINT "FisaLimitaDoc_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GeneratedDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedDocument_driveFileId_key" ON "GeneratedDocument"("driveFileId");

-- CreateIndex
CREATE UNIQUE INDEX "FisaLimitaDoc_luna_key" ON "FisaLimitaDoc"("luna");

-- CreateIndex
CREATE UNIQUE INDEX "FisaLimitaDoc_documentId_key" ON "FisaLimitaDoc"("documentId");
