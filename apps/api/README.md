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

El schema de Prisma está centralizado en `packages/db/prisma/schema.prisma` (monorepo).

### Migraciones

#### Desarrollo

```bash
# Crear una nueva migración
npm run migrate:dev

# Esto generará una migración en packages/db/prisma/migrations/
```

#### Producción (Railway/Supabase)

**⚠️ IMPORTANTE:** Antes de hacer deploy, asegúrate de aplicar las migraciones pendientes.

##### Opción 1: Manual (Recomendado para primera vez)

1. **Obtener DATABASE_URL de Railway:**
   - Ve a Railway → Tu servicio → Variables
   - Copia el valor de `DATABASE_URL`

2. **Aplicar migraciones localmente:**
   ```bash
   # Configurar DATABASE_URL temporalmente
   export DATABASE_URL="postgresql://user:pass@host:port/db"
   # O en Windows PowerShell:
   $env:DATABASE_URL="postgresql://user:pass@host:port/db"
   
   # Aplicar migraciones
   npm run migrate:deploy
   ```

3. **O ejecutar SQL directamente en Railway:**
   - Ve a Railway → PostgreSQL → Query
   - Ejecuta el SQL de las migraciones pendientes desde `packages/db/prisma/migrations/`

##### Opción 2: Automatizado en Railway

**Configurar en Railway:**

1. **Variables de Entorno:**
   - Asegúrate de que `DATABASE_URL` esté configurado (Railway lo hace automáticamente)

2. **Start Command:**
   ```
   npm run migrate:deploy && npm start
   ```
   
   Esto aplicará las migraciones antes de iniciar el servidor.

3. **O usar Deploy Hook (Recomendado):**
   - Railway → Settings → Deploy Hooks
   - Crear un hook que ejecute:
   ```bash
   cd apps/api && npm run migrate:deploy
   ```

**⚠️ Nota de Seguridad:** 
- Las migraciones se ejecutan automáticamente en producción si `NODE_ENV=production` (ver `src/server.ts`)
- Para mayor control, desactiva la ejecución automática y usa Deploy Hooks

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

