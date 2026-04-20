-- Add soft-delete to Honorario
ALTER TABLE "Honorario" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Honorario_tenantId_archivedAt_idx" ON "Honorario"("tenantId", "archivedAt");
