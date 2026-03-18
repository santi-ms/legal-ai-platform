# Refactor del Motor de Generación Documental

> Período: sesión de trabajo — 2026-03-17  
> Branch: `main`  
> Commits: `dda1b24` → `6e693c4`

---

## Resumen ejecutivo

Se realizaron 5 mejoras sucesivas sobre el motor de generación documental del backend. Antes de estos cambios, el sistema:

- No pasaba los datos del formulario a OpenAI (solo enviaba el `baseDraft`)
- Descartaba silenciosamente el campo `additionalClauses`
- Generaba `legal_notice` con estructura de contrato (foro de competencia, resolución de disputas)
- No tenía validación post-generación (podía exportar documentos con placeholders)
- Causaba crash en `lease`, `debt_recognition` y `simple_authorization` ("Template not found")

---

## 1. Datos estructurados del formulario como contexto para OpenAI

**Commit:** `dda1b24`  
**Archivo principal:** `apps/api/src/modules/documents/services/generation-service.ts`

### Problema
`enhanceDraftWithAIWrapper()` recibía `data` como quinto argumento pero **nunca lo leía**. OpenAI solo veía el `baseDraft` ensamblado. Si un campo no fue interpolado en el borrador base, la IA lo desconocía.

### Cambios

**Nueva función exportada `buildStructuredContextForAI(data, documentType)`:**
- Formatea los campos del formulario en secciones legibles agrupadas por tipo documental
- Cubre: `service_contract`, `nda`, `legal_notice`, `lease`
- Cada sección tiene etiquetas claras: `[Partes]`, `[Objeto del contrato]`, `[Condiciones comerciales]`, etc.
- Omite valores vacíos/null

**Nuevo prompt estructurado enviado a OpenAI:**
```
TIPO DE DOCUMENTO: ...
TONO: ...
JURISDICCIÓN: ...

BORRADOR BASE (esqueleto):
---
{baseDraft}
---

DATOS ESTRUCTURADOS DEL FORMULARIO (fuente de verdad):
---
{buildStructuredContextForAI output}
---

INSTRUCCIONES DE SALIDA:
- Usar el borrador base como estructura principal
- Completar con los datos estructurados cuando aporten más precisión
- NO dejar placeholders como [indicar], [COMPLETAR], {{VARIABLE}}
- NO inventar información no presente
- Responder ÚNICAMENTE con el texto final del documento
```

**`getPromptConfigForType()` — system messages especializados por tipo:**

| Tipo | System message anterior | System message nuevo |
|---|---|---|
| `legal_notice` | Genérico | Especifica "CERRADAS y DEFINITIVAS, sin placeholders, listo para enviar" |
| `service_contract` | Genérico | Menciona CCyCN específicamente |
| `nda` | Genérico | Menciona propiedad intelectual y normativa argentina |
| `lease` | No existía | "Ley de Alquileres vigente en Argentina" |

---

## 2. Fix de `additionalClauses` — descarte silencioso

**Commit:** `8fbe076`  
**Archivo principal:** `apps/api/src/modules/documents/services/generation-service.ts`

### Problema
`additionalClauses` llegaba al backend, pasaba la sanitización, se incluía en `data`... pero nunca aparecía en el documento final. No había slot en el template ni lectura de `data` en el wrapper de IA.

### Cambios

**Nueva función privada `appendAdditionalClauses(draft, data)`:**
- Inserta la sección `CLÁUSULAS ADICIONALES` en el `baseDraft` **antes** del bloque de firmas
- Si el campo está vacío, devuelve el draft sin cambios (sin sección vacía)
- Detecta el bloque de firmas con patrón: `/\n(?=_{3,}|\s*Lugar:|FIRMAS|En prueba)/i`
- Si no se detecta firma, appenda al final como fallback

**Impacto dual (belt-and-suspenders):**
1. **Path de IA:** el modelo ve `CLÁUSULAS ADICIONALES` como contenido del documento, no como instrucción
2. **Path de fallback:** si OpenAI falla y se devuelve el `baseDraft` crudo, las cláusulas adicionales **ya están presentes**

