# 📋 DocuLex — Sistema Legal Tech Argentina

> Resumen completo del sistema y sus funcionalidades.

---

## 🏗️ Arquitectura General

**Monorepo Turborepo** con las siguientes apps:

| App | Tech | Rol |
|---|---|---|
| `apps/web` | Next.js 16 (App Router) + Tailwind | Frontend SaaS |
| `apps/api` | Fastify + Prisma + PostgreSQL | Backend principal |
| `apps/pdf` | Servicio de generación de PDFs en AWS | Microservicio |
| `apps/docs` | Documentación interna | — |
| `packages/db` | Schema Prisma + migraciones | — |
| `packages/ui` | Componentes compartidos | — |

**Infraestructura:**
- **Web**: Vercel
- **API**: Railway
- **PDF Service**: AWS (con volumen persistente)
- **DB**: PostgreSQL (Supabase)
- **Auth**: NextAuth.js

---

## 🤖 Los Asistentes de IA (Core del Producto)

1. **Doku Genera** (`/documents/new`) — Genera contratos/documentos legales desde cero usando Claude API (`claude-3-5-sonnet`). Flujos: Chat conversacional o Formulario guiado.
2. **Doku Analiza** (`/analysis`) — Analiza contratos existentes, detecta cláusulas problemáticas, riesgos.
3. **Doku Estratega** (`/estrategia`) — Asesor estratégico para casos complejos.
4. **Doku Juris** (`/juris`) — Búsqueda jurisprudencial y normativa argentina.

**Plantillas soportadas** en `modules/documents/templates/`:
- Contrato de locación (lease)
- NDA
- Carta documento (legal-notice)
- Contrato de servicios
- Reconocimiento de deuda
- Autorización simple

---

## 📁 Módulos de Gestión

| Módulo | Ruta | Función |
|---|---|---|
| **Panel de Control** | `/dashboard` | Overview, stats, actividad reciente |
| **Mis Documentos** | `/documents` | Historial de documentos generados, versionado, edición |
| **Referencias IA** | `/documents/references` | Subir PDFs que la IA usa como plantilla de estilo/formato |
| **Expedientes** | `/expedientes` | Casos judiciales con actuaciones |
| **Vencimientos** | `/vencimientos` | Calendario de plazos legales + notificaciones |
| **Calendario** | `/calendario` | Vista calendar completa |
| **Clientes** | `/clients` | CRM legal |
| **Finanzas** | `/finanzas` | Honorarios, facturación, estadísticas |
| **Importar datos** | `/importar` | Bulk import desde Excel/CSV |
| **Portal Judicial** | `/portal` | Sync con MEV, PJN, SCBA, Corrientes |
| **Analytics** | `/analytics` | Métricas del estudio |

---

## 🔌 Integraciones con Portales Judiciales

Scrapers propios en `apps/api/src/services/`:
- **PJN** — Poder Judicial de la Nación
- **MEV** — Mesa de Entradas Virtual (Buenos Aires)
- **SCBA** — Suprema Corte de Bs. As.
- **Corrientes** — Poder Judicial Corrientes

Componentes:
- `scraper-queue.ts` — gestión de cola de sincronización
- `portal-sync-service.ts` — sincroniza expedientes periódicamente
- `portal-activity-notifier.ts` — notifica novedades al usuario

---

## 💼 Modelos de Datos (Prisma)

**Core schema (`packages/db/prisma/schema.prisma`):**
- `Tenant` — estudio jurídico (multi-tenant aislado)
- `User` — abogados/asistentes con roles (`user`, `owner`, `super_admin`)
- `Document` — documento generado con `referenceDocumentId` opcional
- `DocumentVersion` — versionado (edición colaborativa)
- `DocumentAnnotation` — comentarios/marcas
- `IAUsageLog` — tracking de uso para billing
- `GenerationJob` — cola de generación async
- `Account`, `Session`, `VerificationToken` — NextAuth

**Extendido vía migraciones directas:**
Expediente, Actuación, Cliente, Honorario, Vencimiento, ReferenceDocument, Subscription, Plan, PromoCode, Portal*, etc.

---

## 🔐 Autenticación y Seguridad

- NextAuth.js con magic link + email/password
- Verificación de email por OTP de 6 dígitos
- Bcrypt para hashing
- **Rate limiting**:
  - 100 req/min global
  - 5 req/5min en endpoints sensibles (login, register, reset)
