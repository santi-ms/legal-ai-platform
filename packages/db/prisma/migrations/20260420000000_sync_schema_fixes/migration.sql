-- Migración correctiva: sync schema con migraciones
-- Generado: 2026-04-20
--
-- Cubre los siguientes gaps detectados al comparar schema.prisma con las migraciones existentes:
--   1. Tenant: campos de perfil del estudio (cuit, address, phone, website, logoUrl)
--   2. User: campos de email-verification y perfil extendido
--   3. DocumentAnnotation: tabla completa (no tenía migración)
--   4. GenerationJob: tabla completa (no tenía migración)
--   5. Índices de performance multi-tenant faltantes
-- Todos los cambios usan IF NOT EXISTS para idempotencia.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Tenant — campos de perfil del estudio
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "cuit"    TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "phone"   TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. User — campos de email-verification y perfil extendido
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerificationCodeHash"    TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerificationExpiresAt"   TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerificationAttempts"    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerificationLastSentAt"  TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerificationResendAfter" TIMESTAMP(3);

-- Profile fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio"                     TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone"                   TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "matricula"               TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "especialidad"            TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DocumentAnnotation — tabla completa (sin migración previa)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "DocumentAnnotation" (
    "id"         TEXT         NOT NULL,
    "documentId" TEXT         NOT NULL,
    "tenantId"   TEXT         NOT NULL,
    "authorId"   TEXT,
    "content"    TEXT         NOT NULL,
    "resolved"   BOOLEAN      NOT NULL DEFAULT false,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentAnnotation_pkey" PRIMARY KEY ("id")
);

-- FK: DocumentAnnotation → Document (CASCADE delete)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DocumentAnnotation_documentId_fkey'
  ) THEN
    ALTER TABLE "DocumentAnnotation"
      ADD CONSTRAINT "DocumentAnnotation_documentId_fkey"
      FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: DocumentAnnotation → User (SET NULL on delete)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DocumentAnnotation_authorId_fkey'
  ) THEN
    ALTER TABLE "DocumentAnnotation"
      ADD CONSTRAINT "DocumentAnnotation_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Indexes for DocumentAnnotation (already declared as @@index in schema)
CREATE INDEX IF NOT EXISTS "DocumentAnnotation_documentId_idx" ON "DocumentAnnotation"("documentId");
CREATE INDEX IF NOT EXISTS "DocumentAnnotation_tenantId_idx"   ON "DocumentAnnotation"("tenantId");

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. GenerationJob — tabla completa (sin migración previa)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "GenerationJob" (
    "id"        TEXT         NOT NULL,
    "tenantId"  TEXT         NOT NULL,
    "status"    TEXT         NOT NULL DEFAULT 'pending',
    "result"    JSONB,
    "error"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

-- Indexes for GenerationJob (already declared as @@index in schema)
CREATE INDEX IF NOT EXISTS "GenerationJob_tenantId_idx"  ON "GenerationJob"("tenantId");
CREATE INDEX IF NOT EXISTS "GenerationJob_status_idx"    ON "GenerationJob"("status");
CREATE INDEX IF NOT EXISTS "GenerationJob_createdAt_idx" ON "GenerationJob"("createdAt");

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Índices de performance multi-tenant faltantes
-- ─────────────────────────────────────────────────────────────────────────────

-- Document: queries filtradas por tenant ordenadas por fecha
CREATE INDEX IF NOT EXISTS "Document_tenantId_createdAt_idx"
    ON "Document"("tenantId", "createdAt" DESC);

-- IAUsageLog: queries filtradas por tenant en rango de fechas
CREATE INDEX IF NOT EXISTS "IAUsageLog_tenantId_timestamp_idx"
    ON "IAUsageLog"("tenantId", "timestamp" DESC);

-- User: lookup por tenant (listar usuarios del estudio)
CREATE INDEX IF NOT EXISTS "User_tenantId_idx"
    ON "User"("tenantId");

-- DocumentVersion: lookup por documento + número de versión
CREATE INDEX IF NOT EXISTS "DocumentVersion_documentId_versionNumber_idx"
    ON "DocumentVersion"("documentId", "versionNumber");

-- Add soft-delete to Honorario
ALTER TABLE "Honorario" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Honorario_tenantId_archivedAt_idx" ON "Honorario"("tenantId", "archivedAt");
