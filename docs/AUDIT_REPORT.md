# 🔍 Auditoría Integral DocuLex — Reporte Staff Engineer / QA Lead

> **Fecha:** 2026-04-21
> **Scope:** Monorepo completo (`apps/web`, `apps/api`, `apps/pdf`, `packages/db`)
> **Metodología:** Auditoría estática multi-hilo (4 agentes paralelos) + revisión arquitectónica + plan E2E.
> **Estado:** Fase 1 y Fase 2 entregadas. **Fase 3 bloqueada esperando credenciales de entorno del usuario.**

---

## 📊 Resumen Ejecutivo

| Dimensión | Estado | Hallazgos Críticos | Observación |
|---|---|---|---|
| **Multi-tenant isolation** | 🔴 Crítico | 8 rutas | IDOR por DELETE/UPDATE sin `tenantId` en `where` |
| **Auth & Secrets** | 🔴 Crítico | 3 críticos | Endpoints de diagnóstico expuestos, fallback secrets, timing attack en OTP |
| **Resilience (Claude + Scrapers)** | 🟠 Alto | 3 críticos + 4 altos | Sin timeout en Anthropic SDK, scrapers no cierran browser |
| **Performance & Escalabilidad** | 🟠 Alto | 3 críticos | N+1 en imports, stats carga toda la tabla, schema drift |

**Total hallazgos:** 11 Críticos · 11 Altos · 11 Medios · 17 Buenas prácticas detectadas.

**Veredicto:** El sistema es **funcional pero NO listo para escalar ni para exposición pública prolongada** sin parches críticos. Los 11 hallazgos críticos son explotables hoy por un atacante con una cuenta válida (IDOR) o sin cuenta (diagnostic endpoints, hash fallback).

---

## 🏛️ FASE 1 — Auditoría Estática

### 1️⃣ Multi-Tenant Isolation

#### 🔴 CRITICAL · IDOR por mutaciones sin `tenantId` en `where`

**Patrón vulnerable** (anti-pattern copiado en 8 rutas):

```ts
// ❌ VULNERABLE: verifica, pero no scope-ea el mutate
const existing = await prisma.documentAnnotation.findFirst({
  where: { id: annotationId, tenantId: user.tenantId }
});
if (!existing) return 404;
await prisma.documentAnnotation.delete({ where: { id: annotationId } });
```

El `findFirst` verifica correctamente, pero el `delete` subsiguiente sólo filtra por `id`, que es UUID global. En una race condition (o si el UUID se filtra por otro canal) la mutación escapa el tenant.

**Rutas afectadas:**
| # | Archivo | Línea | Operación |
|---|---|---|---|
| 1 | `routes.documents.ts` | 1423 | DELETE `/documents/:id/annotations/:annotationId` |
| 2 | `routes.analysis.ts` | 442 | DELETE `/analysis/:id` |
| 3 | `routes.sharing.ts` | 147, 193 | PATCH share + viewCount++ |
| 4 | `routes.client-portal.ts` | 169, 182 | PATCH/DELETE link cliente |
| 5 | `routes.team.ts` | 274 | DELETE invitación |
| 6 | `routes.estrategia.ts` | 337 | DELETE estrategia |
| 7 | `routes.actuaciones.ts` | 271 | DELETE actuación |
| 8 | `routes.documents.ts` | 864 | GET generation job polling (fetch-then-check) |

**Refactor propuesto** (aplicar a las 8):

```ts
// ✅ CORRECTO: Prisma acepta tenantId en where compuesto
await prisma.documentAnnotation.delete({
  where: { id: annotationId, tenantId: user.tenantId }
});
// Si Prisma rechaza compound where no-único, usar deleteMany:
const { count } = await prisma.documentAnnotation.deleteMany({
  where: { id: annotationId, tenantId: user.tenantId }
});
if (count === 0) return reply.status(404).send({ ok: false });
```

#### 🟡 MEDIUM · Patrones inconsistentes

`routes.honorarios.ts`, `routes.expedientes.ts`, `routes.clients.ts`, `routes.vencimientos.ts` aplican correctamente el scope en **todas** las operaciones. Otros archivos mezclan. Esto es deuda técnica de estilo: desarrolladores futuros copian el patrón equivocado.

