# Relevamiento Técnico — Legal AI Platform

> Generado: 2026-03-17  
> Propósito: auditoría de arquitectura del flujo de generación documental

---

## 1. Estructura del proyecto

```
/workspace/
├── railway.json                         ← config Railway (root→apps/api)
├── apps/
│   ├── api/
│   │   ├── prisma/schema.prisma
│   │   ├── prisma/migrations/
│   │   ├── package.json
│   │   └── src/
│   │       ├── server.ts                ← Fastify init, CORS, rate limit
│   │       ├── types.ts
│   │       ├── routes.auth.ts
│   │       ├── routes.documents.ts      ★ rutas principales
│   │       ├── routes.user.ts
│   │       ├── utils/auth.ts            ← JWT decode, requireAuth()
│   │       ├── utils/logger.ts
│   │       ├── utils/sanitize.ts
│   │       ├── services/email.ts
│   │       └── modules/documents/
│   │           ├── dto/generate-document.dto.ts
│   │           ├── domain/
│   │           │   ├── document-registry.ts
│   │           │   ├── document-types.ts  ← tipos conocidos por el backend
│   │           │   ├── generation-engine.ts ← assembleBaseDraft()
│   │           │   ├── validation-engine.ts
│   │           │   └── validation-rules.ts
│   │           ├── services/
│   │           │   ├── document-mapper.ts  ← normalización + mapeo legacy
│   │           │   └── generation-service.ts ★ orquestador principal
│   │           ├── templates/
│   │           │   ├── index.ts
│   │           │   ├── legal-notice/template.ts
│   │           │   ├── nda/template.ts
│   │           │   └── service-contract/template.ts
│   │           └── clauses/
│   │               ├── common/{disputes, identification, jurisdiction}.ts
│   │               ├── legal-notice/{breach, context, deadline, demand, facts, warning}.ts
│   │               ├── nda/{breach, definition, obligations, purpose, return, term}.ts
│   │               └── service/{amount, confidentiality, intellectual-property, object, term, termination}.ts
│   ├── web/
│   │   ├── app/
│   │   │   ├── layout.tsx / globals.css
│   │   │   ├── page.tsx                 ← redirect root
│   │   │   ├── auth/{login,register,verify-email,reset}/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── documents/
│   │   │   │   ├── page.tsx             ← lista de documentos
│   │   │   │   ├── new/guided/page.tsx  ★ wizard completo (825 líneas)
│   │   │   │   └── [id]/page.tsx        ← detalle + descarga
│   │   │   ├── settings/{page,billing,security,integrations}/
│   │   │   ├── api/
│   │   │   │   ├── auth/[...nextauth]/{route,authOptions}.ts
│   │   │   │   ├── _auth/{login,register,verify-email,reset}/
│   │   │   │   └── _proxy/[...path]/route.ts ★ proxy autenticado
│   │   │   └── lib/
│   │   │       ├── webApi.ts            ← helpers fetch + getPdfUrl()
│   │   │       ├── pdfGenerator.ts      ← client-side PDF con jsPDF
│   │   │       ├── format.ts / sanitize.ts / utils.ts
│   │   │       └── hooks/useAuth.ts
│   │   └── src/features/documents/
│   │       ├── core/
│   │       │   ├── types.ts             ★ interfaces centrales
│   │       │   ├── registry.ts          ← Map<DocumentTypeId, schema>
│   │       │   ├── validation.ts        ← validateFormData()
│   │       │   └── warnings.ts          ← evaluateWarningRules()
│   │       ├── schemas/
│   │       │   ├── common-fields.ts     ← additionalClausesSection
│   │       │   ├── service-contract.ts
│   │       │   ├── lease-agreement.ts
│   │       │   ├── nda.ts
│   │       │   ├── legal-notice.ts
│   │       │   ├── debt-recognition.ts
│   │       │   └── simple-authorization.ts
│   │       └── ui/
│   │           ├── fields/FieldRenderer.tsx
│   │           ├── forms/DynamicForm.tsx
│   │           ├── summaries/LegalSummary.tsx  ← switch manual por tipo
│   │           └── warnings/WarningsPanel.tsx
│   └── pdf/
│       └── src/
│           ├── server.ts
│           ├── routes.pdf.ts
│           ├── pdfGenerator.ts
│           └── pdfGeneratorPuppeteer.ts
└── packages/
    ├── db/prisma/schema.prisma
    ├── ui/src/{button,card,code}.tsx
    ├── eslint-config/
    └── typescript-config/
```

