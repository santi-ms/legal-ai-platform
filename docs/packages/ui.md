---
title: "Ui"
source:
  - "packages/ui/**"
generated: true
lastSync:
  sourceCommit: "4030ba85a7923a0fce905433b06bf876327f34a1"
  docHash: "ef035b207050"
---
El paquete `@repo/ui` es una biblioteca de componentes React compartida consumida por las aplicaciones del monorepo (principalmente `apps/web` y `apps/docs`).

## Ubicación

```
packages/ui/
└── src/
    ├── button.tsx
    ├── card.tsx
    └── code.tsx
```

## Componentes

### `Button`

Componente de cliente (`"use client"`). Renderiza un `<button>` que al hacer clic muestra un `alert` con el nombre de la aplicación que lo instancia.

```tsx
import { Button } from "@repo/ui";

<Button appName="web" className="btn-primary">
  Hacer algo
</Button>
```

**Props**

| Prop | Tipo | Requerido | Descripción |
|---|---|---|---|
| `children` | `ReactNode` | Sí | Contenido del botón |
| `appName` | `string` | Sí | Nombre de la app, usado en el mensaje del `alert` |
| `className` | `string` | No | Clases CSS adicionales |

> El comportamiento del `onClick` está fijo en un `alert`. Para uso en producción dentro de `apps/web` conviene reemplazar o extender este componente localmente.

---

### `Card`

Renderiza un enlace `<a>` con `target="_blank"` que envuelve un título y contenido arbitrario. Agrega automáticamente parámetros UTM al `href` recibido.

```tsx
import { Card } from "@repo/ui";

<Card href="https://example.com" title="Mi recurso">
  Descripción breve del recurso.
</Card>
```

**Props**

| Prop | Tipo | Requerido | Descripción |
|---|---|---|---|
| `title` | `string` | Sí | Texto del encabezado `<h2>` |
| `href` | `string` | Sí | URL base del enlace |
| `children` | `React.ReactNode` | Sí | Contenido del párrafo |
| `className` | `string` | No | Clases CSS adicionales |

---

### `Code`

Envuelve contenido en una etiqueta `<code>` semántica.

```tsx
import { Code } from "@repo/ui";

<Code className="text-sm">npm install</Code>
```

**Props**

| Prop | Tipo | Requerido | Descripción |
|---|---|---|---|
| `children` | `React.ReactNode` | Sí | Contenido del elemento `<code>` |
| `className` | `string` | No | Clases CSS adicionales |

## Uso desde otras apps

El paquete se referencia como `@repo/ui` en los `package.json` de las aplicaciones consumidoras. No incluye estilos propios; el estilado depende de las clases que pase cada app mediante `className`.

## Estado actual

Los tres componentes existentes son de infraestructura básica del scaffold de Turborepo. La biblioteca está pensada para crecer con componentes reutilizables a medida que se extraigan piezas comunes de `apps/web`.
