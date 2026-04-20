-- CreateTable: Honorario (módulo Finanzas)
CREATE TABLE "Honorario" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "expedienteId" TEXT,
    "clientId" TEXT,
    "tipo" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'ARS',
    "estado" TEXT NOT NULL DEFAULT 'presupuestado',
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "fechaCobro" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Honorario_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "Honorario_tenantId_idx" ON "Honorario"("tenantId");
CREATE INDEX "Honorario_expedienteId_idx" ON "Honorario"("expedienteId");
CREATE INDEX "Honorario_clientId_idx" ON "Honorario"("clientId");
CREATE INDEX "Honorario_estado_idx" ON "Honorario"("estado");
CREATE INDEX "Honorario_fechaVencimiento_idx" ON "Honorario"("fechaVencimiento");

-- Foreign Keys
ALTER TABLE "Honorario" ADD CONSTRAINT "Honorario_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Honorario" ADD CONSTRAINT "Honorario_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Honorario" ADD CONSTRAINT "Honorario_expedienteId_fkey"
    FOREIGN KEY ("expedienteId") REFERENCES "Expediente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Honorario" ADD CONSTRAINT "Honorario_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