**Instrucción reforzada en el prompt:**
```
- El borrador incluye una sección CLÁUSULAS ADICIONALES con contenido 
  solicitado por el usuario — es OBLIGATORIA, incorporarla y numerarla 
  correctamente como cláusula dentro del documento
```
(Solo aparece esta instrucción cuando el campo está presente)

---

## 3. Refactor de `legal_notice` — carta documento argentina real

**Commit:** `aea60a5`  
**Archivos:** 9 archivos modificados

### Problema
`legal_notice` generaba documentos con estructura de contrato:
- Cláusula de "foro de competencia y ley aplicable" (texto de contrato)
- Cláusula de "resolución de disputas" (menciona "el presente contrato")
- Cláusula de identificación de partes con "Las partes se reconocen mutuamente capacidad legal para contratar"
- Frases genéricas de cierre en cada cláusula

### Cambios

**`templates/legal-notice/template.ts` (v1.0.0 → v1.1.0):**
```
{{JURISDICTION}}, {{FECHA_ACTUAL}}         ← ciudad y fecha primero
{{PARTIES}}                                 ← remitente → destinatario
CARTA DOCUMENTO
{{CLAUSE_CONTEXT}}                          ← I. RELACIÓN PREVIA
{{CLAUSE_FACTS}}                            ← II. HECHOS
{{CLAUSE_BREACH}}                           ← III. INCUMPLIMIENTO
{{CLAUSE_DEMAND}}                           ← IV. INTIMACIÓN
{{CLAUSE_DEADLINE}}                         ← V. PLAZO
{{CLAUSE_WARNING}}                          ← VI. APERCIBIMIENTO
___________________________
{{REMITENTE_NOMBRE}}
```
Sin `{{CLAUSE_JURISDICTION}}` ni `{{CLAUSE_DISPUTES}}`.

**`clauses/index.ts`:**
- `getClausesForType("legal_notice")`: no incluye `identificationClause`, `jurisdictionClause`, `disputesClause`
- `getRequiredClauseIds("legal_notice")`: array propio, sin las 3 cláusulas contractuales comunes

**Cláusulas individuales (`clauses/legal-notice/*.ts`):**

| Archivo | Cambio |
|---|---|
| `context.ts` | Numeración romana `I.`, eliminada frase genérica de cierre |
| `facts.ts` | Numeración romana `II.`, eliminada frase "Estos hechos constituyen la base fáctica..." |
| `breach.ts` | Numeración romana `III.`, eliminada frase "Este incumplimiento genera responsabilidad..." |
| `demand.ts` | Usa "INTIMA FEHACIENTEMENTE" (estándar argentino). `IV.` |
| `deadline.ts` | Redacción directa del plazo. `V.` |
| `warning.ts` | Incluye reserva expresa de acciones civiles/penales. `VI.` |

**`getPromptConfigForType("legal_notice")` en `generation-service.ts`:**
```typescript
"NO incluir cláusulas contractuales como 'foro de competencia', 
 'resolución de disputas' ni lenguaje de contrato",
"La narración debe ser directa y cronológica",
"La intimación debe ser concreta: qué hacer, en qué plazo, con qué datos",
"El plazo debe reflejar exactamente el valor indicado",
"El documento es definitivo — todos los campos completos",
```

---

## 4. Validación post-generación

**Commit:** `89a156f`  
**Archivos:** `output-validator.ts` (nuevo) + `routes.documents.ts` (modificado)

### Problema
El sistema podía exportar PDFs con placeholders como `[indicar monto]`, `[describir]`, texto truncado, etc. No había ninguna verificación del texto generado antes de guardarlo.

### Cambios

**Nuevo archivo: `apps/api/src/modules/documents/domain/output-validator.ts`**

Función principal: `validateGeneratedDocumentOutput(text, documentType)`

