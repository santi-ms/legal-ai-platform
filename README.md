# ⚖️ Legal AI Platform

> Plataforma de generación de documentos legales con Inteligencia Artificial

Generá contratos, NDAs y cartas documento listos para firmar en minutos. Cumplimiento total con normativa argentina.

---

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- npm
- Docker Desktop (opcional, para PostgreSQL)

### Instalación Rápida

**Opción 1: Con SQLite (más rápido)**
```bash
# Clonar repositorio
git clone [tu-repo]
cd legal-ai-platform

# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev
```

**Opción 2: Con PostgreSQL + Docker (producción)**
```bash
# Ver README_DOCKER.md para setup completo
docker-compose up -d
npm install
npm run dev
```

### Acceder
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4001
- **PDF Service**: http://localhost:4100

### Variables de entorno clave

| Variable        | Descripción                                                                 | Ejemplo                                           |
|-----------------|------------------------------------------------------------------------------|---------------------------------------------------|
| `NEXTAUTH_URL`  | URL pública del frontend (sin slash final)                                   | `https://legal-ai-platform.vercel.app`            |
| `API_URL`       | URL pública del backend en Railway (sin slash final, usada por el proxy)     | `https://api-production-8cad.up.railway.app`      |
| `BACKEND_PREFIX` (opcional) | Prefijo global del backend (por ejemplo `api` si las rutas viven en `/api/*`) | `api`                                             |

> ⚠️ El proxy de `apps/web/app/api/_proxy/*` **siempre** usa `API_URL` para hablar con el backend. Asegurate de no incluir la barra final y definilo en todos los entornos (Vercel, local, CI).

Endpoints de diagnóstico útiles una vez desplegado:

- `/api/_proxy/_debug/where` → muestra el `apiBase` y la URL exacta hacia `/documents`.
- `/api/_proxy/_debug/health` → ejecuta `/healthz` en el backend.
- `/api/_proxy/_debug/ping-docs` → reenvía a `/documents` mostrando `status`, `contentType` y un preview del cuerpo.

---

## ✨ Características Principales

### 🎯 Generación Inteligente
- IA GPT-4o-mini para generación de documentos
- Cláusulas específicas por jurisdicción argentina
- Tonos: formal y comercial
- Fallback automático a GPT-3.5-turbo
- Listo para firmar

### 👥 Multi-Tenant
- Soporte de múltiples empresas
- Roles: owner, admin, editor, viewer
- Aislamiento de datos
- Escalable

### 📄 Gestión de Documentos
- Versionado automático
- Historial de cambios
- Download de PDFs
- Tracking de costos

### 🔐 Seguridad
- Autenticación con NextAuth
- Contraseñas hasheadas (bcrypt)
- JWT sessions
- Protección de rutas

---

## 🏗️ Arquitectura

```
legal-ai-platform/
├── apps/
│   ├── api/          # Backend Fastify
│   ├── web/          # Frontend Next.js 16
│   └── docs/         # Documentación
├── packages/
│   ├── db/           # Prisma + SQLite/PostgreSQL
│   └── ui/           # Componentes compartidos
└── services/
    └── pdf/          # Generación PDFs
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 16** - Framework React
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **NextAuth** - Autenticación

### Backend
- **Fastify** - API server
- **Prisma** - ORM
- **SQLite** - Base de datos (dev)
- **PostgreSQL** - Base de datos (prod)
- **OpenAI** - Generación IA
- **PDFKit** - Generación PDFs

---

## 📚 Documentación

- **README.md** - Este archivo
- **INICIO_RAPIDO.md** - Setup rápido con Docker (recomendado)
- **README_DOCKER.md** - Setup detallado de PostgreSQL
- **GUIA_POSTGRESQL.md** - Guía completa de migración
- **CHECKLIST_PRODUCCION.md** - Lista de tareas pre-producción
- **RESUMEN_CRITICO_COMPLETADO.md** - Mejoras implementadas

---

## 🔧 Comandos

```bash
# Desarrollo
npm run dev              # Iniciar todos los servicios
npm run build            # Build de producción
npm run lint             # Linting

