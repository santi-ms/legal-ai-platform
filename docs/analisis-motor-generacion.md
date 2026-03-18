# Análisis Técnico — Motor de Generación Documental

> Generado: 2026-03-17  
> Archivos analizados: `generation-service.ts`, `generation-engine.ts`, `document-mapper.ts`, `validation-engine.ts`, `validation-rules.ts`, `templates/**`, `clauses/**`

---

## 1. Cómo entra el payload desde el frontend

El payload llega a `POST /documents/generate` en `routes.documents.ts`. La primera operación es `normalizeDocumentRequest()`:

```typescript
// routes.documents.ts:165–199
const normalized = await normalizeDocumentRequest(request.body);
// { documentType, jurisdiction, tone, structuredData }
```

`normalizeDocumentRequest()` (`document-mapper.ts:95`) intenta primero el nuevo formato DTO, y si falla, convierte el formato legacy:

```typescript
// document-mapper.ts:29–45 — mapeo de tipos y tonos legacy
const typeMap = {
  contrato_servicios:  "service_contract",
  contrato_suministro: "supply_contract",
  nda:                 "nda",
  carta_documento:     "legal_notice",
  contrato_locacion:   "lease",
};
const toneMap = {
  formal:          "formal_technical",
  comercial_claro: "commercial_clear",
};
```

Con el nuevo DTO (que es lo que envía el wizard actual), `structuredData` es directamente `dtoResult.data as StructuredDocumentData` — un cast sin transformación. Todo el `formData` del frontend llega plano en `structuredData`.

---

## 2. Cómo se normaliza cada tipo documental

Para el **nuevo formato** (wizard actual): ninguna transformación. El payload pasa directo como `structuredData`.

Para el **formato legacy**: `mapOldFormatToStructured()` rellena `structuredData` con defaults hardcodeados:

```typescript
// document-mapper.ts:48–79
moneda:       "ARS",       // siempre — el viejo formato no tenía este campo
periodicidad: "mensual",   // siempre
plazo_pago:   "30_dias",   // siempre
```

`debt_recognition` y `simple_authorization` no tienen entrada en ninguno de los dos mapas → `getTemplate()` devuelve `undefined` → lanza `"Template not found"`.

---

## 3. Cómo se arma el `baseDraft`

La cadena completa en `generation-service.ts:52–94`:

```
getTemplate(documentType)          → TemplateBase con content y variablePlaceholders
getClausesForType(documentType)    → Map<clauseId, ClauseDefinition>
getRequiredClauseIds()             → string[]
getOptionalClauseIds()             → Array<{ id, condition? }>
generateClausePlan()               → { required[], optional[], order[] }
assembleBaseDraft()                → texto final
```

`assembleBaseDraft()` (`generation-engine.ts:93–206`) opera en dos pasadas:

**Pasada 1 — Variables del template:** para cada `{{VARIABLE}}` en `template.variablePlaceholders`, llama `getPlaceholderValue(placeholder, data)` y sustituye. Si el valor es vacío, elimina el placeholder y el whitespace alrededor.

**Pasada 2 — Cláusulas:** para cada `clauseId` en `clausePlan.order`:
1. Obtiene el `ClauseDefinition` del Map
2. Reemplaza `{{CLAUSE_NUMBER}}` con "PRIMERA", "SEGUNDA", etc.
3. Reemplaza todas las `{{VARIABLE}}` internas de la cláusula
4. Busca el slot correspondiente en el draft mediante la tabla hardcodeada (`generation-engine.ts:150–177`)
5. Si no encuentra slot, appenda al final (línea 190)

Al final limpia slots vacíos:
```typescript
// generation-engine.ts:198–199
draft = draft.replace(/\{\{CLAUSE_[A-Z_]+\}\}/g, "");
draft = draft.replace(/\{\{[A-Z_]+\}\}/g, "");
```

---

## 4. Qué placeholders existen por tipo

### Variables globales — `getPlaceholderValue()` (`generation-engine.ts:240–291`)

