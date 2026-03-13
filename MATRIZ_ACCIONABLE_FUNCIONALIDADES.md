# 📊 Matriz Accionable - Elementos Sin Funcionalidad

**Fecha:** Enero 2025  
**Versión:** 1.0.0  
**Estado:** Análisis Completo

---

## 📋 Tabla de Clasificación

| # | Elemento | Componente/Archivo | Tipo de Problema | Impacto UX | Impacto Negocio | Esfuerzo Estimado | Recomendación | Acción Concreta Sugerida |
|---|----------|-------------------|------------------|------------|-----------------|-------------------|---------------|-------------------------|
| 1 | "Ver Demo" | `components/landing/Hero.tsx` | Placeholder visual | Alto | Alto | Bajo | Implementar ahora | Crear modal con video demo o redirigir a `/demo` con video embebido |
| 2 | "Hablar con un Asesor" | `components/landing/CTA.tsx` | Callback sin implementar | Alto | Alto | Medio | Implementar ahora | Crear página `/contacto` con formulario o integrar chat widget (Intercom/Drift) |
| 3 | Enlaces redes sociales | `components/landing/Footer.tsx` | Navegación faltante | Bajo | Medio | Bajo | Implementar ahora | Agregar `mailto:` y URLs reales de redes sociales |
| 4 | Enlaces footer (anclas) | `components/landing/Footer.tsx` | Navegación faltante | Medio | Bajo | Bajo | Implementar ahora | Verificar IDs en landing page o crear páginas dedicadas (`/precios`, `/funciones`) |
| 5 | "Casos Activos" | `components/dashboard/DashboardSidebar.tsx` | Navegación faltante | Alto | Medio | Medio | Ocultar temporalmente | Comentar enlace hasta implementar feature de casos |
| 6 | "Calendario" | `components/dashboard/DashboardSidebar.tsx` | Navegación faltante | Alto | Medio | Medio | Ocultar temporalmente | Comentar enlace hasta implementar feature de calendario |
| 7 | "Clientes" | `components/dashboard/DashboardSidebar.tsx` | Navegación faltante | Alto | Medio | Medio | Ocultar temporalmente | Comentar enlace hasta implementar feature de clientes |
| 8 | "Ajustes" | `components/dashboard/DashboardSidebar.tsx` | Navegación faltante | Alto | Medio | Bajo | Implementar ahora | Cambiar `href="#"` a `href="/settings"` (página ya existe) |
| 9 | "Ayuda" | `components/dashboard/DashboardSidebar.tsx` | Navegación faltante | Medio | Bajo | Bajo | Dejar para fase futura | Crear página `/help` con documentación o enlace externo a docs |
| 10 | "Suscripción Premium" | `components/dashboard/DashboardSidebar.tsx` | Callback sin implementar | Alto | Alto | Medio | Implementar ahora | Redirigir a `/settings/billing` o crear modal de suscripción |
| 11 | Botón Notificaciones | `components/dashboard/DashboardHeader.tsx` | Callback sin implementar | Medio | Medio | Alto | Dejar para fase futura | Implementar sistema de notificaciones con dropdown y backend |
| 12 | "Subir PDF" | `components/dashboard/QuickActions.tsx` | Navegación faltante | Medio | Medio | Alto | Dejar para fase futura | Crear feature completa de upload y procesamiento de PDFs |
| 13 | "Nuevo Cliente" | `components/dashboard/QuickActions.tsx` | Navegación faltante | Medio | Medio | Medio | Ocultar temporalmente | Comentar hasta implementar feature de clientes |
| 14 | "Agendar Cita" | `components/dashboard/QuickActions.tsx` | Navegación faltante | Medio | Medio | Medio | Ocultar temporalmente | Comentar hasta implementar feature de calendario |
| 15 | "Informes" | `components/dashboard/QuickActions.tsx` | Navegación faltante | Medio | Bajo | Alto | Dejar para fase futura | Crear feature completa de generación de informes |
| 16 | "Más opciones" (tabla) | `components/documents/DocumentsTableEnhanced.tsx` | Callback sin implementar | Bajo | Bajo | Medio | Dejar para fase futura | Implementar dropdown con opciones: duplicar, eliminar, compartir |
| 17 | Botón Notificaciones (review) | `components/documents/review/DocumentReviewHeader.tsx` | Callback sin implementar | Bajo | Bajo | Alto | Dejar para fase futura | Reutilizar sistema de notificaciones cuando esté implementado |
| 18 | "Aplicar Todo" (AI) | `components/documents/review/AIAssistantSidebar.tsx` | Callback sin implementar | Medio | Medio | Alto | Dejar para fase futura | Implementar lógica de aplicación masiva de sugerencias de IA |
| 19 | "Aplicar" (revisiones) | `components/documents/review/SmartRevisionsSidebar.tsx` | Callback sin implementar | Alto | Alto | Alto | Dejar para fase futura | Implementar editor de documentos con aplicación de cambios |
| 20 | "Ignorar" (revisiones) | `components/documents/review/SmartRevisionsSidebar.tsx` | Callback sin implementar | Medio | Medio | Alto | Dejar para fase futura | Implementar lógica de ignorar cambios sugeridos |
| 21 | Enviar pregunta a IA | `components/documents/review/SmartRevisionsSidebar.tsx` | Callback sin implementar | Alto | Alto | Alto | Dejar para fase futura | Integrar con API de IA para responder preguntas sobre documentos |
| 22 | Botones formato (toolbar) | `components/documents/review/DocumentToolbar.tsx` | Feature futura | Medio | Bajo | Alto | Dejar para fase futura | Implementar editor de texto rico completo (Tiptap/Quill) |
| 23 | "Compartir" (toolbar) | `components/documents/review/DocumentToolbar.tsx` | Callback sin implementar | Medio | Medio | Medio | Dejar para fase futura | Implementar modal de compartir con enlaces y permisos |
| 24 | Botón Notificaciones (settings) | `components/settings/SettingsHeader.tsx` | Callback sin implementar | Bajo | Bajo | Alto | Dejar para fase futura | Reutilizar sistema de notificaciones cuando esté implementado |
| 25 | "Contactar Soporte" | `components/settings/SupportBanner.tsx` | Callback parcial | Medio | Medio | Bajo | Implementar ahora | Mejorar `mailto:` con formulario de contacto o integrar chat |
| 26 | "Recordar mi sesión" | `components/auth/LoginForm.tsx` | Feature futura | Medio | Bajo | Medio | Dejar para fase futura | Implementar persistencia de sesión con cookies/localStorage |
| 27 | "Login con Google" | `components/auth/LoginForm.tsx` | Feature futura | Alto | Alto | Alto | Dejar para fase futura | Implementar OAuth 2.0 con Google (NextAuth provider) |
| 28 | "Login con Apple" | `components/auth/LoginForm.tsx` | Feature futura | Alto | Alto | Alto | Dejar para fase futura | Implementar OAuth 2.0 con Apple (NextAuth provider) |
| 29 | Enlaces footer (registro) | `components/auth/RegisterFormStep1.tsx` | Navegación faltante | Bajo | Bajo | Bajo | Implementar ahora | Crear páginas `/terminos`, `/privacidad`, `/contacto` o usar enlaces externos |
| 30 | "Ver Detalles" (audiencia) | `components/dashboard/NextHearing.tsx` | Navegación faltante | Medio | Bajo | Medio | Ocultar temporalmente | Comentar hasta implementar feature de casos/audiencias |

