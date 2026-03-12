# 📋 Checklist de Deprecación - Wizard Legacy

## 🎯 Objetivo

Deprecar el wizard genérico (`/documents/new`) en favor del flujo guiado (`/documents/new/guided`) una vez que el nuevo flujo esté suficientemente probado y estable.

## ✅ Condiciones Mínimas para Deprecar

### Funcionalidad
- [x] Flujo guiado funcional para service_contract, nda y legal_notice
- [x] Validación de campos y semántica funcionando
- [x] Warnings funcionando
- [x] Autosave funcionando
- [x] Submit al backend funcionando
- [x] Manejo de errores 400/500 funcionando
- [x] Pantalla de resultado funcionando
- [ ] PDF generation funcionando (parcial - jsPDF integrado pero falta validar)
- [ ] Integración con dashboard funcionando

### UX
- [x] Navegación entre pasos clara
- [x] Feedback de autosave visible
- [x] Errores de validación claros
- [x] Warnings presentados de forma útil
- [x] Confirmación antes de descartar draft
- [x] Textos de ayuda donde corresponde
- [ ] Tests de usuario completados (pendiente)

### Observabilidad
- [x] Eventos de tracking implementados
- [ ] Analytics funcionando en producción (pendiente configurar servicio)
- [ ] Métricas de uso disponibles

## 📊 Métricas a Observar

### Antes de Deprecar
1. **Adopción del flujo nuevo**:
   - % de usuarios que usan `/documents/new/guided` vs `/documents/new`
   - Tasa de conversión (completar documento) en cada flujo
   - Tiempo promedio de creación en cada flujo

2. **Errores y problemas**:
   - Tasa de errores 400 (validación) en flujo nuevo
   - Tasa de errores 500 en flujo nuevo
   - Tasa de abandono en cada paso del flujo nuevo
   - Problemas reportados por usuarios

3. **Satisfacción**:
   - Feedback de usuarios sobre el nuevo flujo
   - Comparación de calidad de documentos generados

### Período de Observación Recomendado
- **Mínimo**: 2 semanas con ambos flujos disponibles
- **Ideal**: 1 mes para tener datos estadísticamente significativos

## 🚀 Pasos de Migración

### Fase 1: Preparación (Actual)
- [x] Flujo guiado implementado
- [x] Banner informativo en wizard viejo
- [x] Botón de acceso directo al flujo nuevo
- [x] Tracking de eventos implementado
- [ ] Documentación de uso del nuevo flujo

### Fase 2: Promoción (Próxima)
- [ ] Notificación a usuarios activos sobre nuevo flujo
- [ ] Tutorial o guía del nuevo flujo
- [ ] Destacar el nuevo flujo en dashboard
- [ ] Monitorear métricas de adopción

### Fase 3: Redirección Automática (Después de observación)
- [ ] Redirigir `/documents/new` → `/documents/new/guided`
- [ ] Mantener wizard viejo en ruta legacy: `/documents/new/legacy`
- [ ] Banner de deprecación en wizard legacy
- [ ] Monitorear errores y quejas

### Fase 4: Eliminación (Final)
- [ ] Confirmar que < 5% de usuarios usan wizard legacy
- [ ] Notificar a usuarios restantes
- [ ] Eliminar código del wizard legacy
- [ ] Limpiar imports y dependencias no usadas

## 📁 Archivos Legacy que se Podrían Eliminar

### Después de Deprecación Completa
- `apps/web/app/documents/new/page.tsx` - Wizard genérico
- Posiblemente `apps/web/components/ui/wizard.tsx` si no se usa en otro lugar
- Cualquier lógica específica del wizard viejo que no se reutilice

### Verificar Antes de Eliminar
- [ ] Buscar referencias a `wizard.tsx` en otros archivos
- [ ] Verificar que no hay dependencias del wizard en otros flujos
- [ ] Confirmar que autosave legacy no se usa en otro lugar

## ⚠️ Riesgos y Consideraciones

### Riesgos
1. **Usuarios acostumbrados al wizard viejo**: Pueden resistirse al cambio
2. **Bugs no detectados**: El nuevo flujo puede tener problemas no descubiertos
3. **Pérdida de funcionalidad**: Asegurar que el nuevo flujo tiene todas las features del viejo
4. **Performance**: El nuevo flujo puede ser más lento (más validaciones, más componentes)

### Mitigaciones
1. **Período de transición largo**: Mantener ambos flujos disponibles
2. **Feedback loop rápido**: Monitorear errores y quejas activamente
3. **Rollback plan**: Poder reactivar wizard viejo rápidamente si es necesario
4. **Comunicación clara**: Explicar beneficios del nuevo flujo a usuarios

## 🎯 Criterios de Éxito

### Para Redirigir Automáticamente
- ✅ Flujo nuevo usado por > 70% de usuarios nuevos
- ✅ Tasa de errores en flujo nuevo < 5%
- ✅ Tasa de abandono en flujo nuevo < 20%
- ✅ Sin quejas críticas sobre el nuevo flujo
- ✅ Documentos generados con calidad igual o mejor

### Para Eliminar Código Legacy
- ✅ Flujo nuevo usado por > 95% de usuarios
- ✅ Sin uso del wizard legacy por > 2 semanas
- ✅ Sin dependencias del wizard legacy en código activo
- ✅ Backup/rollback plan documentado

## 📅 Timeline Recomendado

### Semana 1-2: Observación Inicial
- Monitorear métricas de ambos flujos
- Recolectar feedback de usuarios
- Corregir bugs críticos si aparecen

### Semana 3-4: Promoción Activa
- Notificar a usuarios sobre nuevo flujo
- Destacar beneficios
- Ofrecer ayuda/soporte

### Semana 5-6: Evaluación
- Revisar métricas acumuladas
- Decidir si proceder con redirección
- Preparar comunicación

### Semana 7+: Redirección y Deprecación
- Redirigir automáticamente
- Monitorear de cerca
- Planificar eliminación final

## 📝 Notas

- **No apresurarse**: Es mejor mantener ambos flujos más tiempo que deprecar prematuramente
- **Comunicación es clave**: Los usuarios deben entender por qué el cambio es mejor
- **Datos sobre opiniones**: Usar métricas objetivas, no solo feedback subjetivo
- **Rollback siempre posible**: Mantener código legacy accesible durante período de transición

