# 📊 Análisis General del Proyecto — Legal AI Platform

## 1. Descripción General

**Legal AI Platform** es una plataforma SaaS orientada al mercado argentino que permite a profesionales y empresas generar documentos legales listos para firmar en cuestión de minutos, utilizando modelos de lenguaje de OpenAI (GPT-4o-mini con fallback a GPT-3.5-turbo).

---

## 2. Arquitectura

El proyecto está organizado como un **monorepo con Turborepo**, lo que facilita compartir código y mantener builds incrementales:

```
legal-ai-platform/
├── apps/
│   ├── api/          # Backend — Fastify (Node.js/TypeScript)
│   ├── web/          # Frontend — Next.js 16 + React 19
│   ├── pdf/          # Microservicio de generación de PDFs
│   └── docs/         # Sitio de documentación (Next.js)
├── packages/
│   ├── db/           # Esquema Prisma + cliente compartido
│   ├── ui/           # Componentes React compartidos
│   ├── eslint-config/
│   └── typescript-config/
└── e2e/              # Tests E2E con Playwright
```

La comunicación entre el frontend y el backend pasa por un **proxy interno de Next.js** (`/api/_proxy/*`), lo que evita exponer la URL del backend directamente al navegador y simplifica la gestión de CORS en producción.

---

## 3. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, NextAuth |
| Backend API | Fastify, TypeScript, Prisma ORM |
| Base de datos | SQLite (desarrollo), PostgreSQL (producción) |
| IA | OpenAI API (GPT-4o-mini / GPT-3.5-turbo) |
| PDF | PDFKit + Puppeteer (microservicio `apps/pdf`) |
| Autenticación | NextAuth (JWT sessions + bcrypt) |
| Infraestructura | Docker Compose (local), Railway (API), Vercel (frontend) |
| Testing | Playwright (E2E) |
| Monorepo | Turborepo + npm workspaces |

---

## 4. Módulos Principales

### 4.1. Generación de Documentos (backend — `apps/api/src/modules/documents/`)
El corazón del sistema. Implementa un motor de generación estructurado en capas:

- **Registry** (`document-registry.ts`): catálogo de tipos de documentos soportados.
- **Templates** (`templates/`): plantillas base por tipo de documento (contrato de servicios, NDA, carta documento, locación, reconocimiento de deuda, autorización simple).
- **Clauses** (`clauses/`): cláusulas reutilizables por tipo y jurisdicción.
- **Validation Engine** (`validation-engine.ts` + `validation-rules.ts`): validaciones semánticas pre y post generación con niveles `info / warning / error`.
- **Generation Engine** (`generation-engine.ts`): orquesta el flujo: validación → plan de cláusulas → borrador base → enriquecimiento con IA → advertencias de salida.

**Tipos de documentos activos:** `service_contract`, `nda`, `legal_notice`, `lease`, `debt_recognition`, `simple_authorization`.

**Jurisdicciones soportadas:** CABA, Buenos Aires, Córdoba, Santa Fe, Mendoza, Corrientes Capital, Posadas (Misiones).

### 4.2. Autenticación (`apps/api/src/routes.auth.ts` + `apps/web/app/auth/`)
- Registro con verificación de email (token almacenado en `VerificationToken`).
- Login con sesiones JWT via NextAuth.
- Reset de contraseña por email.
- Contraseñas hasheadas con bcrypt.

### 4.3. Multi-Tenancy
- Cada usuario pertenece a un `Tenant`.
- Los documentos quedan aislados por tenant.
- Roles definidos: `owner`, `admin`, `editor`, `viewer` (la lógica de autorización por rol está en progreso).

### 4.4. Generación de PDFs (`apps/pdf/`)
Microservicio independiente (puerto 4100) que recibe el texto generado y produce un PDF descargable usando PDFKit o Puppeteer.