# Base de datos
# ⚠️ Schema único en packages/db/prisma/schema.prisma
# Los scripts autodetectan el schema desde cualquier CWD (local/CI/deploy)

cd apps/api
npm run migrate:dev      # Nueva migración (autodetecta schema)
npm run migrate:deploy   # Deploy de migraciones (autodetecta schema)
npm run db:seed          # Seed de base de datos

# Desde el root del repo también funciona:
npm --workspace apps/api run migrate:deploy

# Comandos directos de Prisma (si necesitas especificar el schema manualmente):
npx prisma studio --schema=../../packages/db/prisma/schema.prisma  # UI de base de datos
npx prisma generate --schema=../../packages/db/prisma/schema.prisma  # Regenerar client

# ⚠️ Entornos sin monorepo completo (Railway)
# Si el deploy no incluye packages/, los scripts no fallan:
# - Si ya existe @prisma/client, omite generate
# - Si no existe, genera warning pero no rompe el build
# - migrate:deploy generará el cliente cuando el schema esté disponible
# 
# Opciones:
# (A) Recomendado: Configurar Root Directory en Railway a la raíz del repo
# (B) Alternativa: Definir PRISMA_SCHEMA_PATH en variables de entorno
```

---

## 🎯 Roadmap

### ✅ Completado
- [x] Sistema de autenticación
- [x] Generación de documentos con IA
- [x] Descarga de PDFs
- [x] Dashboard de documentos
- [x] Mejoras de UX/UI
- [x] Multi-tenant

### 🔄 En Progreso
- [ ] Deploy a producción
- [ ] Integración de pagos
- [ ] Android App (React Native)

### 📅 Planificado
- [ ] Recuperación de contraseña
- [ ] Verificación de email
- [ ] Roles avanzados
- [ ] API pública
- [ ] Analytics avanzado

---

## 💰 Pricing

### Planes Sugeridos
- **Starter**: $49/mes - 10 documentos
- **Pro**: $149/mes - 100 documentos
- **Enterprise**: $399/mes - Ilimitado

---

## 📖 Uso

### 1. Registro
1. Ir a http://localhost:3000
2. Click "Registrarse Gratis"
3. Completar formulario
4. Iniciar sesión automáticamente

### 2. Crear Documento
1. Click "Nuevo documento"
2. Completar wizard (4 pasos)
3. Generar con IA
4. Descargar PDF

### 3. Gestionar
- Ver lista de documentos
- Editar detalles
- Descargar PDFs
- Ver histórico

---

## 🔒 Seguridad

- Contraseñas encriptadas
- JWT tokens
- CORS configurado
- Validación de inputs
- Rate limiting (pendiente)
- HTTPS en producción

---

## 🌐 Producción

### Para Deploy
Opciones recomendadas:
- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Render
- **Database**: Supabase (PostgreSQL), Neon
- **Storage**: Cloudflare R2, AWS S3

### Variables de Entorno

#### Frontend (Vercel/Netlify)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXTAUTH_URL` | ⚠️ **Requerida para build** - URL base de la app | `https://tu-app.vercel.app` |
| `NEXTAUTH_SECRET` | Secret para JWT (generar con `openssl rand -base64 32`) | `tu-secret-aqui` |
| `NEXT_PUBLIC_API_URL` | URL del backend API | `https://tu-api.railway.app` |
| `NEXT_PUBLIC_INACTIVITY_MINUTES` | Minutos de inactividad para logout (opcional, default: 30) | `30` |

