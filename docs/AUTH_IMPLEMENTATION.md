# Sistema de Autenticación - Implementación Completa

## 📋 Resumen

Sistema de autenticación robusto con verificación de email, reset de contraseña, JWT con expiración, cookies no persistentes y logout por inactividad.

## ✅ Funcionalidades Implementadas

### Backend (apps/api)

- ✅ Registro con verificación de email
- ✅ Login con validación de email verificado
- ✅ Reset de contraseña (request + confirm)
- ✅ Rate limiting (5 req / 5 min por IP)
- ✅ Validación con Zod
- ✅ Servicio de email con nodemailer
- ✅ Respuestas homogéneas `{ ok, message, data?, fieldErrors? }`

### Frontend (apps/web)

- ✅ NextAuth configurado con JWT (2 horas)
- ✅ Cookies de sesión no persistentes
- ✅ Middleware de protección de rutas
- ✅ Hook `useAuth()` para acceso a datos de usuario
- ✅ Componente `InactivityLogout` (30 min por defecto)
- ✅ Schemas Zod para validación de formularios

### Base de Datos

- ✅ Modelo User actualizado: `passwordHash`, `emailVerified`
- ✅ VerificationToken para verificación y reset
- ✅ Migraciones preparadas

## 🔧 Cambios en Prisma Schema

### Modelo User

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String?
  passwordHash  String   // Cambiado de password
  role          String
  emailVerified DateTime? // Nuevo campo
  tenantId      String
  // ... resto de campos
  updatedAt     DateTime @updatedAt // Nuevo campo
}
```

## 📝 Migración de Base de Datos

### Paso 1: Renombrar campo password

⚠️ **IMPORTANTE**: Antes de ejecutar la migración, necesitas migrar los datos existentes.

```bash
cd packages/db

# Crear migración
npx prisma migrate dev --name add_email_verification

# O si prefieres hacerlo manualmente:
# 1. Renombrar columna password -> passwordHash
# 2. Agregar columna emailVerified (nullable)
# 3. Agregar columna updatedAt (nullable, luego NOT NULL)
```

### Script SQL Manual (si es necesario)

```sql
-- Renombrar password a passwordHash
ALTER TABLE "User" RENAME COLUMN "password" TO "passwordHash";

-- Agregar emailVerified
ALTER TABLE "User" ADD COLUMN "emailVerified" TIMESTAMP;

-- Agregar updatedAt
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP DEFAULT NOW();
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET NOT NULL;
```

## 🔐 Variables de Entorno

### Backend (apps/api/.env)

```env
# Database
DATABASE_URL="postgresql://..."

# Email (Nodemailer)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=tu-email@gmail.com
EMAIL_SERVER_PASSWORD=tu-app-password
EMAIL_FROM="Legal AI <noreply@tu-dominio.com>"

# Frontend URL (para links en emails)
FRONTEND_URL=http://localhost:3000
```

### Frontend (apps/web/.env)

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-aqui

# API URL
NEXT_PUBLIC_API_URL=http://localhost:4001

# Inactividad (opcional, default 30 min)
NEXT_PUBLIC_INACTIVITY_MINUTES=30
```

## 📍 Endpoints API

### POST /api/register

Registra un nuevo usuario y envía email de verificación.