---

## 2. Schema de base de datos

```prisma
model Tenant {
  id        String       @id @default(uuid())
  name      String
  users     User[]
  documents Document[]
  logs      IAUsageLog[]
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}

model User {
  id                      String    @id @default(cuid())
  name                    String?
  email                   String    @unique
  passwordHash            String    @map("password")
  emailVerified           DateTime?
  company                 String?
  role                    String    @default("user")
  tenantId                String?           // ⚠️ NULLABLE — riesgo
  bio                     String?
  notificationPreferences Json?
  tenant           Tenant?   @relation(fields: [tenantId], references: [id])
  documentsCreated Document[] @relation("CreatedByUser")
  accounts         Account[]
  sessions         Session[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@map("User")
}

model Document {
  id           String            @id @default(uuid())
  tenantId     String                         // no-nullable ✓
  tenant       Tenant            @relation(fields: [tenantId], references: [id])
  createdById  String
  createdBy    User              @relation("CreatedByUser", fields: [createdById], references: [id])
  type         String
  jurisdiccion String
  tono         String
  estado       String            // "generated_text" | "ready_pdf" | "error"
  costUsd      Float?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  versions     DocumentVersion[]
  logs         IAUsageLog[]      @relation("DocLogs")
}

model DocumentVersion {
  id                 String   @id @default(uuid())
  documentId         String
  document           Document @relation(fields: [documentId], references: [id])
  versionNumber      Int
  rawText            String
  pdfUrl             String?          // ⚠️ solo el filename, no URL completa
  hashSha256         String?
  generatedBy        String           // "gpt-4o-mini"
  structuredData     Json?            // input del formulario (nullable)
  clausePlan         Json?
  generationWarnings Json?
  templateVersion    String?
  status             String?          // "draft"|"generated"|"reviewed"|"final"
  createdAt          DateTime @default(now())
}

model IAUsageLog {
  id               String    @id @default(uuid())
  tenantId         String
  tenant           Tenant    @relation(fields: [tenantId], references: [id])
  documentId       String?
  document         Document? @relation("DocLogs", fields: [documentId], references: [id])
  service          String
  modelName        String
  promptTokens     Int
  completionTokens Int
  costUsd          Float
  timestamp        DateTime  @default(now())
}

// NextAuth: Account, Session, VerificationToken (estándar)
```

**Tablas ausentes:** no existe `Template`, `Membership`, `AuditLog` ni tabla de planes/billing.

---

## 3. Flujo completo de generación documental

### 3.1 Entrada — `new/guided/page.tsx`

Wizard de 4 pasos (`selection → form → summary → result`) en un único componente React. Sin routing entre pasos.

**Payload enviado (líneas 234–244):**

```typescript
const requestPayload = {
  documentType: selectedDocumentType,  // "service_contract"
  jurisdiction: formData.jurisdiccion, // alias explícito
  tone: formData.tono,                 // alias explícito
  ...formData,                         // ⚠️ SOBREESCRIBE los dos anteriores
};
// → POST /api/_proxy/documents/generate
```

> ⚠️ `jurisdiction` y `tone` quedan pisados por el spread de `formData`. El backend recibe `jurisdiccion` y `tono`.

### 3.2 Proxy — `_proxy/[...path]/route.ts`

Re-firma un JWT de 15 minutos con `{ id, email, tenantId, role }` usando `NEXTAUTH_SECRET` y lo inyecta como `Authorization: Bearer <token>` antes de forwarding al backend.

### 3.3 Backend — `POST /documents/generate` (`routes.documents.ts:165`)

