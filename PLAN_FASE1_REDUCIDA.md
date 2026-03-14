# 📋 Plan de Implementación - Fase 1 Reducida

**Objetivo:** Eliminar links muertos y mejorar conversión  
**Duración estimada:** 2-4 horas  
**Fecha:** Enero 2025

---

## 📁 Archivos a Modificar

### 1. `apps/web/components/dashboard/DashboardSidebar.tsx`
**Cambios:**
- ✅ Cambiar `href: "#"` a `href: "/settings"` para "Ajustes"
- ✅ Deshabilitar "Casos Activos", "Calendario", "Clientes" con estado disabled y tooltip "Próximamente"
- ✅ Cambiar "Suscripción Premium" de `<button>` a `<Link>` que redirija a `/settings/billing`
- ✅ Deshabilitar "Ayuda" con estado disabled y tooltip "Próximamente"

**Lógica:**
- Links deshabilitados: usar `disabled` class, `cursor-not-allowed`, `opacity-50`
- Agregar tooltip con "Próximamente" o badge
- Mantener estilos visuales pero no clickeables

---

### 2. `apps/web/components/landing/Hero.tsx`
**Cambios:**
- ✅ Implementar "Ver Demo" con modal simple o redirección
- **Solución elegida:** Modal con video embebido de YouTube/Vimeo o mensaje "Demo próximamente"
- **Alternativa simple:** Redirigir a página `/demo` con mensaje explicativo

**Implementación:**
- Crear estado para modal
- Botón abre modal con video o mensaje
- Cerrar modal con X o click fuera

---

### 3. `apps/web/components/landing/CTA.tsx`
**Cambios:**
- ✅ Implementar "Hablar con un Asesor"
- **Solución elegida:** Redirigir a `/contacto` o abrir modal con formulario básico
- **Alternativa simple:** `mailto:` con email prellenado

**Implementación:**
- Crear página `/contacto` básica con formulario
- O modal con formulario de contacto
- Campos: nombre, email, mensaje

---

### 4. `apps/web/components/landing/Footer.tsx`
**Cambios:**
- ✅ Enlaces de redes sociales: cambiar `href="#"` a `mailto:` y URL real
- ✅ Enlaces de anclas: verificar si existen IDs en landing o crear páginas básicas
- **Solución:** Para anclas que no existen, crear páginas básicas o usar scroll suave a secciones existentes

**Enlaces a arreglar:**
- Email: `mailto:soporte@legaltech.ar` (o email real)
- Website: `https://legaltech.ar` (o URL real)
- Anclas: `#funciones`, `#precios`, `#plantillas`, `#api`, `#sobre-nosotros`, `#blog`, `#carreras`, `#contacto`, `#privacidad`, `#terminos`, `#cookies`

---

### 5. `apps/web/components/dashboard/QuickActions.tsx`
**Cambios:**
- ✅ Deshabilitar todos los links muertos
- ✅ Agregar estado disabled con tooltip "Próximamente"
- ✅ Cambiar de `<Link>` a `<div>` o mantener Link pero con `disabled` y `onClick` que previene default

**Acciones a deshabilitar:**
- "Subir PDF"
- "Nuevo Cliente"
- "Agendar Cita"
- "Informes"

---

### 6. `apps/web/components/settings/SupportBanner.tsx`
**Cambios:**
- ✅ Mejorar callback `onContactSupport`
- **Solución:** Si no hay callback, usar `mailto:` por defecto
- O crear página `/contacto` y redirigir

**Implementación:**
- Verificar si `onContactSupport` existe
- Si no existe, usar `window.location.href = 'mailto:soporte@legaltech.ar'`
- O redirigir a `/contacto`

---

### 7. `apps/web/components/auth/RegisterFormStep1.tsx`
**Cambios:**
- ✅ Arreglar enlaces del footer: `#terminos`, `#privacidad`, `#contacto`
- **Solución:** Crear páginas básicas `/terminos`, `/privacidad`, `/contacto`
- O usar enlaces externos si existen

---

## 🆕 Archivos a Crear (Opcional)

### 8. `apps/web/app/contacto/page.tsx` (Nuevo)
**Si se elige crear página de contacto:**
- Formulario básico con campos: nombre, email, mensaje
- Envío a email o backend endpoint
- Diseño consistente con el resto de la app

### 9. `apps/web/app/terminos/page.tsx` (Nuevo)
**Página básica de términos:**
- Contenido placeholder o real
- Diseño simple y profesional

