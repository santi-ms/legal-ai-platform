# API Backend - Legal AI Platform

Backend Fastify para la plataforma de generación de documentos legales con IA.

## 🚀 Inicio Rápido

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Ejecutar migraciones
npm run migrate:dev

# Iniciar servidor de desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:4001`

## 📊 Base de Datos

### Schema de Prisma

**⚠️ IMPORTANTE:** Para Railway (producción), el schema de Prisma está en `prisma/schema.prisma` (local al repo del API).

- ✅ **Schema para Railway:** `prisma/schema.prisma` (este repo)
- ✅ **Schema del monorepo:** `packages/db/prisma/schema.prisma` (desarrollo local)
- ✅ **Migraciones locales:** `prisma/migrations/` (este repo)

**Sincronización Manual:**

Si trabajás en el monorepo y modificás `packages/db/prisma/schema.prisma`, debés copiar los cambios a `prisma/schema.prisma` antes de hacer deploy a Railway:

1. Copiar el contenido de `packages/db/prisma/schema.prisma` a `prisma/schema.prisma`
2. Copiar las migraciones nuevas de `packages/db/prisma/migrations/` a `prisma/migrations/`
3. Hacer commit y push

### Prisma Client

El API genera su propio Prisma Client desde `prisma/schema.prisma`:

```typescript
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
```

O si usás el package compartido (solo en desarrollo local del monorepo):

```typescript
import { prisma } from "db";
```

### Migraciones

#### Desarrollo

```bash
# Crear una nueva migración
npm run migrate:dev

# Esto generará una migración en prisma/migrations/
```

#### Producción (Railway)

**Configuración Automática (Recomendado):**

1. **Railway → Settings → Deploy → Start Command:**
   ```
   npm run migrate:deploy && npm start
   ```

   Esto aplicará las migraciones automáticamente antes de iniciar el servidor.

2. **Variables de Entorno:**
   - `DATABASE_URL` - Configurado automáticamente por Railway
   - `NODE_ENV=production` - Para activar migraciones automáticas

**Migración Manual (Si es necesario):**

1. **Obtener DATABASE_URL de Railway:**
   - Railway → Tu servicio PostgreSQL → Variables
   - Copia el valor de `DATABASE_URL`

2. **Aplicar migraciones:**
   ```bash
   # Configurar DATABASE_URL
   export DATABASE_URL="postgresql://user:pass@host:port/db"
   
   # Aplicar migraciones
   cd apps/api
   npm run migrate:deploy
   ```

**⚠️ Nota:** 
- Las migraciones se ejecutan automáticamente al iniciar el servidor en producción (ver `src/server.ts`)
- El servidor busca el schema en `prisma/schema.prisma` (local)
- Si no existe, intenta usar `packages/db/prisma/schema.prisma` como fallback (solo desarrollo local)

### Migración Actual: Agregar `updatedAt` a Tenant

Si estás viendo el error:
```
Error de base de datos: La columna 'Tenant.updatedAt' no existe en la tabla.
```

**Solución rápida:**

1. **Ejecutar SQL en Railway:**
   ```sql
   ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
   ```

2. **O aplicar migración completa:**
   ```bash
   DATABASE_URL="tu-database-url" npm run migrate:deploy
   ```

## 🔧 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia servidor de desarrollo con hot-reload |
| `npm run build` | Compila TypeScript y genera Prisma Client |
| `npm run start` | Inicia servidor de producción |
| `npm run migrate:dev` | Crea nueva migración (desarrollo) |
| `npm run migrate:deploy` | Aplica migraciones pendientes (producción) |
| `npm run prisma:migrate:deploy` | Alias de `migrate:deploy` |
| `npm run db:seed` | Ejecuta seed de base de datos |

## 📝 Variables de Entorno

### Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string de PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Secret para JWT (mismo que frontend) | `tu-secret-aqui` |
| `OPENAI_API_KEY` | API key de OpenAI | `sk-...` |

### Opcionales

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `4001` |
| `NODE_ENV` | Entorno (development/production) | `development` |
| `FRONTEND_URL` | URL del frontend (para CORS) | `http://localhost:3000` |
| `PDF_SERVICE_URL` | URL del servicio de PDFs | `http://localhost:4100` |

## 🏗️ Estructura del Proyecto

```
apps/api/
├── src/
│   ├── routes.documents.ts    # Rutas de documentos
│   ├── routes.auth.ts          # Rutas de autenticación
│   ├── server.ts               # Servidor Fastify
│   ├── utils/
│   │   └── auth.ts            # Utilidades de autenticación
│   └── types.ts               # Tipos TypeScript
├── scripts/
│   ├── prisma-generate.js     # Genera Prisma Client
│   ├── prisma-migrate.js      # Ejecuta migraciones
│   └── seed.ts                # Seed de base de datos
└── package.json
```

## 🔐 Autenticación

El backend espera un JWT en el header `Authorization: Bearer <token>`.

El token debe contener:
- `id` o `sub`: ID del usuario
- `tenantId`: ID del tenant
- `email`: Email del usuario
- `role`: Rol del usuario

El token se valida usando `NEXTAUTH_SECRET` (mismo secret que el frontend).

## 📚 Documentación Adicional

- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Fastify Documentation](https://www.fastify.io/)
- [Railway Deployment](https://docs.railway.app/)

---

**Última actualización:** Noviembre 13, 2025