---

## 🎯 Plan por Fases

### 📍 FASE 1: Arreglos Críticos para Navegación y Conversión
**Objetivo:** Eliminar puntos de fricción que bloquean conversión y navegación básica  
**Duración estimada:** 1-2 semanas  
**Prioridad:** 🔴 CRÍTICA

#### Tareas:

1. **"Ver Demo" (Hero)**
   - Crear modal con video demo o página `/demo`
   - Esfuerzo: 2-4 horas
   - Archivo: `components/landing/Hero.tsx`

2. **"Hablar con un Asesor" (CTA)**
   - Crear página `/contacto` con formulario básico
   - O integrar chat widget (Intercom/Drift)
   - Esfuerzo: 4-8 horas
   - Archivo: `components/landing/CTA.tsx`, crear `app/contacto/page.tsx`

3. **"Ajustes" en Sidebar**
   - Cambiar `href="#"` a `href="/settings"`
   - Esfuerzo: 5 minutos
   - Archivo: `components/dashboard/DashboardSidebar.tsx`

4. **"Suscripción Premium"**
   - Redirigir a `/settings/billing` o crear modal básico
   - Esfuerzo: 2-4 horas
   - Archivo: `components/dashboard/DashboardSidebar.tsx`

5. **Enlaces Footer (Landing)**
   - Agregar `mailto:` y URLs reales de redes sociales
   - Verificar anclas o crear páginas básicas
   - Esfuerzo: 1-2 horas
   - Archivo: `components/landing/Footer.tsx`

