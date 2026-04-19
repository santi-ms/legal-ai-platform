# DocuLex — Plataforma Legal con IA

> Plataforma SaaS para estudios jurídicos argentinos. Genera documentos legales con IA, gestiona expedientes y clientes, y analiza contratos automáticamente.

---

## Características principales

- **Generación de documentos con IA** — Flujo guiado o chat conversacional para crear contratos, cartas documento, poderes notariales, demandas y más, usando Claude (Anthropic).
- **Documentos de referencia** — Subí tus propios PDFs y la IA los usa como modelo de formato y estilo al generar nuevos documentos.
- **Análisis de contratos** — Cargá cualquier contrato y la IA lo analiza, detecta cláusulas riesgosas y genera un informe con nivel de riesgo.
- **Gestión de expedientes** — Organizá causas, asigná clientes, seguí vencimientos y etapas procesales.
- **Calendario de vencimientos** — Vista mensual de deadlines de todos los expedientes.
- **Gestión de clientes** — Registro de personas físicas y jurídicas vinculadas a expedientes y documentos.
- **Analytics** — Métricas de actividad: documentos generados, clientes activos, expedientes por estado, vencimientos próximos.
- **Multi-tenant** — Cada estudio tiene sus datos aislados. Soporte para múltiples usuarios por organización.
- **Suscripciones** — Planes Free / Pro / Estudio con billing integrado via MercadoPago.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Auth | NextAuth.js v4 (credenciales + Google OAuth) |
| Backend API | Node.js + Express, TypeScript |
| Base de datos | PostgreSQL (Supabase) + Prisma ORM |
| IA | Claude API (Anthropic) — `claude-3-5-sonnet` |
| PDF | Servicio dedicado con Puppeteer |
| Pagos | MercadoPago (suscripciones recurrentes) |
| Deploy Frontend | Vercel |
| Deploy API/PDF | Railway |

---

## Estructura del monorepo

```
legal-ai-platform/
├── apps/
│   ├── web/          # Frontend Next.js
│   ├── api/          # Backend REST API
│   └── pdf/          # Microservicio de generación de PDFs
├── packages/
│   └── db/           # Schema Prisma compartido
└── .env.example      # Variables de entorno requeridas
```

---

## Primeros pasos (desarrollo local)

### Requisitos

- Node.js 18+
- pnpm 8+
- PostgreSQL (o cuenta en Supabase)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/santi-ms/legal-ai-platform.git
cd legal-ai-platform

# Instalar dependencias
pnpm install

# Copiar y completar variables de entorno
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
# Editá los archivos con tus credenciales reales
```

### Variables de entorno necesarias

```env
# API (apps/api/.env)
DATABASE_URL=postgresql://user:password@host:5432/legal_ai
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=http://localhost:3000

# Web (apps/web/.env.local)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<cadena-aleatoria-segura>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_API_URL=http://localhost:4001
```

### Levantar servicios

```bash
# Correr migraciones de base de datos
cd packages/db && npx prisma migrate deploy

# Iniciar todos los servicios en paralelo
pnpm dev
```

Los servicios quedan en:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4001
- **PDF Service**: http://localhost:4100

---

## Deploy en producción

El proyecto está configurado para desplegarse en:

- **Vercel** — `apps/web` (frontend, serverless)
- **Railway** — `apps/api` + `apps/pdf` (servicios con volumen persistente para PDFs)
- **Supabase** — PostgreSQL managed

Ver `.env.example` para la lista completa de variables requeridas en cada entorno.

---

## Licencia

Este proyecto es de código abierto con fines educativos y de portafolio.