```
1. normalizeDocumentRequest(body)     → mapea tipos/tonos legacy, extrae structuredData
2. sanitizeObject(structuredData)     → sanitización XSS
3. getUserFromRequest(request)        → decode JWT → { userId, tenantId, role, email }
   ⚠️ si no hay auth: tenantId = "demo-tenant", userId = "demo-user"
4. generateDocumentWithNewArchitecture(documentType, sanitizedData, tone)
5. prisma.$transaction → Document + DocumentVersion
6. fetch PDF_SERVICE_URL/pdf/generate
7. return { ok, documentId, contrato, pdfUrl, warnings, metadata }
```

### 3.4 Servicio de generación — `generation-service.ts`

```
getTemplate(documentType)          → template con {{SLOT}} placeholders
getClausesForType(documentType)    → Map<clauseId, ClauseDefinition>
getRequiredClauseIds()
validateDocumentData()             → lanza 400 si hay errores
generateClausePlan()               → required + condicionales opcionales
assembleBaseDraft()                → rellena placeholders → texto base
getPromptConfigForType()           → systemMessage + baseInstructions + toneInstructions
enhanceDraftWithAIWrapper()        → llama a OpenAI
```

### 3.5 Llamada a OpenAI

```typescript
await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: systemMessage },
    { role: "user", content:
        `Mejora y completa el siguiente borrador de ${documentType}:\n\n${baseDraft}\n\n` +
        `INSTRUCCIONES:\n${baseInstructions.map(i => `- ${i}`).join("\n")}\n\n` +
        `TONO: ${toneInstruction}\n\n` +
        `IMPORTANTE:\n- NO cambies los datos concretos\n- Responde SOLO con el texto mejorado`
    }
  ],
  temperature: 0.3,
  max_tokens: 4000,
  top_p: 0.9,
});
```

### 3.6 Cómo se decide la plantilla por tipo

`generation-engine.ts` tiene un switch hardcodeado de `clauseId → {{SLOT}}`:

```typescript
clauseId === "identificacion_partes" ? "{{CLAUSE_IDENTIFICATION}}" : null,
clauseId === "objeto_contrato"       ? "{{CLAUSE_OBJECT}}" : null,
clauseId === "monto_pago"            ? "{{CLAUSE_AMOUNT}}" : null,
clauseId === "contexto_relacion"     ? "{{CLAUSE_CONTEXT}}" : null,   // legal_notice
clauseId === "hechos"                ? "{{CLAUSE_FACTS}}" : null,
clauseId === "intimacion"            ? "{{CLAUSE_DEMAND}}" : null,
// ...
```

### 3.7 `additionalClauses` — el gap crítico

El campo viaja en `structuredData`, pasa por `sanitizeObject()`, llega a `generateDocumentWithNewArchitecture()` como parte de `data`, pero:

- `assembleBaseDraft()` no tiene slot `{{CLAUSE_ADDITIONAL}}`
- `enhanceDraftWithAIWrapper()` recibe `data` pero **nunca lo lee** — el prompt se construye solo con `baseDraft` + `promptConfig` + `toneInstruction`

**`additionalClauses` se descarta silenciosamente en todos los tipos documentales.**

---

## 4. Frontend: archivos clave

### `new/guided/page.tsx` (825 líneas)
- Estado plano: `currentStep`, `formData`, `warnings`, `loadingProgress`, `result`, `validationErrors`
- Autosave a `localStorage` con debounce de 2s por tipo documental
- Progreso de carga **simulado** (0→25→70→90→100), no es streaming real
- Validación duplicada: `validateFormData` corre en `DynamicForm.handleSubmit` Y en `handleFormSubmit`

### `DynamicForm.tsx`
- Renderiza secciones y campos desde el schema
- `visibleWhen` solo evalúa truthy (no soporta condiciones por valor específico)

### `LegalSummary.tsx`
- **Switch manual por tipo** — no es schema-driven
- Requiere modificación manual para cada nuevo tipo documental
- Muestra `additionalClauses` genéricamente al final si está presente

### `app/documents/[id]/page.tsx`
- Descarga PDF 100% client-side con `generatePdfFromText(rawText)` — nunca usa `pdfUrl`

---

## 5. Backend: archivos clave

### `routes.documents.ts` — tenant enforcement por ruta