| Placeholder | Campo de datos | Función |
|---|---|---|
| `{{PARTIES}}` | proveedor/cliente/revelador/receptor/remitente/destinatario | `formatParties()` — switch por campos presentes |
| `{{OBJECT}}` | `descripcion_servicio` \|\| `definicion_informacion` \|\| `hechos` | string directo (con fallback encadenado) |
| `{{SCOPE}}` | `alcance` | string directo |
| `{{DELIVERABLES}}` | `entregables` | string directo |
| `{{AMOUNT}}` | `monto` + `moneda` | `"ARS 50000"` |
| `{{PERIODICIDAD}}` | `periodicidad` | mapeo a texto |
| `{{PAYMENT_TERMS}}` | `forma_pago` + `preferencias_fiscales` | texto compuesto |
| `{{PAYMENT_DEADLINE}}` | `plazo_pago` | mapeo de clave |
| `{{TAX_INCLUSION}}` | `precio_incluye_impuestos` | texto booleano |
| `{{PRICE_ADJUSTMENT}}` | `ajuste_precio` | mapeo a texto (solo `inflacion`/`dolar`/`acuerdo`) |
| `{{TERM}}` | `inicio_vigencia` + `plazo_minimo_meses` + `plazo_confidencialidad` | texto compuesto |
| `{{RENEWAL_CLAUSE}}` | `renovacion_automatica` + `preaviso_renovacion` | texto condicional |
| `{{TERMINATION}}` | `penalizacion_rescision` + `penalizacion_monto` | condicional |
| `{{JURISDICTION}}` | `jurisdiccion` | `"Ciudad Autónoma de Buenos Aires"` |
| `{{FECHA_ACTUAL}}` | — | `new Date().toLocaleDateString("es-AR")` |
| `{{REMITENTE_NOMBRE}}` | `remitente_nombre` | string directo |
| `{{CONTEXT}}` | `relacion_previa` | string directo |
| `{{FACTS}}` | `hechos` | string directo |
| `{{BREACH}}` | `incumplimiento` | string directo |
| `{{DEMAND}}` | `intimacion` | string directo |
| `{{DEADLINE}}` | `plazo_cumplimiento` / `plazo_custom` | `formatDeadline()` |
| `{{WARNING}}` | `apercibimiento` | string directo |
| `{{DEFINITION}}` | `definicion_informacion` | string directo |
| `{{PURPOSE}}` | `finalidad_permitida` | string directo |
| `{{EXCLUSIONS}}` | `exclusiones` | string directo |
| `{{PENALIDAD_INCUMPLIMIENTO}}` | `penalidad_incumplimiento` | string directo |

### Template de Carta Documento — flujo completo de slots

```
{{PARTIES}}
CARTA DOCUMENTO
{{CLAUSE_CONTEXT}}    → contexto_relacion → {{CONTEXT}} = relacion_previa
{{CLAUSE_FACTS}}      → hechos            → {{FACTS}} = hechos
{{CLAUSE_BREACH}}     → incumplimiento    → {{BREACH}} = incumplimiento
{{CLAUSE_DEMAND}}     → intimacion        → {{DEMAND}} = intimacion
{{CLAUSE_DEADLINE}}   → plazo_cumplimiento → {{DEADLINE}} = formatDeadline()
{{CLAUSE_WARNING}}    → apercibimiento    → {{WARNING}} = apercibimiento (OPCIONAL)
{{CLAUSE_JURISDICTION}} → foro_competencia → {{JURISDICTION}} = formatJurisdiction()
{{CLAUSE_DISPUTES}}   → resolucion_disputas
Lugar: {{JURISDICTION}}
Fecha: {{FECHA_ACTUAL}}
{{REMITENTE_NOMBRE}}
```

---

## 5. Qué datos del formulario no se usan realmente

### Completamente ignorados

| Campo | Motivo |
|---|---|
| `additionalClauses` | No hay slot, no se inyecta al prompt (ver punto 8) |
| `tono` (en `data`) | Se usa `tone` del nivel superior del payload, no `data.tono` |
| `jurisdiction` (alias explícito) | Pisado por `jurisdiccion` del spread de `formData` |