6. **Enlaces Footer (Registro)**
   - Crear páginas `/terminos`, `/privacidad` o usar enlaces externos
   - Esfuerzo: 2-4 horas
   - Archivo: `components/auth/RegisterFormStep1.tsx`

7. **"Contactar Soporte" (Settings)**
   - Mejorar con formulario de contacto o chat
   - Esfuerzo: 2-4 horas
   - Archivo: `components/settings/SupportBanner.tsx`

**Total Fase 1:** ~15-30 horas

---

### 📍 FASE 2: Funcionalidades Core del Producto
**Objetivo:** Implementar features principales que los usuarios esperan  
**Duración estimada:** 3-4 semanas  
**Prioridad:** 🟡 ALTA

#### Tareas:

1. **Ocultar Features No Implementadas**
   - Comentar enlaces a "Casos Activos", "Calendario", "Clientes", "Agendar Cita", "Nuevo Cliente", "Ver Detalles"
   - Agregar comentarios `// TODO: Implementar en fase futura`
   - Esfuerzo: 1 hora
   - Archivos: `DashboardSidebar.tsx`, `QuickActions.tsx`, `NextHearing.tsx`

2. **Sistema de Notificaciones (Base)**
   - Crear componente de dropdown de notificaciones
   - Backend endpoint para notificaciones
   - Esfuerzo: 16-24 horas
   - Archivos: Crear `components/shared/NotificationsDropdown.tsx`, `apps/api/src/routes.notifications.ts`

3. **"Más Opciones" en Tabla de Documentos**
   - Implementar dropdown con opciones: duplicar, eliminar, compartir
   - Esfuerzo: 8-12 horas
   - Archivo: `components/documents/DocumentsTableEnhanced.tsx`

4. **"Compartir" Documento**
   - Modal de compartir con generación de enlaces
   - Sistema de permisos básico
   - Esfuerzo: 12-16 horas
   - Archivo: `components/documents/review/DocumentToolbar.tsx`

5. **"Ayuda" en Sidebar**
   - Crear página `/help` con documentación básica
   - O enlace a documentación externa
   - Esfuerzo: 4-8 horas
   - Archivo: `components/dashboard/DashboardSidebar.tsx`, crear `app/help/page.tsx`

**Total Fase 2:** ~40-60 horas

---

### 📍 FASE 3: Mejoras Secundarias y Features Futuras
**Objetivo:** Implementar funcionalidades avanzadas y mejoras de UX  
**Duración estimada:** 6-8 semanas  
**Prioridad:** 🟢 MEDIA/BAJA

#### Tareas:

1. **Login Social (Google/Apple)**
   - Implementar OAuth 2.0 con NextAuth
   - Configurar providers
   - Esfuerzo: 16-24 horas
   - Archivos: `components/auth/LoginForm.tsx`, `app/api/auth/[...nextauth]/route.ts`

2. **"Recordar mi sesión"**
   - Implementar persistencia de sesión
   - Cookies con expiración extendida
   - Esfuerzo: 4-8 horas
   - Archivo: `components/auth/LoginForm.tsx`, configuración NextAuth