| Endpoint | Tenant check |
|---|---|
| `GET /documents` | ✅ `where.tenantId = user.tenantId` |
| `GET /documents/:id` | ❌ `findUnique({ where: { id } })` sin tenantId — sin auth |
| `POST /documents/generate` | ⚠️ fallback a `"demo-tenant"` si no hay auth |
| `DELETE /documents/:id` | ✅ + verifica rol admin/owner |
| `PATCH /documents/:id` | ✅ |
| `GET /documents/:id/pdf` | ✅ |

### `generation-service.ts`
Orquestador principal. `getPromptConfigForType()` es **independiente** del `promptConfig` del schema frontend — el backend tiene sus propias instrucciones hardcodeadas.

### `utils/auth.ts`
```typescript
export function getUserFromRequest(request: FastifyRequest): AuthUser | null {
  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, secret) as any;
  return {
    userId: decoded.id || decoded.sub,
    tenantId: decoded.tenantId,
    role: decoded.role || "user",
    email: decoded.email,
  };
}
```

---

## 6. Prompts y plantillas

### Prompt genérico base

```typescript
// generation-service.ts:201
systemMessage: "Eres un abogado senior argentino especializado en derecho comercial con 20 años de experiencia..."

userPrompt: `Mejora y completa el siguiente borrador de ${documentType}:
${baseDraft}
INSTRUCCIONES:
- El documento debe ser legalmente válido y ejecutable en Argentina
- Usar los datos concretos proporcionados
- Incluir cláusulas obligatorias según tipo de contrato
- Estructura: Encabezado con datos completos de partes, luego cláusulas numeradas
TONO: ${toneInstruction}
IMPORTANTE: Responde SOLO con el texto mejorado del documento`
```

### Customizaciones por tipo

| Tipo | Instrucción adicional |
|---|---|
| `service_contract` | Incluir: identificación de partes, objeto, monto y forma de pago, vigencia, foro |
| `nda` | Incluir: definición clara de info confidencial, finalidad, obligaciones, plazo, medidas de protección |
| `legal_notice` | Incluir: relación previa, narración cronológica, incumplimiento, intimación concreta, plazo, apercibimiento |
| `lease`, `debt_recognition`, `simple_authorization` | Sin customización (usan solo la base) |

### `promptConfig` del frontend
Cada schema define su propio `promptConfig` con `systemMessage`, `baseInstructions`, `toneInstructions`, `formatInstructions`. **El backend nunca lee este objeto** — tiene el suyo propio en `generation-service.ts`.

---

## 7. Validaciones actuales

### Frontend — `validation.ts`

**Fase 1 — Campos:** `required`, `minLength`, `maxLength`, `pattern`, `min/max`, tipo `cuit` (11 dígitos), tipo `date`.

**Fase 2 — Semánticas** (ejemplos):
- Carta Documento: intimación ≥ 30 chars, plazo presente, hechos ≥ 30 chars, incumplimiento ≥ 20 chars
- NDA: definición de info confidencial requerida, finalidad requerida
- Poder: alcance y trámite requeridos

**Warnings** (no bloquean):
- Carta Documento: intimación ambigua/corta, falta contexto relación previa
- NDA: plazo muy corto, sin obligación de devolución
- Servicio: sin cláusula de confidencialidad, sin PI definida

### Backend — `validation-engine.ts`
Corre sus propias validaciones semánticas. Si fallan → 400 con `validationErrors[]`.

### Validación post-generación
**No existe.** No hay control de placeholders tipo `[COMPLETAR]`, `[indicar nombre]`, etc. en el texto generado por la IA.

---

## 8. Tipos documentales

### Contrato de Servicios (`service_contract`) ✅ backend completo

| Sección | Obligatorios | Opcionales/Condicionales |
|---|---|---|
| Config | jurisdiccion, tono | — |
| Partes | proveedor_{nombre,doc,domicilio}, cliente_{nombre,doc,domicilio} | — |
| Servicio | descripcion_servicio, alcance | entregables |
| Comercial | monto, moneda, periodicidad, forma_pago, plazo_pago | — |
| Rescisión | — | penalizacion_rescision → penalizacion_monto, preaviso_rescision |
| PI | — | propiedad_intelectual → tipo_propiedad_intelectual |
| Confidencialidad | — | confidencialidad → plazo_confidencialidad |
| Notificaciones | — | domicilio_notificaciones → domicilio_especial |