**Patrones detectados:**

| Código | Severidad | Patrón | Ejemplo |
|---|---|---|---|
| `PLACEHOLDER_BRACKET` | error | `\[[^\]]{1,120}\]` | `[indicar monto]`, `[nombre]` |
| `TEMPLATE_VARIABLE` | error | `\{\{[A-Z_]{2,50}\}\}` | `{{PARTIES}}` no reemplazado |
| `PLACEHOLDER_WORD_ES` | error | palabras sueltas | `indicar`, `describir`, `especificar`, `completar` |
| `PLACEHOLDER_WORD_EN` | error | palabras en inglés | `placeholder`, `TBD`, `insert here` |
| `BLANK_UNDERSCORES` | warning | `_{5,19}` | `_____` (no líneas de firma) |
| `PAREN_INSTRUCTION` | error | `\(indicar...\)` | `(indicar el monto aquí)` |
| `TRUNCATED_DOTS` | warning | `\.{4,}` | `.......` |
| `DOCUMENT_TOO_SHORT` | error | texto < 150 chars | — |
| `EMPTY_SECTION` | warning | sección sin cuerpo | dos encabezados consecutivos |

**Hook en `routes.documents.ts` (paso 3.5):**
```
generationResult.aiEnhancedDraft
  → validateGeneratedDocumentOutput()
  → si hasOutputErrors:
      - status en DB: "needs_review" (en lugar de "generated")
      - PDF service: OMITIDO
      - respuesta: incompleteDocument: true, outputWarnings: [...]
  → si válido:
      - flujo normal sin cambios
```

**Estructura de la respuesta con documento incompleto:**
```json
{
  "ok": true,
  "documentId": "abc-123",
  "contrato": "...texto con [indicar monto]...",
  "pdfUrl": null,
  "incompleteDocument": true,
  "outputWarnings": [
    {
      "code": "PLACEHOLDER_BRACKET",
      "message": "Placeholder sin completar detectado: \"[indicar monto]\"",
      "match": "[indicar monto]",
      "severity": "error"
    }
  ]
}
```

**Extensión futura:** `runTypeSpecificChecks(text, documentType)` está implementada como no-op, lista para agregar reglas por tipo.

---

## 5. Auditoría y corrección de mappings — lease, debt_recognition, simple_authorization

**Commit:** `6e693c4`  
**Archivos:** 19 archivos (11 nuevos, 8 modificados)

### Problema
Los 3 tipos causaban crash `"Template not found"`. Los pocos campos que no crasheaban se perdían por nombres distintos entre frontend y backend o por ausencia de formatters.

### Pérdidas corregidas

**lease:**
| Campo frontend | Bug | Fix |
|---|---|---|
| `locador_nombre` / `locatario_nombre` | `formatParties()` sin rama | Nueva rama en `formatParties()` |
| `monto_alquiler` | `formatAmount()` leía `data.monto` | Nuevo `formatRentAmount()` → `RENT_AMOUNT` |
| `fecha_inicio` | `formatTerm()` leía `inicio_vigencia` | Nuevo `formatLeaseTerm()` → `LEASE_TERM` |
| `duracion_meses` | `formatTerm()` leía `plazo_minimo_meses` | Incluido en `LEASE_TERM` |
| `dia_pago` | Sin mapping | `DIA_PAGO` |
| `destino_uso` | Sin mapping | `PROPERTY_USE` → `formatDestinoUso()` |
| `descripcion_inmueble` | Sin mapping | `PROPERTY_DESC` |
| `domicilio_inmueble` | Sin mapping | `PROPERTY_ADDRESS` |
| `ajuste_precio: "icl"` | Devolvía `""` | Agregado a `formatPriceAdjustment()` |
| `deposito` / `deposito_meses` | Sin mapping | `DEPOSITO` → `formatDeposito()` |
| `servicios_cargo_locatario` | Sin mapping + nombre erróneo | `SERVICIOS_LOCATARIO` |