### Capturados pero con pérdida de precisión

| Campo | Problema |
|---|---|
| `monto_alquiler` (locación) | `formatAmount()` lee `data.monto`, no `data.monto_alquiler` |
| `monto_deuda` (rec. deuda) | Idem + no hay template |
| `duracion_meses` (locación) | `formatTerm()` lee `data.plazo_minimo_meses`, no `data.duracion_meses` |
| `fecha_inicio` (locación) | `formatTerm()` lee `data.inicio_vigencia`, no `data.fecha_inicio` |
| `dia_pago` (locación) | Sin mapping en `getPlaceholderValue()` |
| `destino_uso` (locación) | Sin mapping |
| `ajuste_precio: "icl"` | `formatPriceAdjustment()` no maneja `"icl"` → devuelve `""` |
| `acreedor_*` / `deudor_*` | `formatParties()` no tiene rama para estos campos |
| `autorizante_*` / `autorizado_*` | Idem |
| `causa_deuda` | Sin mapping |
| `tramite_autorizado` | Sin mapping |
| `condiciones_especiales` | Sin mapping |
| `descripcion_servicio` → `{{OBJECT}}` | Fallback encadenado: usa `definicion_informacion \|\| hechos` si no existe |

---

## 6. Cómo se construye el prompt final

`enhanceDraftWithAIWrapper()` (`generation-service.ts:140–196`):

```typescript
const toneInstruction = promptConfig.toneInstructions[tone]
  || promptConfig.toneInstructions.commercial_clear;

const userPrompt = `Mejora y completa el siguiente borrador de ${documentType}:

${baseDraft}

INSTRUCCIONES:
- El documento debe ser legalmente válido y ejecutable en Argentina
- Usar los datos concretos proporcionados
- Incluir cláusulas obligatorias según tipo de contrato
- Estructura: Encabezado con datos completos, luego cláusulas numeradas
${documentType === "legal_notice"
  ? "- Incluir: relación previa o contexto, narración cronológica de hechos, descripción clara del incumplimiento, intimación concreta y específica, plazo para cumplir, apercibimiento con consecuencias legales"
  : ""}

TONO: ${toneInstruction}

IMPORTANTE:
- Mantén la estructura y cláusulas del borrador
- Mejora la coherencia y fluidez del texto
- NO cambies los datos concretos (montos, fechas, nombres)
- Responde SOLO con el texto mejorado del documento`;
```

La función recibe `data` como quinto parámetro pero **en ninguna línea del cuerpo lo usa**. El prompt se construye exclusivamente de `baseDraft` + `promptConfig` + `toneInstruction`.

---

## 7. Qué datos concretos recibe OpenAI

OpenAI recibe el **`baseDraft` ya ensamblado** — no los campos crudos del formulario. Los datos ya fueron interpolados por `assembleBaseDraft()`. Para una Carta Documento típica:

```
REMITENTE: Construcciones del Sur SRL, 30-71234567-9, con domicilio en Av. Corrientes 1234
DESTINATARIO: Inmobiliaria Palermo SA, 30-68901234-5, con domicilio en Av. Santa Fe 4567

CARTA DOCUMENTO

PRIMERA: CONTEXTO Y RELACIÓN PREVIA
Contrato de locación de obra del 15/10/2025...
En virtud de la relación establecida, se han producido los hechos que se detallan a continuación.

SEGUNDA: HECHOS
La remitente cumplió la obra. Factura B N°342...
Estos hechos constituyen la base fáctica de la presente intimación.

TERCERA: INCUMPLIMIENTO
Como consecuencia de los hechos narrados, se ha producido el siguiente incumplimiento:
A la fecha no se recibió el pago de $2.550.000...
Este incumplimiento genera responsabilidad...

CUARTA: INTIMACIÓN
Por la presente, se INTIMA a Inmobiliaria Palermo SA a:
Se INTIMA a pagar $2.550.000 con intereses...
Esta intimación es clara, concreta y específica...

QUINTA: PLAZO PARA CUMPLIR
Se otorga un plazo de 10 días hábiles para cumplir...

SEXTA: APERCIBIMIENTO    ← solo si data.apercibimiento es truthy
En caso de incumplimiento... se procederá a:
Vencido el plazo se iniciarán acciones judiciales...

SÉPTIMA: FORO DE COMPETENCIA Y LEY APLICABLE
...Ciudad Autónoma de Buenos Aires...

OCTAVA: RESOLUCIÓN DE DISPUTAS
...

Lugar: Ciudad Autónoma de Buenos Aires
Fecha: 17/3/2026

___________________________
Construcciones del Sur SRL
Firma y aclaración / DNI
```