### Contrato de Locación (`lease`) ✅ backend completo

| Sección | Obligatorios | Opcionales/Condicionales |
|---|---|---|
| Config | jurisdiccion, tono | — |
| Partes | locador_{nombre,doc,domicilio}, locatario_{nombre,doc,domicilio} | — |
| Objeto | descripcion_inmueble, domicilio_inmueble, destino_uso | — |
| Económico | monto_alquiler, moneda, forma_pago, dia_pago, ajuste_precio | — |
| Plazo | fecha_inicio, duracion_meses | renovacion_automatica |
| Condiciones | — | deposito_garantia → meses_deposito, servicios_locatario, preaviso_rescision |

### NDA (`nda`) ✅ backend completo

| Sección | Obligatorios | Opcionales/Condicionales |
|---|---|---|
| Config | jurisdiccion, tono | — |
| Partes | revelador_{nombre,doc,domicilio}, receptor_{nombre,doc,domicilio} | — |
| Info confidencial | definicion_informacion, finalidad_permitida | exclusiones |
| Plazo | plazo_confidencialidad, inicio_vigencia | — |
| Obligaciones | — | devolucion_destruccion → plazo_devolucion |
| Incumplimiento | penalidad_incumplimiento | — |

### Carta Documento (`legal_notice`) ✅ backend completo

| Sección | Obligatorios | Opcionales/Condicionales |
|---|---|---|
| Config | jurisdiccion, tono | — |
| Partes | remitente_{nombre,doc,domicilio}, destinatario_{nombre,doc,domicilio} | — |
| Contexto | relacion_previa | — |
| Hechos | hechos, incumplimiento | — |
| Intimación | intimacion, plazo_cumplimiento, apercibimiento | plazo_custom (si plazo = "custom") |

### Reconocimiento de Deuda (`debt_recognition`) ❌ sin backend

| Sección | Obligatorios | Opcionales/Condicionales |
|---|---|---|
| Config | jurisdiccion, tono | — |
| Partes | acreedor_{nombre,doc,domicilio}, deudor_{nombre,doc,domicilio} | — |
| Deuda | monto_deuda, moneda, causa_deuda, fecha_reconocimiento | — |
| Pago | forma_pago | pago_en_cuotas → cantidad_cuotas, monto_cuota, fecha_primer_vencimiento; incluye_intereses → tasa_interes |

> **Rompe en producción**: el backend lanza `"Template not found for document type: debt_recognition"`

### Poder / Autorización (`simple_authorization`) ❌ sin backend

| Sección | Obligatorios | Opcionales/Condicionales |
|---|---|---|
| Config | jurisdiccion, tono | — |
| Partes | autorizante_{nombre,doc,domicilio}, autorizado_{nombre,doc,domicilio} | — |
| Alcance | tramite_autorizado, descripcion_alcance | limitaciones |
| Vigencia | fecha_autorizacion | acto_unico → vigencia_hasta |
| Observaciones | — | condiciones_especiales, documentacion_asociada |

> **Rompe en producción**: el backend lanza `"Template not found for document type: simple_authorization"`

---

## 9. Multi-tenant y seguridad

### Flujo de identidad

```
Login API → { user: { id, tenantId, role } }
         → NextAuth JWT callback guarda tenantId
         → _proxy re-firma JWT 15min con { id, email, tenantId, role }
         → backend decodifica en getUserFromRequest()
```

### Enforcement de tenant

No hay middleware global. Cada ruta aplica `where: { tenantId: user.tenantId }` manualmente.

### Riesgo crítico — `GET /documents/:id`

```typescript
// routes.documents.ts ~línea 668
const document = await prisma.document.findUnique({
  where: { id },    // SIN tenantId filter, SIN requireAuth()
});
// Cualquier request HTTP con el UUID puede obtener el documento
```

### Riesgo secundario — `POST /documents/generate`

