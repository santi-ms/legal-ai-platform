-- CreateTable: JurisConsulta + JurisMensaje
-- Doku Juris — Research jurisprudencial conversacional

CREATE TABLE "JurisConsulta" (
    "id"           TEXT NOT NULL,
    "tenantId"     TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "expedienteId" TEXT,
    "titulo"       TEXT NOT NULL,
    "provincia"    TEXT,
    "materia"      TEXT,
    "tokensUsed"   INTEGER NOT NULL DEFAULT 0,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    "deletedAt"    TIMESTAMP(3),

    CONSTRAINT "JurisConsulta_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JurisMensaje" (
    "id"          TEXT NOT NULL,
    "consultaId"  TEXT NOT NULL,
    "role"        TEXT NOT NULL,
    "content"     TEXT NOT NULL,
    "citas"       JSONB,
    "webSearches" JSONB,
    "tokensUsed"  INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JurisMensaje_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "JurisConsulta_tenantId_idx"     ON "JurisConsulta"("tenantId");
CREATE INDEX "JurisConsulta_userId_idx"        ON "JurisConsulta"("userId");
CREATE INDEX "JurisConsulta_expedienteId_idx"  ON "JurisConsulta"("expedienteId");
CREATE INDEX "JurisConsulta_deletedAt_idx"     ON "JurisConsulta"("deletedAt");
CREATE INDEX "JurisMensaje_consultaId_idx"     ON "JurisMensaje"("consultaId");

-- Foreign Keys
ALTER TABLE "JurisConsulta"
    ADD CONSTRAINT "JurisConsulta_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JurisConsulta"
    ADD CONSTRAINT "JurisConsulta_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JurisConsulta"
    ADD CONSTRAINT "JurisConsulta_expedienteId_fkey"
        FOREIGN KEY ("expedienteId") REFERENCES "Expediente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "JurisMensaje"
    ADD CONSTRAINT "JurisMensaje_consultaId_fkey"
        FOREIGN KEY ("consultaId") REFERENCES "JurisConsulta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