#### Backend (Railway/Render)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string de PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `POSTMARK_SERVER_TOKEN` | Server token de Postmark (prioridad principal para emails OTP) | `postmark-server-token` |
| `EMAIL_SERVER_HOST` | SMTP server host | `smtp.gmail.com` |
| `EMAIL_SERVER_PORT` | SMTP port | `587` |
| `EMAIL_SERVER_USER` | Usuario SMTP | `tu-email@gmail.com` |
| `EMAIL_SERVER_PASSWORD` | Password SMTP (App Password para Gmail) | `tu-app-password` |
| `EMAIL_FROM` | Email remitente | `Legal AI <noreply@tu-dominio.com>` |
| `FRONTEND_URL` | URL del frontend (para links en emails) | `https://tu-app.vercel.app` |
| `PORT` | Puerto del servidor (opcional, default: 4001) | `4001` |
| `OPENAI_API_KEY` | API key de OpenAI | `sk-...` |

Prioridad de envío de emails: `POSTMARK_SERVER_TOKEN` -> SMTP (`EMAIL_SERVER_*`) -> logger fallback para desarrollo.

### Deploy en Railway (Backend API)

#### Configuración del Servicio

**Opción A (Recomendada): Deploy desde raíz del monorepo**

1. En Railway, configurar el **Root Directory** del servicio API a la raíz del repo:
   - Settings → Service → Root Directory: `/` (raíz del repo)
   - Esto asegura que `packages/db/prisma/schema.prisma` esté disponible

2. Configurar el **Start Command**:
   ```
   cd apps/api && npm start
   ```

**Opción B: Deploy desde `apps/api` (sin monorepo completo)**

Si Railway deploya solo desde `apps/api` (sin `packages/`):

1. Agregar variable de entorno en Railway:
   ```
   PRISMA_SCHEMA_PATH=/app/packages/db/prisma/schema.prisma
   ```
   (Ajustar la ruta según la estructura real del deploy)

2. O dejar que el script omita generate si no hay schema:
   - El `postinstall` no fallará si no hay schema
   - `migrate:deploy` generará el cliente cuando el schema esté disponible

#### Post-Deploy Scripts

Después de cada deploy en Railway, ejecutar:

```bash
cd apps/api
npm run migrate:deploy  # Genera cliente y aplica migraciones
npm run db:seed         # Seed de datos iniciales
```

**Configurar en Railway:**
1. Ve a tu proyecto en Railway
2. Settings → Deploy → Post-Deploy Command
3. Agregar: `cd apps/api && npm run migrate:deploy && npm run db:seed`

**Nota**: Si el schema no está disponible en el entorno de build:
- `postinstall` no falla (warning pero exit code 0)
- `migrate:deploy` generará el cliente cuando el schema esté presente
- Si el schema nunca está disponible, asegurate de tener `@prisma/client` en `node_modules` (incluido en el build)

#### Healthcheck

Railway puede usar el endpoint `/healthz` para health checks:
- **Path**: `/healthz`
- **Interval**: 30s
- **Timeout**: 5s

### Seed de Base de Datos

El seed crea automáticamente:
- **Tenant por defecto**: "Default Tenant"
- **Usuario admin demo**: `admin@legal-ai.local` / `KodoAdmin123`

```bash
cd apps/api
npm run db:seed
```

### E2E Tests (Playwright)

#### Localmente

```bash
# Levantar servicios
npm run dev

# En otra terminal, ejecutar tests
npm run e2e

# Con UI interactiva
npm run e2e:headed
npm run e2e:ui
```

#### En CI

Los tests E2E se ejecutan automáticamente en GitHub Actions en cada PR/push.

**Variables de entorno para E2E:**
- `E2E_BASE_URL` - URL base del frontend (default: http://localhost:3000)
- `E2E_API_URL` - URL del API backend (default: http://localhost:4001)

---

## 📞 Soporte

¿Problemas? Revisa:
1. Logs del servidor
2. Variables de entorno (.env.example)
3. Prisma migrations

---

## 📄 Licencia

Propietario - Todos los derechos reservados

---

**Hecho con ❤️ en Argentina** 🇦🇷