```typescript
const user = getUserFromRequest(request);
const tenantId = user?.tenantId || "demo-tenant";  // fallback en lugar de 401
const userId   = user?.userId   || "demo-user";
```

---

## 10. Ejemplo real — Carta Documento de punta a punta

### Payload enviado

```json
{
  "documentType": "legal_notice",
  "jurisdiction": "caba",
  "tone": "formal_technical",
  "jurisdiccion": "caba",
  "tono": "formal_technical",
  "remitente_nombre": "Construcciones del Sur SRL",
  "remitente_doc": "30-71234567-9",
  "remitente_domicilio": "Av. Corrientes 1234, CABA",
  "destinatario_nombre": "Inmobiliaria Palermo SA",
  "destinatario_doc": "30-68901234-5",
  "destinatario_domicilio": "Av. Santa Fe 4567, CABA",
  "relacion_previa": "Contrato de locación de obra del 15/10/2025...",
  "hechos": "La remitente cumplió la obra. Factura B N°342...",
  "incumplimiento": "A la fecha no se recibió el pago de $2.550.000...",
  "intimacion": "Se INTIMA a pagar $2.550.000 con intereses...",
  "plazo_cumplimiento": "10_dias",
  "apercibimiento": "Vencido el plazo se iniciarán acciones judiciales...",
  "additionalClauses": "Se deja constancia de reclamos previos..."
}
```

### Secuencia

```
1. Frontend → POST /api/_proxy/documents/generate
2. Proxy agrega Authorization: Bearer <jwt-15min>
3. Backend normaliza → documentType: "legal_notice", structuredData: { ... }
4. getTemplate("legal_notice") → template con {{CLAUSE_CONTEXT}}, {{CLAUSE_FACTS}}, etc.
5. assembleBaseDraft() → rellena slots con datos del formulario
   ⚠️ additionalClauses: no tiene slot → se descarta
6. OpenAI: systemMessage + userPrompt (baseDraft + instrucciones + tono)
7. prisma.$transaction → Document + DocumentVersion (rawText = texto IA)
8. fetch PDF_SERVICE → genera archivo → guarda filename en pdfUrl
9. return { ok, documentId, contrato, pdfUrl: "<versionId>.pdf", warnings, metadata }
```

---

## 11. Riesgos y deuda técnica

### Bugs activos

| # | Descripción | Impacto |
|---|---|---|
| 1 | `additionalClauses` descartado silenciosamente | Jurídico directo |
| 2 | `GET /documents/:id` sin tenant check ni auth | Fuga de datos entre tenants |
| 3 | `POST /documents/generate` con fallback `"demo-tenant"` | Generación sin tenant real |
| 4 | `debt_recognition` y `simple_authorization` sin template backend | Crash en producción |

### Inconsistencias arquitecturales

| # | Descripción |
|---|---|
| 5 | Dos `promptConfig` paralelos — frontend y backend desincronizados |
| 6 | Payload key collision: `jurisdiction`/`tone` pisados por `...formData` |
| 7 | `LegalSummary` es switch manual — no schema-driven |
| 8 | Validación duplicada en form submit |
| 9 | `visibleWhen` solo truthy, no soporta condiciones por valor |
| 10 | Progreso de carga fake (0→25→70→90→100 hardcodeado) |

### Deuda estructural

| # | Descripción |
|---|---|
| 11 | `StructuredDocumentData = Record<string, unknown>` — sin type safety |
| 12 | Sin control de placeholders post-generación (`[COMPLETAR]`, `[indicar]`, etc.) |
| 13 | `pdfUrl` guarda filename, no URL — confusión semántica |
| 14 | `User.tenantId` nullable — usuario sin tenant no se rechaza |
| 15 | Templates hardcodeados en código — sin versionado ni edición sin deploy |

---

## A. Arquitectura actual resumida

**Frontend (Next.js):** Wizard de 4 pasos en un único componente. Los schemas (campos, validaciones, warnings, resumen, prompt config) viven en el cliente. El proxy BFF refresca el JWT en cada request.

**Backend (Fastify):** Un archivo de rutas principal. La generación pasa por: normalización → validación → armado de borrador con cláusulas (template + slots) → mejora con IA → guardado en PostgreSQL → llamada al servicio PDF.

