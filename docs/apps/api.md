---
title: "Api"
source:
  - "apps/api/**"
generated: true
lastSync:
  sourceCommit: "4030ba85a7923a0fce905433b06bf876327f34a1"
  docHash: "6a25924c9784"
---
## Descripción general

`apps/api` es el backend principal de la plataforma. Está construido con **Fastify** y expuesto como un servidor HTTP que concentra autenticación, gestión de expedientes, generación de documentos legales, integraciones de IA, facturación y scrapers de organismos judiciales argentinos. La base de datos se accede a través de **Prisma Client**.

## Estructura de directorios

```
apps/api/src/
├── data/                  # Seeds de datos (códigos legales)
├── modules/
│   └── documents/         # Motor de generación de documentos
│       ├── clauses/       # Cláusulas por tipo de documento
│       ├── domain/        # Motor, validador, tipos y registro
│       ├── dto/           # Esquemas de entrada (Zod)
│       ├── services/      # Lógica de generación y extracción PDF
│       └── templates/     # Plantillas por tipo de documento
├── routes.*.ts            # Rutas agrupadas por dominio
├── schemas/               # Esquemas Zod compartidos
├── scripts/               # Scripts de seed
├── services/              # Servicios transversales (email, scrapers, AI, etc.)
├── types/                 # Declaraciones de tipos
├── utils/                 # Utilidades (auth, logger, sanitize, etc.)
├── db.ts                  # Instancia global de PrismaClient
├── server.ts              # Bootstrap del servidor Fastify
└── types.ts               # Tipos globales de la aplicación
```

## Servidor

El punto de entrada es `apps/api/src/server.ts`. Registra los siguientes plugins de Fastify:

- `@fastify/cors` — control de orígenes permitidos
- `@fastify/helmet` — cabeceras de seguridad HTTP
- `@fastify/rate-limit` — límite de peticiones por IP
- `@fastify/multipart` — subida de archivos
- `@fastify/swagger` + `@fastify/swagger-ui` — documentación OpenAPI

Cada archivo `routes.*.ts` registra un conjunto de rutas relacionadas con un dominio específico.

## Base de datos

`apps/api/src/db.ts` exporta una única instancia de `PrismaClient` reutilizable entre reinicios en desarrollo (via `globalThis`). En producción se crea una instancia nueva por proceso.

La URL de conexión se toma de `DATABASE_URL`. Si la URL no incluye `connection_limit`, se añade automáticamente `connection_limit=15` para evitar agotar el pool de conexiones de Supabase.

```ts
import { prisma } from "./db.js";
```

En desarrollo se registran los niveles `error`, `warn` y `query`. En producción sólo `error` y `warn`.

## Rutas disponibles

Cada archivo `routes.<dominio>.ts` agrupa un área funcional:

| Archivo | Dominio |
|---|---|
| `routes.auth.ts` | Registro, login, JWT, verificación de email |
| `routes.user.ts` | Perfil, configuración de usuario |
| `routes.documents.ts` | Generación, edición y exportación de documentos |
| `routes.expedientes.ts` | Expedientes judiciales |
| `routes.clients.ts` | Gestión de clientes |
| `routes.billing.ts` | Suscripciones y pagos (MercadoPago) |
| `routes.analysis.ts` | Análisis de documentos con IA |
| `routes.chat.ts` | Chat con asistente legal |
| `routes.assistant.ts` | Asistente general |
| `routes.juris.ts` | Jurisprudencia y búsqueda legal |
| `routes.vencimientos.ts` | Vencimientos y plazos |
| `routes.calendar.ts` | Calendario de eventos |
| `routes.honorarios.ts` | Liquidación de honorarios |
| `routes.actuaciones.ts` | Actuaciones judiciales |
| `routes.estrategia.ts` | Estrategia legal asistida por IA |
| `routes.team.ts` | Gestión de equipo y roles |
| `routes.tenant.ts` | Configuración de tenant |
| `routes.imports.ts` | Importación masiva de datos |
| `routes.search.ts` | Búsqueda global |
| `routes.sharing.ts` | Compartir documentos |
| `routes.references.ts` | Referencias y bibliografía |
| `routes.stats.ts` | Estadísticas de uso |
| `routes.portal.ts` | Portal de clientes (acceso externo) |
| `routes.client-portal.ts` | Rutas internas del portal de clientes |
| `routes.prompts.ts` | Gestión de prompts personalizados |
| `routes.superadmin.ts` | Administración global de la plataforma |

## Módulo de documentos

### Tipos de documento soportados

Definidos en `modules/documents/domain/document-types.ts` y registrados en `modules/documents/domain/document-registry.ts`:

- `service_contract` — Contrato de servicios
- `nda` — Acuerdo de confidencialidad
- `legal_notice` — Carta documento / intimación
- `lease` — Contrato de locación
- `debt_recognition` — Reconocimiento de deuda
- `simple_authorization` — Autorización simple

### Cláusulas

Cada tipo de documento tiene sus cláusulas en `modules/documents/clauses/<tipo>/`. La función central es:

```ts
import { getClausesForType } from "./clauses/index.js";

const clauses = getClausesForType("lease");
// Devuelve un Map<string, ClauseDefinition>
```

`getRequiredClauseIds(documentType)` devuelve el array de IDs de cláusulas obligatorias para cada tipo.

