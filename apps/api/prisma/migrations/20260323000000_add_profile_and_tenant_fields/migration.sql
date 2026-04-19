-- AddProfileAndTenantFields
-- Nuevos campos de perfil profesional para abogados

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "matricula" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "especialidad" TEXT;

-- Nuevos campos para el estudio jurídico (Tenant)
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "cuit" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "website" TEXT;
