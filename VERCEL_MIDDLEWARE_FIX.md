# ✅ Fix de Middleware para Vercel Edge Runtime

## Problema
El middleware fallaba en Vercel con error `500: MIDDLEWARE_INVOCATION_FAILED` porque:
1. Usaba `getToken` de `next-auth/jwt` que no funciona bien en Edge Runtime
2. Accedía a `process.env.NEXTAUTH_SECRET` que causa problemas en el edge

## Solución
Se simplificó completamente el middleware para:
- **Solo leer cookies** de NextAuth (no usar `getToken`)
- **No acceder a variables de entorno** (no necesita `NEXTAUTH_SECRET`)
- **Funcionar 100% en Edge Runtime**

### Cómo funciona ahora:
1. **Rutas normales** (`/`, `/about`, etc.): Pasan directo, sin verificación
2. **Rutas protegidas** (`/documents/*`): Verifican si hay cookie de sesión
   - Sin cookie → redirige a `/auth/login`
   - Con cookie → pasa directo
3. **Rutas de auth** (`/auth/login`, `/auth/register`):
   - Con cookie → redirige a `/documents` (ya logueado)
   - Sin cookie → pasa directo

## Ventajas
✅ **Compatible con Edge Runtime**  
✅ **No depende de `NEXTAUTH_SECRET`**  
✅ **Más rápido y simple**  
✅ **Funciona en producción**

## Trade-offs
- No decodifica el JWT (solo verifica existencia)
- La verificación real del usuario la hace NextAuth en las páginas
- Esto es suficiente para protección básica de rutas

## Referencias
- NextAuth Middleware: https://next-auth.js.org/configuration/nextjs#middleware
- Edge Runtime: https://nextjs.org/docs/app/building-your-application/routing/middleware#edge-runtime