---

## 8. Dónde se pierde `additionalClauses` — exactamente

```typescript
// generation-service.ts:52–109
export async function generateDocumentWithNewArchitecture(documentType, data, tone) {
  const baseDraft = assembleBaseDraft(template, clauses, clausePlan, data);
  //  assembleBaseDraft() no tiene {{CLAUSE_ADDITIONAL}} ni mapeo para additionalClauses
  //  en getPlaceholderValue() líneas 245–291 → no aparece en la tabla de mapping

  const enhancedResult = await enhanceDraftWithAIWrapper(
    baseDraft, documentType, tone, promptConfig,
    data   // ← se pasa como quinto argumento
  );
}

// generation-service.ts:140–196
async function enhanceDraftWithAIWrapper(baseDraft, documentType, tone, promptConfig, data) {
  const userPrompt = `Mejora y completa... ${baseDraft} ...`;
  //                data nunca se referencia en este cuerpo
  await openai.chat.completions.create({ ... });
}
```

`additionalClauses` entra, pasa por sanitización, llega a `data`, se pasa como argumento... y en ninguna de las dos funciones se hace `data.additionalClauses`. Se descarta en silencio.

---

## 9. Si `tono` y `jurisdiccion` se usan de verdad

**`tone` — SÍ se usa, solo para el estilo del prompt:**
```typescript
// generation-service.ts:151
const toneInstruction = promptConfig.toneInstructions[tone];
// → "Formal y técnico legal. Terminología jurídica precisa."
// Se inyecta en el prompt como: TONO: Formal y técnico legal...
```
El tono afecta la forma en que la IA escribe, no el contenido del `baseDraft`.

**`jurisdiccion` — SÍ se usa en el `baseDraft`, en dos lugares:**
```typescript
// generation-engine.ts:539–551
function formatJurisdiction(data): string {
  const jurisdictionMap = {
    caba:             "Ciudad Autónoma de Buenos Aires",
    buenos_aires:     "Provincia de Buenos Aires",
    cordoba:          "Provincia de Córdoba",
    santa_fe:         "Provincia de Santa Fe",
    mendoza:          "Provincia de Mendoza",
    corrientes_capital: "Corrientes Capital",
    posadas_misiones: "Posadas, Misiones",
  };
  return jurisdictionMap[data.jurisdiccion] || data.jurisdiccion;
}
```
Alimenta `{{JURISDICTION}}` → cláusula de foro de competencia + pie del template (`Lugar: {{JURISDICTION}}`).

---

## 10. Lógica específica vs genérica por tipo documental

| Tipo | Template | Cláusulas propias | Val. semánticas | Warnings | Opcionales condicionales |
|---|---|---|---|---|---|
| `service_contract` | ✅ | 6 | 4 | 5 | 3 |
| `nda` | ✅ | 6 | 3 | 3 | 2 |
| `legal_notice` | ✅ | 6 | 4 | 3 | 1 |
| `lease` | ❌ | 0 | 0 | 0 | 0 |
| `debt_recognition` | ❌ | 0 | 0 | 0 | 0 |
| `simple_authorization` | ❌ | 0 | 0 | 0 | 0 |

`lease`, `debt_recognition` y `simple_authorization` tienen schema completo en el frontend pero **cero implementación en el backend** → crash inmediato al generar.

Dentro de los 3 tipos operativos:
- `service_contract` y `nda` tienen más lógica condicional (cláusulas opcionales activadas por switches del formulario)
- `legal_notice` es casi completamente lineal — todo es obligatorio salvo `apercibimiento`

