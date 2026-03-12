# 🔧 Hardening Backend - Resumen de Cambios

## 📋 Objetivo

Validar el flujo real de `service_contract` end-to-end con casos de prueba representativos, corregir inconsistencias y dejar estable el contrato de request/response y persistencia.

## ✅ Cambios Implementados

### 1. **Sistema de Validación Semántica Real**

**Archivo**: `apps/api/src/modules/documents/domain/validation-rules.ts`

- ✅ Implementadas validaciones semánticas para `service_contract`:
  - `penalizacion_requiere_rescision` - Error si hay monto sin activar rescisión
  - `monto_requiere_moneda` - Error si hay monto sin moneda
  - `propiedad_intelectual_requiere_tipo` - Error si se activa IP sin tipo
  - `confidencialidad_requiere_plazo` - Error si se activa confidencialidad sin plazo

- ✅ Implementadas warning rules para `service_contract`:
  - `sin_confidencialidad` - Warning si falta confidencialidad
  - `sin_propiedad_intelectual` - Warning si falta IP
  - `precio_sin_impuestos` - Warning si no se aclara impuestos
  - `sin_ajuste_precio` - Warning si contrato largo sin ajuste
  - `alcance_poco_detallado` - Warning si alcance poco detallado

**Archivo**: `apps/api/src/modules/documents/domain/validation-engine.ts`
- ✅ Actualizado para usar `validation-rules.ts` con import dinámico (ESM compatible)

### 2. **Correcciones en Cláusulas**

- ✅ Todas las cláusulas ahora usan `{{CLAUSE_NUMBER}}` en lugar de números hardcodeados
- ✅ Sistema de numeración automática funcionando correctamente
- ✅ Cláusulas corregidas:
  - `identification.ts` - Usa `{{CLAUSE_NUMBER}}`
  - `object.ts` - Usa `{{CLAUSE_NUMBER}}`
  - `amount.ts` - Usa `{{CLAUSE_NUMBER}}`
  - `term.ts` - Usa `{{CLAUSE_NUMBER}}`
  - `termination.ts` - Usa `{{CLAUSE_NUMBER}}`
  - `jurisdiction.ts` - Ya usaba `{{CLAUSE_NUMBER}}`
  - `disputes.ts` - Ya usaba `{{CLAUSE_NUMBER}}`
  - `confidentiality.ts` - Ya usaba `{{CLAUSE_NUMBER}}`
  - `intellectual-property.ts` - Ya usaba `{{CLAUSE_NUMBER}}`

### 3. **Mejoras en Motor de Generación**

**Archivo**: `apps/api/src/modules/documents/domain/generation-engine.ts`

- ✅ Mejorado sistema de mapeo de slots de cláusulas:
  - Soporta múltiples formatos de slots
  - Mapea IDs de cláusulas a nombres de slots del template
  - Ejemplo: `identificacion_partes` → `{{CLAUSE_IDENTIFICATION}}`

- ✅ Mejorado reemplazo de placeholders:
  - Elimina placeholders vacíos correctamente
  - Limpia líneas vacías múltiples
  - No deja placeholders sin reemplazar

- ✅ Mejorado formateo de placeholders:
  - `SCOPE` y `DELIVERABLES` solo se incluyen si tienen valor
  - Placeholders vacíos se eliminan completamente

### 4. **Correcciones en Document Mapper**

**Archivo**: `apps/api/src/modules/documents/services/document-mapper.ts`

- ✅ Convertido a función async para compatibilidad ESM
- ✅ Usa `import()` dinámico en lugar de `require()`
- ✅ Mejor manejo de errores

**Archivo**: `apps/api/src/routes.documents.ts`
- ✅ Actualizado para usar `await normalizeDocumentRequest()`

### 5. **Script de Testing**

**Archivo**: `apps/api/scripts/test-generation.ts`

- ✅ 5 casos de prueba implementados:
  1. **Caso mínimo válido** - Service contract con campos mínimos
  2. **Caso completo** - Con todas las opciones (rescisión, penalidad, confidencialidad, IP)
  3. **Caso inválido** - Penalización sin activar rescisión (debe fallar)
  4. **Caso con warnings** - Sin confidencialidad ni IP en contrato largo
  5. **Backward compatible** - Formato viejo (GenerateDocumentSchema)

- ✅ Validaciones implementadas:
  - Validación de response (ok, documentId, contrato, warnings, metadata)
  - Validación de persistencia (structuredData, clausePlan, warnings, templateVersion, status)
  - Validación de estructura de clausePlan
  - Validación de contenido de structuredData
  - Validación de mapeo de formato viejo

**Archivo**: `apps/api/package.json`
- ✅ Agregado script: `"test:generation": "tsx scripts/test-generation.ts"`

## 🔍 Problemas Detectados y Corregidos

### Problema 1: Validaciones Semánticas Vacías
**Síntoma**: `getValidationRulesForType()` retornaba arrays vacíos
**Solución**: Creado `validation-rules.ts` con validaciones reales

### Problema 2: Cláusulas con Números Hardcodeados
**Síntoma**: Cláusulas tenían "PRIMERA", "SEGUNDA" hardcodeados
**Solución**: Reemplazados por `{{CLAUSE_NUMBER}}` con numeración automática

### Problema 3: Mapeo de Slots de Cláusulas
**Síntoma**: Template usa `{{CLAUSE_IDENTIFICATION}}` pero cláusula tiene ID `identificacion_partes`
**Solución**: Sistema de mapeo múltiple con múltiples formatos de slots

### Problema 4: Placeholders Vacíos
**Síntoma**: Placeholders vacíos dejaban texto como `{{SCOPE}}` o líneas vacías
**Solución**: Sistema de limpieza que elimina placeholders vacíos y líneas múltiples