**Request:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "Password123",
  "companyName": "Mi Empresa SRL"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Usuario creado exitosamente. Revisa tu email para verificar tu cuenta.",
  "data": {
    "userId": "...",
    "email": "juan@example.com"
  }
}
```

### GET /api/auth/verify-email?token=...

Verifica el email del usuario con el token recibido.

**Response (200):**
```json
{
  "ok": true,
  "message": "Email verificado exitosamente",
  "data": {
    "email": "juan@example.com"
  }
}
```

### POST /api/auth/login

Inicia sesión (requiere email verificado).

**Request:**
```json
{
  "email": "juan@example.com",
  "password": "Password123"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Login exitoso",
  "data": {
    "id": "...",
    "email": "juan@example.com",
    "name": "Juan Pérez",
    "role": "owner",
    "tenantId": "..."
  }
}
```

**Response (403) - Email no verificado:**
```json
{
  "ok": false,
  "message": "Debes verificar tu email antes de iniciar sesión",
  "error": "email_not_verified"
}
```

### POST /api/auth/reset/request

Solicita reset de contraseña (envía email con token).

**Request:**
```json
{
  "email": "juan@example.com"
}
```

### POST /api/auth/reset/confirm

Confirma reset de contraseña con token.

**Request:**
```json
{
  "token": "...",
  "password": "NewPassword123"
}
```

## 🎨 Flujo de Usuario

### 1. Registro

1. Usuario completa formulario en `/auth/register`
2. Sistema crea usuario con `emailVerified: null`
3. Sistema genera token de verificación (24h expiración)
4. Sistema envía email con link `/auth/verify-email?token=...`
5. Usuario hace clic en link o visita la URL
6. Sistema marca `emailVerified: new Date()`
7. Usuario puede iniciar sesión

### 2. Login

1. Usuario completa formulario en `/auth/login`
2. Sistema valida credenciales
3. Sistema verifica que `emailVerified !== null`
4. Si no está verificado → error 403
5. Si está verificado → NextAuth crea JWT (2h expiración)
6. Cookie de sesión se establece (sin maxAge → se elimina al cerrar navegador)
7. Usuario es redirigido a `/documents`

### 3. Reset de Contraseña

1. Usuario visita `/auth/reset`
2. Ingresa su email
3. Sistema genera token de reset (1h expiración)
4. Sistema envía email con link `/auth/reset/[token]`
5. Usuario hace clic y establece nueva contraseña
6. Sistema actualiza `passwordHash` y elimina token

### 4. Inactividad

- Usuario sin actividad durante 30 minutos (configurable)
- Sistema cierra sesión automáticamente
- Usuario es redirigido a `/auth/login`

## 🛡️ Seguridad

### Rate Limiting

- 5 requests por 5 minutos por IP en endpoints sensibles
- Endpoints protegidos: `/api/register`, `/api/auth/login`, `/api/auth/reset/*`

### JWT

- Expiración: 2 horas
- Refresh automático: cada 10 minutos de actividad
- Contiene: `id`, `email`, `name`, `role`, `tenantId`

### Cookies

- `httpOnly: true` (no accesible desde JavaScript)
- `sameSite: 'lax'` (protección CSRF)
- `secure: true` en producción (HTTPS)
- **Sin `maxAge`** → cookie de sesión (se elimina al cerrar navegador)

## 📂 Archivos Creados/Modificados

### Backend

- `apps/api/src/services/email.ts` - Servicio de email
- `apps/api/src/schemas/auth.ts` - Schemas Zod
- `apps/api/src/routes.auth.ts` - Rutas de autenticación (completamente reescritas)
- `apps/api/package.json` - Agregado nodemailer

### Frontend

- `apps/web/app/api/auth/[...nextauth]/route.ts` - Configuración NextAuth actualizada
- `apps/web/types/next-auth.d.ts` - Tipos actualizados con tenantId
- `apps/web/middleware.ts` - Protección de rutas
- `apps/web/app/lib/hooks/useAuth.ts` - Hook para acceso a auth
- `apps/web/app/components/InactivityLogout.tsx` - Componente de inactividad
- `apps/web/app/lib/validations/auth.ts` - Schemas Zod para frontend
- `apps/web/package.json` - Agregado react-hook-form, @hookform/resolvers, zod

### Base de Datos

- `packages/db/prisma/schema.prisma` - User actualizado con passwordHash y emailVerified

## 🚧 Tareas Pendientes

### Formularios Frontend

Los formularios necesitan ser actualizados con react-hook-form y zodResolver:

1. **apps/web/app/auth/register/page.tsx**
   - Usar `useForm` de react-hook-form
   - Validación con `zodResolver(registerSchema)`
   - Manejo de errores por campo
   - Toast notifications

2. **apps/web/app/auth/login/page.tsx**
   - Actualizar con react-hook-form
   - Manejar error `email_not_verified`
   - Mejorar UX con mensajes claros

3. **apps/web/app/auth/reset/page.tsx** (nuevo)
   - Formulario para solicitar reset
   - Toast: "Revisa tu email"

4. **apps/web/app/auth/reset/[token]/page.tsx** (nuevo)
   - Formulario para confirmar nueva contraseña
   - Validación de token
   - Toast: "Contraseña actualizada"

5. **apps/web/app/auth/verify-email/page.tsx** (nuevo)
   - Verificar token desde query params
   - Mostrar estado (éxito/error)
   - CTA a login

### Layout Protegido

Agregar componente de inactividad en layout protegido:

- Crear `apps/web/app/documents/layout.tsx` o
- Agregar condicionalmente en `apps/web/app/layout.tsx`

```tsx
import InactivityLogout from "@/app/components/InactivityLogout";

export default function ProtectedLayout({ children }) {
  return (
    <>
      <InactivityLogout />
      {children}
    </>
  );
}
```

## ✅ Checklist de QA

Ver archivo `docs/auth-qa.md` para checklist completo de pruebas.

## 📚 Referencias

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)

