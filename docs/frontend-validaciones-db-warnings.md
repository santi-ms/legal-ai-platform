# Mejoras de calidad documental — Frontend, DB y Validaciones

> Período: sesión de trabajo — 2026-03-17  
> Branch: `main`  
> Commits: `4ef76a7` → `275e2c9`

---

## Resumen ejecutivo

Tres iteraciones sucesivas que cierran el ciclo completo de calidad documental:
1. El frontend ahora comunica claramente cuando un documento fue marcado como incompleto
2. Los warnings de validación post-generación quedan persistidos en la base de datos
3. Los tres tipos documentales sin validación backend ya tienen reglas semánticas y warnings

---

## 1. Manejo de documentos incompletos en el frontend

**Commit:** `4ef76a7`  
**Archivos:** 3 modificados

### Problema
El backend podía devolver `incompleteDocument: true` y `outputWarnings: [...]`, pero el frontend los ignoraba. Un documento con placeholders se mostraba exactamente igual que uno generado correctamente — mismo ícono de check verde, mismo botón de descarga, sin advertencia.

### Cambios

#### `apps/web/app/documents/new/guided/page.tsx`

**Nuevos tipos:**
```typescript
interface OutputWarning {
  code: string;
  message: string;
  match?: string;
  severity: "error" | "warning";
}

interface GenerationResult {
  // ...campos existentes...
  incompleteDocument?: boolean;   // nuevo — backend detectó placeholders
  outputWarnings?: OutputWarning[]; // nuevo — lista de issues específicos
}
```

**Captura de campos en `handleGenerate`:**
```typescript
const generationResult: GenerationResult = {
  // ...
  incompleteDocument: json.incompleteDocument || false,
  outputWarnings: json.outputWarnings || [],
};
```

**Header condicional del paso resultado:**

| Condición | Ícono | Título |
|---|---|---|
| `incompleteDocument = false` | CheckCircle verde | "¡Documento generado exitosamente!" |
| `incompleteDocument = true` | AlertTriangle amber | "Documento generado con advertencias" |

**Panel de problemas** (solo cuando `incompleteDocument = true`):
```
⚠ Se detectaron N problema(s) que deben revisarse
  • Placeholder sin completar detectado: "[indicar monto]"    [indicar monto]
  • Instrucción meta sin resolver: "describir"                describir
  El documento fue guardado para revisión. El PDF no se generó automáticamente.
```

**Botón PDF condicional:**

| Estado | Botón |
|---|---|
| Documento completo | `Descargar PDF` (habilitado, fondo primario) |
| `incompleteDocument = true` | `PDF no disponible` (deshabilitado, gris, cursor not-allowed) |

---

#### `apps/web/app/documents/[id]/page.tsx`

**Banner `needs_review`** (antes del contenido):
```
⚠ Este documento requiere revisión
  El sistema detectó posibles placeholders o contenido incompleto...
  El PDF no se generó automáticamente.
  • [lista de issues específicos desde la DB cuando están disponibles]
```

**Botón de descarga condicional:**

| `doc.estado` | Botón |
|---|---|
| cualquier otro | `⬇ Descargar PDF` (habilitado) |
| `needs_review` | `⚠ PDF no disponible` (deshabilitado, gris) |

**Display de estado actualizado:**

| Valor DB | Texto mostrado | Color |
|---|---|---|
| `generated` / `generated_text` | Generado | verde |
| `needs_review` | Requiere revisión | amber/negrita |
| `DRAFT` (legacy) | — | amber |

---

#### `apps/web/components/dashboard/RecentDocumentsTable.tsx`

**`statusConfig` extendido** con valores del backend (antes solo tenía valores en español legacy):

```typescript
generated:      { label: "Generado",           className: "...emerald..." },
generated_text: { label: "Generado",           className: "...emerald..." },
needs_review:   { label: "Requiere revisión",   className: "...amber..."  },
draft:          { label: "Borrador",            className: "...slate..."  },
// + los 4 valores legacy en español (sin cambios)
```

---

## 2. Persistencia de outputWarnings en base de datos

**Commit:** `f7e0268`  
**Archivos:** 9 modificados

### Problema
Los warnings de validación post-generación (`output-validator.ts`) solo viajaban en la respuesta HTTP. Si el usuario volvía a ver el documento después, el banner decía "requiere revisión" pero sin detallar qué problema específico se detectó. Sin persistencia no hay trazabilidad para auditoría ni debugging.

### Estrategia elegida

