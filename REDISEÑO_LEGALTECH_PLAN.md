# 🏗️ Plan de Rediseño: Legal AI Platform
## De Wizard Genérico a Sistema Documental Modular

---

## 📋 FASE 1: Análisis de Arquitectura Actual

### Estado Actual Identificado

#### **Frontend (`apps/web`)**
- **Wizard Universal**: `apps/web/app/documents/new/page.tsx`
  - 4 pasos genéricos para todos los tipos de documentos
  - Formulario hardcodeado con campos fijos
  - Validación básica (solo campos requeridos)
  - Auto-guardado en localStorage
  - Generación de PDF con jsPDF en frontend

- **Estructura de Datos**:
  ```typescript
  interface FormData {
    type: string;                    // "contrato_servicios", "nda", etc.
    jurisdiccion: string;            // "caba", "cordoba", etc.
    tono: string;                    // "formal", "comercial_claro"
    proveedor_nombre: string;
    proveedor_doc: string;
    proveedor_domicilio: string;
    cliente_nombre: string;
    cliente_doc: string;
    cliente_domicilio: string;
    descripcion_servicio: string;
    monto_mensual: string;
    forma_pago: string;
    inicio_vigencia: string;
    plazo_minimo_meses: number;
    penalizacion_rescision: boolean;
    penalizacion_monto?: string;
    preferencias_fiscales: string;
  }
  ```

- **Tipos de Documentos Actuales**:
  - `contrato_servicios` - Contrato de Servicios
  - `contrato_suministro` - Contrato de Suministro
  - `nda` - Acuerdo de Confidencialidad
  - `carta_documento` - Carta Documento
  - `contrato_locacion` - Contrato de Locación

#### **Backend (`apps/api`)**
- **Endpoint**: `POST /documents/generate`
- **Validación**: Zod schema genérico (`GenerateDocumentSchema`)
- **Prompt Construction**: Hardcodeado en `routes.documents.ts` (líneas 182-239)
  - Prompt monolítico que genera todo desde cero
  - Instrucciones genéricas para todos los tipos
  - Sin separación de templates/cláusulas
  - Sin validación semántica

- **Modelo de Datos (Prisma)**:
  ```prisma
  model Document {
    id             String
    tenantId       String
    createdById    String
    type           String            // "contrato_servicios"
    jurisdiccion   String
    tono           String
    estado         String            // "generated_text"
    costUsd        Float?
    versions       DocumentVersion[]
  }

  model DocumentVersion {
    id              String
    documentId      String
    versionNumber   Int
    rawText         String            // Solo texto plano
    pdfUrl          String?
    hashSha256      String?
    generatedBy     String
    createdAt       DateTime
  }
  ```

#### **Problemas Identificados**
1. ❌ Wizard genérico no escala por tipo documental
2. ❌ Prompt monolítico delega demasiado a la IA
3. ❌ No hay validación semántica
4. ❌ No hay warnings/alertas
5. ❌ No se guardan datos estructurados
6. ❌ No hay cláusulas modulares
7. ❌ No hay templates base
8. ❌ Difícil agregar nuevos tipos de documentos

---

## 🎯 Estrategia de Migración

### Principios
- ✅ **Backward Compatible**: No romper datos existentes
- ✅ **Incremental**: Cambios por fases, código funcionando en cada fase
- ✅ **Extensible**: Fácil agregar nuevos tipos documentales
- ✅ **Type-Safe**: TypeScript fuerte en toda la arquitectura
- ✅ **Multi-tenant**: Mantener aislamiento por tenant

### Enfoque de Migración
1. **Fase 2-4**: Crear nueva arquitectura en paralelo (no romper lo existente)
2. **Fase 5-6**: Implementar validaciones y motor de ensamblado
3. **Fase 7**: Extender modelo de datos (migración segura)
4. **Fase 8-9**: Refactorizar backend y frontend gradualmente
5. **Fase 10-12**: Preparar futuro y documentar

