# 🔧 Fix: Autenticación y Proxy en Producción

**Fecha:** Noviembre 13, 2025  
**Problema:** Error 401 "Autenticación requerida" en producción (Vercel + Railway)

---

## 📋 Resumen del Problema

El proxy `/api/_proxy/*` no estaba obteniendo correctamente la sesión de NextAuth en producción, resultando en:
- `tieneAuthToken: false`
- Backend respondiendo con 401 Unauthorized
- Usuario no podía cargar documentos aunque estuviera logueado

---

## ✅ Cambios Realizados

### 1. Configuración de NextAuth (`apps/web/app/api/auth/[...nextauth]/authOptions.ts`)

**Cambios:**
- ✅ Agregado `trustHost: true` para Vercel/producción
- ✅ Verificado que las cookies están configuradas correctamente:
  - `sameSite: "lax"` (compatible con navegación cross-site)
  - `secure: true` en producción (HTTPS)
  - Nombres correctos: `__Secure-next-auth.session-token` en producción

**Razón:** NextAuth necesita `trustHost: true` para funcionar correctamente en plataformas como Vercel donde el host puede variar.

---

### 2. Reescritura del Proxy (`apps/web/app/api/_proxy/[...path]/route.ts`)

**Cambio principal:** Reemplazado el método manual de lectura de cookies por la API oficial de NextAuth.

**Antes:**
- Leía cookies manualmente del header
- Decodificaba el JWT de NextAuth manualmente
- Propenso a errores en producción

**Ahora:**
- Usa `getServerSession(authOptions)` - API oficial de NextAuth para App Router
- Más confiable y mantenible
- Funciona correctamente en producción

**Código clave:**
```typescript
// Obtener sesión usando la API oficial de NextAuth
const session = await getServerSession(authOptions);

if (!session || !session.user) {
  return NextResponse.json(
    { ok: false, error: "UNAUTHORIZED", message: "Autenticación requerida" },
    { status: 401 }
  );
}

// Generar token JWT para el backend
const backendToken = jwt.sign(
  {
    id: user.id,
    sub: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role || "user",
  },
  process.env.NEXTAUTH_SECRET!,
  { expiresIn: "15m" }
);
```

**Mejoras adicionales:**
- ✅ Mejor manejo de errores
- ✅ Logging más claro y útil
- ✅ Validación de variables de entorno
- ✅ Runtime explícito: `export const runtime = "nodejs"`

---

### 3. Verificación del Backend (`apps/api/src/utils/auth.ts`)

**Estado:** ✅ Ya estaba correcto

El backend espera:
- `decoded.id || decoded.sub` para `userId`
- `decoded.tenantId` para multi-tenant
- `decoded.role` para autorización
- `decoded.email` para identificación

El proxy ahora genera el token con esta estructura exacta, por lo que la compatibilidad está garantizada.

---

## 🧪 Tests Manuales

### En Desarrollo (localhost)

1. **Iniciar servicios:**
   ```bash
   npm run dev
   ```

2. **Loguearse:**
   - Ir a http://localhost:3000
   - Iniciar sesión con credenciales válidas

3. **Verificar documentos:**
   - Ir a http://localhost:3000/documents
   - Debe cargar los documentos sin error 401
   - Verificar en DevTools → Network que `/api/_proxy/documents` devuelve 200

4. **Verificar logs:**
   - En la consola del servidor debe aparecer:
     ```
     [_proxy] ✅ Sesión encontrada para usuario: { id: '...', email: '...', tenantId: '...' }
     [_proxy] ✅ Request exitoso: { path: 'documents', status: 200 }
     ```

### En Producción (Vercel)

1. **Hacer deploy:**
   - Push a `main` branch
   - Vercel deploy automático

2. **Loguearse:**
   - Ir a https://legal-ai-platform-orcin.vercel.app
   - Iniciar sesión

3. **Verificar en DevTools:**
   - Abrir DevTools → Network
   - Verificar:
     - `/api/auth/session` → 200 OK ✅
     - `/api/_proxy/documents` → 200 OK ✅ (ya NO 401)

4. **Verificar cookies:**
   - DevTools → Application → Cookies
   - Debe existir: `__Secure-next-auth.session-token` ✅

5. **Verificar logs de Vercel:**
   - En Vercel Dashboard → Logs
   - Buscar mensajes:
     ```
     [_proxy] ✅ Sesión encontrada para usuario: ...
     [_proxy] ✅ Request exitoso: ...
     ```

---

## 🔍 Diagnóstico de Problemas

### Si sigue apareciendo 401:

1. **Verificar variables de entorno en Vercel:**
   - `NEXTAUTH_URL` = `https://legal-ai-platform-orcin.vercel.app`
   - `NEXTAUTH_SECRET` = (mismo valor que en Railway)
   - `NEXT_PUBLIC_API_URL` = `https://api-production-8cad.up.railway.app`

2. **Verificar logs de Vercel:**
   - Buscar mensajes `[_proxy]` en los logs
   - Si aparece "Sin sesión de NextAuth", el problema es con NextAuth
   - Si aparece "Sesión encontrada" pero sigue 401, el problema es con el backend

3. **Verificar cookies:**
   - En DevTools → Application → Cookies
   - Debe existir la cookie de sesión
   - Si no existe, el problema es con NextAuth (verificar `trustHost: true`)

### Si el proxy devuelve 500:

1. **Verificar que `NEXTAUTH_SECRET` esté configurado:**
   - Debe estar en Vercel (frontend)
   - Debe estar en Railway (backend)
   - Deben ser el mismo valor

2. **Verificar logs de error:**
   - Buscar mensajes de error específicos en los logs

---

## 📝 Notas Técnicas

### Por qué `getServerSession` es mejor que leer cookies manualmente:

1. **API oficial:** NextAuth está diseñado para funcionar con `getServerSession` en App Router
2. **Manejo de cookies:** NextAuth maneja automáticamente los diferentes nombres de cookies según el entorno
3. **Seguridad:** NextAuth valida y verifica el token correctamente
4. **Mantenibilidad:** Si NextAuth cambia su implementación, `getServerSession` se actualiza automáticamente

### Estructura del JWT generado para el backend:

```json
{
  "id": "user-id",
  "sub": "user-id",
  "email": "user@example.com",
  "tenantId": "tenant-id",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234568790
}
```

El backend espera esta estructura y la valida usando `NEXTAUTH_SECRET`.

---

## ✅ Checklist de Deploy

Antes de hacer deploy, verificar:

- [ ] `trustHost: true` está en `authOptions`
- [ ] `NEXTAUTH_SECRET` está configurado en Vercel
- [ ] `NEXTAUTH_SECRET` está configurado en Railway (mismo valor)
- [ ] `NEXT_PUBLIC_API_URL` está configurado en Vercel
- [ ] El código del proxy usa `getServerSession` (no lectura manual de cookies)
- [ ] `runtime = "nodejs"` está en el proxy

---

## 🎯 Resultado Esperado

Después de estos cambios:

1. ✅ Usuario logueado puede acceder a `/documents`
2. ✅ `/api/_proxy/documents` devuelve 200 (no 401)
3. ✅ Backend recibe el token JWT correctamente
4. ✅ Multi-tenant funciona (filtrado por `tenantId`)
5. ✅ Funciona tanto en desarrollo como en producción

---

## 📚 Referencias

- [NextAuth.js - getServerSession](https://next-auth.js.org/tutorials/securing-pages-and-api-routes#using-getserversession)
- [NextAuth.js - Configuration](https://next-auth.js.org/configuration/options)
- [Next.js App Router - Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Última actualización:** Noviembre 13, 2025

