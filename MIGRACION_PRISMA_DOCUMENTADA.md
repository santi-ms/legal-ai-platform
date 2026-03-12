# 📦 Migración de Prisma - Campos Estructurados Documentales

## 📋 Resumen

Esta migración agrega campos estructurados al modelo `DocumentVersion` para soportar la nueva arquitectura documental modular, manteniendo **100% de compatibilidad backward** con registros existentes.

## 🎯 Objetivo

Extender el modelo de persistencia para guardar:
- Datos estructurados del request del usuario
- Plan de cláusulas generado
- Warnings generados durante la creación
- Versión del template usado
- Estado del documento

## 📊 Modelo Modificado

### `DocumentVersion`

**Campos Agregados** (todos nullable):

```prisma
model DocumentVersion {
  // ... campos existentes ...
  
  // New structured data fields (nullable for backward compatibility)
  structuredData      Json?     // Structured document data (user input)
  clausePlan          Json?     // Plan of clauses to include
  generationWarnings  Json?     // Warnings generated during creation
  templateVersion     String?   // Version of template used
  status              String?   // "draft" | "generated" | "reviewed" | "final"
}
```

## 🔍 Detalles de los Campos

### `structuredData` (Json?)
- **Tipo**: JSONB (PostgreSQL)
- **Nullable**: Sí (backward compatibility)
- **Descripción**: Contiene todos los datos estructurados del request del usuario
- **Ejemplo**:
  ```json
  {
    "jurisdiccion": "caba",
    "tono": "commercial_clear",
    "proveedor_nombre": "Servicios ABC SRL",
    "proveedor_doc": "20-12345678-9",
    "cliente_nombre": "Cliente XYZ SA",
    "descripcion_servicio": "Servicios de consultoría...",
    "monto": "150000",
    "moneda": "ARS",
    // ... todos los campos del request
  }
  ```

### `clausePlan` (Json?)
- **Tipo**: JSONB (PostgreSQL)
- **Nullable**: Sí (backward compatibility)
- **Descripción**: Plan de cláusulas que se incluyeron en el documento
- **Ejemplo**:
  ```json
  {
    "required": ["identificacion_partes", "objeto_contrato", "monto_pago"],
    "optional": ["confidencialidad", "propiedad_intelectual"],
    "order": ["identificacion_partes", "objeto_contrato", "monto_pago", "confidencialidad", "propiedad_intelectual"],
    "metadata": {
      "documentType": "service_contract",
      "totalClauses": 5,
      "requiredCount": 3,
      "optionalCount": 2
    }
  }
  ```

### `generationWarnings` (Json?)
- **Tipo**: JSONB (PostgreSQL)
- **Nullable**: Sí (backward compatibility)
- **Descripción**: Warnings generados durante la creación del documento
- **Ejemplo**:
  ```json
  [
    {
      "id": "warning-sin_confidencialidad-1234567890",
      "ruleId": "sin_confidencialidad",
      "message": "No se incluyó una cláusula de confidencialidad...",
      "suggestion": "Considera activar la opción de confidencialidad...",
      "severity": "warning"
    }
  ]
  ```

### `templateVersion` (String?)
- **Tipo**: TEXT (PostgreSQL)
- **Nullable**: Sí (backward compatibility)
- **Descripción**: Versión del template usado para generar el documento
- **Ejemplo**: `"1.0.0"`

### `status` (String?)
- **Tipo**: TEXT (PostgreSQL)
- **Nullable**: Sí (backward compatibility)
- **Descripción**: Estado del documento en su ciclo de vida
- **Valores posibles**: `"draft"` | `"generated"` | `"reviewed"` | `"final"`
- **Ejemplo**: `"generated"`

## 🔄 Compatibilidad Backward

### ✅ Registros Existentes
- **No se rompen**: Todos los campos nuevos son `nullable`
- **Valores por defecto**: `NULL` para registros existentes
- **Queries existentes**: Siguen funcionando sin cambios
- **Código legacy**: Puede seguir usando solo `rawText` sin problemas

### ✅ Nuevos Registros
- **Campos poblados**: Los nuevos documentos tendrán todos los campos estructurados
- **Código nuevo**: Puede usar `structuredData`, `clausePlan`, etc.

## 📁 Archivos de Migración

### 1. `packages/db/prisma/migrations/20250111195936_add_structured_document_fields/migration.sql`
- Migración para el schema del monorepo
- Usado en desarrollo local

### 2. `apps/api/prisma/migrations/20250111195936_add_structured_document_fields/migration.sql`
- Migración para el schema del API
- Usado en producción (Railway)

**Ambas migraciones son idénticas** y agregan los mismos campos.

## 🚀 Cómo Aplicar la Migración

### Desarrollo Local

```bash
# Opción 1: Desde el monorepo
cd packages/db
npx prisma migrate deploy --schema prisma/schema.prisma

# Opción 2: Desde el API
cd apps/api
npx prisma migrate deploy --schema prisma/schema.prisma
```

