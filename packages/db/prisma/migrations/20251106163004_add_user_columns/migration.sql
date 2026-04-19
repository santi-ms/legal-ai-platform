-- AlterTable: Agregar columnas faltantes a User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: Hacer tenantId opcional (NULL)
ALTER TABLE "User" ALTER COLUMN "tenantId" DROP NOT NULL;