**Generación:** 3 capas — template con slots `{{CLAUSE_X}}` → cláusulas renderizadas → IA mejora el borrador completo. La IA trabaja sobre texto ya semi-estructurado, no genera desde cero.

**PDF:** Microservicio separado. El frontend usa también jsPDF client-side para descarga directa.

**DB:** PostgreSQL vía Prisma. Sin tablas de templates ni auditoría. Multi-tenant por columna `tenantId` con filtros manuales por ruta.

---

## B. Archivos más importantes para auditar

| Prioridad | Archivo | Razón |
|---|---|---|
| 🔴 | `apps/api/src/routes.documents.ts` | Toda la lógica + seguridad |
| 🔴 | `apps/api/src/modules/documents/services/generation-service.ts` | Orquestador IA + prompt |
| 🔴 | `apps/api/src/modules/documents/domain/generation-engine.ts` | Armado de borrador + slots |
| 🟠 | `apps/web/app/documents/new/guided/page.tsx` | Wizard completo (825 líneas) |
| 🟠 | `apps/web/src/features/documents/ui/summaries/LegalSummary.tsx` | Switch manual por tipo |
| 🟡 | `apps/web/src/features/documents/core/types.ts` | Contratos de tipos compartidos |
| 🟡 | `apps/web/src/features/documents/schemas/common-fields.ts` | Campo additionalClauses |
| 🟡 | `apps/web/app/api/_proxy/[...path]/route.ts` | Auth flow + JWT |
| 🟡 | `apps/api/src/utils/auth.ts` | JWT decode + tenant |
| 🟢 | `apps/web/src/features/documents/core/validation.ts` | Validaciones frontend |

---

## C. Riesgos técnicos detectables leyendo el código

| Severidad | Riesgo |
|---|---|
| 🔴 Crítico | `GET /documents/:id` sin tenant check — fuga de datos entre tenants |
| 🔴 Crítico | `additionalClauses` silenciosamente descartado — impacto jurídico directo |
| 🔴 Crítico | `debt_recognition` y `simple_authorization` rompen en producción |
| 🟠 Alto | `POST /documents/generate` acepta requests sin auth con fallback demo |
| 🟠 Alto | Sin detección de placeholders vacíos en texto generado |
| 🟠 Alto | `promptConfig` del frontend es letra muerta (backend tiene el suyo) |
| 🟡 Medio | `LegalSummary` manual — riesgo de desincronización |
| 🟡 Medio | `StructuredDocumentData = Record<string, unknown>` — sin type safety |
| 🟡 Medio | Validación duplicada en form submit |
| 🟡 Medio | Templates hardcodeados — sin versionado ni edición sin deploy |
| 🟢 Bajo | Payload key collision `jurisdiction` vs `jurisdiccion` |
| 🟢 Bajo | `visibleWhen` solo truthy |
| 🟢 Bajo | `pdfUrl` guarda filename, no URL |

---

## D. Orden recomendado de archivos para revisar primero

1. `apps/api/src/routes.documents.ts` — seguridad multi-tenant y flujo completo
2. `apps/api/src/modules/documents/services/generation-service.ts` — dónde muere `additionalClauses` y cómo se arma el prompt
3. `apps/api/src/modules/documents/domain/generation-engine.ts` — slots, cláusulas y template assembly
4. `apps/web/app/documents/new/guided/page.tsx` — payload, validaciones duplicadas, progreso fake
5. `apps/web/src/features/documents/schemas/{debt-recognition,simple-authorization}.ts` — tipos sin backend
6. `apps/web/src/features/documents/ui/summaries/LegalSummary.tsx` — switch manual vs schema-driven
7. `apps/web/src/features/documents/core/types.ts` — `StructuredDocumentData` y contratos de tipos
8. `apps/web/app/api/_proxy/[...path]/route.ts` — auth flow y JWT re-signing
9. `apps/api/src/modules/documents/templates/` — plantillas hardcodeadas
10. `apps/api/prisma/schema.prisma` — ausencia de tabla Template, nullable tenantId en User