- Inactivity logout automático
- Multi-tenant aislado por `tenantId`
- Helmet + CORS configurado

---

## 💳 Sistema de Billing

Ubicado en `routes.billing.ts`:
- Suscripciones (Plans)
- Códigos promo
- Tracking de documentos/mes (counter tipo "18/50")
- Plan "Pro Edition" premium

---

## 🎨 Frontend — Patrón de Diseño

- **Tailwind** con `darkMode: "class"`, tema default `dark`
- **Colores**: `primary #2b3bee`, `bg-light #f6f6f8`, `bg-dark #101222`
- **AppShell** envuelve rutas autenticadas (sidebar + header + content)
- **Componentes reusables**: `PageHeader`, `EmptyState`, `PageSkeleton`, `StatsGrid`, `FloatingAssistant` (widget IA flotante)
- **Scrollbar global** theme-aware (4px, transparente, adaptado al modo)
- **ThemeProvider** con modo sistema/claro/oscuro

---

## 🛠️ Panel Super-Admin (`/admin`)

Solo accesible con email en `SUPER_ADMIN_EMAIL`:
- Overview global del sistema
- Tabla de todos los tenants
- Tabla de todos los usuarios
- **PromptsManager** — editar prompts de IA en vivo
- **PromoCodesManager** — crear códigos de descuento
- Detalle por tenant

---

## 🔧 Funcionalidades Transversales

- **Chat IA flotante** en cualquier página (FloatingAssistant)
- **Búsqueda global** con `Ctrl+K` (Command Palette)
- **Atajos de teclado** tipo Linear (`g d` → dashboard, `g e` → expedientes, etc.)
- **Portal del cliente** (`/portal/cliente/[token]`) — acceso externo para que clientes vean sus casos
- **Compartir documento por link** (`/share/[token]`)
- **Notificaciones** (panel + email)
- **RAG service** para búsqueda semántica en documentos
- **PDF generation** vía microservicio dedicado
- **Prompts customizables** desde admin panel
- **Onboarding flow** post-registro

---

## 🇦🇷 Foco: Argentina

Todo adaptado a **normativa argentina**:
- Código Civil y Comercial
- Formatos de documentos legales locales
- Integración con portales judiciales argentinos
- Idioma español argentino
- Formato AR de fechas, montos, etc.

---

## 🗂️ Estructura de Rutas Backend (API)

| Archivo | Propósito |
|---|---|
| `routes.auth.ts` | Login, registro, verificación email, reset password |
| `routes.documents.ts` | CRUD documentos, versionado, generación |
| `routes.chat.ts` | Chat conversacional con IA (Doku Genera) |
| `routes.analysis.ts` | Análisis de contratos (Doku Analiza) |
| `routes.estrategia.ts` | Asesoría estratégica (Doku Estratega) |
| `routes.juris.ts` | Búsqueda jurisprudencial (Doku Juris) |
| `routes.expedientes.ts` | Gestión de expedientes |
| `routes.actuaciones.ts` | Actuaciones dentro de expedientes |
| `routes.clients.ts` | CRM de clientes |
| `routes.vencimientos.ts` | Plazos legales |
| `routes.calendar.ts` | Calendario unificado |
| `routes.honorarios.ts` | Finanzas/honorarios |
| `routes.imports.ts` | Bulk import Excel/CSV |
| `routes.portal.ts` | Config sync con portales judiciales |
| `routes.client-portal.ts` | Portal cliente externo |
| `routes.sharing.ts` | Compartir documentos por link |
| `routes.references.ts` | Documentos de referencia para IA |
| `routes.billing.ts` | Subscripciones y planes |
| `routes.team.ts` | Gestión de equipo del tenant |
| `routes.assistant.ts` | FloatingAssistant endpoints |
| `routes.prompts.ts` | Prompts customizables |
| `routes.search.ts` | Búsqueda global |
| `routes.stats.ts` | Métricas |
| `routes.superadmin.ts` | Panel super-admin |
| `routes.user.ts` | Perfil usuario |

---

## 📝 TL;DR

Plataforma SaaS multi-tenant para **estudios jurídicos argentinos** que combina:

1. **IA generativa** (Claude API) para documentos legales
2. **Gestión integral** de casos, clientes, vencimientos, honorarios
3. **Integración nativa** con portales judiciales del país (PJN, MEV, SCBA, Corrientes)
4. **Portal cliente** para transparencia con clientes finales

Diseñada desde cero para el mercado legal argentino, con normativa y vocabulario locales.