---

## 11. Validaciones después de generar el texto

**No existen.** El flujo post-generación:

```typescript
// generation-service.ts:111–134
aiEnhancedDraft = enhancedResult.text;
// → se guarda directo en DocumentVersion.rawText
// → se devuelve directo al frontend
// No hay ningún paso de revisión del contenido generado
```

---

## 12. Control de placeholders `[indicar]`, `[describir]`, etc.

**No existe.** Ni en el backend ni en el frontend hay ningún paso que:
- Detecte patrones `[...]`, `{{...}}` residuales o `___` en el texto generado
- Verifique que nombres/montos/fechas reales estén presentes
- Rechace o marque el texto si la IA generó fragmentos incompletos

Si OpenAI devuelve `"El monto de [INDICAR MONTO]..."` ese texto llega al usuario sin advertencia.

---

## 13. Cambios mínimos para que Carta Documento genere un documento cerrado

Son **3 cambios** en `generation-service.ts` únicamente, sin tocar ningún otro archivo.

### Cambio 1 — Inyectar `additionalClauses` al prompt

```typescript
// generation-service.ts:154 — en enhanceDraftWithAIWrapper()
const additionalClausesText = data.additionalClauses
  ? `\n\nCLÁUSULAS ADICIONALES SOLICITADAS POR EL USUARIO (incorporar en el documento):\n${data.additionalClauses}`
  : "";

const userPrompt = `Mejora y completa el siguiente borrador de ${documentType}:\n\n${baseDraft}${additionalClausesText}\n\nINSTRUCCIONES:\n...`;
```

### Cambio 2 — Agregar instrucción anti-placeholder

```typescript
// generation-service.ts:163–169 — en el bloque IMPORTANTE
`- NO dejes placeholders como [indicar], [COMPLETAR], [___] — si falta un dato, usá lo que está en el borrador`
```

### Cambio 3 — Fortalecer el `systemMessage` para `legal_notice`

```typescript
// generation-service.ts:233–237
} else if (documentType === "legal_notice") {
  baseConfig.systemMessage = "Eres un abogado senior argentino especializado en derecho comercial y cartas documento. Generás cartas documento CERRADAS — con todos los datos completos, sin dejar espacios en blanco ni placeholders. El documento debe poder enviarse sin modificaciones adicionales.";
  baseConfig.baseInstructions.push(
    "Incluir: relación previa o contexto, narración cronológica de hechos, descripción clara del incumplimiento, intimación concreta y específica, plazo para cumplir, apercibimiento con consecuencias legales",
    "El documento es una carta documento definitiva, no una plantilla — todos los campos deben estar completos con los datos proporcionados"
  );
}
```

---

## A. Datos que sí llegan al documento final

**Carta Documento:** `remitente_nombre`, `remitente_doc`, `remitente_domicilio`, `destinatario_nombre`, `destinatario_doc`, `destinatario_domicilio`, `relacion_previa`, `hechos`, `incumplimiento`, `intimacion`, `plazo_cumplimiento` (+ `plazo_custom`), `apercibimiento`, `jurisdiccion`

**Contrato de Servicios:** todos los anteriores más `descripcion_servicio`, `alcance`, `entregables`, `monto`, `moneda`, `periodicidad`, `forma_pago`, `plazo_pago`, `precio_incluye_impuestos`, `ajuste_precio` (solo `inflacion`/`dolar`/`acuerdo`), `inicio_vigencia`, `plazo_minimo_meses`, `renovacion_automatica`, `preaviso_renovacion`, `penalizacion_rescision`, `penalizacion_monto`, `confidencialidad`, `plazo_confidencialidad`, `propiedad_intelectual`, `tipo_propiedad_intelectual`, `preferencias_fiscales`

**NDA:** `revelador_nombre/doc/domicilio`, `receptor_nombre/doc/domicilio`, `definicion_informacion`, `finalidad_permitida`, `exclusiones`, `plazo_confidencialidad`, `inicio_vigencia`, `devolucion_destruccion`, `plazo_devolucion`, `penalidad_incumplimiento`