---

## 📐 Arquitectura Propuesta

### Estructura de Directorios

```
apps/web/src/features/documents/
├── core/
│   ├── types.ts              # Tipos base del dominio
│   ├── registry.ts           # Registry central de tipos documentales
│   ├── validation.ts         # Validaciones semánticas
│   ├── generation.ts         # Motor de generación
│   └── warnings.ts           # Sistema de warnings
├── schemas/
│   ├── index.ts              # Export central
│   ├── service-contract.ts  # Schema específico
│   ├── nda.ts
│   ├── lease.ts
│   ├── supply-contract.ts
│   └── legal-notice.ts
├── clauses/
│   ├── common/               # Cláusulas reutilizables
│   ├── service/
│   ├── nda/
│   ├── lease/
│   ├── supply/
│   └── legal-notice/
├── ui/
│   ├── steps/                # Componentes de pasos
│   ├── fields/               # Campos dinámicos
│   ├── summaries/            # Resúmenes jurídicos
│   └── warnings/             # Panel de warnings
└── utils/

apps/api/src/modules/documents/
├── domain/
│   ├── document-types.ts     # Tipos del dominio
│   ├── document-registry.ts # Registry backend
│   ├── clause-engine.ts      # Motor de cláusulas
│   ├── validation-engine.ts # Validaciones
│   ├── generation-engine.ts  # Generación híbrida
│   └── warning-engine.ts     # Warnings
├── templates/
│   ├── service-contract/
│   ├── nda/
│   ├── lease/
│   ├── supply-contract/
│   └── legal-notice/
├── services/
│   ├── document-service.ts
│   └── generation-service.ts
├── routes/
│   └── documents.routes.ts
└── dto/
    ├── generate-document.dto.ts
    └── document-response.dto.ts
```

---

## 🔄 Plan de Implementación por Fases

### **FASE 2: Arquitectura de Dominio Documental**

**Objetivo**: Crear la base del sistema modular sin romper lo existente.

**Tareas**:
1. Crear tipos base del dominio (`core/types.ts`)
2. Crear registry central (`core/registry.ts`)
3. Definir interfaces de schemas documentales
4. Crear estructura de cláusulas modulares
5. Implementar sistema de validación base

**Archivos a crear**:
- `apps/web/src/features/documents/core/types.ts`
- `apps/web/src/features/documents/core/registry.ts`
- `apps/web/src/features/documents/core/validation.ts`
- `apps/api/src/modules/documents/domain/document-types.ts`
- `apps/api/src/modules/documents/domain/document-registry.ts`

---

### **FASE 3: Flujo Guiado**

**Objetivo**: Reemplazar wizard universal por flujo específico.

**Tareas**:
1. Crear pantalla de selección de tipo documental
2. Implementar formularios dinámicos basados en schemas
3. Crear resumen jurídico estructurado
4. Implementar panel de warnings
5. Mantener compatibilidad con flujo actual durante transición

**Archivos a crear/modificar**:
- `apps/web/app/documents/new/page.tsx` → Refactorizar
- `apps/web/app/documents/new/[type]/page.tsx` → Nuevo flujo por tipo
- `apps/web/src/features/documents/ui/` → Componentes nuevos

---

### **FASE 4: Schemas Específicos**

**Objetivo**: Implementar schemas completos para 3 tipos principales.

**Tareas**:
1. Schema completo para `service_contract`
2. Schema completo para `nda`
3. Schema completo para `legal_notice`
4. Preparar estructura para `lease` y `supply_contract`

**Archivos a crear**:
- `apps/web/src/features/documents/schemas/service-contract.ts`
- `apps/web/src/features/documents/schemas/nda.ts`
- `apps/web/src/features/documents/schemas/legal-notice.ts`

---

### **FASE 5: Validación en 3 Niveles**

