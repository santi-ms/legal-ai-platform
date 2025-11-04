# Checklist de QA - Sistema de Autenticación

## ✅ Pruebas de Registro

### Registro Exitoso

- [ ] Completar formulario con datos válidos
  - Nombre: "Juan Pérez"
  - Email: "juan@example.com"
  - Contraseña: "Password123" (≥ 8 chars, 1 letra, 1 número)
  - Nombre de empresa: "Mi Empresa SRL"
- [ ] Verificar mensaje de éxito: "Revisa tu email para verificar tu cuenta"
- [ ] Verificar que usuario se crea en BD con `emailVerified: null`
- [ ] Verificar que se genera `VerificationToken` en BD
- [ ] Verificar que se envía email de verificación
- [ ] Verificar link en email apunta a `/auth/verify-email?token=...`

### Validaciones de Formulario

- [ ] Email inválido muestra error
- [ ] Contraseña < 8 caracteres muestra error
- [ ] Contraseña sin letras muestra error
- [ ] Contraseña sin números muestra error
- [ ] Campos vacíos muestran errores
- [ ] Email duplicado muestra error apropiado

### Rate Limiting

- [ ] Intentar 6 registros en < 5 minutos desde la misma IP
- [ ] Verificar que el 6º intento devuelve 429 (Too Many Requests)
- [ ] Verificar mensaje: "Demasiados intentos. Por favor espera 5 minutos."

## ✅ Pruebas de Verificación de Email

### Verificación Exitosa

- [ ] Hacer clic en link de verificación del email
- [ ] Verificar que usuario es redirigido a `/auth/verify-email?token=...`
- [ ] Verificar que `emailVerified` se actualiza en BD
- [ ] Verificar que `VerificationToken` se elimina de BD
- [ ] Verificar mensaje de éxito: "Email verificado exitosamente"
- [ ] Verificar CTA a login funciona

### Errores de Verificación

- [ ] Token inválido muestra error apropiado
- [ ] Token expirado (> 24h) muestra error apropiado
- [ ] Token ya usado muestra error apropiado
- [ ] Token vacío muestra error apropiado

## ✅ Pruebas de Login

### Login Exitoso (Email Verificado)

- [ ] Completar formulario con credenciales válidas de usuario verificado
- [ ] Verificar que se crea sesión JWT
- [ ] Verificar que cookie de sesión se establece (sin maxAge)
- [ ] Verificar que usuario es redirigido a `/documents`
- [ ] Verificar que `useAuth()` devuelve datos correctos (`id`, `email`, `name`, `role`, `tenantId`)

### Login con Email No Verificado

- [ ] Intentar login con usuario no verificado
- [ ] Verificar error 403: "Debes verificar tu email antes de iniciar sesión"
- [ ] Verificar mensaje claro en UI

### Credenciales Inválidas

- [ ] Email incorrecto muestra error
- [ ] Contraseña incorrecta muestra error
- [ ] Email vacío muestra error
- [ ] Contraseña vacía muestra error

### Rate Limiting

- [ ] Intentar 6 logins fallidos en < 5 minutos desde la misma IP
- [ ] Verificar que el 6º intento devuelve 429
- [ ] Verificar mensaje: "Demasiados intentos. Por favor espera 5 minutos."

## ✅ Pruebas de Reset de Contraseña

### Request Reset Exitoso

- [ ] Completar formulario en `/auth/reset` con email válido
- [ ] Verificar mensaje: "Revisa tu email para resetear tu contraseña"
- [ ] Verificar que se genera `VerificationToken` (tipo "reset")
- [ ] Verificar que se envía email con link `/auth/reset/[token]`
- [ ] Verificar expiración de token (1 hora)

### Confirm Reset Exitoso

- [ ] Hacer clic en link de reset del email
- [ ] Verificar que usuario es redirigido a `/auth/reset/[token]`
- [ ] Completar formulario con nueva contraseña válida
- [ ] Verificar que `passwordHash` se actualiza en BD
- [ ] Verificar que `VerificationToken` se elimina
- [ ] Verificar mensaje: "Contraseña actualizada exitosamente"
- [ ] Verificar CTA a login funciona
- [ ] Verificar que login con nueva contraseña funciona

### Errores de Reset

- [ ] Token inválido muestra error
- [ ] Token expirado (> 1h) muestra error
- [ ] Token ya usado muestra error
- [ ] Contraseña nueva no cumple requisitos muestra error
- [ ] Confirmación de contraseña no coincide muestra error

### Rate Limiting

- [ ] Intentar 6 requests de reset en < 5 minutos desde la misma IP
- [ ] Verificar que el 6º intento devuelve 429

