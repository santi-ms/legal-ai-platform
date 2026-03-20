-- AlterTable: add OTP-based email verification support
ALTER TABLE "User"
ADD COLUMN "emailVerificationCodeHash" TEXT,
ADD COLUMN "emailVerificationExpiresAt" TIMESTAMP(3),
ADD COLUMN "emailVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "emailVerificationLastSentAt" TIMESTAMP(3),
ADD COLUMN "emailVerificationResendAfter" TIMESTAMP(3);

-- Backfill existing accounts as already verified so current users are not blocked by the new OTP flow.
UPDATE "User"
SET "emailVerified" = COALESCE("emailVerified", NOW())
WHERE "emailVerified" IS NULL;