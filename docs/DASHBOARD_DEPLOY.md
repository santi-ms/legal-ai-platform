# 🚀 Guía de Deploy del Dashboard

## Checklist Pre-Deploy

### Backend (Railway)

- [ ] **Configuración del servicio (elegir una opción):**

  **Opción A (Recomendada): Deploy desde raíz del monorepo**
  - [ ] Root Directory configurado a `/` (raíz del repo)
  - [ ] Start Command: `cd apps/api && npm start`
  - [ ] Esto asegura que `packages/db/prisma/schema.prisma` esté disponible

  **Opción B: Deploy desde `apps/api` (sin monorepo completo)**
  - [ ] Variable de entorno `PRISMA_SCHEMA_PATH` configurada (si el schema está en otra ubicación)
  - [ ] O dejar que los scripts omitan generate (no fallan si no hay schema)

- [ ] Variables de entorno configuradas:
  - `DATABASE_URL` (PostgreSQL)
  - `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM`
  - `FRONTEND_URL` (URL del frontend en Vercel)
  - `NEXTAUTH_SECRET` (mismo que en frontend)
  - `OPENAI_API_KEY`
  - `PDF_SERVICE_URL`
  - `PRISMA_SCHEMA_PATH` (opcional, solo si Opción B)

- [ ] Post-deploy scripts ejecutados:
  ```bash
  cd apps/api
  npm run migrate:deploy  # Genera cliente y aplica migraciones
  npm run db:seed         # Seed de datos iniciales
  ```

  **Nota**: Los scripts de Prisma no fallan si no encuentran el schema:
  - Si ya existe `@prisma/client`, omite generate
  - Si no existe, genera warning pero no rompe el build
  - `migrate:deploy` generará el cliente cuando el schema esté disponible

- [ ] Healthcheck configurado:
  - URL: `https://your-api.railway.app/healthz`
  - Expected: `{ "ok": true, "uptime": ..., "timestamp": ... }`

### Frontend (Vercel)

- [ ] Variables de entorno configuradas:
  - `NEXTAUTH_URL` (URL de producción del frontend)
  - `NEXTAUTH_SECRET` (mismo que en backend)
  - `NEXT_PUBLIC_API_URL` (URL del backend en Railway)

- [ ] Build verificado:
  ```bash
  npm run build
  ```

- [ ] Deploy verificado:
  - Dashboard accesible en `/dashboard`
  - Redirección a login funciona
  - Proxy funciona correctamente

## Comandos Post-Deploy

### Railway (Backend)

```bash
# 1. Conectarse al servicio
railway link

# 2. Ejecutar migraciones
railway run npm --workspace apps/api run migrate:deploy

# 3. Seed de datos iniciales
railway run npm --workspace apps/api run db:seed

# 4. Verificar healthcheck
curl https://your-api.railway.app/healthz
```

### Vercel (Frontend)

```bash
# 1. Deploy automático desde main branch
git push origin main

# 2. Verificar build logs en Vercel dashboard

# 3. Verificar que el dashboard funciona
# Navegar a: https://your-app.vercel.app/dashboard
```

## Verificación Post-Deploy

### 1. Verificar Proxy

```bash
# Desde el navegador (DevTools → Network)
# Debe mostrar requests a /api/_proxy/documents
# NO debe mostrar JWT en headers ni responses
```

### 2. Verificar Autenticación

1. Ir a `/dashboard` sin login → debe redirigir a `/auth/login`
2. Loguearse → debe redirigir a `/dashboard`
3. Verificar que los documentos se cargan correctamente

### 3. Verificar Filtros

1. Aplicar filtros (tipo, búsqueda, fechas)
2. Verificar que la URL se actualiza
3. Recargar la página → debe mantener los filtros

### 4. Verificar Acciones

1. Preview PDF → debe abrir modal con iframe
2. Descargar PDF → debe descargar correctamente
3. Duplicar → debe mostrar toast de éxito
4. Eliminar (admin) → debe mostrar confirmación

### 5. Verificar RBAC

1. Como admin → debe ver botón "Eliminar"
2. Como user regular → NO debe ver botón "Eliminar"

## Troubleshooting

### Error 401 en Proxy

**Causa:** `NEXTAUTH_SECRET` no configurado o diferente entre frontend/backend

**Solución:**
1. Verificar que `NEXTAUTH_SECRET` está configurado en Vercel
2. Verificar que es el mismo valor en Railway (si se usa para validar JWT)
3. Verificar que el usuario está autenticado

### PDF no se muestra

**Causa:** CORS o permisos del documento

**Solución:**
1. Verificar que el documento tiene `lastVersion.pdfUrl`
2. Verificar que el usuario tiene acceso al documento (mismo tenantId)
3. Verificar logs del backend para errores

### Build falla en Vercel

**Causa:** Errores de TypeScript o dependencias faltantes

**Solución:**
1. Ejecutar `npm run build` localmente
2. Verificar que todas las dependencias están en `package.json`
3. Verificar logs de build en Vercel para detalles

## Monitoreo

### Métricas a Monitorear

- **Healthcheck**: `/healthz` debe responder OK
- **Tiempo de respuesta**: Proxy debe responder en <500ms
- **Errores 401**: Monitorear intentos de acceso no autorizado
- **Errores 500**: Monitorear errores del servidor

### Logs Importantes

- `[proxy/documents] Error:` - Errores en el proxy
- `[auth]` - Errores de autenticación
- `Prisma` - Errores de base de datos

## Seguridad en Producción

- ✅ JWT nunca expuesto al cliente
- ✅ `NEXTAUTH_SECRET` solo en variables de entorno (server-side)
- ✅ Headers `Cache-Control: no-store` en todas las respuestas
- ✅ Sanitización de filenames en PDF
- ✅ Validación de tenantId en todos los endpoints
- ✅ RBAC en frontend y backend