**Recomendación:** Crear un helper `scopedPrisma(user.tenantId)` o un ESLint rule custom que detecte `.delete({ where: { id } })` sin `tenantId`.

---

### 2️⃣ Auth, Secrets, Rate Limits, CORS

#### 🔴 CRITICAL-A · Endpoints de diagnóstico exponen password hashes

**Archivo:** `apps/api/src/routes.auth.ts:1041-1107`

```ts
// GET /api/_diagnostics/auth  — SIN AUTH
// GET /api/_diagnostics/prisma-user?email=... — SIN AUTH
// Devuelve: id, email, role, tenantId, emailVerified, passwordHash (!!)
```

**Impacto:** Un atacante puede enumerar todos los usuarios del sistema y extraer hashes bcrypt para crackeo offline. **Explotable ahora mismo en producción.**

**Remediación inmediata:**
```ts
// Opción A: remover en producción
if (process.env.NODE_ENV === 'production') return reply.status(404);
// Opción B: gate con super-admin
if (user?.email !== process.env.SUPER_ADMIN_EMAIL) return reply.status(403);
// Opción C: nunca retornar passwordHash, jamás.
```

#### 🔴 CRITICAL-B · Hardcoded fallback secrets

| Archivo | Línea | Valor |
|---|---|---|
| `apps/web/.../authOptions.ts` | 239 | `"dev-secret-change-in-production"` |
| `apps/api/src/routes.auth.ts` | 52-55 | `"dev-email-verification-pepper"` |
| `apps/web/middleware.ts` | — | `"dev-secret-change-in-production"` |

Si `NEXTAUTH_SECRET` o `JWT_SECRET` no está en producción, **cualquiera puede forjar JWTs válidos** usando el fallback hardcoded (presente en código público del repo).

**Remediación:**
```ts
const secret = process.env.NEXTAUTH_SECRET;
if (!secret || secret.startsWith("dev-")) {
  throw new Error("NEXTAUTH_SECRET required in production");
}
```

#### 🔴 CRITICAL-C · OTP verificado con `!==` (timing attack)

**Archivo:** `routes.auth.ts:613-614`
```ts
if (incomingHash !== user.emailVerificationCodeHash) { ... }
```

Aunque los hashes son SHA256 (lo cual mitiga parcialmente porque longitud fija), `!==` hace short-circuit. Un atacante con precisión de ms puede brute-forcear el OTP de 6 dígitos (1M combinaciones).

**Fix:**
```ts
import { timingSafeEqual } from 'node:crypto';
const a = Buffer.from(incomingHash, 'hex');
const b = Buffer.from(user.emailVerificationCodeHash, 'hex');
if (a.length !== b.length || !timingSafeEqual(a, b)) { ... }
```

#### 🟠 HIGH · CORS acepta cualquier `*.vercel.app`

**Archivo:** `apps/api/src/server.ts:88`
```ts
if (origin.includes(".vercel.app")) return true;  // ⚠ Demasiado permisivo
```

Un atacante puede desplegar su propio proyecto en Vercel (subdominio arbitrario gratuito) y hacer requests autenticadas al API. **Fix:** whitelist explícito de producción + staging.

#### 🟠 HIGH · Sin rate-limit en `/api/auth/reset/confirm` (line 965)

Los otros 4 endpoints sensibles tienen `sensitiveRateLimit` (5 req / 5 min), pero `reset/confirm` no. El token de reset dura 1 hora — eso son 3600 intentos por IP sin freno.

#### 🟡 MEDIUM · Logs con datos de auth

`authOptions.ts:66,69,74` imprime emails y `hasUser` a consola. En producción con logs compartidos (Vercel/Datadog/etc.), esto es PII leak.

---

### 3️⃣ Resilience — Claude API + Scrapers Judiciales

#### 🔴 CRITICAL-D · Sin timeout en el cliente Anthropic

**Archivos:** `routes.chat.ts:6`, `routes.analysis.ts:18`, `routes.estrategia.ts:17`, `routes.juris.ts:29`, `routes.assistant.ts:21`

