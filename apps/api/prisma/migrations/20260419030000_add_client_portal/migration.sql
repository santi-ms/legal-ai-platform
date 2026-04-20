-- Phase 6a: Portal del Cliente (magic-link read-only access)

CREATE TABLE IF NOT EXISTS "ClientPortalAccess" (
    "id"             TEXT        NOT NULL,
    "tenantId"       TEXT        NOT NULL,
    "clientId"       TEXT        NOT NULL,
    "createdById"    TEXT        NOT NULL,
    "expedienteId"   TEXT,
    "token"          TEXT        NOT NULL,
    "showDocuments"  BOOLEAN     NOT NULL DEFAULT true,
    "showHonorarios" BOOLEAN     NOT NULL DEFAULT false,
    "showMovimientos" BOOLEAN    NOT NULL DEFAULT true,
    "message"        TEXT,
    "status"         TEXT        NOT NULL DEFAULT 'active',
    "expiresAt"      TIMESTAMP(3) NOT NULL,
    "viewCount"      INTEGER     NOT NULL DEFAULT 0,
    "lastViewedAt"   TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientPortalAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClientPortalAccess_token_key"
    ON "ClientPortalAccess"("token");
CREATE INDEX IF NOT EXISTS "ClientPortalAccess_tenantId_idx"
    ON "ClientPortalAccess"("tenantId");
CREATE INDEX IF NOT EXISTS "ClientPortalAccess_clientId_idx"
    ON "ClientPortalAccess"("clientId");
CREATE INDEX IF NOT EXISTS "ClientPortalAccess_status_idx"
    ON "ClientPortalAccess"("status");

ALTER TABLE "ClientPortalAccess"
    ADD CONSTRAINT "ClientPortalAccess_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientPortalAccess"
    ADD CONSTRAINT "ClientPortalAccess_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientPortalAccess"
    ADD CONSTRAINT "ClientPortalAccess_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientPortalAccess"
    ADD CONSTRAINT "ClientPortalAccess_expedienteId_fkey"
    FOREIGN KEY ("expedienteId") REFERENCES "Expediente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
