---
title: "Overview"
source:
  - "*.md"
  - "package.json"
  - "pnpm-workspace.yaml"
  - "turbo.json"
  - "*.config.*"
generated: true
lastSync:
  sourceCommit: "4030ba85a7923a0fce905433b06bf876327f34a1"
  docHash: "f8b1de2383e1"
---
## Descripción general

Esta plataforma es un sistema de gestión legal para abogados argentinos. Combina generación de documentos legales, gestión de expedientes, análisis con IA, portal de clientes y herramientas de facturación en un monorepo Turborepo.

## Estructura del monorepo

```
apps/
  api/       — API REST construida con Fastify
  web/       — Frontend Next.js (App Router)
  pdf/       — Servicio de generación de PDF con Fastify + Puppeteer/PDFKit
  docs/      — Sitio de documentación Next.js
packages/
  db/        — Cliente Prisma compartido (@prisma/client)
  ui/        — Componentes React compartidos (@repo/ui)
  eslint-config/ — Configuración ESLint compartida
```

## Aplicaciones principales

### `apps/api` — API REST

Servidor Fastify con los siguientes plugins registrados:

- `@fastify/cors`, `@fastify/helmet` — seguridad HTTP
- `@fastify/rate-limit` — límites de tasa por ruta
- `@fastify/multipart` — subida de archivos
- `@fastify/swagger` + `@fastify/swagger-ui` — documentación OpenAPI en `/docs`

La base de datos se accede a través de Prisma. La instancia del cliente se define en `apps/api/src/db.ts` y limita las conexiones a 15 para no agotar el pool de sesiones de Supabase:

```ts
// apps/api/src/db.ts
export const prisma = new PrismaClient({
  datasources: { db: { url: buildUrl(process.env.DATABASE_URL) } },
});
```

Las rutas están organizadas por dominio en archivos `routes.*.ts`:

| Archivo | Dominio |
|---|---|
| `routes.auth.ts` | Autenticación y usuarios |
| `routes.documents.ts` | Generación y gestión de documentos |
| `routes.expedientes.ts` | Expedientes judiciales |
| `routes.billing.ts` | Facturación y suscripciones (MercadoPago) |
| `routes.juris.ts` | Jurisprudencia y códigos legales |
| `routes.chat.ts` | Chat con IA |
| `routes.analysis.ts` | Análisis de documentos con IA |
| `routes.vencimientos.ts` | Vencimientos y plazos |
| `routes.clients.ts` | Gestión de clientes |
| `routes.team.ts` | Equipos y multi-tenant |

**Servicios internos relevantes:**

- `services/rag-service.ts` — búsqueda semántica sobre códigos legales
- `services/plan-limits.ts` — control de límites por plan de suscripción
- `services/deadline-notifier.ts` / `services/vencimiento-notifier.ts` — notificaciones de plazos vía `node-cron`
- `services/pjn-scraper.ts`, `services/scba-scraper.ts`, `services/mev-scraper.ts` — scrapers de sistemas judiciales

### `apps/web` — Frontend

Aplicación Next.js con autenticación via `next-auth` (adaptador Prisma). El frontend se comunica con `apps/api` a través del proxy ubicado en `apps/web/app/api/_proxy/[...path]/route.ts`.

Estilos con Tailwind CSS. Formularios con `react-hook-form` + `zod`. Animaciones con `framer-motion`.

### `apps/pdf` — Servicio PDF

Microservicio Fastify independiente que expone rutas en `apps/pdf/src/routes.pdf.ts`. Ofrece dos motores de generación:

- `pdfGenerator.ts` — basado en PDFKit
- `pdfGeneratorPuppeteer.ts` — basado en Puppeteer (HTML → PDF)

## Módulo de generación de documentos

El código vive en `apps/api/src/modules/documents/`. La estructura es:

```
clauses/       — Definiciones de cláusulas por tipo de documento
domain/        — Motor de generación, validación y registro
templates/     — Plantillas base por tipo
services/      — Servicio de generación y mapeo
dto/           — Esquemas de entrada con Zod
```

### Tipos de documento soportados

| `documentType` | Descripción |
|---|---|
| `service_contract` | Contrato de servicios |
| `nda` | Acuerdo de confidencialidad |
| `legal_notice` | Carta documento / intimación |
| `lease` | Contrato de locación |
| `debt_recognition` | Reconocimiento de deuda |
| `simple_authorization` | Autorización simple |

### Sistema de cláusulas

Cada cláusula implementa la interfaz `ClauseDefinition` (definida en `domain/generation-engine.ts`) y usa placeholders `{{NOMBRE}}` que el motor reemplaza al generar el documento.

La función `getClausesForType(documentType)` en `clauses/index.ts` devuelve un `Map<string, ClauseDefinition>` con las cláusulas aplicables. Las cláusulas comunes (`identificacion_partes`, `foro_competencia`, `resolucion_disputas`) se incluyen en todos los tipos excepto `legal_notice` y `lease`, que tienen estructuras propias.

```ts
import { getClausesForType } from "./clauses/index.js";

const clauses = getClausesForType("nda");
// Devuelve: definicion_informacion, finalidad_permitida,
//           obligaciones_receptor, plazo_confidencialidad,
//           devolucion_informacion, incumplimiento_nda,
//           identificacion_partes, foro_competencia, resolucion_disputas
```

## Base de datos de códigos legales

`apps/api/src/data/legal-codes-seed.ts` contiene artículos curados de los principales cuerpos normativos argentinos usados para la función de RAG (búsqueda semántica):

- **CCCN** (Ley 26.994) — obligaciones, contratos, responsabilidad civil, prescripción
- **CPCCN** (Ley 17.454) — sentencia, medidas cautelares, demanda, prueba
- **CPCC Misiones** (Ley 4178) y **CPCC Corrientes** (Ley 3948) — jurisdicción provincial
- **LCT** (Ley 20.744) — derecho laboral
- **Ley 24.522** — concursos y quiebras

Cada entrada es un `SeedChunk` con los campos `code`, `jurisdiction`, `article`, `sectionTitle` y `text`.

## Variables de entorno requeridas

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión Prisma a Supabase (Postgres) |
| `JWT_SECRET` | Firma de tokens JWT (`jsonwebtoken`) |
| `OPENAI_API_KEY` | API de OpenAI para generación/análisis |
| `ANTHROPIC_API_KEY` | API de Anthropic (Claude) |
| `RESEND_API_KEY` | Envío de emails via Resend |
| `MERCADOPAGO_ACCESS_TOKEN` | Integración de pagos |
| `SENTRY_DSN` | Monitoreo de errores |

## Comandos de desarrollo

Desde la raíz del monorepo (requiere Turborepo):

```bash
# Instalar dependencias
pnpm install

# Levantar todos los servicios en modo desarrollo
pnpm dev

# Generar cliente Prisma
pnpm --filter api exec prisma generate

# Ejecutar migraciones
pnpm --filter api exec prisma migrate dev

# Correr tests (Vitest en apps/api)
pnpm --filter api test
```