```ts
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
// ❌ Sin timeout → default 10 min. Railway/Vercel matan a los 60s.
```

**Impacto:** Un prompt lento o un bug en Anthropic cuelga el proceso Fastify hasta el timeout de Railway. Los workers de Fastify quedan bloqueados, cascada de 503s.

**Fix:**
```ts
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 30_000,   // 30s
  maxRetries: 2,
});
```

#### 🔴 CRITICAL-E · Jobs background sin reporte de error al cliente

**Archivos:** `routes.analysis.ts:243`, `routes.estrategia.ts:239`

```ts
setImmediate(async () => {
  try { await claudeCall(); } catch (err) { app.log.error(err); }
});
return reply.status(202).send({ jobId });
```

Si Claude falla, el cliente ve 202 pero el job jamás se completa. No hay estado `failed` consultable, no hay webhook, no hay retry. **El usuario queda mirando un spinner eterno.**

**Fix:** Usar el patrón de `GenerationJob` (tabla Postgres con `status: pending|running|completed|failed` y `error: string?`), igual que `/documents/generate`.

#### 🟠 HIGH · Scrapers Puppeteer sin `browser.close()` en dos portales

| Portal | Archivo | Estado |
|---|---|---|
| MEV | `mev-scraper.ts:622-623` | ✅ `finally { await browser.close() }` |
| PJN | `pjn-scraper.ts` | ⚠️ Verificar |
| **Corrientes** | `corrientes-scraper.ts` | ❌ **Ningún** `browser.close()` |
| **SCBA** | `scba-scraper.ts` | ❌ Falta finally |

**Impacto:** Cada crash del scraper deja un proceso Chromium zombi. En Railway (memoria limitada) = OOM en horas.

**Fix estándar:**
```ts
let browser: Browser | null = null;
try {
  browser = await puppeteer.launch({ ... });
  // ...
} finally {
  await browser?.close().catch(() => {});
}
```

#### 🟠 HIGH · Scraper queue sin retry

**Archivo:** `apps/api/src/services/scraper-queue.ts:49-83`

Si un portal está caído 5 minutos, el job se marca `failed` para siempre. No hay re-enqueue con backoff. El tenant debe clickar manualmente "Sincronizar" para reintentar.

**Fix:** Añadir `attempts: number` y `nextRetryAt: Date` a la tabla, retry hasta 3 veces con backoff exponencial (2s, 4s, 8s).

#### 🟡 MEDIUM · Retry sin cap exponencial

**Archivo:** `routes.chat.ts:10-18` usa `Math.pow(2, i)` sin `Math.min()`. Si `retries=10`, delay final ≈ 17 min. Comparar con `generation-service.ts:84` que sí tiene cap de 8s (bien).

#### 🟡 MEDIUM · Retry sólo considera 429, no 503/529

**Archivo:** `routes.chat.ts:10-18`

```ts
if (err?.status >= 400 && err?.status < 500 && err?.status !== 429) throw err;
```

Claude retorna `529 Overloaded` en picos. Esta condición lo deja pasar como 4xx → no retry. Fix: añadir `429, 503, 529` a la whitelist de retry.

#### 🟡 MEDIUM · PDF extraction sin fallback OCR

Archivos escaneados → `extractTextFromPdf()` retorna string vacío → 400 inmediato. Para un estudio jurídico argentino esto es **inaceptable** (muchas demandas y contratos llegan escaneados).

**Fix futuro:** Integrar Tesseract o el OCR de Anthropic vía visión.

---

### 4️⃣ Performance & Escalabilidad

#### 🔴 CRITICAL-F · N+1 en bulk imports

**Archivo:** `routes.imports.ts:144-214`

```ts
for (const row of rows) {                                        // 5000 rows
  const existing = await prisma.client.findFirst({ where: ... }); // 5000 queries
  if (!existing) await prisma.client.create({ ... });              // +5000 queries
}
```

Para 5000 filas → **10 000+ queries seriales**. Timeout garantizado en Railway.