### 10. `apps/web/app/privacidad/page.tsx` (Nuevo)
**Página básica de privacidad:**
- Contenido placeholder o real
- Diseño simple y profesional

### 11. `apps/web/app/demo/page.tsx` (Opcional - si se elige redirección)
**Página de demo:**
- Mensaje "Demo próximamente" o video embebido
- Diseño atractivo

---

## 🎯 Estrategia de Implementación

### Opción A: Solución Mínima (Más Rápida)
- **"Ver Demo":** Modal con mensaje "Demo próximamente" + video placeholder
- **"Hablar con un Asesor":** `mailto:` con email prellenado
- **Enlaces footer:** `mailto:` y URLs reales, anclas a secciones existentes o páginas básicas
- **"Contactar Soporte":** `mailto:` por defecto
- **Enlaces registro:** Crear páginas básicas `/terminos`, `/privacidad`, `/contacto`

### Opción B: Solución Mejorada (Más Completa)
- **"Ver Demo":** Modal con video real embebido
- **"Hablar con un Asesor":** Página `/contacto` con formulario funcional
- **Enlaces footer:** Páginas dedicadas para cada sección
- **"Contactar Soporte":** Redirigir a `/contacto` o formulario en modal
- **Enlaces registro:** Páginas completas con contenido real

**Recomendación:** Opción A para Fase 1, luego mejorar en Fase 2

---

## ✅ Checklist de Implementación

### Prioridad 1 (Crítico - Navegación):
- [ ] Cambiar "Ajustes" a `/settings` en DashboardSidebar
- [ ] Deshabilitar "Casos Activos", "Calendario", "Clientes" en DashboardSidebar
- [ ] Deshabilitar "Ayuda" en DashboardSidebar
- [ ] Deshabilitar todas las QuickActions
- [ ] Cambiar "Suscripción Premium" a link a `/settings/billing`

### Prioridad 2 (Conversión):
- [ ] Implementar "Ver Demo" (modal o página)
- [ ] Implementar "Hablar con un Asesor" (mailto o página)
- [ ] Arreglar enlaces de redes sociales en Footer
- [ ] Arreglar anclas del Footer (verificar IDs o crear páginas)
- [ ] Arreglar enlaces del footer de registro

### Prioridad 3 (Mejoras):
- [ ] Mejorar "Contactar Soporte" con solución funcional
- [ ] Crear páginas básicas si es necesario (`/terminos`, `/privacidad`, `/contacto`)

---

## 📝 Notas Técnicas

### Para Links Deshabilitados:
```tsx
// Opción 1: Div con estilos disabled
<div className="... opacity-50 cursor-not-allowed" title="Próximamente">
  <Icon />
  <span>Label</span>
</div>

// Opción 2: Link con onClick preventDefault
<Link 
  href="#" 
  onClick={(e) => e.preventDefault()}
  className="... opacity-50 cursor-not-allowed"
  title="Próximamente"
>
  <Icon />
  <span>Label</span>
</Link>
```

### Para Modales:
- Usar estado local con `useState`
- Componente modal reutilizable o inline
- Cerrar con X, click fuera, o ESC

### Para Formularios:
- Usar `react-hook-form` si ya está en el proyecto
- Validación básica con Zod
- Envío a endpoint o `mailto:`

---

## 🚀 Orden de Ejecución

1. **DashboardSidebar** - Arreglos de navegación (15 min)
2. **QuickActions** - Deshabilitar links (10 min)
3. **Hero** - "Ver Demo" (20-30 min)
4. **CTA** - "Hablar con un Asesor" (20-30 min)
5. **Footer (Landing)** - Enlaces (15 min)
6. **RegisterFormStep1** - Footer enlaces (10 min)
7. **SupportBanner** - Contactar Soporte (10 min)
8. **Páginas nuevas** (si se crean) - 30-60 min

**Total estimado:** 2-3 horas

---

## 🎨 Consideraciones de Diseño

- **Estados disabled:** Usar `opacity-50`, `cursor-not-allowed`, mantener colores pero más tenues
- **Tooltips:** Agregar `title` attribute o componente tooltip
- **Badges "Próximamente":** Opcional, pequeño badge en esquina del botón
- **Consistencia:** Mantener estilos existentes, solo cambiar funcionalidad

---

**Listo para implementación** ✅

