-- CreateTable: GenerationJob
-- DB-backed job queue to replace in-memory Map.
-- Jobs survive server restarts and work across multiple instances.

CREATE TABLE "GenerationJob" (
    "id"        TEXT NOT NULL,
    "tenantId"  TEXT NOT NULL,
    "status"    TEXT NOT NULL DEFAULT 'pending',
    "result"    JSONB,
    "error"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GenerationJob_tenantId_idx" ON "GenerationJob"("tenantId");
CREATE INDEX "GenerationJob_status_idx"   ON "GenerationJob"("status");
CREATE INDEX "GenerationJob_createdAt_idx" ON "GenerationJob"("createdAt");
