# 🔧 Migración: Agregar `updatedAt` a Tenant

**Fecha:** Noviembre 13, 2025  
**Problema:** Error `Tenant.updatedAt` no existe en producción

---

## 📋 Resumen

El modelo `Tenant` en el schema de Prisma ahora incluye `updatedAt`, pero la base de datos de producción no tiene esta columna, causando errores al crear/actualizar tenants.

---

## ✅ Cambios Realizados

### 1. Schema Actualizado (`packages/db/prisma/schema.prisma`)

**Agregado:**
```prisma
model Tenant {
  id        String      @id @default(uuid())
  name      String
  users     User[]
  documents Document[]
  logs      IAUsageLog[]
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt  // ← NUEVO
}
```

### 2. Migración Creada

**Archivo:** `packages/db/prisma/migrations/20251113_add_tenant_updated_at/migration.sql`

```sql
-- AlterTable: Agregar updatedAt a Tenant
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
```

### 3. Scripts Actualizados

**Agregado en `apps/api/package.json`:**
- `prisma:migrate:deploy` - Alias para `migrate:deploy`

---

## 🚀 Aplicar Migración en Producción

### Opción A: SQL Directo en Railway (Más Rápido)

1. **Ir a Railway:**
   - Railway Dashboard → Tu servicio PostgreSQL → Query

2. **Ejecutar SQL:**
   ```sql
   ALTER TABLE "Tenant" 
   ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
   ```

3. **Verificar:**
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'Tenant' AND column_name = 'updatedAt';
   ```

### Opción B: Usar Prisma Migrate Deploy

1. **Configurar DATABASE_URL:**
   ```bash
   # En Railway, copiar DATABASE_URL de Variables
   export DATABASE_URL="postgresql://user:pass@host:port/db"
   ```

2. **Aplicar migraciones:**
   ```bash
   cd apps/api
   npm run migrate:deploy
   ```

   Esto aplicará todas las migraciones pendientes, incluyendo la de `updatedAt`.

### Opción C: Automatizar en Railway

**Configurar Start Command en Railway:**

1. **Railway → Settings → Deploy**
2. **Start Command:**
   ```
   npm run migrate:deploy && npm start
   ```

   Esto aplicará migraciones automáticamente antes de iniciar el servidor.

**O usar Deploy Hook (Recomendado):**

1. **Railway → Settings → Deploy Hooks**
2. **Crear hook:**
   - **Name:** `Run Migrations`
   - **Command:** `cd apps/api && npm run migrate:deploy`

3. **Ejecutar manualmente después de cada deploy** (o configurar para ejecución automática)

---

## ✅ Verificación Post-Migración

### 1. Verificar Columna

```sql
-- En Railway PostgreSQL Query
\d "Tenant"
```

Deberías ver:
```
Column     | Type           | Nullable | Default
-----------+----------------+----------+------------------
id         | text           | not null | 
name       | text           | not null | 
createdAt  | timestamp(3)   | not null | CURRENT_TIMESTAMP
updatedAt  | timestamp(3)   | not null | CURRENT_TIMESTAMP  ← NUEVO
```

### 2. Probar Creación de Documento

1. **Generar un documento desde la UI**
2. **Verificar logs de Railway:**
   - No debe aparecer: `Error de base de datos: La columna 'Tenant.updatedAt' no existe`
   - Debe aparecer: `✅ Request exitoso` o similar

### 3. Verificar Actualización de Tenant

Si hay código que actualiza tenants, verificar que `updatedAt` se actualiza automáticamente.

---

## 🔍 Troubleshooting

### Si la migración falla:

1. **Verificar que DATABASE_URL es correcto:**
   ```bash
   echo $DATABASE_URL
   ```

2. **Verificar permisos:**
   - El usuario de la DB debe tener permisos para ALTER TABLE

3. **Verificar si la columna ya existe:**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'Tenant' AND column_name = 'updatedAt';
   ```
   
   Si ya existe, la migración se saltará (gracias a `IF NOT EXISTS`).

### Si el error persiste:

1. **Verificar que el cliente de Prisma se regeneró:**
   ```bash
   cd apps/api
   npm run postinstall
   ```

2. **Verificar que el schema está sincronizado:**
   ```bash
   cd packages/db
   npx prisma db pull
   npx prisma generate
   ```

---

## 📝 Notas Técnicas

### Por qué `@updatedAt`?

El decorador `@updatedAt` en Prisma:
- Actualiza automáticamente el campo cuando se modifica el registro
- No requiere que lo establezcas manualmente en `update()`
- Es equivalente a `ON UPDATE CURRENT_TIMESTAMP` en SQL

### Compatibilidad

- ✅ PostgreSQL (producción)
- ✅ SQLite (desarrollo local)
- ✅ Todas las versiones de Prisma 5.x

---

## ✅ Checklist

- [ ] Schema actualizado con `updatedAt` en Tenant
- [ ] Migración SQL creada
- [ ] Migración aplicada en producción (Railway)
- [ ] Columna `updatedAt` verificada en base de datos
- [ ] Prueba de creación de documento exitosa
- [ ] Scripts de package.json actualizados
- [ ] Documentación creada

---

**Última actualización:** Noviembre 13, 2025

