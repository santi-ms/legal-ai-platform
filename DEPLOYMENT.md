# 🚀 Guía de Deployment a Producción

## Resumen Ejecutivo

Esta guía describe el proceso completo para deployar la aplicación Legal AI Platform a producción en Vercel (frontend) y Railway (backend API).

---

## 📋 Pre-requisitos

1. **Cuentas:**
   - Vercel (frontend)
   - Railway (backend API)
   - Supabase o PostgreSQL (base de datos)

2. **Variables de entorno configuradas** (ver sección abajo)

3. **Repositorio Git conectado** a Vercel y Railway

---

## 🔧 Variables de Entorno

### Frontend (Vercel)

Configurar en: **Project Settings → Environment Variables**

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NEXTAUTH_URL` | `https://tu-app.vercel.app` | ⚠️ **Requerida para build** |
| `NEXTAUTH_SECRET` | `[generar con: openssl rand -base64 32]` | Secret para JWT |
| `NEXT_PUBLIC_API_URL` | `https://tu-api.railway.app` | URL del backend API |
| `NEXT_PUBLIC_INACTIVITY_MINUTES` | `30` | (Opcional) Minutos de inactividad |

### Backend (Railway)

Configurar en: **Variables tab**

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Connection string de PostgreSQL (Supabase) |
| `POSTMARK_SERVER_TOKEN` | `postmark-server-token` | Provider principal de emails transaccionales |
| `EMAIL_SERVER_HOST` | `smtp.gmail.com` | SMTP server |
| `EMAIL_SERVER_PORT` | `587` | SMTP port |
| `EMAIL_SERVER_USER` | `tu-email@gmail.com` | Usuario SMTP |
| `EMAIL_SERVER_PASSWORD` | `[App Password de Gmail]` | Password SMTP |
| `EMAIL_FROM` | `Legal AI <noreply@tu-dominio.com>` | Remitente |
| `FRONTEND_URL` | `https://tu-app.vercel.app` | URL del frontend |
| `PORT` | `4001` | (Opcional) Puerto del servidor |
| `OPENAI_API_KEY` | `sk-...` | API key de OpenAI |

Prioridad de providers para email: `POSTMARK_SERVER_TOKEN` -> SMTP (`EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`) -> logger fallback.

---

## 🚢 Deploy del Frontend (Vercel)