**Nueva columna `outputWarnings Json?` en `DocumentVersion`** — paralela a `generationWarnings`:

| Columna | Contenido | Cuándo se llena |
|---|---|---|
| `generationWarnings` | Warnings de reglas semánticas del formulario | Antes de llamar a la IA |
| `outputWarnings` | Issues de `output-validator.ts` | Después de que la IA genera el texto |

La trazabilidad es por versión: si se regenera el documento, la nueva `DocumentVersion` tiene sus propios `outputWarnings`.

### Cambios

#### Schemas Prisma (3 archivos sincronizados)

```prisma
model DocumentVersion {
  // ...campos existentes...
  generationWarnings  Json?  // Pre-generation warnings (semantic validation rules)
  outputWarnings      Json?  // Post-generation warnings (placeholder/completeness detection)
  status              String? // "draft"|"generated"|"reviewed"|"final"|"needs_review"
}
```

Archivos: `apps/api/prisma/schema.prisma`, `packages/db/prisma/schema.prisma`, `apps/web/prisma/schema.prisma`

#### Migración

**`20251116000000_add_output_warnings_to_document_version`** (en los 3 módulos):

```sql
ALTER TABLE "DocumentVersion" ADD COLUMN IF NOT EXISTS "outputWarnings" JSONB;

COMMENT ON COLUMN "DocumentVersion"."outputWarnings" IS
  'Post-generation output validation issues: placeholders, incomplete content, etc.';
```

El `IF NOT EXISTS` garantiza que es safe en producción sobre datos existentes.

#### `apps/api/src/routes.documents.ts`

**Guardado en `DocumentVersion.create`:**
```typescript
outputWarnings: outputValidation.issues.length > 0
  ? outputValidation.issues as any
  : null,   // null si no hay issues — evita ruido en columna
```

**Expuesto en `GET /documents/:id`:**
```typescript
select: {
  id: true,
  rawText: true,
  pdfUrl: true,
  status: true,         // nuevo
  outputWarnings: true, // nuevo
  createdAt: true,
},
```

#### `apps/web/app/lib/webApi.ts`

```typescript
lastVersion: {
  id: string;
  rawText: string;
  pdfUrl: string | null;
  status: string | null;          // nuevo
  outputWarnings: Array<{         // nuevo
    code: string;
    message: string;
    match?: string;
    severity: "error" | "warning";
  }> | null;
  createdAt: string;
} | null;
```

#### `apps/web/app/documents/[id]/page.tsx`

El banner `needs_review` ahora lista los issues específicos desde la DB (con el fragmento exacto del texto):

```
⚠ Este documento requiere revisión
  • Placeholder sin completar: "[indicar monto]"   [indicar monto]
  • Instrucción meta sin resolver: "describir"      describir
```

Antes era texto genérico; ahora cada reapertura del documento muestra exactamente qué problema se detectó.

### Ejemplo de registro en DB

**Con warnings:**
```json
{
  "id": "abc-123",
  "status": "needs_review",
  "generationWarnings": [
    { "ruleId": "sin_relacion_previa", "message": "...", "severity": "warning" }
  ],
  "outputWarnings": [
    { "code": "PLACEHOLDER_BRACKET", "message": "Placeholder sin completar: \"[indicar monto]\"", "match": "[indicar monto]", "severity": "error" },
    { "code": "PLACEHOLDER_WORD_ES", "message": "Instrucción meta sin resolver: \"indicar\"", "match": "indicar", "severity": "error" }
  ]
}
```

**Sin warnings (documento limpio):**
```json
{
  "id": "xyz-456",
  "status": "generated",
  "generationWarnings": [],
  "outputWarnings": null
}
```

---

## 3. Validaciones semánticas backend para lease, debt_recognition y simple_authorization

**Commit:** `275e2c9`  
**Archivos:** 1 modificado

### Problema
`lease`, `debt_recognition` y `simple_authorization` tenían templates, cláusulas y mappings completos desde el refactor anterior, pero `getValidationRulesForType()` devolvía arrays vacíos para los tres — cualquier payload pasaba sin validación.

### Único archivo modificado

`apps/api/src/modules/documents/domain/validation-rules.ts`

El archivo pasó de 344 a 735 líneas. Se agregaron 6 funciones nuevas siguiendo exactamente el mismo patrón de las existentes.

---

### `lease` — 6 errores bloqueantes + 4 warnings