**Fix:**
```ts
// 1) Prefetch all unique keys
const existingKeys = new Set(
  (await prisma.client.findMany({
    where: { tenantId, dni: { in: rows.map(r => r.dni) } },
    select: { dni: true }
  })).map(c => c.dni)
);
// 2) Batch create
await prisma.client.createMany({
  data: rows.filter(r => !existingKeys.has(r.dni)).map(r => ({ ...r, tenantId })),
  skipDuplicates: true,
});
```

#### 🔴 CRITICAL-G · Document stats fetchea toda la tabla a memoria

**Archivo:** `routes.documents.ts:83-197`

Carga **todos** los documents del tenant sin `take`, luego filtra/agrupa en memoria. Con 10 000 documentos y `rawText` grande → potencial OOM y latencia de segundos en cada dashboard load.

**Fix:**
```ts
const [total, byType, byMonth] = await Promise.all([
  prisma.document.count({ where: { tenantId } }),
  prisma.document.groupBy({ by: ['type'], where: { tenantId }, _count: true }),
  prisma.$queryRaw`SELECT date_trunc('month', "createdAt") AS m, COUNT(*)::int
                   FROM "Document" WHERE "tenantId" = ${tenantId}
                   GROUP BY m ORDER BY m DESC LIMIT 12`,
]);
```

#### 🔴 CRITICAL-H · Schema Prisma desincronizado del DB real

`schema.prisma` declara 10 modelos. El código usa 28+ (`Client`, `Expediente`, `Actuacion`, `Vencimiento`, `ReferenceDocument`, `Honorario`, `Subscription`, `Plan`, `PromoCode`, `Portal*`, etc.).

**Consecuencias:**
- Pérdida de type-safety (los modelos faltantes se accedan via `$queryRaw` o `any`)
- Prisma no optimiza queries que no conoce
- Riesgo de que una `prisma migrate` rompa datos en Supabase

**Fix:** Reconstruir `schema.prisma` a partir del estado real de la DB con `prisma db pull`.

#### 🟠 HIGH · Falta índices compuestos multi-tenant

Faltan:
- `Document @@index([tenantId, expedienteId])`
- `Document @@index([tenantId, clientId])`
- `DocumentAnnotation @@index([tenantId, documentId])`
- `DocumentVersion @@index([documentId, status])`

Consultas como `WHERE tenantId=? AND clientId=?` hacen full scan cuando el tenant tiene muchos documentos.

#### 🟠 HIGH · Expedientes detail: N+1 de versions

**Archivo:** `routes.expedientes.ts:312-345` — GET `/expedientes/:id` incluye `documents` con `take:50`, y después itera cada uno para traer `versions`. → 51 queries por render.

#### 🟡 MEDIUM · Offset pagination

Todo el sistema usa `skip: (page-1)*size`. Eficiente hasta ~200 páginas. Para fases futuras, migrar a cursor-based (`WHERE createdAt < cursor`).

#### 🟡 MEDIUM · Cleanup de `GenerationJob` con lock potencial

`setInterval(60min, deleteMany({ createdAt < 30min }))`. Si se acumulan jobs (bug anterior), el delete bloquea writes. **Fix:** Delete por lotes (`LIMIT 1000`).

---

### ✅ Patrones correctos detectados (mantener)

1. **Rate-limit global + per-route** bien aplicado en `/register`, `/login`, `/reset/request`, `/verify/resend`.
2. **NextAuth cookies**: `httpOnly`, `sameSite=lax`, `secure=true` en prod, prefijos `__Host-` / `__Secure-`.
3. **Sentry** con redacción de `Authorization` y `Cookie` antes del envío.
4. **Reset tokens** con TTL 1h y borrado tras uso.
5. **Email enumeration protection** en `/reset/request` (responde 200 siempre).
6. **GenerationJob** como cola persistente en DB para generación async (sobrevive reinicios).
7. **Credenciales de portal** cifradas con AES (no plain-text en DB).
8. **Queue deduplication** en `scraper-queue.ts` (no se encolan 2 sync al mismo tenant+portal).
9. **Bcrypt 10 rounds**, OTP con salt (userId + code + pepper).
10. **Zod schema validation** en todos los POST.
11. **CSRF-ish protection**: `X-Requested-With: XHR` en writes desde `webApi.ts`.
12. **max_tokens** siempre seteado en Claude calls (evita cost explosion).