---

## B. Datos que el formulario captura pero el backend ignora

| Campo | Formulario | Razón de pérdida |
|---|---|---|
| `additionalClauses` | Todos los tipos | No hay slot ni inyección al prompt |
| `monto_alquiler` | Locación | `formatAmount()` lee `data.monto` |
| `monto_deuda` | Rec. de deuda | Idem + no hay template |
| `duracion_meses` | Locación | `formatTerm()` lee `data.plazo_minimo_meses` |
| `fecha_inicio` | Locación | `formatTerm()` lee `data.inicio_vigencia` |
| `dia_pago` | Locación | Sin mapping en `getPlaceholderValue()` |
| `destino_uso` | Locación | Sin mapping |
| `ajuste_precio: "icl"` | Locación y Servicios | `formatPriceAdjustment()` no maneja `"icl"` → `""` |
| `acreedor_*` / `deudor_*` | Rec. de deuda | `formatParties()` no tiene rama + no hay template |
| `autorizante_*` / `autorizado_*` | Poder/Autorización | Idem |
| `causa_deuda` | Rec. de deuda | Sin mapping |
| `tramite_autorizado` | Poder/Autorización | Sin mapping |
| `condiciones_especiales` | Poder/Autorización | Sin mapping |
| `tono` (en `data`) | Todos | Se usa `tone` del nivel superior |
| `jurisdiction` (alias) | Todos | Pisado por `data.jurisdiccion` del spread |

---

## C. Lugares exactos donde el sistema sigue siendo genérico

| Archivo | Línea | Problema |
|---|---|---|
| `generation-service.ts:209–222` | `systemMessage` base | Idéntico para `service_contract`, `nda` y `lease`. No menciona jurisdicción, normativa aplicable, montos ni partes |
| `generation-service.ts:154` | `userPrompt` | `data` disponible pero nunca usado — el prompt no incluye campos clave directamente |
| `generation-engine.ts:297–313` | `formatParties()` | Switch sin formateo jurídico (`"en adelante EL PROVEEDOR"`, tipo societario, etc.) |
| `clauses/legal-notice/context.ts:14` | Cierre fijo | `"En virtud de la relación establecida..."` se agrega siempre, incluso cuando el contexto ya lo dice |
| `clauses/legal-notice/breach.ts:18` | Cierre fijo | `"Este incumplimiento genera responsabilidad..."` — frase genérica no controlada por el usuario |
| `clauses/legal-notice/facts.ts:17` | Cierre fijo | `"Estos hechos constituyen la base fáctica..."` — idem |
| `clauses/legal-notice/demand.ts:18` | Cierre fijo | `"Esta intimación es clara, concreta y específica..."` — idem |
| `clauses/common/identification.ts:17` | Frase inaplicable | `"Las partes se reconocen mutuamente capacidad legal para contratar..."` — lenguaje de contrato, no de intimación |

---

## D. Refactor mínimo recomendado para mejorar ya la calidad del output

En orden de impacto / esfuerzo:

| # | Cambio | Archivo | Línea | Esfuerzo |
|---|---|---|---|---|
| 1 | Inyectar `additionalClauses` al prompt | `generation-service.ts` | 154 | 2 líneas |
| 2 | Instrucción anti-placeholder en IMPORTANTE | `generation-service.ts` | 163 | 1 línea |
| 3 | Fortalecer `systemMessage` para `legal_notice` | `generation-service.ts` | 233 | 3 líneas |
| 4 | Corregir nombres de campo para Locación | `generation-engine.ts` | 427–443 | 3 cambios |
| 5 | Agregar `"icl"` al mapa de ajuste de precio | `generation-engine.ts` | 376 | 1 línea |
| 6 | Eliminar frases de cierre genéricas en cláusulas de Carta Documento | `clauses/legal-notice/*.ts` | varios | 6 líneas |
| 7 | Detectar placeholders post-generación | `routes.documents.ts` | ~350 | 5 líneas |
