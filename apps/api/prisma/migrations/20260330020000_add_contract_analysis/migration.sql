-- CreateTable: ContractAnalysis
CREATE TABLE IF NOT EXISTS "ContractAnalysis" (
    "id"           TEXT NOT NULL,
    "tenantId"     TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileName"     TEXT NOT NULL,
    "fileSize"     INTEGER NOT NULL,
    "storageUrl"   TEXT NOT NULL,
    "pdfText"      TEXT,
    "status"       TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "result"       JSONB,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractAnalysis_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ContractAnalysis_tenantId_fkey'
  ) THEN
    ALTER TABLE "ContractAnalysis"
      ADD CONSTRAINT "ContractAnalysis_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ContractAnalysis_uploadedById_fkey'
  ) THEN
    ALTER TABLE "ContractAnalysis"
      ADD CONSTRAINT "ContractAnalysis_uploadedById_fkey"
      FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "ContractAnalysis_tenantId_idx"  ON "ContractAnalysis"("tenantId");
CREATE INDEX IF NOT EXISTS "ContractAnalysis_status_idx"    ON "ContractAnalysis"("status");
