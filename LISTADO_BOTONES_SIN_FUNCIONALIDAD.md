# Listado de Botones y Enlaces Sin Funcionalidad

## 📋 Resumen
Este documento lista todos los botones, enlaces y elementos clickeables que actualmente no tienen funcionalidad implementada o apuntan a `#` (placeholders).

---

## 🏠 Landing Page

### 1. **Navbar** (`components/landing/Navbar.tsx`)
- ✅ **Navegación de anclas** - Funciona (scroll a secciones)
- ✅ **Iniciar Sesión** - Funciona (`/auth/login`)
- ✅ **Probar Gratis** - Funciona (`/auth/register`)

### 2. **Hero** (`components/landing/Hero.tsx`)
- ❌ **"Ver Demo"** - Botón sin funcionalidad
  - Ubicación: Botón secundario junto a "Comenzar Ahora"
  - Acción actual: Ninguna
  - Sugerencia: Abrir modal de video demo o redirigir a página de demo

### 3. **CTA** (`components/landing/CTA.tsx`)
- ✅ **"Empezar Prueba Gratuita"** - Funciona (`/auth/register`)
- ❌ **"Hablar con un Asesor"** - Botón sin funcionalidad
  - Ubicación: Sección CTA final
  - Acción actual: Ninguna
  - Sugerencia: Abrir formulario de contacto o redirigir a `/contacto`

### 4. **Footer** (`components/landing/Footer.tsx`)
- ❌ **Enlaces de redes sociales** (Email, Website) - `href="#"` 
  - Ubicación: Footer, sección de branding
  - Acción actual: No hace nada
  - Sugerencia: Agregar URLs reales o `mailto:` y `https://`
- ❌ **Todos los enlaces del footer** - Apuntan a `#funciones`, `#precios`, etc.
  - Ubicación: Footer, secciones Producto, Compañía, Legal
  - Acción actual: Scroll a anclas (funciona si existen las secciones)
  - Nota: Verificar que las secciones con esos IDs existan en la página

---

## 📊 Dashboard

### 5. **DashboardSidebar** (`components/dashboard/DashboardSidebar.tsx`)
- ✅ **Panel de Control** - Funciona (`/dashboard`)
- ✅ **Documentos** - Funciona (`/documents`)
- ❌ **"Casos Activos"** - `href="#"` 
  - Ubicación: Sidebar, navegación principal
  - Acción actual: No hace nada
  - Sugerencia: Crear página `/cases` o deshabilitar temporalmente
- ❌ **"Calendario"** - `href="#"` 
  - Ubicación: Sidebar, navegación principal
  - Acción actual: No hace nada
  - Sugerencia: Crear página `/calendar` o deshabilitar temporalmente
- ❌ **"Clientes"** - `href="#"` 
  - Ubicación: Sidebar, navegación principal
  - Acción actual: No hace nada
  - Sugerencia: Crear página `/clients` o deshabilitar temporalmente
- ❌ **"Ajustes"** - `href="#"` 
  - Ubicación: Sidebar, sección Configuración
  - Acción actual: No hace nada
  - Sugerencia: Cambiar a `/settings`
- ❌ **"Ayuda"** - `href="#"` 
  - Ubicación: Sidebar, sección Configuración
  - Acción actual: No hace nada
  - Sugerencia: Crear página `/help` o enlace a documentación
- ❌ **"Suscripción Premium"** - Botón sin funcionalidad
  - Ubicación: Sidebar, parte inferior
  - Acción actual: No hace nada
  - Sugerencia: Redirigir a `/settings/billing` o abrir modal de suscripción

### 6. **DashboardHeader** (`components/dashboard/DashboardHeader.tsx`)
- ✅ **Búsqueda** - Funciona (callback `onSearch`)
- ❌ **Botón de Notificaciones** - Sin funcionalidad
  - Ubicación: Header, lado derecho
  - Acción actual: No hace nada
  - Sugerencia: Abrir dropdown de notificaciones
- ✅ **Perfil de Usuario** - Funciona (`/profile`)

### 7. **QuickActions** (`components/dashboard/QuickActions.tsx`)
- ❌ **"Subir PDF"** - `href="#"` 
  - Ubicación: Dashboard, tarjeta de acciones rápidas
  - Acción actual: No hace nada
  - Sugerencia: Abrir modal de upload o redirigir a página de upload