## ✅ Pruebas de Sesión y JWT

### Expiración de JWT

- [ ] Iniciar sesión
- [ ] Esperar 2 horas (o modificar `maxAge` temporalmente para pruebas)
- [ ] Intentar acceder a ruta protegida (`/documents`)
- [ ] Verificar que se redirige a `/auth/login`
- [ ] Verificar error 401 en llamadas API

### Cookie de Sesión (No Persistente)

- [ ] Iniciar sesión
- [ ] Verificar que cookie no tiene `maxAge` o `expires`
- [ ] Cerrar navegador completamente
- [ ] Abrir navegador nuevamente
- [ ] Intentar acceder a ruta protegida
- [ ] Verificar que se redirige a `/auth/login` (cookie eliminada)

### Refresh de JWT

- [ ] Iniciar sesión
- [ ] Realizar actividad cada < 10 minutos durante 2+ horas
- [ ] Verificar que sesión permanece activa
- [ ] Verificar que JWT se refresca automáticamente

### Datos en Sesión

- [ ] Verificar que `session.user` contiene:
  - `id` (string)
  - `email` (string)
  - `name` (string | null)
  - `role` (string: "owner" | "admin" | "editor" | "viewer")
  - `tenantId` (string)

## ✅ Pruebas de Inactividad

### Logout por Inactividad

- [ ] Iniciar sesión
- [ ] No realizar actividad durante 30 minutos (o tiempo configurado)
- [ ] Verificar que se cierra sesión automáticamente
- [ ] Verificar redirección a `/auth/login`
- [ ] Verificar mensaje en consola: "🔒 Sesión cerrada por inactividad"

### Eventos que Resetean Timer

- [ ] Iniciar sesión
- [ ] Realizar actividad (movimiento de mouse, tecla, click, scroll, touch)
- [ ] Verificar que timer se resetea
- [ ] Verificar que sesión permanece activa

### Configuración por Env

- [ ] Establecer `NEXT_PUBLIC_INACTIVITY_MINUTES=15`
- [ ] Verificar que logout ocurre después de 15 minutos

## ✅ Pruebas de Middleware y Rutas Protegidas

### Protección de Rutas

- [ ] Intentar acceder a `/dashboard` sin sesión → redirige a `/auth/login`
- [ ] Intentar acceder a `/documents` sin sesión → redirige a `/auth/login`
- [ ] Acceder a rutas protegidas con sesión válida → permite acceso

### Redirección Post-Login

- [ ] Intentar acceder a `/documents` sin sesión
- [ ] Iniciar sesión
- [ ] Verificar que se redirige a `/documents` (no a página por defecto)

## ✅ Pruebas de Multi-Tenant y Roles

### Hook useAuth()

- [ ] Verificar que `useAuth()` devuelve:
  - `user` (objeto con datos completos)
  - `tenantId` (string)
  - `role` (string)
  - `isAuthenticated` (boolean)
  - `isLoading` (boolean)
  - `isAdmin` (boolean: true si role === "admin" || "owner")
  - `isOwner` (boolean: true si role === "owner")

### Filtrado por Tenant

- [ ] Crear documentos desde diferentes tenants
- [ ] Verificar que usuarios solo ven documentos de su `tenantId`

## ✅ Pruebas de Email

### Plantillas de Email

- [ ] Verificar que email de verificación tiene:
  - HTML bien formateado
  - Link funcional
  - Texto alternativo

- [ ] Verificar que email de reset tiene:
  - HTML bien formateado
  - Link funcional
  - Texto alternativo

### Configuración de Email

- [ ] Verificar que emails se envían desde `EMAIL_FROM`
- [ ] Verificar que emails llegan correctamente
- [ ] Verificar que links en emails usan `FRONTEND_URL` correcto

## ✅ Pruebas de Seguridad

### Bcrypt Hashing

- [ ] Verificar que `passwordHash` en BD es hash bcrypt (no texto plano)
- [ ] Verificar que login compara hash correctamente

### CSRF Protection

- [ ] Verificar que cookies tienen `sameSite: 'lax'`
- [ ] Verificar que cookies tienen `httpOnly: true`

### HTTPS en Producción

- [ ] Verificar que cookies tienen `secure: true` en producción
- [ ] Verificar que cookies tienen nombres `__Secure-` en producción

## ✅ Pruebas de Frontend (UI/UX)

### Formularios con React Hook Form y Zod