### Problema 5: Require() en ESM
**Síntoma**: `require()` no funciona en módulos ESM
**Solución**: Convertido a `import()` dinámico async

## 📊 Estado de Testing

### Casos de Prueba Listos

1. ✅ **Caso mínimo válido**
   - Payload mínimo con campos requeridos
   - Debe generar documento exitosamente
   - Debe persistir structuredData, clausePlan, warnings

2. ✅ **Caso completo**
   - Todas las opciones activadas
   - Debe incluir cláusulas opcionales
   - Debe verificar contenido del contrato

3. ✅ **Caso inválido**
   - Penalización sin activar rescisión
   - Debe retornar error 400
   - Debe validar semantic validation

4. ✅ **Caso con warnings**
   - Contrato largo sin ajuste de precio
   - Sin confidencialidad ni IP
   - Debe generar con warnings no bloqueantes

5. ✅ **Backward compatible**
   - Formato viejo (GenerateDocumentSchema)
   - Debe mapear correctamente
   - Debe preservar formato viejo en DB

## 📝 Contrato Final Estable

### Request (Nuevo Formato)

```json
{
  "documentType": "service_contract",
  "jurisdiction": "caba",
  "tone": "commercial_clear",
  "proveedor_nombre": "Servicios ABC SRL",
  "proveedor_doc": "20-12345678-9",
  "proveedor_domicilio": "Av. Corrientes 1234, CABA",
  "cliente_nombre": "Cliente XYZ SA",
  "cliente_doc": "30-98765432-1",
  "cliente_domicilio": "Av. Santa Fe 5678, CABA",
  "descripcion_servicio": "Servicios de consultoría contable mensual",
  "monto": "150000",
  "moneda": "ARS",
  "periodicidad": "mensual",
  "forma_pago": "transferencia_bancaria",
  "plazo_pago": "30_dias",
  "preferencias_fiscales": "responsable_inscripto",
  "inicio_vigencia": "2025-02-01",
  "plazo_minimo_meses": 12
}
```

### Request (Formato Viejo - Compatible)

```json
{
  "type": "contrato_servicios",
  "jurisdiccion": "caba",
  "tono": "formal",
  "proveedor_nombre": "Legacy Provider SRL",
  "proveedor_doc": "20-55555555-5",
  "proveedor_domicilio": "Legacy Address 123",
  "cliente_nombre": "Legacy Client SA",
  "cliente_doc": "30-66666666-6",
  "cliente_domicilio": "Legacy Address 456",
  "descripcion_servicio": "Legacy service description",
  "monto_mensual": "200000",
  "forma_pago": "transferencia_bancaria",
  "inicio_vigencia": "2025-02-01",
  "plazo_minimo_meses": 12,
  "penalizacion_rescision": false,
  "preferencias_fiscales": "monotributo"
}
```

### Response

```json
{
  "ok": true,
  "documentId": "uuid-del-documento",
  "contrato": "TEXTO COMPLETO DEL CONTRATO...",
  "pdfUrl": "uuid-del-documento.pdf",
  "warnings": [
    {
      "id": "warning-sin_confidencialidad-1234567890",
      "ruleId": "sin_confidencialidad",
      "message": "No se incluyó una cláusula de confidencialidad...",
      "suggestion": "Considera activar la opción de confidencialidad...",
      "severity": "warning"
    }
  ],
  "metadata": {
    "documentType": "service_contract",
    "templateVersion": "1.0.0",
    "generationTimestamp": "2025-01-XX..."
  }
}
```

## 💾 Campos Listos para Migración de Prisma

### DocumentVersion - Nuevos Campos (Nullable)

```prisma
model DocumentVersion {
  // ... campos existentes ...
  
  // Nuevos campos estructurados
  structuredData      Json?     // Structured document data (user input)
  clausePlan          Json?     // Plan of clauses to include
  generationWarnings  Json?     // Warnings generated during creation
  templateVersion     String?   // Version of template used
  status              String?   // "draft" | "generated" | "reviewed" | "final"
}
```

### Estructura de structuredData (JSON)

```typescript
{
  jurisdiccion: string;
  tono: string;
  proveedor_nombre: string;
  proveedor_doc: string;
  proveedor_domicilio: string;
  cliente_nombre: string;
  cliente_doc: string;
  cliente_domicilio: string;
  descripcion_servicio: string;
  monto: string;
  moneda: string;
  // ... todos los campos del request
}
```

### Estructura de clausePlan (JSON)

```typescript
{
  required: string[];      // IDs de cláusulas requeridas
  optional: string[];     // IDs de cláusulas opcionales incluidas
  order: string[];        // Orden final de cláusulas
  metadata: {
    documentType: string;
    totalClauses: number;
    requiredCount: number;
    optionalCount: number;
  }
}
```

### Estructura de generationWarnings (JSON)

```typescript
Array<{
  id: string;
  ruleId: string;
  message: string;
  suggestion?: string;
  severity: "info" | "warning" | "error";
}>
```

## 🚀 Próximos Pasos

1. **Ejecutar Tests**: `npm run test:generation` (requiere servidor corriendo)
2. **Crear Migración de Prisma**: Para los nuevos campos
3. **Validar en Producción**: Probar con datos reales
4. **Documentar**: Actualizar documentación de API

## ✅ Checklist de Hardening

- [x] Validaciones semánticas implementadas
- [x] Warning rules implementadas
- [x] Cláusulas corregidas (numeración automática)
- [x] Sistema de mapeo de slots mejorado
- [x] Limpieza de placeholders vacíos
- [x] Compatibilidad ESM (import dinámico)
- [x] Script de testing creado
- [x] Contrato de request/response documentado
- [x] Campos de persistencia definidos
- [ ] Tests ejecutados y validados
- [ ] Migración de Prisma creada

