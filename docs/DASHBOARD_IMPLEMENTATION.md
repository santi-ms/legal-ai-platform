# 📊 Dashboard de Documentos - Implementación Completa

## ✅ Estado de Implementación

### Backend API (apps/api) - COMPLETADO ✅

#### Endpoints Implementados

1. **GET /documents** - Lista paginada con filtros
   - Query params: `query`, `type`, `jurisdiccion`, `from`, `to`, `page`, `pageSize`, `sort`
   - Respuesta: `{ ok: true, items: [], total, page, pageSize }`
   - Autenticación requerida
   - Filtro por tenantId automático

2. **POST /documents/:id/duplicate** - Duplicar documento
   - Crea copia con mismo contenido pero sin PDF
   - Respuesta: `{ ok: true, data: { id } }`

3. **DELETE /documents/:id** - Eliminar documento
   - Solo admin/owner pueden eliminar
   - Verifica tenantId

4. **PATCH /documents/:id** - Actualizar metadatos
   - Campos: `type`, `jurisdiccion`, `tono`
   - Verifica tenantId

5. **GET /documents/:id** - Detalle de documento
   - Actualizado para requerir autenticación y filtrar por tenant

6. **GET /documents/:id/pdf** - Descargar PDF
   - Actualizado para requerir autenticación y filtrar por tenant

#### Autenticación

- Helper `getUserFromRequest()` extrae JWT del header `Authorization: Bearer <token>`
- Helper `requireAuth()` lanza error si no hay token válido
- Multi-tenant: todos los endpoints filtran por `tenantId` del usuario

### Frontend (apps/web) - COMPLETADO ✅

#### Proxy Server-Side (Sin Exponer JWT)

**Rutas implementadas:**
- `GET /api/_proxy/documents` - Lista documentos
- `GET /api/_proxy/documents/[id]` - Detalle de documento
- `PATCH /api/_proxy/documents/[id]` - Actualizar documento
- `DELETE /api/_proxy/documents/[id]` - Eliminar documento
- `POST /api/_proxy/documents/[id]/duplicate` - Duplicar documento
- `GET /api/_proxy/documents/[id]/pdf` - Stream de PDF

**Seguridad:**
- ✅ JWT nunca expuesto al cliente
- ✅ Token obtenido server-side con `getToken()` de NextAuth
- ✅ JWT generado dinámicamente con `generateJWT()` para el backend
- ✅ Retorna 401 si no hay sesión

#### Componentes Implementados

1. **`/dashboard`** - Página principal ✅
   - Ruta protegida con redirección a login
   - Integración con `useSearchParams` para filtros en URL
   - Estados: loading, error, empty
   - Header con contador y botón "Nuevo documento"

2. **`FiltersBar`** - Búsqueda y filtros ✅
   - Búsqueda de texto (debounce 400ms)
   - Select tipo de documento
   - Input jurisdicción
   - Rango de fechas (from/to)
   - Select orden (fecha asc/desc)
   - Botón "Limpiar filtros"
   - Sincronización con URL

3. **`DocumentsTable`** - Tabla con acciones ✅
   - Columnas: Tipo, Jurisdicción, Estado, Fecha, Acciones
   - Acciones por fila: Ver, Descargar PDF, Duplicar, Eliminar (solo admin)
   - RBAC: oculta acciones destructivas si no es admin

4. **`PDFPreviewModal`** - Modal para preview de PDF ✅
   - Iframe embebido con PDF desde proxy
   - Responsive y accesible

5. **`Pagination`** - Paginación server-side ✅
   - Muestra: "Mostrando X - Y de Z"
   - Botones anterior/siguiente
   - Números de página (máx 5 visibles)
   - Sincronización con URL

6. **`ConfirmDialog`** - Dialog de confirmación ✅
   - Para acciones destructivas
   - Variante "destructive" con estilo rojo

7. **`EmptyState`, `ErrorState`, `LoadingSkeleton`** - Estados ✅
   - EmptyState con CTA "Crear documento"
   - ErrorState con botón "Reintentar"
   - LoadingSkeleton con animación

#### Helpers Client-Side

**`apps/web/app/lib/webApi.ts`** ✅
- `listDocuments(params)` - Lista con filtros
- `getDocument(id)` - Obtener documento
- `duplicateDocument(id)` - Duplicar
- `deleteDocument(id)` - Eliminar
- `patchDocument(id, payload)` - Actualizar
- `getPdfUrl(id)` - URL del PDF via proxy

