-- CreateTable Expediente
CREATE TABLE IF NOT EXISTS "Expediente" (
    "id"            TEXT NOT NULL,
    "tenantId"      TEXT NOT NULL,
    "createdById"   TEXT NOT NULL,
    "number"        TEXT,
    "title"         TEXT NOT NULL,
    "matter"        TEXT NOT NULL,
    "status"        TEXT NOT NULL DEFAULT 'activo',
    "clientId"      TEXT,
    "court"         TEXT,
    "judge"         TEXT,
    "opposingParty" TEXT,
    "openedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt"      TIMESTAMP(3),
    "deadline"      TIMESTAMP(3),
    "notes"         TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expediente_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "Expediente_tenantId_idx"  ON "Expediente"("tenantId");
CREATE INDEX IF NOT EXISTS "Expediente_clientId_idx"  ON "Expediente"("clientId");

-- AddForeignKey Expediente → Tenant
ALTER TABLE "Expediente"
    ADD CONSTRAINT "Expediente_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey Expediente → User
ALTER TABLE "Expediente"
    ADD CONSTRAINT "Expediente_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey Expediente → Client (nullable)
ALTER TABLE "Expediente"
    ADD CONSTRAINT "Expediente_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddColumn expedienteId to Document
ALTER TABLE "Document"
    ADD COLUMN IF NOT EXISTS "expedienteId" TEXT;

-- AddForeignKey Document → Expediente (nullable)
ALTER TABLE "Document"
    ADD CONSTRAINT "Document_expedienteId_fkey"
    FOREIGN KEY ("expedienteId") REFERENCES "Expediente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