| ID | Tipo | Condición |
|---|---|---|
| `canon_requerido` | error | `monto_alquiler > 0` |
| `moneda_requerida_locacion` | error | `moneda` presente |
| `fecha_inicio_requerida` | error | `fecha_inicio` presente |
| `duracion_requerida` | error | `duracion_meses >= 1` |
| `deposito_requiere_meses` | error | si `deposito = true` → `deposito_meses >= 1` |
| `ajuste_valido` | error | `ajuste_precio` ∈ `{ninguno, icl, inflacion, dolar, acuerdo}` |
| `sin_ajuste_largo_plazo` | warning | `duracion_meses >= 12` sin mecanismo de ajuste |
| `sin_deposito_garantia` | warning | no hay depósito de garantía |
| `descripcion_inmueble_escasa` | warning | `descripcion_inmueble < 30` chars |
| `sin_destino_uso` | warning | `destino_uso` no especificado |

---

### `debt_recognition` — 6 errores bloqueantes + 4 warnings

| ID | Tipo | Condición |
|---|---|---|
| `monto_deuda_requerido` | error | `monto_deuda > 0` |
| `moneda_requerida_deuda` | error | `moneda` presente |
| `causa_deuda_requerida` | error | `causa_deuda >= 20` chars |
| `fecha_reconocimiento_requerida` | error | `fecha_reconocimiento` presente |
| `cuotas_requieren_datos_completos` | error | si `pago_en_cuotas` → `cantidad_cuotas >= 2` + `fecha_primer_vencimiento` |
| `intereses_requieren_tasa` | error | si `incluye_intereses` → `tasa_interes` presente |
| `inconsistencia_cuotas_monto` | warning | `monto_cuota × cantidad_cuotas` difiere >5% del `monto_deuda` |
| `sin_forma_pago_deuda` | warning | `forma_pago` ausente |
| `sin_consecuencias_mora` | warning | ni `clausula_aceleracion` ni `consecuencias_mora` |
| `causa_deuda_escasa` | warning | `causa_deuda < 50` chars |

---

### `simple_authorization` — 5 errores bloqueantes + 4 warnings

| ID | Tipo | Condición |
|---|---|---|
| `tramite_autorizado_requerido` | error | `tramite_autorizado >= 5` chars |
| `alcance_autorizacion_requerido` | error | `descripcion_alcance >= 20` chars |
| `autorizante_completo` | error | `autorizante_nombre` + `autorizante_doc` presentes |
| `autorizado_completo` | error | `autorizado_nombre` + `autorizado_doc` presentes |
| `vigencia_definida` | error | si `!acto_unico` → `vigencia_hasta` presente |
| `sin_limitaciones_autorizacion` | warning | `limitaciones` ausente |
| `alcance_demasiado_breve` | warning | `descripcion_alcance < 50` chars |
| `acto_amplio_sin_limites` | warning | `descripcion_alcance > 100` chars y `!limitaciones` |
| `sin_fecha_autorizacion` | warning | `fecha_autorizacion` ausente |

---

### Cobertura de validación backend por tipo documental

| Tipo | Errores bloqueantes | Warnings | Estado |
|---|---|---|---|
| `service_contract` | 4 | 5 | ✅ |
| `nda` | 3 | 3 | ✅ |
| `legal_notice` | 4 | 3 | ✅ |
| `lease` | 6 | 4 | ✅ nuevo |
| `debt_recognition` | 6 | 4 | ✅ nuevo |
| `simple_authorization` | 5 | 4 | ✅ nuevo |
| `supply_contract` | 0 | 0 | ❌ pendiente |

---

## Estado final del sistema de calidad documental

```
Frontend (wizard)
  └─ handleGenerate captura incompleteDocument + outputWarnings
  └─ Header condicional: success vs advertencia
  └─ Panel de issues con fragmentos exactos
  └─ PDF deshabilitado cuando incompleto

Frontend (detalle /documents/:id)
  └─ Banner needs_review con lista de issues desde DB
  └─ Botón de descarga deshabilitado
  └─ Estado "Requiere revisión" en amber

Frontend (dashboard)
  └─ Badge "Requiere revisión" para needs_review
  └─ Badge "Generado" para generated/generated_text

Backend (POST /documents/generate)
  └─ Validación pre-generación: errores semánticos → 400
  └─ Validación post-generación: placeholders → needs_review
  └─ outputWarnings persistidos en DocumentVersion

Base de datos
  └─ DocumentVersion.outputWarnings Json? (migración 20251116000000)
  └─ DocumentVersion.status: "generated" | "needs_review" | ...

API (GET /documents/:id)
  └─ Expone status + outputWarnings en lastVersion
```
