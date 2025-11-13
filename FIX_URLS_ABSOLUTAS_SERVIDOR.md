# 🔧 Fix: URLs Absolutas en Código del Servidor

**Fecha:** Noviembre 13, 2025  
**Problema:** "Failed to parse URL from /api/_proxy/documents" en producción

---

## 📋 Resumen del Problema

En producción, cuando un Server Component (RSC) intentaba hacer `fetch()` con una URL relativa como `/api/_proxy/documents`, Node.js lanzaba el error:

```
Failed to parse URL from /api/_proxy/documents
```

**Causa:** Node.js no puede resolver URLs relativas sin una base URL. En el navegador, las URLs relativas se resuelven automáticamente contra `window.location.origin`, pero en el servidor no existe ese contexto.

---

## ✅ Cambios Realizados

### 1. Nuevo Helper: `apps/web/app/lib/url-utils.ts`

Creado un helper reutilizable para construir URLs absolutas:

```typescript
export function buildFrontendUrl(
  path: string,
  searchParams?: URLSearchParams | Record<string, string | number | undefined>
): string
```

**Características:**
- Obtiene la base URL de `NEXTAUTH_URL` → `VERCEL_URL` → `localhost:3000` (dev)
- Construye URLs absolutas usando `new URL(path, baseUrl)`
- Soporta parámetros de búsqueda opcionales
- Funciona tanto con `URLSearchParams` como con objetos `Record`

**Función auxiliar:**
```typescript
export function isServer(): boolean
```
- Detecta si el código se está ejecutando en el servidor

---

### 2. Modificado: `apps/web/app/lib/webApi.ts`

**Función `proxyJson()`:**
- Ahora detecta si se ejecuta en servidor o cliente
- Usa URL absoluta en servidor, relativa en cliente
- Mantiene compatibilidad con código cliente existente

**Antes:**
```typescript
const resp = await fetch(`${PROXY_BASE}${normalized}`, { ... });
```

**Ahora:**
```typescript
const url = isServer()
  ? buildFrontendUrl(`${PROXY_BASE}${normalized}`)
  : `${PROXY_BASE}${normalized}`;

const resp = await fetch(url, { ... });
```

---

### 3. Modificado: `apps/web/app/lib/api.ts`

**Funciones corregidas:**
- `getDocuments()` - Usa URL absoluta en servidor
- `getDocument(id)` - Usa URL absoluta en servidor
- `generateDocument(formData)` - Simplificado para usar el helper

**Antes:**
```typescript
const res = await fetch("/api/_proxy/documents", { ... });
```

**Ahora:**
```typescript
const url = isServer()
  ? buildFrontendUrl("/api/_proxy/documents")
  : "/api/_proxy/documents";

const res = await fetch(url, { ... });
```

---

## 🔍 Archivos Afectados

### Nuevos:
- ✅ `apps/web/app/lib/url-utils.ts` - Helper para URLs absolutas

### Modificados:
- ✅ `apps/web/app/lib/webApi.ts` - `proxyJson()` ahora usa URLs absolutas en servidor
- ✅ `apps/web/app/lib/api.ts` - `getDocuments()`, `getDocument()`, `generateDocument()` corregidos

### No modificados (ya correctos):
- ✅ `apps/web/app/documents/new/page.tsx` - Componente cliente, URLs relativas OK
- ✅ `apps/web/app/documents/[id]/page.tsx` - Componente cliente, URLs relativas OK
- ✅ `apps/web/app/dashboard/page.tsx` - Componente cliente, URLs relativas OK

---

## 🧪 Tests Manuales

### En Desarrollo (localhost)

1. **Iniciar servicios:**
   ```bash
   npm run dev
   ```

2. **Loguearse:**
   - Ir a http://localhost:3000
   - Iniciar sesión

3. **Verificar documentos:**
   - Ir a http://localhost:3000/documents
   - Debe cargar los documentos sin error
   - No debe aparecer "Failed to parse URL..."

4. **Verificar logs:**
   - En la consola del servidor no debe haber errores de URL

### En Producción (Vercel)

1. **Hacer deploy:**
   - Push a `main` branch
   - Vercel deploy automático

2. **Loguearse:**
   - Ir a https://legal-ai-platform-orcin.vercel.app
   - Iniciar sesión

3. **Verificar en DevTools:**
   - Abrir DevTools → Network
   - Ir a `/documents`
   - Verificar que aparece el request:
     ```
     GET /api/_proxy/documents?page=1&pageSize=20&sort=createdAt:desc
     Status: 200 OK
     ```
   - Ya NO debe aparecer el error "Failed to parse URL..."

4. **Verificar que se muestran los documentos:**
   - La página debe mostrar la lista de documentos (o mensaje de lista vacía)
   - No debe aparecer el error "No se pudieron cargar los documentos"

---

## 📝 Notas Técnicas

### Por qué URLs relativas fallan en el servidor:

En el navegador:
```javascript
// ✅ Funciona - el navegador resuelve contra window.location.origin
fetch("/api/_proxy/documents")
```

En Node.js (servidor):
```javascript
// ❌ Falla - Node.js no sabe cuál es la base URL
fetch("/api/_proxy/documents") // Error: Failed to parse URL
```

### Solución:

```javascript
// ✅ Funciona - URL absoluta con base URL explícita
const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
const url = new URL("/api/_proxy/documents", baseUrl);
fetch(url.toString())
```

### Detección automática:

El helper `isServer()` detecta el entorno:
- `typeof window === "undefined"` → Servidor
- `typeof window !== "undefined"` → Cliente

Esto permite usar URLs relativas en cliente (más simple) y absolutas en servidor (necesario).

---

## ✅ Checklist de Deploy

Antes de hacer deploy, verificar:

- [ ] `NEXTAUTH_URL` está configurado en Vercel
- [ ] `url-utils.ts` está creado con `buildFrontendUrl()`
- [ ] `webApi.ts` usa `buildFrontendUrl()` en servidor
- [ ] `api.ts` usa `buildFrontendUrl()` en servidor
- [ ] No hay errores de linting

---

## 🎯 Resultado Esperado

Después de estos cambios:

1. ✅ Server Components pueden hacer fetch a `/api/_proxy/*` sin errores
2. ✅ No aparece "Failed to parse URL..." en producción
3. ✅ `/documents` carga correctamente en producción
4. ✅ Client Components siguen funcionando con URLs relativas
5. ✅ Compatibilidad total entre desarrollo y producción

---

## 📚 Referencias

- [Next.js - Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Node.js - URL API](https://nodejs.org/api/url.html)
- [MDN - URL Constructor](https://developer.mozilla.org/en-US/docs/Web/API/URL/URL)

---

**Última actualización:** Noviembre 13, 2025

