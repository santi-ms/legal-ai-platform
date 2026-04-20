-- ─── Vencimientos ────────────────────────────────────────────────────────────

CREATE TABLE "Vencimiento" (
  "id"              TEXT        NOT NULL,
  "tenantId"        TEXT        NOT NULL,
  "createdById"     TEXT        NOT NULL,
  "titulo"          TEXT        NOT NULL,
  "descripcion"     TEXT,
  "tipo"            TEXT        NOT NULL DEFAULT 'otro',
  "fechaVencimiento" TIMESTAMP(3) NOT NULL,
  "alertaDias"      INTEGER     NOT NULL DEFAULT 3,
  "expedienteId"    TEXT,
  "clientId"        TEXT,
  "estado"          TEXT        NOT NULL DEFAULT 'pendiente',
  "completadoAt"    TIMESTAMP(3),
  "completadoById"  TEXT,
  "notificadoAt"    TIMESTAMP(3),
  "archivedAt"      TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Vencimiento_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "Vencimiento"
  ADD CONSTRAINT "Vencimiento_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Vencimiento"
  ADD CONSTRAINT "Vencimiento_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Vencimiento"
  ADD CONSTRAINT "Vencimiento_expedienteId_fkey"
    FOREIGN KEY ("expedienteId") REFERENCES "Expediente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Vencimiento"
  ADD CONSTRAINT "Vencimiento_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "Vencimiento_tenantId_idx"          ON "Vencimiento"("tenantId");
CREATE INDEX "Vencimiento_fechaVencimiento_idx"   ON "Vencimiento"("fechaVencimiento");
CREATE INDEX "Vencimiento_estado_idx"             ON "Vencimiento"("estado");
CREATE INDEX "Vencimiento_expedienteId_idx"       ON "Vencimiento"("expedienteId");
CREATE INDEX "Vencimiento_clientId_idx"           ON "Vencimiento"("clientId");
CREATE INDEX "Vencimiento_archivedAt_idx"         ON "Vencimiento"("archivedAt");