Las cláusulas comparten tres cláusulas comunes (`identificacion_partes`, `foro_competencia`, `resolucion_disputas`) excepto `legal_notice` y `lease`, que usan sus propias variantes.

Cada `ClauseDefinition` tiene la forma:

```ts
interface ClauseDefinition {
  id: string;
  name: string;
  category: "common" | "type_specific";
  required: boolean;
  content: string; // plantilla con marcadores {{VARIABLE}}
}
```

Los marcadores `{{VARIABLE}}` son sustituidos en tiempo de generación por el motor.

### Motor de generación

`modules/documents/domain/generation-engine.ts` orquesta la construcción del documento. `modules/documents/services/generation-service.ts` es el servicio que invoca el motor, llama a la IA (OpenAI / Anthropic) y persiste el resultado.

El flujo típico:

1. El DTO de entrada se valida con Zod (`dto/generate-document.dto.ts`).
2. `validation-engine.ts` aplica las reglas de `validation-rules.ts`.
3. `generation-engine.ts` ensambla las cláusulas y rellena las variables.
4. `output-validator.ts` verifica el documento generado.
5. `document-mapper.ts` transforma el resultado para la respuesta HTTP.

### Plantillas

`modules/documents/templates/<tipo>/template.ts` define la estructura de alto nivel del documento (cabecera, orden de cláusulas, pie). `modules/documents/templates/index.ts` las exporta todas.

### Extracción de PDF

`modules/documents/services/pdf-extractor.ts` usa `pdf-parse` para extraer texto de archivos PDF subidos por el usuario.

## Servicios transversales

| Archivo | Responsabilidad |
|---|---|
| `services/email.ts` | Envío de correo (Nodemailer + Resend) |
| `services/email-templates.ts` | Plantillas HTML de correos |
| `services/audit-log.ts` | Registro de auditoría de acciones |
| `services/plan-limits.ts` | Control de límites por plan de suscripción |
| `services/ai-rate-limit.ts` | Rate limiting específico para llamadas a IA |
| `services/rag-service.ts` | Recuperación de contexto legal (RAG) |
| `services/deadline-notifier.ts` | Notificaciones de vencimientos próximos |
| `services/vencimiento-notifier.ts` | Alertas de vencimientos procesales |
| `services/portal-activity-notifier.ts` | Notificaciones de actividad en el portal |
| `services/portal-sync-service.ts` | Sincronización de datos del portal de clientes |
| `services/scraper-queue.ts` | Cola de trabajos para scrapers |
| `services/pjn-scraper.ts` | Scraper del Poder Judicial de la Nación |
| `services/scba-scraper.ts` | Scraper de la SCBA |
| `services/mev-scraper.ts` | Scraper del MEV |
| `services/corrientes-scraper.ts` | Scraper del Poder Judicial de Corrientes |

Los scrapers recuperan actuaciones y movimientos judiciales de organismos públicos argentinos. La cola (`scraper-queue.ts`) gestiona la ejecución asíncrona para evitar bloqueos.

Los trabajos programados (cron) se definen en `server.ts` usando `node-cron`.

## Utilidades

| Archivo | Descripción |
|---|---|
| `utils/auth.ts` | Helpers de JWT y verificación de tokens (`jsonwebtoken`) |
| `utils/encryption.ts` | Cifrado/descifrado de datos sensibles |
| `utils/errors.ts` | Clases de error tipadas para Fastify |
| `utils/logger.ts` | Logger estructurado del servidor |
| `utils/sanitize.ts` | Sanitización de HTML con `xss` |
| `utils/import-parser.ts` | Parseo de CSV/XLSX para importación masiva (`papaparse`, `xlsx`) |
| `utils/plazo-calculator.ts` | Cálculo de plazos procesales argentinos |

## Datos de seed

`data/legal-codes-seed.ts` exporta `LEGAL_CODE_SEED`, un array de objetos `SeedChunk` con artículos de los principales cuerpos normativos argentinos:

- **CCCN** (Código Civil y Comercial de la Nación, Ley 26.994)
- **CPCCN** (Código Procesal Civil y Comercial de la Nación, Ley 17.454)
- **CPCC Misiones** (Ley 4178)
- **CPCC Corrientes** (Ley 3948)
- **LCT** (Ley 20.744)
- **Ley 24.522** — Concursos y Quiebras

Cada entrada tiene la forma:

```ts
interface SeedChunk {
  code: string;        // e.g. "CCCN"
  jurisdiction: string; // e.g. "nacional"
  article: string;     // e.g. "957"
  sectionTitle?: string;
  text: string;        // texto completo del artículo
}
```

Este seed se utiliza para poblar el índice de búsqueda semántica usado por `rag-service.ts`.

## Variables de entorno requeridas

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL (Supabase) |
| `NODE_ENV` | `development` \| `production` |

Las demás variables (claves de OpenAI, Anthropic, MercadoPago, Resend, Sentry, etc.) se cargan con `dotenv` desde `.env`. No están documentadas explícitamente en el código fuente accesible; consultar el archivo `.env.example` si existe en el repositorio.

## Tests

Los tests usan **Vitest**. Los archivos de test se ubican junto a los servicios que prueban:

- `services/ai-rate-limit.test.ts`
- `services/audit-log.test.ts`
- `services/plan-limits.test.ts`

Para ejecutarlos:

```bash
cd apps/api
npx vitest run
```