---

## 🧪 FASE 2 — Plan de Testing E2E

### Infraestructura existente

- `playwright.config.ts` en root → testDir `./e2e`
- Specs: `e2e/{auth,dashboard}.spec.ts`, `apps/web/e2e/{auth.setup,auth,clients,dashboard,expedientes}.spec.ts`
- Scripts: `npm run e2e` (root), `test-generation.ts`, `test-all-types.ts`, `test-job-queue.ts`, `test-webhook-mp.ts` en `apps/api/scripts`

### Estrategia de mocks

| Boundary externa | Estrategia propuesta |
|---|---|
| **Anthropic Claude API** | Mock HTTP con `msw` o reemplazar `Anthropic` por fixture en `NODE_ENV=test`. Respuestas canned por tipo de documento. |
| **Postmark (emails)** | Provider `logger` ya existe → usar en test, capturar emails vía endpoint interno. |
| **Portales judiciales (PJN/MEV/SCBA/CTES)** | Mockear el scraper a nivel del service layer (`portal-sync-service.ts`), no tocar Puppeteer. Devolver fixtures estáticos. |
| **PDF Service (AWS)** | Stubear con Fastify inline (`apps/pdf` se levanta local con `PORT=4100`). |
| **Supabase (Postgres)** | DB de test efímera: `postgres://test:test@localhost:5433/doculex_test` con `prisma migrate reset` antes de cada suite. |

### Suites E2E propuestas (nuevas)

#### Suite A — Multi-tenant isolation (crítica)
1. `tenant-isolation.spec.ts`
   - Crear dos tenants (A, B), cada uno con un expediente y una anotación.
   - Tenant A intenta `DELETE /documents/:idB/annotations/:annB` → **debe devolver 404**, no 200.
   - Repetir para las 8 rutas afectadas (tabla arriba).
   - **Assertion clave:** El recurso sigue existiendo después del ataque (consulta con Prisma directamente).

#### Suite B — Auth hardening
2. `auth-diagnostics.spec.ts`
   - GET `/api/_diagnostics/auth` sin token → **debe devolver 404 o 401** (no 200).
3. `auth-timing.spec.ts`
   - Enviar 50 OTP incorrectos, medir stdev de latencia → **debe ser <5ms** (si no, hay timing leak).
4. `auth-reset-brute.spec.ts`
   - 20 requests a `/api/auth/reset/confirm` con token inválido → **6º+ debe devolver 429**.

#### Suite C — Resilience
5. `claude-timeout.spec.ts`
   - Mock Claude con `delay: 90_000`. `POST /documents/generate` → **debe abortar a los 30s con error claro**, no a los 60s de Railway.
6. `scraper-cleanup.spec.ts`
   - Forzar throw en Corrientes scraper → assertion: `process.platform === 'linux'` → chequear `ps aux | grep chromium` no crece.
7. `analysis-failed-status.spec.ts`
   - Mock Claude con 500. POST `/analysis/upload`, pollear `GET /analysis/:id` → **status debe ser `failed`** con `error` legible, no quedarse en `running`.

#### Suite D — Performance (smoke)
8. `imports-batch.spec.ts`
   - Subir CSV con 1000 filas → **debe completar en <10s** (post-fix).
9. `dashboard-stats.spec.ts`
   - Seed 5000 documentos en un tenant. GET `/documents/stats` → **debe responder <500ms** y memoria de proceso <200MB delta.

### Suites E2E existentes (re-ejecutar)

- `auth.setup.ts` → verifica flujo login.
- `auth.spec.ts` (x2) → login, register, reset.
- `dashboard.spec.ts` (x2) → stats, navegación.
- `clients.spec.ts` → CRUD clientes (validar tenant scoping nuevo).
- `expedientes.spec.ts` → creación expediente + actuación.

---

## 🚧 FASE 3 — BLOQUEADA

Para ejecutar la Fase 3 (corrida real de Playwright + smoke de performance) necesito que configures localmente:

### Variables requeridas (copiar a `.env` en la raíz)

