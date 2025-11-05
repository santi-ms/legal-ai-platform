# 🚂 Railway Deploy - Prisma Schema Autodetección

## Problema

En Railway, cuando el servicio API se deploya con CWD en `/app` y el repo solo incluye el subdirectorio `apps/api` (sin el monorepo completo), no existe `packages/db/prisma/schema.prisma`, causando que `postinstall` falle.

## Solución

Los scripts de Prisma (`prisma-generate.js` y `prisma-migrate.js`) ahora:

1. ✅ **No fallan si no encuentran el schema** - Exit code 0 con warning
2. ✅ **Soportan override por env** - Variable `PRISMA_SCHEMA_PATH`
3. ✅ **Verifican si ya existe cliente** - Si `@prisma/client` existe, omiten generate
4. ✅ **Logs informativos** - Muestran CWD y rutas probadas

## Estrategias de Deploy

### Opción A: Deploy desde Raíz del Monorepo (Recomendada) ⭐

**Configuración en Railway:**

1. Settings → Service → Root Directory: `/` (raíz del repo)
2. Start Command: `cd apps/api && npm start`
3. Build Command: (dejar por defecto o `npm install`)

**Ventajas:**
- ✅ Schema siempre disponible (`packages/db/prisma/schema.prisma`)
- ✅ Scripts funcionan sin configuración adicional
- ✅ E2E tests pueden ejecutarse desde el repo completo
- ✅ Monorepo completo disponible para CI/CD

**Desventajas:**
- ⚠️ Deploy puede ser más lento (incluye todo el repo)

### Opción B: Deploy desde `apps/api` (Sin Monorepo Completo)

**Configuración en Railway:**

1. Settings → Service → Root Directory: `apps/api` (o dejar por defecto)
2. Start Command: `npm start`
3. Build Command: `npm install` (o por defecto)

**Opción B1: Con Variable de Entorno**

Si el schema está disponible en otra ubicación:

1. Agregar variable de entorno:
   ```
   PRISMA_SCHEMA_PATH=/app/packages/db/prisma/schema.prisma
   ```
   (Ajustar según la estructura real)

2. Los scripts usarán esta ruta si existe

**Opción B2: Sin Schema en Build**

Dejar que los scripts omitan generate:

1. No configurar `PRISMA_SCHEMA_PATH`
2. El `postinstall` no fallará (warning pero exit 0)
3. `migrate:deploy` generará el cliente cuando el schema esté disponible

**Ventajas:**
- ✅ Deploy más rápido (solo incluye `apps/api`)
- ✅ Build más liviano

**Desventajas:**
- ⚠️ Schema debe estar disponible en runtime (o en migrate:deploy)
- ⚠️ Requiere configuración adicional si se usa `PRISMA_SCHEMA_PATH`

## Comportamiento de los Scripts

### `prisma-generate.js` (postinstall)

**Si encuentra schema:**
```
✅ Usando schema: /path/to/schema.prisma
✅ Prisma Client generado exitosamente
```

**Si NO encuentra schema pero ya existe cliente:**
```
⚠️  No se encontró schema.prisma en el entorno de build.
ℹ️  @prisma/client ya existe; omito generate para no romper el build.
```
Exit code: 0 (no rompe el build)

**Si NO encuentra schema y NO existe cliente:**
```
⚠️  No se encontró schema.prisma en el entorno de build.
ℹ️  Omitiendo generate. Generá el cliente cuando el schema esté disponible (p.ej., en migrate:deploy).
```
Exit code: 0 (no rompe el build)

### `prisma-migrate.js` (migrate:deploy)

**Si encuentra schema:**
```
✅ Usando schema: /path/to/schema.prisma | modo: deploy
✅ Migración deploy completada exitosamente
```

**Si NO encuentra schema:**
```
⚠️  Schema no encontrado. Modo deploy. Omito migración sin romper el build.
ℹ️  Para ejecutar migraciones, asegurate de que el schema esté disponible.
```
Exit code: 0 (no rompe el deploy)

## Variables de Entorno

### `PRISMA_SCHEMA_PATH` (Opcional)

**Cuándo usar:**
- Opción B (deploy desde `apps/api`)
- El schema está en una ubicación no estándar

**Ejemplo:**
```
PRISMA_SCHEMA_PATH=/app/packages/db/prisma/schema.prisma
```

**Prioridad:**
1. `PRISMA_SCHEMA_PATH` (si existe y el archivo está)
2. Rutas candidatas estándar (monorepo)
3. Fallback locales

## Flujo Recomendado

### Opción A (Recomendada)

```
1. Railway configurado con Root Directory = /
2. Build ejecuta: npm install
3. postinstall ejecuta: node scripts/prisma-generate.js
4. Schema encontrado: packages/db/prisma/schema.prisma
5. Prisma Client generado exitosamente
6. Start Command: cd apps/api && npm start
```

### Opción B (Alternativa)

```
1. Railway configurado con Root Directory = apps/api
2. Build ejecuta: npm install
3. postinstall ejecuta: node scripts/prisma-generate.js
4. Schema NO encontrado → warning pero exit 0
5. @prisma/client ya incluido en node_modules (del build)
6. Post-deploy: npm run migrate:deploy
7. migrate:deploy encuentra schema (si está disponible) o genera cliente
8. Migraciones aplicadas
```

## Troubleshooting

### Error: "No se encontró schema.prisma"

**Síntomas:**
- Warning en logs pero build no falla
- `@prisma/client` puede no estar generado

**Solución:**
1. Verificar Root Directory en Railway
2. Si Opción B, configurar `PRISMA_SCHEMA_PATH`
3. O asegurar que `@prisma/client` está en `node_modules` (incluido en build)

### Error: "Cannot find module '@prisma/client'"

**Síntomas:**
- Runtime error al iniciar la API
- `@prisma/client` no está en `node_modules`

**Solución:**
1. Asegurar que `@prisma/client` está en `package.json` dependencies
2. Verificar que `npm install` se ejecutó correctamente
3. Si Opción B, ejecutar `migrate:deploy` en post-deploy (genera el cliente)

### Error: "Prisma schema not found" en migrate:deploy

**Síntomas:**
- `migrate:deploy` no encuentra el schema
- Warning pero no falla

**Solución:**
1. Configurar `PRISMA_SCHEMA_PATH` si el schema está en otra ubicación
2. O cambiar a Opción A (deploy desde raíz)
3. Verificar que el schema está disponible en el entorno de deploy

## Verificación Post-Deploy

```bash
# 1. Verificar que el cliente está generado
railway run ls -la apps/api/node_modules/@prisma/client

# 2. Verificar que las migraciones se aplicaron
railway run cd apps/api && npm run migrate:deploy

# 3. Verificar que el seed funcionó
railway run cd apps/api && npm run db:seed

# 4. Verificar healthcheck
curl https://your-api.railway.app/healthz
```

## Recomendación Final

**Para producción, usar Opción A (deploy desde raíz del monorepo):**

1. Más simple y predecible
2. Schema siempre disponible
3. No requiere configuración adicional
4. Mejor para CI/CD y tests

**Opción B solo si:**
- Necesitas deploy más rápido
- El repo es muy grande
- Tienes control sobre la estructura del deploy