## 📋 Query Parameters del Dashboard

### GET /documents (via proxy)

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `query` | string | Búsqueda de texto en type y jurisdiccion | `?query=contrato` |
| `type` | string | Filtro por tipo de documento | `?type=contrato_servicios` |
| `jurisdiccion` | string | Filtro por jurisdicción | `?jurisdiccion=Corrientes` |
| `from` | ISO datetime | Fecha desde (inclusive) | `?from=2025-01-01T00:00:00Z` |
| `to` | ISO datetime | Fecha hasta (inclusive) | `?to=2025-12-31T23:59:59Z` |
| `page` | number | Página actual (default: 1) | `?page=2` |
| `pageSize` | number | Items por página (default: 20, max: 100) | `?pageSize=50` |
| `sort` | enum | Orden: `createdAt:asc` o `createdAt:desc` | `?sort=createdAt:desc` |

**Ejemplos de URLs:**

```
# Listado básico
/dashboard

# Con búsqueda y tipo
/dashboard?query=contrato&type=contrato_servicios

# Con filtros completos y paginación
/dashboard?query=servicios&type=contrato_servicios&jurisdiccion=Corrientes&page=2&pageSize=20&sort=createdAt:desc

# Con rango de fechas
/dashboard?from=2025-01-01T00:00:00Z&to=2025-12-31T23:59:59Z
```

## 🔐 RBAC (Role-Based Access Control)

### Roles

- `owner` - Acceso completo
- `admin` - Puede eliminar documentos
- `editor` - Puede crear y editar
- `viewer` - Solo lectura

### Permisos en UI

- **Eliminar**: Solo visible si `role === 'admin' || role === 'owner'`
- **Duplicar**: Cualquier usuario autenticado
- **Ver/Descargar PDF**: Cualquier usuario autenticado

### Permisos en Endpoints (Backend)

- **DELETE /documents/:id**: Solo `admin` y `owner`
- **PATCH /documents/:id**: Cualquier usuario autenticado
- **POST /documents/:id/duplicate**: Cualquier usuario autenticado

## 🔒 Seguridad

### Proxy Server-Side

- ✅ **JWT nunca expuesto al cliente**: El token JWT solo existe en el servidor
- ✅ **Token obtenido server-side**: Usa `getToken()` de NextAuth que solo funciona en Route Handlers
- ✅ **JWT generado dinámicamente**: `generateJWT()` usa `NEXTAUTH_SECRET` (server-only)
- ✅ **Validación de sesión**: Cada request verifica autenticación antes de procesar
- ✅ **Headers de seguridad**: `Cache-Control: no-store` en todas las respuestas
- ✅ **Sanitización de filenames**: PDF filenames sanitizados para evitar path traversal
- ✅ **Retorna 401**: Si no hay sesión, respuesta unificada con headers de no-cache

### Flujo de Autenticación (Diagrama)

```
┌─────────────┐
│   Cliente   │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. GET /api/_proxy/documents?query=...
       │    (sin token en headers)
       ▼
┌─────────────────────────────────────┐
│  Next.js Route Handler (Server)     │
│  /app/api/_proxy/documents/route.ts │
├─────────────────────────────────────┤
│ 2. getToken({ req })                │
│    → Lee cookie NextAuth (server)   │
│    → Si no hay token → 401          │
│                                     │
│ 3. generateJWT(token)               │
│    → Usa NEXTAUTH_SECRET (env)      │
│    → Genera JWT con payload:        │
│      { id, email, role, tenantId }  │
│                                     │
│ 4. fetch(backendUrl, {              │
│      headers: {                     │
│        Authorization: Bearer <jwt>  │
│      }                              │
│    })                               │
└──────┬──────────────────────────────┘
       │
       │ 5. Request con JWT válido
       ▼
┌─────────────────────────────────────┐
│  Backend API (Fastify)              │
│  apps/api/src/routes.documents.ts   │
├─────────────────────────────────────┤
│ 6. getUserFromRequest(request)      │
│    → Verifica JWT con secret        │
│    → Extrae userId, tenantId, role  │
│                                     │
│ 7. Prisma query con filtro:         │
│    where: { tenantId: user.tenantId }│
│                                     │
│ 8. Retorna { items, total, ... }    │
└──────┬──────────────────────────────┘
       │
       │ 9. Response con datos
       ▼
┌─────────────────────────────────────┐
│  Next.js Route Handler (Server)     │
│                                     │
│ 10. Retorna datos al cliente        │
│     (sin exponer el JWT)            │
│     Headers: Cache-Control: no-store│
└──────┬──────────────────────────────┘
       │
       │ 11. JSON response
       ▼
┌─────────────┐
│   Cliente   │
│  (Browser)  │
└─────────────┘
```