#### Registro (`/auth/register`)
- [ ] Validación en tiempo real: errores aparecen mientras se escribe
- [ ] Email inválido muestra error debajo del input
- [ ] Contraseña < 8 caracteres muestra error
- [ ] Contraseña sin letras muestra error específico
- [ ] Contraseña sin números muestra error específico
- [ ] Confirmación de contraseña no coincide muestra error
- [ ] Todos los campos requeridos validan correctamente
- [ ] Mensajes de error son claros y descriptivos
- [ ] Botón de submit está deshabilitado durante loading
- [ ] Redirección a `/auth/verify-email?sent=1` después de registro exitoso

#### Login (`/auth/login`)
- [ ] Validación de email y password
- [ ] Errores aparecen debajo de cada input
- [ ] Link "¿Olvidaste tu contraseña?" redirige a `/auth/reset`
- [ ] Banner de "Email verificado" aparece cuando `?verified=1`
- [ ] Mensaje de error claro para credenciales inválidas
- [ ] Mensaje de error claro para email no verificado
- [ ] Redirección a `/documents` después de login exitoso
- [ ] Toast de éxito muestra "Sesión iniciada exitosamente"

#### Reset Request (`/auth/reset`)
- [ ] Validación de email
- [ ] Mensaje genérico después de enviar (no revela si email existe)
- [ ] Página de éxito muestra instrucciones claras
- [ ] CTA "Volver al inicio de sesión" funciona
- [ ] Link a login funciona

#### Reset Confirm (`/auth/reset/[token]`)
- [ ] Token se obtiene correctamente de la URL
- [ ] Validación de contraseña (mínimo 8, letra, número)
- [ ] Validación de confirmación de contraseña
- [ ] Errores se muestran debajo de cada input
- [ ] Mensaje de error para token inválido/expirado
- [ ] Redirección a `/auth/login` después de éxito
- [ ] Toast de éxito muestra "Contraseña actualizada exitosamente"

#### Verify Email (`/auth/verify-email`)
- [ ] Página muestra instrucciones cuando `?sent=1`
- [ ] Verificación automática cuando hay `?token=...`
- [ ] Estado de "Verificando..." se muestra durante la verificación
- [ ] Mensaje de éxito y redirección a login con `?verified=1`
- [ ] Mensaje de error claro para token inválido/expirado
- [ ] CTAs funcionan correctamente

### Validaciones Zod en Frontend

- [ ] Validaciones se ejecutan antes de enviar al backend
- [ ] Errores de validación son específicos por campo
- [ ] Mensajes de error coinciden con los schemas Zod
- [ ] Validaciones no bloquean la interfaz

### Redirecciones y Flujo de Usuario

- [ ] Registro → `/auth/verify-email?sent=1`
- [ ] Click en link de verificación → `/auth/verify-email?token=...` → `/auth/login?verified=1`
- [ ] Login exitoso → `/documents`
- [ ] Reset request → página de éxito → `/auth/login`
- [ ] Reset confirm → `/auth/login`
- [ ] Rutas protegidas sin sesión → `/auth/login`
- [ ] Rutas de auth (`/auth/*`) no requieren sesión

### Accesibilidad

- [ ] Inputs tienen `aria-invalid` cuando hay errores
- [ ] Inputs tienen `aria-describedby` apuntando a mensajes de error
- [ ] Mensajes de error tienen `role="alert"`
- [ ] Botones tienen `aria-label` cuando es necesario
- [ ] Navegación por teclado funciona correctamente
- [ ] Focus visible en todos los elementos interactivos

### Toast Notifications

- [ ] Toasts aparecen en éxito/error
- [ ] Toasts tienen el color apropiado (verde para éxito, rojo para error)
- [ ] Toasts desaparecen automáticamente
- [ ] Mensajes de toast son claros y concisos

### Estados de Carga

- [ ] Botones muestran spinner durante loading
- [ ] Botones están deshabilitados durante loading
- [ ] Formularios no se pueden enviar múltiples veces
- [ ] Feedback visual claro durante operaciones asíncronas

## 📝 Notas para QA

### Comandos Útiles

```bash
# Verificar usuario en BD
npx prisma studio

# Ver logs de API
railway logs --service api

# Ver logs de Vercel
vercel logs
```

### Datos de Prueba

- **Usuario de prueba**: `test@example.com`
- **Contraseña**: `Test123456`
- **Tenant**: Se crea automáticamente

### Ambientes

- **Local**: `http://localhost:3000`
- **Producción**: URL de Vercel
- **API**: URL de Railway

---

**Última actualización**: Fecha de implementación
**Tester**: ________________
**Estado**: ⬜ Pendiente | ✅ Aprobado | ❌ Rechazado
