-- Phase 5: Portal Judicial MEV Misiones

-- ── Nuevos campos en Expediente (portal sync) ─────────────────────────────────
ALTER TABLE "Expediente"
  ADD COLUMN IF NOT EXISTS "portalSyncEnabled"    BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "portalId"             TEXT,
  ADD COLUMN IF NOT EXISTS "portalStatus"         TEXT,
  ADD COLUMN IF NOT EXISTS "portalLastSync"       TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "portalLastMovimiento" TEXT,
  ADD COLUMN IF NOT EXISTS "portalMovimientoAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "portalNewActivity"    BOOLEAN   NOT NULL DEFAULT false;

-- ── PortalCredential ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PortalCredential" (
    "id"          TEXT        NOT NULL,
    "tenantId"    TEXT        NOT NULL,
    "portal"      TEXT        NOT NULL DEFAULT 'mev_misiones',
    "username"    TEXT        NOT NULL,
    "passwordEnc" TEXT        NOT NULL,
    "isActive"    BOOLEAN     NOT NULL DEFAULT true,
    "lastValidAt" TIMESTAMP(3),
    "lastError"   TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortalCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PortalCredential_tenantId_portal_key"
    ON "PortalCredential"("tenantId", "portal");
CREATE INDEX IF NOT EXISTS "PortalCredential_tenantId_idx"
    ON "PortalCredential"("tenantId");

ALTER TABLE "PortalCredential"
    ADD CONSTRAINT "PortalCredential_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── PortalSyncLog ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PortalSyncLog" (
    "id"                 TEXT         NOT NULL,
    "tenantId"           TEXT         NOT NULL,
    "portal"             TEXT         NOT NULL DEFAULT 'mev_misiones',
    "credentialId"       TEXT,
    "status"             TEXT         NOT NULL DEFAULT 'running',
    "trigger"            TEXT         NOT NULL DEFAULT 'cron',
    "startedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt"         TIMESTAMP(3),
    "expedientesChecked" INTEGER      NOT NULL DEFAULT 0,
    "expedientesUpdated" INTEGER      NOT NULL DEFAULT 0,
    "errorMessage"       TEXT,

    CONSTRAINT "PortalSyncLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PortalSyncLog_tenantId_idx"
    ON "PortalSyncLog"("tenantId");
CREATE INDEX IF NOT EXISTS "PortalSyncLog_credentialId_idx"
    ON "PortalSyncLog"("credentialId");
CREATE INDEX IF NOT EXISTS "PortalSyncLog_startedAt_idx"
    ON "PortalSyncLog"("startedAt");

ALTER TABLE "PortalSyncLog"
    ADD CONSTRAINT "PortalSyncLog_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortalSyncLog"
    ADD CONSTRAINT "PortalSyncLog_credentialId_fkey"
    FOREIGN KEY ("credentialId") REFERENCES "PortalCredential"("id") ON DELETE SET NULL ON UPDATE CASCADE;
