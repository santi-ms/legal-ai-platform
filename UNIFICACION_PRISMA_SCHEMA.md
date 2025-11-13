# 🔧 Unificación de Schema Prisma - Solución Definitiva

**Fecha:** Noviembre 13, 2025  
**Problema:** Error P2022 - Column "Tenant.updatedAt" no existe debido a schemas duplicados

---

## 📋 Resumen del Problema

El proyecto tenía múltiples schemas de Prisma duplicados:
- `packages/db/prisma/schema.prisma` (schema central)
- `apps/api/prisma/schema.prisma` (duplicado)
- `apps/web/prisma/schema.prisma` (duplicado)

Esto causaba:
- Desincronización entre código y base de datos
- Migraciones no aplicadas en producción
- Errores P2022 (columnas faltantes)

---

## ✅ Solución Implementada

### 1. Schema Único Centralizado

**✅ Schema válido:**
- `packages/db/prisma/schema.prisma` - **ÚNICO schema válido**

**❌ Eliminados:**
- `apps/api/prisma/schema.prisma` - Eliminado
- Migraciones duplicadas en `apps/api/prisma/migrations/` - Eliminadas

### 2. Prisma Client Compartido

**Package compartido:** `packages/db`

Todos los servicios importan el mismo Prisma Client:

```typescript
import { prisma } from "db";
```

**Ventajas:**
- Una sola instancia de Prisma Client
- Schema siempre sincronizado
- Sin duplicación de código

### 3. Scripts Unificados

**`apps/api/package.json`:**

```json
{
  "scripts": {
    "prisma:generate": "prisma generate --schema ../../packages/db/prisma/schema.prisma",
    "migrate:dev": "prisma migrate dev --schema ../../packages/db/prisma/schema.prisma",
    "migrate:deploy": "prisma migrate deploy --schema ../../packages/db/prisma/schema.prisma",
    "prisma:migrate:deploy": "prisma migrate deploy --schema ../../packages/db/prisma/schema.prisma"
  }
}
```

**Todos los scripts apuntan al schema compartido.**

### 4. Migraciones Centralizadas

**Ubicación única:**
- `packages/db/prisma/migrations/`

**Migraciones existentes:**
- `20251031201409_init_postgresql/` - Migración inicial
- `20251106163004_add_user_columns/` - Columnas de User
- `20251113_add_tenant_updated_at/` - Agregar updatedAt a Tenant

### 5. Configuración de Railway

**Start Command en Railway:**

```
npm run migrate:deploy && npm start
```

**O alternativamente (más explícito):**

```
cd apps/api && npm run migrate:deploy && npm start
```

Esto asegura que:
1. Se aplican todas las migraciones pendientes
2. Se genera el Prisma Client
3. Se inicia el servidor

---

## 📝 Archivos Modificados

### Eliminados:
- ✅ `apps/api/prisma/schema.prisma` - Schema duplicado eliminado
- ✅ `apps/api/prisma/migrations/` - Migraciones duplicadas (mantener solo las de packages/db)

### Modificados:

1. **`packages/db/prisma/schema.prisma`**
   - Agregado `updatedAt` a modelo `Tenant`

2. **`apps/api/package.json`**
   - Scripts actualizados para usar schema compartido
   - Agregado `"db": "*"` como dependencia
   - Scripts simplificados

3. **`apps/api/tsconfig.json`**
   - Agregado path alias para `"db"`

4. **`apps/api/src/routes.documents.ts`**
   - Cambiado: `import { PrismaClient } from "@prisma/client"` + `new PrismaClient()`
   - Por: `import { prisma } from "db"`

5. **`apps/api/src/routes.auth.ts`**
   - Cambiado: `import { PrismaClient } from "@prisma/client"` + `new PrismaClient()`
   - Por: `import { prisma } from "db"`

6. **`apps/api/src/server.ts`**
   - Actualizado `runMigrations()` para usar solo schema compartido
   - Eliminados fallbacks a schemas locales

7. **`apps/api/scripts/seed.ts`**
   - Cambiado para usar `prisma` compartido

8. **`apps/api/README.md`**
   - Documentación actualizada con instrucciones correctas

### Creados:

1. **`packages/db/prisma/migrations/20251113_add_tenant_updated_at/migration.sql`**
   - Migración para agregar `updatedAt` a Tenant

2. **`MIGRACION_TENANT_UPDATEDAT.md`**
   - Documentación de la migración

3. **`UNIFICACION_PRISMA_SCHEMA.md`** (este archivo)
   - Documentación completa de la unificación

---

## 🚀 Instrucciones para Deploy en Railway

### Paso 1: Configurar Start Command

1. **Ir a Railway:**
   - Railway Dashboard → Tu servicio API → Settings → Deploy

2. **Start Command:**
   ```
   npm run migrate:deploy && npm start
   ```

   O más explícito:
   ```
   cd apps/api && npm run migrate:deploy && npm start
   ```

