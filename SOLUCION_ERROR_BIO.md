# Solución al Error: Columna "User.bio" no existe

## 🔴 Problema
El error indica que la columna `User.bio` no existe en la tabla `User` de la base de datos. Esto significa que la migración de Prisma no se ha aplicado.

## ✅ Solución

### Opción 1: Aplicar Migración con Prisma (Recomendado)

Si tienes `DATABASE_URL` configurada en tu `.env`, ejecuta:

```bash
cd apps/api
npx prisma migrate deploy
```

O si estás en desarrollo:

```bash
cd apps/api
npx prisma migrate dev
```

### Opción 2: Ejecutar SQL Manualmente

Si no puedes usar Prisma CLI, ejecuta este SQL directamente en tu base de datos:

```sql
-- Agregar columnas bio y notificationPreferences a la tabla User
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "bio" TEXT,
ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB;
```

### Opción 3: Verificar y Aplicar Migración Pendiente

1. Verifica el estado de las migraciones:
```bash
cd apps/api
npx prisma migrate status
```

2. Si hay migraciones pendientes, aplícalas:
```bash
npx prisma migrate deploy
```

3. Regenera el Prisma Client:
```bash
npx prisma generate
```

## 📋 Verificación

Después de aplicar la migración, verifica que las columnas existan:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('bio', 'notificationPreferences');
```

Deberías ver ambas columnas listadas.

## 🔧 Configuración de DATABASE_URL

Si el error persiste porque `DATABASE_URL` no está configurada, agrega esto a tu `.env` en `apps/api/`:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/nombre_base_datos"
```

O para SQLite (desarrollo):

```env
DATABASE_URL="file:./dev.db"
```

## 📝 Notas

- La migración `20250115000000_add_user_profile_fields` ya existe en `apps/api/prisma/migrations/`
- Los esquemas de Prisma en `apps/api/prisma/schema.prisma` y `packages/db/prisma/schema.prisma` ya están sincronizados
- Las columnas son opcionales (nullable), por lo que no afectarán registros existentes

