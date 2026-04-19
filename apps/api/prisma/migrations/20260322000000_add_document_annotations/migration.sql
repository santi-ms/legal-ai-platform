-- CreateTable: DocumentAnnotation
CREATE TABLE "DocumentAnnotation" (
    "id"         TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "tenantId"   TEXT NOT NULL,
    "authorId"   TEXT,
    "content"    TEXT NOT NULL,
    "resolved"   BOOLEAN NOT NULL DEFAULT false,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentAnnotation_documentId_idx" ON "DocumentAnnotation"("documentId");
CREATE INDEX "DocumentAnnotation_tenantId_idx" ON "DocumentAnnotation"("tenantId");

-- AddForeignKey
ALTER TABLE "DocumentAnnotation" ADD CONSTRAINT "DocumentAnnotation_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DocumentAnnotation" ADD CONSTRAINT "DocumentAnnotation_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