**debt_recognition:**
| Campo frontend | Bug | Fix |
|---|---|---|
| `acreedor_nombre` / `deudor_nombre` | `formatParties()` sin rama | Nueva rama en `formatParties()` |
| `monto_deuda` | `formatAmount()` leía `data.monto` | Nuevo `formatDebtAmount()` → `DEBT_AMOUNT` |
| `causa_deuda` | Sin mapping | `DEBT_CAUSE` |
| `fecha_reconocimiento` | Sin mapping | `RECOGNITION_DATE` |
| Plan de pago completo | Sin mapping | `PAYMENT_PLAN` → `formatPaymentPlan()` |
| `incluye_intereses` / `tasa_interes` | Sin mapping | `INTEREST_CLAUSE` → `formatInterestClause()` |
| `clausula_aceleracion` / `consecuencias_mora` | Sin mapping | `DEFAULT_CLAUSE` → `formatDefaultClause()` |

**simple_authorization:**
| Campo frontend | Bug | Fix |
|---|---|---|
| `autorizante_nombre` / `autorizado_nombre` | `formatParties()` sin rama | Nueva rama en `formatParties()` |
| `tramite_autorizado` | Sin mapping | `TRAMITE` |
| `descripcion_alcance` | Sin mapping | `SCOPE_DESC` |
| `limitaciones` | Sin mapping | `LIMITATIONS` |
| `fecha_autorizacion` + vigencia | Sin mapping | `AUTH_VALIDITY` → `formatAuthValidity()` |
| `condiciones_especiales` / `documentacion_asociada` | Sin mapping | `SPECIAL_CONDITIONS` → `formatSpecialConditions()` |

### Archivos creados

**Templates (3):**
- `templates/lease/template.ts`
- `templates/debt-recognition/template.ts`
- `templates/simple-authorization/template.ts`

**Cláusulas (9):**
- `clauses/lease/{property, amount, term, conditions}.ts`
- `clauses/debt-recognition/{debt, payment, default}.ts`
- `clauses/simple-authorization/{scope, validity}.ts`

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `domain/document-types.ts` | Agrega `debt_recognition` y `simple_authorization` a `DocumentTypeId` |
| `domain/generation-engine.ts` | +3 ramas en `formatParties()`, 3 formatters de monto separados, ICL en ajuste, 15 nuevos formatters, 35 nuevos placeholders, 10 nuevos slots |
| `templates/index.ts` | Registra los 3 nuevos templates |
| `clauses/index.ts` | Registra las 9 cláusulas, listas de required separadas por tipo |
| `services/generation-service.ts` | `buildStructuredContextForAI` para los 2 tipos nuevos, `getPromptConfigForType` para ambos |

---

## Deuda técnica pendiente

| Tipo | Pendiente |
|---|---|
| `lease`, `debt_recognition`, `simple_authorization` | Sin validaciones semánticas ni warnings en backend (`validation-rules.ts`) |
| `lease` | `identificacion_partes` usa texto genérico de contrato |
| `supply_contract` | Sin template ni cláusulas en backend |
| Frontend | `incompleteDocument: true` no tiene UI para mostrar advertencia al usuario |
| General | `outputWarnings` no persiste en DB — solo viaja en la respuesta HTTP |

---

## Estado del sistema por tipo documental

| Tipo | Template | Cláusulas | Val. backend | Post-generación | Mappings |
|---|---|---|---|---|---|
| `service_contract` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `nda` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `legal_notice` | ✅ v1.1 | ✅ refactorizadas | ✅ | ✅ | ✅ |
| `lease` | ✅ nuevo | ✅ nuevo | ❌ | ✅ | ✅ |
| `debt_recognition` | ✅ nuevo | ✅ nuevo | ❌ | ✅ | ✅ |
| `simple_authorization` | ✅ nuevo | ✅ nuevo | ❌ | ✅ | ✅ |
| `supply_contract` | ❌ | ❌ | ❌ | ✅ | ❌ |
