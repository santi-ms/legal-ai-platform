-- Script SQL completo para configurar la base de datos
-- Ejecutar esto en Supabase SQL Editor

-- 1. Crear tabla Tenant si no existe
CREATE TABLE IF NOT EXISTS "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- 2. Crear tabla User si no existe
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "tenantId" TEXT,
    "emailVerified" TIMESTAMP(3),
    "company" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- 3. Agregar columnas faltantes a User si ya existe
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 4. Hacer tenantId opcional si es necesario
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'User' AND column_name = 'tenantId' AND is_nullable = 'NO') THEN
        ALTER TABLE "User" ALTER COLUMN "tenantId" DROP NOT NULL;
    END IF;
END $$;

-- 5. Agregar updatedAt a Tenant si falta
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 6. Crear índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- 7. Agregar foreign keys si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_tenantId_fkey') THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" 
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Verificar que las columnas existen
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('User', 'Tenant')
ORDER BY table_name, ordinal_position;

