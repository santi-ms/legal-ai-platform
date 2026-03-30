-- CreateTable: TeamInvitation
CREATE TABLE IF NOT EXISTS "TeamInvitation" (
    "id"           TEXT NOT NULL,
    "tenantId"     TEXT NOT NULL,
    "invitedById"  TEXT NOT NULL,
    "email"        TEXT NOT NULL,
    "tokenHash"    TEXT NOT NULL,
    "status"       TEXT NOT NULL DEFAULT 'pending',
    "expiresAt"    TIMESTAMP(3) NOT NULL,
    "acceptedAt"   TIMESTAMP(3),
    "acceptedById" TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TeamInvitation_tokenHash_key"    ON "TeamInvitation"("tokenHash");
CREATE INDEX        IF NOT EXISTS "TeamInvitation_tenantId_idx"      ON "TeamInvitation"("tenantId");
CREATE INDEX        IF NOT EXISTS "TeamInvitation_email_idx"         ON "TeamInvitation"("email");
CREATE INDEX        IF NOT EXISTS "TeamInvitation_status_idx"        ON "TeamInvitation"("status");

-- AddForeignKey: TeamInvitation -> Tenant
ALTER TABLE "TeamInvitation" DROP CONSTRAINT IF EXISTS "TeamInvitation_tenantId_fkey";
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: TeamInvitation -> User (quien invitó)
ALTER TABLE "TeamInvitation" DROP CONSTRAINT IF EXISTS "TeamInvitation_invitedById_fkey";
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_invitedById_fkey"
    FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
