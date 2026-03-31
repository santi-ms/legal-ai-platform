-- CreateTable: DocumentShare
CREATE TABLE IF NOT EXISTS "DocumentShare" (
    "id"           TEXT NOT NULL,
    "documentId"   TEXT NOT NULL,
    "tenantId"     TEXT NOT NULL,
    "createdById"  TEXT NOT NULL,
    "token"        TEXT NOT NULL,
    "expiresAt"    TIMESTAMP(3) NOT NULL,
    "viewCount"    INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "status"       TEXT NOT NULL DEFAULT 'active',
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentShare_pkey" PRIMARY KEY ("id")
);

-- Unique token
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentShare_token_key" ON "DocumentShare"("token");

-- Indexes
CREATE INDEX IF NOT EXISTS "DocumentShare_documentId_idx"  ON "DocumentShare"("documentId");
CREATE INDEX IF NOT EXISTS "DocumentShare_tenantId_idx"    ON "DocumentShare"("tenantId");
CREATE INDEX IF NOT EXISTS "DocumentShare_status_idx"      ON "DocumentShare"("status");

-- Foreign key to Document
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DocumentShare_documentId_fkey'
  ) THEN
    ALTER TABLE "DocumentShare"
      ADD CONSTRAINT "DocumentShare_documentId_fkey"
      FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
