---
title: "Web"
source:
  - "apps/web/**"
generated: true
lastSync:
  sourceCommit: "4030ba85a7923a0fce905433b06bf876327f34a1"
  docHash: "ce8e199250d0"
---
## Descripción general

`apps/web` es la aplicación principal para usuarios finales. Está construida con Next.js (App Router), React, Tailwind CSS y NextAuth. Se comunica con `apps/api` a través de un proxy interno ubicado en `app/api/_proxy/[...path]/route.ts`. El estado de sesión lo gestiona NextAuth con el adaptador de Prisma (`@next-auth/prisma-adapter`).

## Estructura de rutas

Las páginas de la aplicación autenticada viven bajo el grupo `app/(app)/`. Las páginas de autenticación están en `app/auth/`.

```
app/
├── (app)/
│   ├── admin/          # Panel super-admin
│   ├── analysis/       # Análisis de contratos con IA
│   ├── analytics/      # Estadísticas de uso
│   ├── calendario/     # Calendario de eventos
│   ├── clients/        # Gestión de clientes
│   ├── dashboard/      # Panel principal
│   ├── documents/      # Generación y gestión de documentos
│   ├── estrategia/     # Estrategia legal con IA
│   ├── expedientes/    # Gestión de expedientes
│   ├── finanzas/       # Honorarios y facturación
│   ├── importar/       # Importación de datos
│   ├── juris/          # Jurisprudencia
│   ├── settings/       # Configuración de cuenta, billing, equipo
│   └── vencimientos/   # Vencimientos procesales
├── auth/
│   ├── login/
│   ├── register/
│   ├── reset/
│   └── verify-email/
└── api/
    ├── _auth/          # Handlers internos de autenticación
    ├── _proxy/         # Proxy hacia apps/api
    └── auth/[...nextauth]/
```

## Autenticación

La sesión se maneja con NextAuth. La configuración está en `app/api/auth/[...nextauth]/authOptions.ts`. Los endpoints de registro, login, verificación de email y reset de contraseña están implementados como Route Handlers en `app/api/_auth/` y se exponen mediante delegación desde `app/api/auth/`.

El proxy en `app/api/_proxy/[...path]/route.ts` reenvía las peticiones autenticadas a la API de Fastify, inyectando el token JWT de la sesión actual.

## Panel super-admin (`/admin`)

Accesible únicamente para el usuario configurado en `SUPER_ADMIN_EMAIL`. El acceso no autorizado muestra una pantalla de "Acceso denegado" con redirección al dashboard.

La página raíz (`app/(app)/admin/page.tsx`) organiza el contenido en cinco pestañas:

| Pestaña | Componente | Descripción |
|---|---|---|
| Overview | `AdminOverview` | Métricas globales del sistema |
| Estudios | `TenantsTable` | Lista paginada de tenants con filtro por plan |
| Usuarios | `UsersTable` | Lista paginada de usuarios con búsqueda |
| Prompts IA | `PromptsManager` | CRUD de prompts de generación de documentos |
| Códigos Promo | `PromoCodesManager` | CRUD de códigos promocionales |

Al hacer clic en un tenant desde cualquier pestaña se abre `TenantDetailModal`, que muestra usuarios, documentos, clientes, uso de IA y análisis del tenant seleccionado.

### Componentes del admin

**`AdminOverview`** (`components/AdminOverview.tsx`)  
Recibe un objeto `SuperAdminOverview` con campos como `totalTenants`, `totalUsers`, `totalDocuments`, `totalAiCostUsd`, `planBreakdown` y `recentTenants`. Muestra tarjetas de estadísticas usando el componente `StatCard` de `adminHelpers.tsx`.

**`TenantsTable`** (`components/TenantsTable.tsx`)  
Lista paginada (25 por página) con búsqueda por nombre o CUIT y filtro por plan (`free`, `pro`, `proplus`, `equipo`, `estudio`).

**`UsersTable`** (`components/UsersTable.tsx`)  
Lista paginada (50 por página) con búsqueda por nombre o email. Permite eliminar cuentas directamente desde la tabla.

**`PromptsManager`** (`components/PromptsManager.tsx`)  
Permite crear, editar, activar/desactivar y eliminar prompts de IA. Cada prompt tiene `documentType`, `label`, `systemMessage`, `baseInstructions[]` e `isActive`.