**Objetivo**: Sistema robusto de validación.

**Tareas**:
1. Validación de campos (formato, obligatorios, enums)
2. Validación semántica (reglas de negocio)
3. Warning rules (alertas no bloqueantes)

**Archivos a crear**:
- `apps/web/src/features/documents/core/validation.ts` (expandir)
- `apps/api/src/modules/documents/domain/validation-engine.ts`

---

### **FASE 6: Motor de Ensamblado Documental**

**Objetivo**: Generación híbrida (templates + IA).

**Tareas**:
1. Crear templates base por tipo
2. Sistema de cláusulas modulares
3. Motor de ensamblado (template + cláusulas)
4. Integración con IA para redacción asistida
5. Generar `structuredData`, `clausePlan`, `baseDraft`, `aiEnhancedDraft`

**Archivos a crear**:
- `apps/api/src/modules/documents/domain/clause-engine.ts`
- `apps/api/src/modules/documents/domain/generation-engine.ts`
- `apps/api/src/modules/documents/templates/` (templates base)

---

### **FASE 7: Persistencia Extendida**

**Objetivo**: Guardar datos estructurados además de rawText.

**Tareas**:
1. Crear migración de Prisma para extender DocumentVersion
2. Agregar campos: `structuredData`, `clausePlan`, `generationWarnings`, `templateVersion`
3. Mantener backward compatibility
4. Actualizar queries para incluir nuevos campos

**Archivos a modificar**:
- `packages/db/prisma/schema.prisma`
- Crear migración: `YYYYMMDDHHMMSS_add_structured_data.sql`

---

### **FASE 8: Refactor Backend**

**Objetivo**: Backend desacoplado con DTOs estructurados.

**Tareas**:
1. Crear DTOs por tipo documental
2. Refactorizar endpoint `/documents/generate` para usar registry
3. Separar servicios (document-service, generation-service)
4. Implementar validaciones centralizadas
5. Mantener endpoint genérico pero con despacho interno por tipo

**Archivos a crear/modificar**:
- `apps/api/src/modules/documents/dto/`
- `apps/api/src/modules/documents/services/`
- `apps/api/src/routes.documents.ts` → Refactorizar

---

### **FASE 9: Refactor Frontend**

**Objetivo**: Formularios dinámicos y UX mejorada.

**Tareas**:
1. Componentes reutilizables por field type
2. Formulario dinámico basado en schemas
3. Resumen jurídico reutilizable
4. Panel de warnings reutilizable
5. Mantener autosave, progreso, vista previa

**Archivos a crear/modificar**:
- `apps/web/src/features/documents/ui/fields/`
- `apps/web/src/features/documents/ui/summaries/`
- `apps/web/src/features/documents/ui/warnings/`
- `apps/web/app/documents/new/[type]/page.tsx`

---

### **FASE 10: Preparar Render Server-Side**

**Objetivo**: Base para futuro renderizado en servidor.

**Tareas**:
1. Diseñar capa de salida abstracta
2. Preparar estructura para PDF backend (Puppeteer)
3. Preparar estructura para DOCX futuro
4. No implementar aún, solo preparar arquitectura

---

### **FASE 11: Testing**

**Objetivo**: Tests para componentes críticos.

**Tareas**:
1. Tests para registry
2. Tests para validaciones semánticas
3. Tests para warning rules
4. Tests para clause engine
5. Tests para generación base

---

### **FASE 12: Entrega**

**Objetivo**: Documentación completa.

**Entregables**:
1. Código implementado
2. Comentarios claros
3. TODOs explícitos
4. Documentación en markdown:
   - Qué cambió
   - Por qué
   - Migraciones realizadas
   - Archivos clave
   - Cómo extender un nuevo tipo documental
   - Riesgos o pendientes

---

## 🚀 Inicio de Implementación

**Siguiente paso**: Comenzar con FASE 2 - Crear arquitectura de dominio documental.