- ❌ **"Nuevo Cliente"** - `href="#"` 
  - Ubicación: Dashboard, tarjeta de acciones rápidas
  - Acción actual: No hace nada
  - Sugerencia: Crear página `/clients/new` o abrir modal
- ❌ **"Agendar Cita"** - `href="#"` 
  - Ubicación: Dashboard, tarjeta de acciones rápidas
  - Acción actual: No hace nada
  - Sugerencia: Crear página `/calendar/new` o abrir modal
- ❌ **"Informes"** - `href="#"` 
  - Ubicación: Dashboard, tarjeta de acciones rápidas
  - Acción actual: No hace nada
  - Sugerencia: Crear página `/reports` o abrir modal

---

## 📄 Documentos

### 8. **DocumentsTableEnhanced** (`components/documents/DocumentsTableEnhanced.tsx`)
- ✅ **Ver PDF** - Funciona (callback `onPreview`)
- ✅ **Descargar PDF** - Funciona (`handleDownload`)
- ✅ **Editar** - Funciona (callback `onEdit`)
- ❌ **"Más opciones"** (MoreVertical) - Sin funcionalidad
  - Ubicación: Tabla de documentos, columna Acciones
  - Acción actual: No hace nada
  - Sugerencia: Abrir dropdown con opciones adicionales (duplicar, eliminar, compartir)

### 9. **DocumentReviewHeader** (`components/documents/review/DocumentReviewHeader.tsx`)
- ✅ **"Finalizar y Descargar"** - Funciona (callback `onFinalize`)
- ❌ **Botón de Notificaciones** - Sin funcionalidad
  - Ubicación: Header de revisión
  - Acción actual: No hace nada
  - Sugerencia: Abrir dropdown de notificaciones
- ✅ **Perfil de Usuario** - Funciona (link a perfil)

### 10. **AIAssistantSidebar** (`components/documents/review/AIAssistantSidebar.tsx`)
- ✅ **Tabs de navegación** - Funciona (cambia tabs internamente)
- ❌ **"Aplicar Todo"** - Callback opcional, puede no estar implementado
  - Ubicación: Sidebar de asistente AI, parte inferior
  - Acción actual: Solo funciona si se pasa `onApplyAll`
  - Nota: En `page.tsx` tiene `handleApplyAll` que solo hace `console.log`
  - Sugerencia: Implementar lógica real de aplicación de sugerencias

### 11. **SmartRevisionsSidebar** (`components/documents/review/SmartRevisionsSidebar.tsx`)
- ❌ **"Aplicar"** (cambios sugeridos) - Callback opcional
  - Ubicación: Sidebar de revisiones, cada cambio sugerido
  - Acción actual: Solo funciona si se pasa `onApplyChange`
  - Nota: En `page.tsx` tiene `handleApplyChange` que solo hace `console.log`
  - Sugerencia: Implementar lógica real de aplicación de cambios
- ❌ **"Ignorar"** (cambios sugeridos) - Callback opcional
  - Ubicación: Sidebar de revisiones, cada cambio sugerido
  - Acción actual: Solo funciona si se pasa `onIgnoreChange`
  - Nota: En `page.tsx` tiene `handleIgnoreChange` que solo hace `console.log`
  - Sugerencia: Implementar lógica real de ignorar cambios
- ❌ **Enviar pregunta a IA** - Callback opcional
  - Ubicación: Sidebar de revisiones, input de texto
  - Acción actual: Solo funciona si se pasa `onAskAI`
  - Nota: En `page.tsx` tiene `handleAskAI` que solo hace `console.log`
  - Sugerencia: Implementar integración real con API de IA

### 12. **DocumentToolbar** (`components/documents/review/DocumentToolbar.tsx`)
- ❌ **Botones de formato** (Bold, Italic, etc.) - Sin funcionalidad
  - Ubicación: Toolbar del editor de documentos
  - Acción actual: No hacen nada
  - Sugerencia: Implementar editor de texto rico o deshabilitar temporalmente
- ❌ **"Compartir"** - Sin funcionalidad
  - Ubicación: Toolbar del editor
  - Acción actual: No hace nada
  - Sugerencia: Abrir modal de compartir o implementar funcionalidad

