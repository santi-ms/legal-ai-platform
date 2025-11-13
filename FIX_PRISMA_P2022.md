# 🔧 Fix: Error P2022 - Columna no existe en PostgreSQL

**Fecha:** Noviembre 13, 2025  
**Problema:** Error P2022 al crear documentos en producción (Railway)

---

## 📋 Resumen del Problema

Al intentar crear un documento en producción, Prisma devuelve:
```
P2022: Column <X> does not exist in the current table
```

**Causa:** El schema de Prisma (`packages/db/prisma/schema.prisma`) tiene campos que no existen en la base de datos PostgreSQL de Railway.

---

## ✅ Cambios Realizados

### 1. Logs Mejorados en `apps/api/src/routes.documents.ts`

**Agregado:**
- Log del payload antes de crear el documento
- Log detallado del error P2022 con nombre de columna
- Mensaje de error más descriptivo que indica qué columna falta

**Cambios:**
- Corregido `estado: "GENERATED"` → `estado: "generated_text"` (valor correcto según schema)

### 2. Scripts para Diagnóstico

**Creados:**
- `apps/api/scripts/generate-migration-diff.sh` - Genera diff entre DB y schema
- `apps/api/scripts/sync-production-schema.js` - Sincroniza schema con DB

---

## 🔍 Campos del Modelo Document (según schema.prisma)

El modelo `Document` debe tener estos campos:

```prisma
model Document {
  id             String            @id @default(uuid())
  tenantId       String            // NOT NULL
  createdById    String            // NOT NULL
  type           String            // NOT NULL
  jurisdiccion   String            // NOT NULL
  tono           String            // NOT NULL
  estado         String            // NOT NULL
  costUsd        Float?            // NULLABLE
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
}
```

**Relaciones:**
- `tenantId` → `Tenant.id` (foreign key)
- `createdById` → `User.id` (foreign key)

---

## 🛠️ Pasos para Resolver

### Opción A: Aplicar Migraciones Existentes (Recomendado)

1. **Verificar migraciones pendientes:**
   ```bash
   cd apps/api
   npm run migrate:deploy
   ```

2. **Si falla, generar nueva migración:**
   ```bash
   cd packages/db
   npx prisma migrate dev --name fix-document-columns
   ```

3. **Aplicar en Railway:**
   - Ir a Railway → PostgreSQL → Query
   - Ejecutar el SQL de la migración generada

### Opción B: Generar Diff y Aplicar Manualmente

1. **Generar diff:**
   ```bash
   cd apps/api
   DATABASE_URL="postgresql://..." node scripts/sync-production-schema.js
   ```

2. **Revisar el diff generado** (`migration-diff.sql`)

3. **Aplicar en Railway:**
   - Ir a Railway → PostgreSQL → Query
   - Copiar y pegar el SQL del diff
   - Ejecutar

### Opción C: Crear Migración Manual

Si las opciones anteriores no funcionan, crear una migración SQL manual:

```sql
-- Verificar qué columnas faltan
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Document'
ORDER BY ordinal_position;

-- Agregar columnas faltantes (ejemplo)
ALTER TABLE "Document" 
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS "createdById" TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS "jurisdiccion" TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS "tono" TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS "estado" TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS "costUsd" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW();

-- Agregar foreign keys
ALTER TABLE "Document"
  ADD CONSTRAINT "Document_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id"),
  ADD CONSTRAINT "Document_createdById_fkey" 
    FOREIGN KEY ("createdById") REFERENCES "User"("id");
```

---

## 📊 Verificación Post-Fix

Después de aplicar las migraciones:

1. **Verificar estructura de tabla:**
   ```sql
   \d "Document"
   ```

2. **Probar creación de documento:**
   - Generar un documento desde la UI
   - Verificar que no aparece error P2022
   - Verificar en logs que el documento se crea correctamente

3. **Verificar logs:**
   - Buscar: `[_proxy] ✅ Token encontrado`
   - Buscar: `Intentando crear documento con datos:`
   - No debe aparecer: `Prisma P2022: Columna no existe`

---

## 🔍 Diagnóstico de Errores

### Si sigue apareciendo P2022:

1. **Revisar logs de Railway:**
   - Buscar el mensaje: `Prisma P2022: Columna no existe en la tabla`
   - Ver el campo `meta.column` para identificar la columna faltante

2. **Verificar schema vs DB:**
   ```bash
   cd packages/db
   npx prisma db pull
   ```
   Esto generará un nuevo schema basado en la DB actual. Comparar con `schema.prisma`.

3. **Verificar migraciones aplicadas:**
   ```sql
   SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC;
   ```

---

## 📝 Notas Técnicas

### Campos NOT NULL sin default:

Los siguientes campos son NOT NULL y deben tener valores:
- `tenantId` - Viene del JWT (proxy)
- `createdById` - Viene del JWT (proxy)
- `type` - Viene del request body
- `jurisdiccion` - Viene del request body
- `tono` - Viene del request body
- `estado` - Se establece como "generated_text"

### Valores de `estado`:

Según el schema, los valores válidos son:
- `"generated_text"`
- `"ready_pdf"`
- `"error"`

**NO usar:** `"GENERATED"` (mayúsculas) - esto causará problemas.

---

## ✅ Checklist de Resolución

- [ ] Logs mejorados aplicados
- [ ] Valor de `estado` corregido a `"generated_text"`
- [ ] Migraciones aplicadas en Railway
- [ ] Tabla `Document` tiene todas las columnas necesarias
- [ ] Foreign keys configuradas correctamente
- [ ] Prueba de creación de documento exitosa
- [ ] No aparece error P2022 en logs

---

**Última actualización:** Noviembre 13, 2025

