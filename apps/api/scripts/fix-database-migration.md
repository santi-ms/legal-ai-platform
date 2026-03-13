# Solución Rápida: Aplicar Migración de Campos de Usuario

## 🔴 Problema
La columna `User.bio` no existe en la base de datos, causando errores al generar documentos.

## ✅ Solución Rápida

### Opción 1: Si el servidor está corriendo

El servidor ya tiene acceso a la base de datos. Simplemente ejecuta este SQL directamente en tu base de datos PostgreSQL:

```sql
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "bio" TEXT,
ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB;
```

### Opción 2: Usar psql o tu cliente de PostgreSQL

1. Conecta a tu base de datos PostgreSQL
2. Ejecuta:

```sql
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "bio" TEXT,
ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB;
```

### Opción 3: Configurar DATABASE_URL y usar Prisma

1. Agrega a `apps/api/.env`:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/nombre_base_datos"
```

2. Luego ejecuta:

```bash
cd apps/api
npm run migrate:deploy
```

## 🔍 Verificar que funcionó

Ejecuta en tu base de datos:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('bio', 'notificationPreferences');
```

Deberías ver ambas columnas.

## 📝 Nota

Si el servidor está corriendo y funcionando, significa que tiene acceso a la base de datos. Solo necesitas ejecutar el SQL manualmente o configurar DATABASE_URL en el .env para que Prisma pueda aplicar las migraciones automáticamente.

