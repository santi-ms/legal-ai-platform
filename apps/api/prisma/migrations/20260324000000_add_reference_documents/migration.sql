-- CreateTable: ReferenceDocument
CREATE TABLE "ReferenceDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'pdf',
    "documentType" TEXT NOT NULL,
    "pdfText" TEXT,
    "storageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ReferenceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReferenceDocument_tenantId_idx" ON "ReferenceDocument"("tenantId");
CREATE INDEX "ReferenceDocument_documentType_idx" ON "ReferenceDocument"("documentType");
CREATE INDEX "ReferenceDocument_deletedAt_idx" ON "ReferenceDocument"("deletedAt");

-- AddForeignKey
ALTER TABLE "ReferenceDocument" ADD CONSTRAINT "ReferenceDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferenceDocument" ADD CONSTRAINT "ReferenceDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Add referenceDocumentId to Document
ALTER TABLE "Document" ADD COLUMN "referenceDocumentId" TEXT;
ALTER TABLE "Document" ADD CONSTRAINT "Document_referenceDocumentId_fkey" FOREIGN KEY ("referenceDocumentId") REFERENCES "ReferenceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
