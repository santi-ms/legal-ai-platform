-- Soft-delete on Honorario.
-- Idempotent: production DB already has the column applied out-of-band
-- (originally lived in packages/db/prisma/migrations/20260420000001_honorario_soft_delete).
-- Re-declared here so a fresh `prisma migrate deploy` can recreate the schema from scratch.

ALTER TABLE "Honorario" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Honorario_tenantId_archivedAt_idx"
    ON "Honorario"("tenantId", "archivedAt");