### Variables de Entorno (Seguridad)

**Server-side only (nunca expuestas al cliente):**
- `NEXTAUTH_SECRET` - Usado para firmar JWT (solo en Route Handlers)
- `API_URL` - URL del backend (solo en Route Handlers)

**Client-side (públicas):**
- `NEXT_PUBLIC_API_URL` - NO se usa en el proxy (solo para referencias)
- `NEXTAUTH_URL` - URL pública de NextAuth

**Confirmación de seguridad:**
- ✅ `generateJWT()` solo se ejecuta en Route Handlers (server-only)
- ✅ `NEXTAUTH_SECRET` nunca aparece en bundles del cliente
- ✅ El JWT generado nunca se expone al cliente (solo se usa internamente)

## 🧪 Tests E2E

Ver `e2e/dashboard.spec.ts` para tests completos:

1. Listado + paginación
2. Filtros (type/jurisdicción/fecha) + búsqueda
3. Preview PDF en modal
4. Acciones: duplicar, eliminar
5. Guard de ruta: sin sesión → redirige a login
6. RBAC: user no ve acciones destructivas

## 📝 Estructura de Archivos

```
apps/web/
├── app/
│   ├── api/
│   │   └── _proxy/
│   │       ├── documents/
│   │       │   ├── route.ts (GET lista)
│   │       │   └── [id]/
│   │       │       ├── route.ts (GET, PATCH, DELETE)
│   │       │       ├── duplicate/route.ts (POST)
│   │       │       └── pdf/route.ts (GET stream)
│   │       └── utils.ts (generateJWT)
│   ├── dashboard/
│   │   └── page.tsx (Página principal)
│   └── lib/
│       ├── webApi.ts (Helpers client-side)
│       └── hooks/
│           └── useAuth.ts (Hook de autenticación)
└── components/
    ├── dashboard/
    │   ├── DashboardComponents.tsx (EmptyState, ErrorState, LoadingSkeleton)
    │   ├── DocumentsTable.tsx
    │   ├── FiltersBar.tsx
    │   ├── PDFPreviewModal.tsx
    │   ├── Pagination.tsx
    │   └── ConfirmDialog.tsx
    └── ui/
        ├── dialog.tsx (Componente base)
        └── select.tsx (Componente base)
```

## 🚀 Uso

### Acceder al Dashboard

1. Loguearse en `/auth/login`
2. Navegar a `/dashboard`
3. Si no está autenticado, redirige automáticamente a login

### Filtros

- Todos los filtros se sincronizan con la URL
- Puedes compartir URLs con filtros aplicados
- Cambiar filtros resetea la página a 1

### Acciones

- **Ver**: Abre modal con preview del PDF
- **Descargar**: Descarga el PDF en nueva pestaña
- **Duplicar**: Crea copia del documento (sin PDF)
- **Eliminar**: Muestra confirmación, solo visible para admin

## 🐛 Troubleshooting

### Error 401 en proxy

- Verificar que `NEXTAUTH_SECRET` esté configurado
- Verificar que el usuario esté autenticado
- Verificar que el token de NextAuth tenga `user.tenantId` y `user.role`

### PDF no se muestra

- Verificar que el documento tenga `lastVersion.pdfUrl`
- Verificar permisos del documento (tenantId)
- Verificar CORS si se accede directamente al backend

### Filtros no funcionan

- Verificar formato de fechas (ISO 8601)
- Verificar que los valores de `type` coincidan con los del backend
- Verificar logs del servidor para errores de validación

## ✅ Criterios de Aceptación - COMPLETADOS

- ✅ `/dashboard` operativo: lista paginada, filtros, sort, paginación y acciones
- ✅ URL refleja el estado (deep link)
- ✅ PDF preview estable en modal
- ✅ Acciones respetan RBAC y tenant
- ✅ JWT nunca expuesto al cliente (todo va por proxy server-side)
- ⏳ E2E verde en CI (tests creados, pendiente ejecución)
- ✅ Docs actualizados