### 4.5. Dashboard (`apps/web/app/dashboard/` + `apps/web/app/documents/`)
- Lista de documentos del tenant con filtros y búsqueda.
- Wizard de creación en 4 pasos.
- Descarga de PDFs.
- Historial de versiones por documento (`DocumentVersion`).
- Tracking de costo de IA por documento (`IAUsageLog`).

---

## 5. Modelo de Datos

Entidades principales en `packages/db/prisma/schema.prisma`:

```
Tenant ──< User ──< Document ──< DocumentVersion
                              └─< IAUsageLog
```

- `Tenant`: empresa/organización.
- `User`: usuario con perfil (bio, preferencias de notificación).
- `Document`: metadatos del documento (tipo, jurisdicción, tono, estado, costo).
- `DocumentVersion`: versiones inmutables con texto raw, PDF URL, hash SHA-256 y datos estructurados.
- `IAUsageLog`: registro de tokens y costos por llamada a OpenAI.
- `Account` / `Session` / `VerificationToken`: modelos de NextAuth.

---

## 6. Estado Actual

| Funcionalidad | Estado |
|---|---|
| Autenticación completa (registro, login, reset) | ✅ Completo |
| Generación de documentos con IA | ✅ Completo |
| Descarga de PDFs | ✅ Completo |
| Dashboard de documentos | ✅ Completo |
| Multi-tenant básico | ✅ Completo |
| Seguridad (CORS, rate limiting, helmet, bcrypt) | ✅ Completo |
| Tests E2E con Playwright | ✅ Completo |
| CI/CD con GitHub Actions | ✅ Completo |
| Integración de pagos | ⏳ Pendiente |
| Roles avanzados (autorización granular) | ⏳ Pendiente |
| Verificación de email en producción (SMTP) | ⏳ Pendiente |
| App mobile (React Native) | 📅 Planificado |
| API pública documentada | 📅 Planificado |
| Analytics avanzado | 📅 Planificado |

---

## 7. Seguridad

**Implementado:**
- Contraseñas hasheadas con bcrypt.
- Sesiones JWT firmadas (NextAuth).
- CORS restringido por whitelist de orígenes en producción.
- Rate limiting: 100 req/min por IP (`@fastify/rate-limit`).
- HTTP security headers con `@fastify/helmet`.
- Validación de inputs en el backend (schemas de Fastify).
- Tokens de verificación/reset de un solo uso con expiración.

**Pendiente / Áreas de mejora:**
- Rate limiting diferenciado por ruta (ej. más estricto en `/api/auth`).
- Autorización por rol no totalmente aplicada en todos los endpoints.
- Audit log de acciones sensibles.
- HTTPS forzado en todos los entornos.

---

## 8. Observaciones Técnicas

- **Deuda documental**: la raíz del repo contiene ~50 archivos `.md` de notas de desarrollo (fixes, migraciones, análisis). Estos deberían consolidarse o moverse a `docs/` para mantener el repositorio ordenado.
- **Schema Prisma duplicado**: el schema vive en `packages/db/prisma/schema.prisma` pero `apps/api` tiene su propio directorio `prisma/` para Railway. Esto puede generar confusión; se recomienda unificar.
- **Microservicio PDF**: actualmente en el monorepo pero con mínima integración documentada. Sería valioso agregar un contrato de API explícito entre `apps/api` y `apps/pdf`.
- **Costo de IA**: el tracking de costos está implementado en `IAUsageLog`, lo que es la base necesaria para implementar planes de suscripción y límites de uso.

---

## 9. Modelo de Negocio Sugerido

Planes mensuales propuestos (en el README):

| Plan | Precio | Límite |
|---|---|---|
| Starter | $49/mes | 10 documentos |
| Pro | $149/mes | 100 documentos |
| Enterprise | $399/mes | Ilimitado |

La infraestructura actual (multi-tenant + IAUsageLog) ya está preparada para implementar estos límites.

---

*Análisis generado el 2026-03-18 · Basado en el estado actual del repositorio.*
