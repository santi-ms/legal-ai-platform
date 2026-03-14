# 🎯 Propuesta Fase 2 - Pulido Funcional Módulo Documentos y Dashboard

**Objetivo:** Pulir funcionalidades existentes sin abrir features grandes nuevas  
**Duración estimada:** 3-5 horas  
**Enfoque:** UX, estabilidad, y completitud de flujos existentes

---

## 📋 Alcance de Fase 2

### ✅ INCLUYE
- Mejoras de UX en flujos existentes
- Corrección de bugs menores
- Completar funcionalidades parcialmente implementadas
- Mejoras de rendimiento y feedback visual
- Validaciones y manejo de errores mejorados

### ❌ NO INCLUYE
- Nuevas features grandes (editor rico, IA avanzada, etc.)
- Integraciones nuevas
- Cambios arquitectónicos mayores
- Nuevos módulos completos

---

## 🎯 Tareas Propuestas

### 1. Dashboard de Documentos - Mejoras de UX

**Problemas detectados:**
- Falta feedback visual al filtrar/buscar
- Estados de carga no siempre claros
- Falta manejo de estados vacíos (sin documentos)

**Tareas:**
- [ ] Agregar skeleton loaders mientras cargan documentos
- [ ] Mejorar estado vacío: mensaje claro + CTA a crear documento
- [ ] Agregar indicador visual cuando hay filtros activos
- [ ] Mejorar feedback al eliminar documento (toast + optimistic update)
- [ ] Agregar confirmación antes de eliminar documento

**Archivos a tocar:**
- `apps/web/app/documents/page.tsx`
- `apps/web/components/dashboard/DocumentsTable.tsx`
- `apps/web/components/dashboard/DocumentsFilters.tsx` (si existe)

**Esfuerzo:** 1-1.5 horas

---

### 2. Flujo de Creación de Documentos - Pulido

**Problemas detectados:**
- Autosave podría tener mejor feedback
- Validaciones frontend podrían ser más claras
- Falta manejo de errores de red más robusto
- Loading states durante generación podrían ser más informativos

**Tareas:**
- [ ] Mejorar indicador de autosave (más visible, con timestamp)
- [ ] Agregar validación en tiempo real con feedback inmediato
- [ ] Mejorar mensajes de error de validación (más específicos)
- [ ] Agregar retry automático en caso de error de red
- [ ] Mejorar progress indicator durante generación (pasos más claros)
- [ ] Agregar cancelación de generación si es posible

**Archivos a tocar:**
- `apps/web/app/documents/new/guided/page.tsx`
- `apps/web/src/features/documents/ui/autosave/AutosaveIndicator.tsx`
- `apps/web/src/features/documents/ui/forms/DynamicForm.tsx`
- `apps/web/src/features/documents/ui/errors/ValidationErrorPanel.tsx`

**Esfuerzo:** 1.5-2 horas

---

### 3. Vista de Detalle de Documento - Completar Funcionalidades

**Problemas detectados:**
- Botones de acción podrían tener mejor feedback
- Falta confirmación en acciones destructivas
- Preview/descarga podría tener mejor UX

**Tareas:**
- [ ] Agregar confirmación antes de eliminar versión
- [ ] Mejorar feedback al descargar PDF (loading state)
- [ ] Agregar preview mejorado del documento (si no existe)
- [ ] Mejorar manejo de errores al generar PDF
- [ ] Agregar tooltips informativos en botones de acción

**Archivos a tocar:**
- `apps/web/app/documents/[id]/page.tsx`
- `apps/web/components/documents/DocumentActions.tsx` (si existe)
- `apps/web/app/lib/pdfGenerator.ts`

**Esfuerzo:** 1 hora

---

### 4. Dashboard Principal - Mejoras Menores

**Problemas detectados:**
- Stats cards podrían tener mejor loading state
- Quick actions ya están deshabilitadas (Fase 1) pero podrían tener mejor mensaje

**Tareas:**
- [ ] Agregar skeleton loaders en stats cards
- [ ] Mejorar mensaje en quick actions disabled (tooltip más informativo)
- [ ] Agregar refresh manual de datos si es necesario
- [ ] Mejorar manejo de errores al cargar dashboard

**Archivos a tocar:**
- `apps/web/app/dashboard/page.tsx`
- `apps/web/components/dashboard/QuickActions.tsx` (ya modificado en Fase 1)
- `apps/web/components/dashboard/StatsCards.tsx` (si existe)

**Esfuerzo:** 0.5-1 hora

---

### 5. Validaciones y Manejo de Errores - Robustez

**Problemas detectados:**
- Algunos errores de backend no se muestran claramente
- Falta validación de límites (ej: caracteres máximos)
- Errores de red podrían tener mejor manejo

**Tareas:**
- [ ] Agregar validación de límites en campos de texto (maxLength)
- [ ] Mejorar mensajes de error del backend (más user-friendly)
- [ ] Agregar timeout handling en requests largos
- [ ] Mejorar error boundaries si es necesario
- [ ] Agregar logging de errores para debugging

**Archivos a tocar:**
- `apps/web/src/features/documents/core/validation.ts`
- `apps/web/src/features/documents/ui/fields/FieldRenderer.tsx`
- `apps/web/app/lib/webApi.ts` (si existe)

**Esfuerzo:** 1 hora

---

## 📊 Priorización

### Prioridad Alta (Hacer primero)
1. **Dashboard de Documentos - Mejoras de UX** (impacto alto, esfuerzo medio)
2. **Flujo de Creación - Pulido** (impacto alto, esfuerzo medio-alto)

### Prioridad Media (Si hay tiempo)
3. **Vista de Detalle - Completar** (impacto medio, esfuerzo bajo)
4. **Validaciones y Errores - Robustez** (impacto medio, esfuerzo medio)

### Prioridad Baja (Opcional)
5. **Dashboard Principal - Mejoras Menores** (impacto bajo, esfuerzo bajo)

---

## 🎯 Fase 2 Reducida (Recomendada)

Si el tiempo es limitado, enfocarse en:

1. **Dashboard de Documentos - UX** (1-1.5h)
   - Skeleton loaders
   - Estado vacío mejorado
   - Feedback al eliminar

2. **Flujo de Creación - Pulido** (1.5-2h)
   - Autosave mejorado
   - Validaciones en tiempo real
   - Progress indicator mejorado

**Total:** 2.5-3.5 horas de trabajo enfocado

---

## ✅ Criterios de Éxito

- [ ] Dashboard se siente más responsivo y profesional
- [ ] Flujo de creación tiene mejor feedback en cada paso
- [ ] Errores son más claros y accionables
- [ ] Estados de carga son consistentes y claros
- [ ] No se introducen bugs nuevos
- [ ] Mejora la percepción de calidad del producto

---

## 🚀 Siguiente Fase (Post-Fase 2)

Después de Fase 2, considerar:
- Fase 3: Features de valor medio (compartir documentos, notificaciones básicas)
- O continuar con pulido según feedback de usuarios

---

**¿Proceder con Fase 2 Reducida (Dashboard + Creación)?**