1. **Conectar repositorio:**
   - Ve a [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Selecciona tu repositorio
   - Root Directory: `apps/web`

2. **Configurar variables de entorno** (ver tabla arriba)

3. **Build Settings:**
   - Framework Preset: Next.js
   - Build Command: `npm run build` (o `cd apps/web && npm run build`)
   - Output Directory: `.next`

4. **Deploy:**
   - Vercel detectará automáticamente los cambios en `main`
   - Cada push hará un nuevo deploy

---

## 🔧 Deploy del Backend (Railway)

1. **Crear proyecto:**
   - Ve a [Railway Dashboard](https://railway.app)
   - Click "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Selecciona tu repositorio

2. **Configurar servicio:**
   - Root Directory: `apps/api`
   - Build Command: `npm run build`
   - Start Command: `npm start`

3. **Configurar variables de entorno** (ver tabla arriba)

4. **Post-Deploy Script (IMPORTANTE):**

   En Railway, configurar el post-deploy command:

   ```bash
   cd apps/api && npm run migrate:deploy && npm run db:seed
   ```

   **Cómo configurarlo:**
   - Ve a tu servicio en Railway
   - Settings → Deploy
   - En "Post Deploy Command", agregar:
     ```
     cd apps/api && npm run migrate:deploy && npm run db:seed
     ```

   Esto asegura que:
   - Las migraciones se ejecuten automáticamente después de cada deploy
   - El seed cree el Tenant y Admin por defecto si no existen

5. **Healthcheck:**
   - Settings → Healthcheck
   - Path: `/healthz`
   - Interval: 30s
   - Timeout: 5s

---

## 🚧 Entornos sin Monorepo Completo (Railway)

Si el deploy de `apps/api` se ejecuta desde un subdirectorio sin acceso a `packages/`, el sistema usa un **schema de fallback** ubicado en `apps/api/prisma/schema.prisma`.

### Sistema de Fallback Automático

El proyecto incluye un **schema de fallback** en `apps/api/prisma/schema.prisma` que es idéntico al schema central. Los scripts de Prisma buscan el schema en este orden:

1. **`PRISMA_SCHEMA_PATH`** (si está definida como variable de entorno)
2. **Schema central** (`packages/db/prisma/schema.prisma`) - cuando el monorepo está presente
3. **Schema fallback** (`apps/api/prisma/schema.prisma`) - cuando solo está el servicio

### Modos de Deploy

#### Opción A: Deploy desde la Raíz del Monorepo (Recomendada) ⭐

**Esta es la opción más limpia y recomendada.**

1. En Railway, cambiar el **Root Directory** del servicio API:
   - Settings → Source
   - Root Directory: **`/`** (raíz del repositorio) o dejar vacío
   - Build Command: `cd apps/api && npm run build`
   - Start Command: `cd apps/api && npm start`

2. Esto asegura que:
   - El monorepo completo esté disponible durante el build
   - El script `postinstall` usa el schema central `packages/db/prisma/schema.prisma`
   - El `prestart` genera el cliente antes de iniciar el servidor
   - No necesitas configurar variables adicionales

#### Opción B: Service-Only Deploy (Railway sin monorepo completo)

Cuando Railway solo construye el subdirectorio `apps/api`:

1. **Schema de fallback automático:**
   - El sistema detecta que no existe `packages/db/`
   - Usa automáticamente `apps/api/prisma/schema.prisma`
   - El `prestart` garantiza que `prisma generate` se ejecuta antes de iniciar

2. **Configuración en Railway:**
   - Root Directory: `apps/api` (o dejar que Railway lo detecte)
   - Build Command: `npm run build`
   - Start Command: `npm start` (el `prestart` ejecuta `prisma generate` automáticamente)

3. **Ventajas:**
   - ✅ No requiere configuración adicional
   - ✅ El schema fallback está incluido en el repo
   - ✅ `prestart` garantiza que el cliente Prisma esté generado antes de iniciar

#### Opción C: Usar PRISMA_SCHEMA_PATH (Override Manual)

Si necesitas forzar una ruta específica del schema:

1. En Railway, agregar variable de entorno:
   - Variables → Add Variable
   - Name: `PRISMA_SCHEMA_PATH`
   - Value: `/app/packages/db/prisma/schema.prisma` (o la ruta que necesites)

2. El script `prisma-generate.js` buscará el schema en esta ruta primero.

### Comportamiento del Sistema

Los scripts `prisma-generate.js` y `prisma-migrate.js`:

- ✅ **Priorizan `PRISMA_SCHEMA_PATH`** si está definida
- ✅ **Buscan el schema central** cuando el monorepo está presente
- ✅ **Usan el schema fallback** cuando solo está el servicio
- ✅ **No rompen el build** si no encuentran ningún schema (pero el fallback siempre debería estar presente)
- ✅ **`prestart` garantiza** que `prisma generate` se ejecuta antes de `npm start`

### Sincronización de Schemas (Desarrollo/CI)

Para mantener ambos schemas sincronizados:

```bash
# En desarrollo local o CI
npm --workspace apps/api run schema:sync
```

Este comando copia `packages/db/prisma/schema.prisma` a `apps/api/prisma/schema.prisma` si el schema central existe.

**Nota:** En CI, puedes ejecutar `schema:sync` antes del build para asegurar que ambos schemas están alineados.

---

## ✅ Comandos Post-Deploy Manuales

Si prefieres ejecutar manualmente después del primer deploy:

```bash
# SSH a Railway o ejecutar en Railway CLI
cd apps/api
npm run migrate:deploy
npm run db:seed
```

**Usuario admin creado por seed:**
- Email: `admin@legal-ai.local`
- Password: `KodoAdmin123`

⚠️ **Cambiar la contraseña del admin después del primer deploy en producción.**

---

## 🧪 Verificación Post-Deploy

### 1. Verificar Healthcheck

```bash
curl https://tu-api.railway.app/healthz
```

Debería responder:
```json
{
  "ok": true,
  "uptime": 123,
  "timestamp": "2025-01-28T..."
}
```

### 2. Verificar Frontend

- Visitar `https://tu-app.vercel.app`
- Debería cargar sin errores
- Probar registro/login

### 3. Verificar Base de Datos

```bash
# Ejecutar en Railway o localmente con DATABASE_URL de producción
cd apps/api
npx prisma studio --schema=../../packages/db/prisma/schema.prisma
```

Verificar que existan:
- Tenant "Default Tenant"
- Usuario `admin@legal-ai.local`

---

## 🔄 Actualizaciones Futuras

### Migraciones

Cuando agregues nuevas migraciones:

1. **Desarrollar localmente:**
   ```bash
   cd apps/api
   npm run migrate:dev -- --name nombre_de_la_migracion
   ```

2. **Commit y push:**
   ```bash
   git add packages/db/prisma/migrations
   git commit -m "feat: agregar migración X"
   git push
   ```

3. **Railway ejecutará automáticamente:**
   - Build
   - Post-deploy: `migrate:deploy` + `db:seed`

### Seed Updates

Si actualizas `apps/api/scripts/seed.ts`:
- El post-deploy script lo ejecutará automáticamente
- El seed es idempotente (no duplica datos)

---

## 🐛 Troubleshooting

### Error: "NEXTAUTH_URL is not defined"

**Solución:** Agregar `NEXTAUTH_URL` en Vercel antes del build.

### Error: "Database connection failed"

**Solución:** 
- Verificar `DATABASE_URL` en Railway
- Verificar que la DB esté accesible desde Railway
- En Supabase: Settings → Database → Connection Pooling

### Error: "Migration failed"

**Solución:**
- Ejecutar manualmente: `cd apps/api && npm run migrate:deploy`
- Revisar logs en Railway
- Verificar que `DATABASE_URL` apunte a la DB correcta

### Email no se envía

**Solución:**
- Verificar credenciales SMTP en Railway
- Para Gmail: usar App Password (no la contraseña normal)
- Verificar `EMAIL_FROM` tiene formato válido

---

## 📊 Monitoring

### Railway

- **Logs**: Dashboard → Service → Logs
- **Metrics**: Dashboard → Service → Metrics
- **Healthcheck**: Automático vía `/healthz`

### Vercel

- **Analytics**: Dashboard → Project → Analytics
- **Logs**: Dashboard → Project → Logs
- **Deployments**: Dashboard → Project → Deployments

---

## 🔒 Seguridad Post-Deploy

1. ✅ Cambiar password del admin (`admin@legal-ai.local`)
2. ✅ Verificar que `NEXTAUTH_SECRET` sea único y seguro
3. ✅ Verificar HTTPS activo en Vercel
4. ✅ Revisar CORS en Railway (solo tu dominio de Vercel)
5. ✅ Rotar `DATABASE_URL` si se compromete
6. ✅ Limitar acceso a `/healthz` si es necesario (IP whitelist)

---

## 📞 Soporte

Si tenés problemas:
1. Revisar logs en Railway/Vercel
2. Verificar variables de entorno
3. Revisar `.github/workflows/ci.yml` para tests locales
4. Ejecutar E2E tests localmente antes de deploy

---

**Última actualización:** 2025-01-28