### Producción (Railway)

La migración se aplicará automáticamente al hacer deploy si:
- `DATABASE_URL` está configurado
- El servidor ejecuta migraciones al iniciar (ya implementado en `server.ts`)

**O manualmente**:
```bash
# En Railway, ejecutar:
cd apps/api
npx prisma migrate deploy --schema prisma/schema.prisma
```

## ✅ Verificación Post-Migración

### 1. Verificar que las columnas existen

```sql
-- PostgreSQL
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'DocumentVersion'
  AND column_name IN ('structuredData', 'clausePlan', 'generationWarnings', 'templateVersion', 'status');
```

### 2. Verificar que registros existentes no se rompieron

```sql
-- Debe retornar todos los registros existentes
SELECT id, "versionNumber", "rawText", "structuredData", "clausePlan"
FROM "DocumentVersion"
WHERE "structuredData" IS NULL; -- Registros antiguos
```

### 3. Verificar que nuevos registros tienen los campos

```sql
-- Después de generar un documento nuevo
SELECT id, "structuredData", "clausePlan", "templateVersion", "status"
FROM "DocumentVersion"
WHERE "structuredData" IS NOT NULL; -- Registros nuevos
```

## 🔧 Uso en el Código

### Crear DocumentVersion con nuevos campos

```typescript
const version = await prisma.documentVersion.create({
  data: {
    documentId: doc.id,
    versionNumber: 1,
    rawText: contrato,
    generatedBy: "gpt-4o-mini",
    // Nuevos campos
    structuredData: generationResult.structuredData,
    clausePlan: generationResult.clausePlan,
    generationWarnings: generationResult.warnings,
    templateVersion: generationResult.metadata.templateVersion,
    status: "generated",
  },
});
```

### Leer DocumentVersion con nuevos campos

```typescript
const version = await prisma.documentVersion.findUnique({
  where: { id: versionId },
});

// Los campos pueden ser null para registros antiguos
if (version.structuredData) {
  const data = version.structuredData as StructuredDocumentData;
  // Usar datos estructurados
}

if (version.clausePlan) {
  const plan = version.clausePlan as ClausePlan;
  // Usar plan de cláusulas
}
```

## 📝 Notas Técnicas

### Por qué JSONB en lugar de JSON
- **JSONB**: Binario, indexable, más rápido para queries
- **JSON**: Texto, no indexable, más lento
- **Elección**: JSONB para mejor rendimiento en queries futuras

### Por qué nullable
- **Backward Compatibility**: Registros existentes no tienen estos campos
- **Migración Gradual**: El sistema puede funcionar con ambos tipos de registros
- **Sin Breaking Changes**: Código legacy sigue funcionando

### Naming Consistency
- **snake_case**: Consistente con `versionNumber`, `rawText`, `pdfUrl`, `hashSha256`
- **CamelCase en TypeScript**: Prisma Client convierte automáticamente a camelCase

## ⚠️ Consideraciones

### 1. Tamaño de JSONB
- Los campos JSONB pueden crecer significativamente
- Considerar límites si hay documentos muy grandes
- PostgreSQL maneja bien JSONB hasta varios MB

### 2. Índices Futuros
- Si se necesitan queries frecuentes sobre `structuredData`, considerar índices GIN
- Por ahora, no se agregan índices (optimización prematura)

### 3. Migración en Producción
- **Backup recomendado**: Hacer backup antes de aplicar en producción
- **Downtime**: No requiere downtime (ALTER TABLE ADD COLUMN es rápido)
- **Rollback**: Si es necesario, se pueden eliminar las columnas (pérdida de datos)

## ✅ Checklist de Aplicación

- [x] Schema actualizado en `packages/db/prisma/schema.prisma`
- [x] Schema actualizado en `apps/api/prisma/schema.prisma`
- [x] Migración SQL creada
- [x] Campos son nullable (backward compatible)
- [x] Naming consistente con convenciones existentes
- [ ] **Aplicar migración en desarrollo** (requiere DATABASE_URL)
- [ ] **Aplicar migración en producción** (Railway)
- [ ] **Verificar que registros existentes no se rompieron**
- [ ] **Verificar que nuevos registros tienen los campos**

## 🎯 Estado Final

Una vez aplicada la migración:
- ✅ Registros existentes: Siguen funcionando (campos NULL)
- ✅ Nuevos registros: Tienen todos los campos estructurados
- ✅ Código backend: Ya está listo para usar los nuevos campos
- ✅ Tests: Podrán validar persistencia completa

## 📚 Referencias

- **Schema Principal**: `packages/db/prisma/schema.prisma`
- **Schema API**: `apps/api/prisma/schema.prisma`
- **Código que usa**: `apps/api/src/routes.documents.ts` (líneas 296-300)
- **Tipos TypeScript**: `apps/api/src/modules/documents/domain/document-types.ts`