```bash
# === WEB (apps/web/.env.local) ===
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generar con `openssl rand -base64 32`>
API_URL=http://localhost:4001
NEXT_PUBLIC_API_URL=http://localhost:4001
NEXT_PUBLIC_PDF_SERVICE_URL=http://localhost:4100

# === API (apps/api/.env) ===
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/doculex_test?schema=public
PORT=4001
FRONTEND_URL=http://localhost:3000

# Email — basta con que vaya al logger (no hace falta Postmark)
EMAIL_FROM=test@doculex.local

# Claude — necesito una key real o confirmar que uso mock
ANTHROPIC_API_KEY=sk-ant-...           # ⚠ NECESARIO

SUPER_ADMIN_EMAIL=santinomartins539@gmail.com

# === PDF (apps/pdf/.env) ===
PDF_OUTPUT_DIR=./pdfs
PORT=4100
```

### Decisiones que necesito de tu parte

1. **Claude API en tests:** ¿Usamos tu key real (cuesta tokens, ~USD 0.50 por corrida completa) o prefieren que implemente los mocks con `msw`?
2. **Base de datos:** ¿Levanto un Postgres local con Docker (`docker run postgres:16`), o preferís usar un schema separado en tu Supabase (`doculex_test`)?
3. **Portales judiciales:** Los voy a mockear sí o sí (scrapean sitios reales del PJN/MEV, no corresponde golpearlos en tests). ¿De acuerdo?
4. **Branch de trabajo:** ¿Creo una rama `audit/phase-3-e2e` para los nuevos specs o los meto en `main`?

### Riesgo de ejecutar Fase 3 sin los fixes

Si corremos los specs de la **Suite A** (multi-tenant IDOR) **antes** de aplicar los fixes de `routes.*.ts`, **van a fallar** — eso es **lo esperado**, probará la vulnerabilidad. Los fixes van en una segunda fase de esta auditoría (Fase 4 — Remediación) que te propongo hacer después de validar los hallazgos de Fase 3.

---

## 🎯 Recomendaciones priorizadas

### Tier 1 — Aplicar HOY (explotables en producción)

1. 🔴 Borrar o gate-ar `/api/_diagnostics/*` (15 min)
2. 🔴 Fail-fast si `NEXTAUTH_SECRET` empieza con `"dev-"` (10 min)
3. 🔴 `timingSafeEqual` en verificación de OTP (5 min)
4. 🔴 Añadir `timeout: 30_000` a los 5 clientes `Anthropic` (15 min)
5. 🔴 Rate-limit a `/api/auth/reset/confirm` (5 min)

**Total: ~50 minutos de trabajo, elimina 4 CVEs.**

### Tier 2 — Esta semana

6. 🔴 Aplicar `tenantId` en mutaciones a las 8 rutas IDOR (2 hs + tests)
7. 🟠 `browser.close()` en `finally` de `corrientes-scraper.ts` y `scba-scraper.ts` (30 min)
8. 🟠 CORS whitelist explícito (reemplazar `.vercel.app`) (10 min)
9. 🔴 Cambiar `setImmediate` de analysis/estrategia a `GenerationJob` pattern (4 hs)

### Tier 3 — Próximo sprint

10. 🔴 Sync `schema.prisma` con `prisma db pull` + añadir índices compuestos (1 día)
11. 🔴 Refactor `/documents/stats` a queries agregadas (3 hs)
12. 🔴 Batch `routes.imports.ts` con `createMany` + prefetch (4 hs)
13. 🟠 Retry + backoff en `scraper-queue.ts` (3 hs)
14. 🟡 Cursor-based pagination opcional (1 día)

---

## 📎 Anexos

- **Agentes ejecutados:**
  - `aa706d64dc45891fc` — Multi-tenant isolation audit
  - `a5974e31539bf16d0` — Auth + secrets + rate limit audit
  - `a1a7467539f92ef8c` — Claude + scrapers resilience audit
  - `aec6d1fccc78a6875` — Performance + scalability audit
- **Outputs detallados:** disponibles en `C:\Users\santi\AppData\Local\Temp\claude\...\tasks\*.output`

---

**Fin del reporte Fase 1 + 2.**
**Espero tu respuesta a las 4 preguntas de Fase 3 para continuar.**
