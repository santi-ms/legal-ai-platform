-- CreateTable: EscritoAnalisis (DocuLex ESTRATEGA)
CREATE TABLE "EscritoAnalisis" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "expedienteId" TEXT,
    "originalName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageUrl" TEXT NOT NULL DEFAULT '',
    "pdfText" TEXT,
    "tipoEscrito" TEXT NOT NULL DEFAULT 'otro',
    "materia" TEXT,
    "provincia" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EscritoAnalisis_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "EscritoAnalisis_tenantId_idx"     ON "EscritoAnalisis"("tenantId");
CREATE INDEX "EscritoAnalisis_expedienteId_idx" ON "EscritoAnalisis"("expedienteId");
CREATE INDEX "EscritoAnalisis_status_idx"       ON "EscritoAnalisis"("status");
CREATE INDEX "EscritoAnalisis_deletedAt_idx"    ON "EscritoAnalisis"("deletedAt");

-- Foreign Keys
ALTER TABLE "EscritoAnalisis" ADD CONSTRAINT "EscritoAnalisis_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EscritoAnalisis" ADD CONSTRAINT "EscritoAnalisis_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EscritoAnalisis" ADD CONSTRAINT "EscritoAnalisis_expedienteId_fkey"
    FOREIGN KEY ("expedienteId") REFERENCES "Expediente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