**`PromoCodesManager`** (`components/PromoCodesManager.tsx`)  
Gestión de códigos promocionales. Al crear un código se define:
- `code`: string en mayúsculas sin espacios
- `planCode`: `pro`, `proplus`, `equipo` o `estudio`
- `trialDays`: número de días de trial (1–365)
- `maxUses`: número entero o `-1` para ilimitado
- `expiresAt`: fecha opcional de vencimiento

**`adminHelpers.tsx`**  
Exporta utilidades compartidas entre los componentes del admin:

```ts
PlanBadge     // badge visual por código de plan
StatCard      // tarjeta de métrica con ícono
fmt(n)        // formatea número con locale es-AR
fmtCost(usd)  // "$0.0000 USD"
fmtDate(iso)  // dd/mm/yyyy
fmtDateTime(iso) // dd/mm/yyyy hh:mm
```

Los planes reconocidos son `free`, `pro`, `proplus`, `equipo` y `estudio`, definidos en `PLAN_LABELS` y `PLAN_COLORS`.

## Análisis de contratos (`/analysis`)

La sección "Doku Analiza" permite subir contratos en PDF (máx. 10 MB) para que Claude los analice. El flujo es:

1. El usuario arrastra o selecciona un PDF en la zona de upload de `app/(app)/analysis/page.tsx`.
2. Se llama a `uploadContractForAnalysis(file)` del módulo `app/lib/webApi`.
3. La API devuelve un `analysisId` y el usuario es redirigido a `/analysis/[id]`.
4. La página de detalle (`app/(app)/analysis/[id]/page.tsx`) hace polling cada 3 segundos mientras el estado sea `pending` o `processing`.
5. Cuando el estado pasa a `done`, se renderiza el resultado con riesgo global, cláusulas problemáticas y recomendaciones.

### Estados del análisis

| Estado | Comportamiento en UI |
|---|---|
| `pending` / `processing` | Spinner con mensaje, polling automático |
| `done` | Resultado completo con indicador de riesgo |
| `error` | Mensaje de error con opción de volver |

### Clasificación de riesgo

```ts
const OVERALL_RISK_CONFIG = {
  low:    { label: "Riesgo Bajo",   icon: CheckCircle2  },
  medium: { label: "Riesgo Medio",  icon: AlertTriangle },
  high:   { label: "Riesgo Alto",   icon: ShieldAlert   },
};
```

Cada cláusula también tiene su propio nivel (`Alta`, `Media`, `Baja`) definido en `CLAUSE_RISK_CONFIG`.

### Chat de seguimiento

Desde la página de detalle, el usuario puede hacer preguntas sobre el análisis. El componente mantiene un array local `chatMessages` y llama a `askContractAnalysis(id, pregunta)` para cada mensaje.

## Documentos (`/documents`)

La sección de documentos soporta tres modos de creación accesibles desde `/documents/new`:

- **Chat** (`/documents/new/chat`): creación conversacional
- **Guiado** (`/documents/new/guided`): formulario paso a paso con campos predefinidos
- **Step-by-step** (`/documents/new/step-by-step`): redirige al flujo guiado

Los documentos generados se pueden revisar en `/documents/[id]/review` y editar en `/documents/[id]/edit`.

## Comunicación con la API

Todas las llamadas al backend pasan por funciones exportadas desde `app/lib/webApi`. El proxy en `app/api/_proxy/[...path]/route.ts` agrega el header de autorización y reenvía la petición a `apps/api`.

El hook `usePlanLimitHandler` (en `app/lib/hooks/usePlanLimitHandler`) intercepta errores de límite de plan y muestra el diálogo de upgrade correspondiente. La función `isPlanLimitError` de `app/lib/webApi` permite identificar estos errores antes de mostrarlos.

## Configuración y variables de entorno

Las variables relevantes para `apps/web` incluyen las usadas por NextAuth (ver `app/api/auth/[...nextauth]/authOptions.ts`), la URL del backend y `SUPER_ADMIN_EMAIL`. Estas no están documentadas en código fuente visible; deben definirse en `.env.local`.

## Tecnologías clave

- **Next.js** (App Router) con React Server Components y Client Components (`"use client"`)
- **NextAuth** para sesiones y autenticación OAuth/credentials
- **Tailwind CSS** + `tailwind-variants` + `clsx` / `tailwind-merge` para estilos
- **React Hook Form** + `zod` + `@hookform/resolvers` para formularios validados
- **Framer Motion** para animaciones
- **Sentry** (`@sentry/nextjs`) para monitoreo de errores en producción
- **Playwright** para tests end-to-end