3. **Editor de Documentos con IA**
   - Implementar editor de texto rico (Tiptap/Quill)
   - Integrar "Aplicar Todo", "Aplicar", "Ignorar" cambios
   - Integrar chat con IA para preguntas
   - Esfuerzo: 40-60 horas
   - Archivos: `DocumentToolbar.tsx`, `AIAssistantSidebar.tsx`, `SmartRevisionsSidebar.tsx`

4. **Features de Gestión**
   - Implementar "Casos Activos"
   - Implementar "Calendario"
   - Implementar "Clientes"
   - Esfuerzo: 80-120 horas cada una
   - Archivos: Crear módulos completos

5. **Upload y Procesamiento de PDFs**
   - Feature completa de upload
   - OCR y extracción de texto
   - Esfuerzo: 40-60 horas
   - Archivo: `QuickActions.tsx`, crear módulo de procesamiento

6. **Generación de Informes**
   - Feature completa de informes
   - Dashboard de analytics
   - Esfuerzo: 60-80 horas
   - Archivo: `QuickActions.tsx`, crear módulo de informes

**Total Fase 3:** ~240-360 horas

---

## 📊 Resumen Ejecutivo

### Distribución por Recomendación:
- **Implementar ahora:** 7 elementos (Fase 1)
- **Ocultar temporalmente:** 5 elementos (Fase 2)
- **Dejar para fase futura:** 18 elementos (Fase 3)

### Distribución por Impacto UX:
- **Alto:** 10 elementos
- **Medio:** 15 elementos
- **Bajo:** 5 elementos

### Distribución por Esfuerzo:
- **Bajo:** 8 elementos
- **Medio:** 10 elementos
- **Alto:** 12 elementos

### ROI (Impacto / Esfuerzo) - Top 5:
1. "Ajustes" en Sidebar - ROI: Muy Alto (Alto impacto, 5 minutos)
2. Enlaces Footer - ROI: Alto (Medio impacto, 1-2 horas)
3. "Ver Demo" - ROI: Alto (Alto impacto, 2-4 horas)
4. "Suscripción Premium" - ROI: Alto (Alto impacto, 2-4 horas)
5. "Contactar Soporte" - ROI: Medio-Alto (Medio impacto, 2-4 horas)

---

## ✅ Checklist de Implementación

### Fase 1 - Checklist:
- [ ] Implementar "Ver Demo"
- [ ] Implementar "Hablar con un Asesor"
- [ ] Arreglar "Ajustes" en Sidebar
- [ ] Implementar "Suscripción Premium"
- [ ] Arreglar enlaces Footer (Landing)
- [ ] Arreglar enlaces Footer (Registro)
- [ ] Mejorar "Contactar Soporte"

### Fase 2 - Checklist:
- [ ] Ocultar features no implementadas
- [ ] Sistema de notificaciones (base)
- [ ] "Más Opciones" en tabla
- [ ] "Compartir" documento
- [ ] Página de Ayuda

### Fase 3 - Checklist:
- [ ] Login social (Google/Apple)
- [ ] "Recordar mi sesión"
- [ ] Editor de documentos con IA
- [ ] Features de gestión (Casos, Calendario, Clientes)
- [ ] Upload y procesamiento de PDFs
- [ ] Generación de informes

---

## 📝 Notas de Implementación

### Consideraciones Técnicas:
- **Ocultar elementos:** Usar `display: none` o comentar en JSX con `{/* TODO */}`
- **Estado disabled:** Para botones que no funcionan, usar `disabled={true}` y agregar tooltip explicativo
- **Placeholders:** Crear páginas básicas con mensaje "Próximamente" para features futuras
- **Callbacks:** Implementar handlers básicos que muestren toast/alert explicando que está en desarrollo

### Mejores Prácticas:
- Siempre agregar `aria-label` y `title` a elementos deshabilitados
- Usar `cursor: not-allowed` para elementos no clickeables
- Agregar comentarios `// TODO:` con referencia a issue/ticket
- Documentar decisiones de diseño en comentarios

---

**Última actualización:** Enero 2025  
**Próxima revisión:** Después de completar Fase 1