3. **Guardar cambios**

### Paso 2: Verificar Variables de Entorno

Asegúrate de que estén configuradas:
- ✅ `DATABASE_URL` - Configurado automáticamente por Railway
- ✅ `NODE_ENV=production` - Para activar migraciones automáticas
- ✅ `NEXTAUTH_SECRET` - Mismo valor que en Vercel
- ✅ `OPENAI_API_KEY` - API key de OpenAI

### Paso 3: Deploy

1. **Hacer commit y push:**
   ```bash
   git add .
   git commit -m "Unificar schema Prisma - usar solo packages/db/prisma/schema.prisma"
   git push
   ```

2. **Railway hará deploy automáticamente**

3. **Verificar logs:**
   - Buscar: `[migrate] 🔄 Ejecutando migraciones de Prisma...`
   - Buscar: `[migrate] ✅ Migraciones aplicadas correctamente`
   - Buscar: `[api] listening on 4001`

### Paso 4: Verificar Migración

1. **Ir a Railway → PostgreSQL → Query**

2. **Verificar columna:**
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'Tenant' AND column_name = 'updatedAt';
   ```

3. **Debería mostrar:**
   ```
   column_name | data_type      | is_nullable | column_default
   updatedAt   | timestamp(3)   | NO          | CURRENT_TIMESTAMP
   ```

### Paso 5: Probar Generación de Documento

1. **Loguearse en producción**
2. **Generar un documento**
3. **Verificar que no aparece error P2022**
4. **Verificar logs:**
   - No debe aparecer: `Error de base de datos: La columna 'Tenant.updatedAt' no existe`
   - Debe aparecer: `✅ Request exitoso` o similar

---

## ✅ Verificación Post-Deploy

### Checklist:

- [ ] Schema único en `packages/db/prisma/schema.prisma`
- [ ] No hay schemas duplicados en `apps/api/prisma/` o `apps/web/prisma/`
- [ ] Todas las migraciones en `packages/db/prisma/migrations/`
- [ ] Scripts en `apps/api/package.json` apuntan al schema compartido
- [ ] Imports usan `import { prisma } from "db"`
- [ ] Railway Start Command configurado: `npm run migrate:deploy && npm start`
- [ ] Build pasa sin errores: `npm run build`
- [ ] Columna `Tenant.updatedAt` existe en producción
- [ ] Generación de documentos funciona sin errores P2022

---

## 🔍 Troubleshooting

### Si el build falla:

1. **Verificar que `db` está en dependencias:**
   ```bash
   cd apps/api
   npm install
   ```

2. **Regenerar Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

3. **Verificar paths en tsconfig.json:**
   ```json
   {
     "paths": {
       "db": ["../../packages/db/index.ts"]
     }
   }
   ```

### Si las migraciones no se aplican:

1. **Verificar DATABASE_URL:**
   ```bash
   echo $DATABASE_URL
   ```

2. **Ejecutar manualmente:**
   ```bash
   cd apps/api
   DATABASE_URL="tu-url" npm run migrate:deploy
   ```

3. **Verificar logs de Railway:**
   - Buscar errores en `[migrate]`

### Si aparece error "db module not found":

1. **Verificar que `db` está en package.json:**
   ```json
   {
     "dependencies": {
       "db": "*"
     }
   }
   ```

2. **Reinstalar dependencias:**
   ```bash
   npm install
   ```

---

## 📚 Estructura Final

```
legal-ai-platform/
├── packages/
│   └── db/
│       ├── index.ts                    # Exporta prisma compartido
│       └── prisma/
│           ├── schema.prisma           # ✅ ÚNICO schema válido
│           └── migrations/             # ✅ Migraciones centralizadas
│               ├── 20251031201409_init_postgresql/
│               ├── 20251106163004_add_user_columns/
│               └── 20251113_add_tenant_updated_at/
│
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── routes.documents.ts    # Usa: import { prisma } from "db"
│   │   │   ├── routes.auth.ts         # Usa: import { prisma } from "db"
│   │   │   └── server.ts              # Migraciones automáticas
│   │   ├── package.json               # Scripts apuntan a schema compartido
│   │   └── tsconfig.json              # Path alias para "db"
│   │
│   └── web/
│       └── ... (no usa Prisma directamente)
```

---

## 🎯 Resultado Esperado

Después de aplicar estos cambios:

1. ✅ **Un solo schema:** `packages/db/prisma/schema.prisma`
2. ✅ **Migraciones centralizadas:** `packages/db/prisma/migrations/`
3. ✅ **Prisma Client compartido:** `import { prisma } from "db"`
4. ✅ **Migraciones automáticas en Railway:** Antes de iniciar el servidor
5. ✅ **Sin errores P2022:** Todas las columnas existen en producción
6. ✅ **Generación de documentos funciona:** Sin errores de base de datos

---

**Última actualización:** Noviembre 13, 2025