---

## ⚙️ Settings

### 13. **SettingsHeader** (`components/settings/SettingsHeader.tsx`)
- ❌ **Botón de Notificaciones** - Sin funcionalidad
  - Ubicación: Header de settings
  - Acción actual: No hace nada
  - Sugerencia: Abrir dropdown de notificaciones
- ✅ **Perfil de Usuario** - Funciona (`/profile`)

### 14. **SupportBanner** (`components/settings/SupportBanner.tsx`)
- ❌ **"Contactar Soporte"** - Callback opcional
  - Ubicación: Banner de ayuda en settings
  - Acción actual: Solo abre `mailto:` si se pasa `onContactSupport`
  - Nota: En `page.tsx` tiene implementación básica con `mailto:`
  - Sugerencia: Mejorar con formulario de contacto o chat

---

## 🔐 Auth

### 15. **LoginForm** (`components/auth/LoginForm.tsx`)
- ✅ **"Iniciar Sesión"** - Funciona (submit del formulario)
- ❌ **"Recordar mi sesión"** - Checkbox sin funcionalidad
  - Ubicación: Formulario de login
  - Acción actual: No persiste la preferencia
  - Sugerencia: Implementar persistencia de sesión
- ❌ **"Login con Google"** - Sin funcionalidad
  - Ubicación: Botones de login social
  - Acción actual: Muestra mensaje "aún no está disponible"
  - Sugerencia: Implementar OAuth con Google
- ❌ **"Login con Apple"** - Sin funcionalidad
  - Ubicación: Botones de login social
  - Acción actual: Muestra mensaje "aún no está disponible"
  - Sugerencia: Implementar OAuth con Apple

### 16. **RegisterFormStep1** (`components/auth/RegisterFormStep1.tsx`)
- ✅ **"Continuar al siguiente paso"** - Funciona (submit del formulario)
- ❌ **Enlaces del footer** (Términos, Privacidad, Contacto) - `href="#terminos"`, etc.
  - Ubicación: Footer del formulario de registro
  - Acción actual: No hacen nada (anclas que no existen)
  - Sugerencia: Crear páginas reales o usar enlaces externos

---

## 📝 Otros

### 17. **Features** (`components/landing/Features.tsx`)
- ✅ **"Explorar todas las funciones"** - Funciona (scroll a `#funciones`)

### 18. **NextHearing** (`components/dashboard/NextHearing.tsx`)
- ❌ **"Ver Detalles"** - Sin funcionalidad
  - Ubicación: Tarjeta de próxima audiencia
  - Acción actual: No hace nada
  - Sugerencia: Redirigir a página de detalles del caso

---

## 📊 Estadísticas

### Total de elementos sin funcionalidad: **~30**

**Por categoría:**
- Landing Page: 4
- Dashboard: 8
- Documentos: 6
- Settings: 2
- Auth: 5
- Otros: 2
- Footer/Enlaces generales: 3+

---

## 🎯 Prioridades de Implementación

### Alta Prioridad (UX crítica):
1. **"Ver Demo"** en Hero - Primera impresión importante
2. **"Hablar con un Asesor"** en CTA - Conversión
3. **Navegación del Sidebar** (Casos, Calendario, Clientes) - Navegación principal
4. **"Suscripción Premium"** - Monetización
5. **Botones de login social** - Si se planea usar

### Media Prioridad (Funcionalidad importante):
6. **Quick Actions** del Dashboard - Accesos rápidos
7. **Funcionalidades de revisión de documentos** (Aplicar cambios, preguntar a IA)
8. **Botones de notificaciones** - Comunicación con usuarios
9. **"Recordar mi sesión"** - UX de login

### Baja Prioridad (Mejoras):
10. **Enlaces del footer** - Información legal/empresa
11. **Toolbar del editor** - Si no se usa editor rico
12. **Enlaces de redes sociales** - Marketing

---

## 📝 Notas

- Los elementos marcados con ✅ tienen funcionalidad completa
- Los elementos marcados con ❌ necesitan implementación
- Algunos callbacks son opcionales y pueden no estar pasados desde el componente padre
- Los enlaces a `#` pueden funcionar si las secciones con esos IDs existen en la página

