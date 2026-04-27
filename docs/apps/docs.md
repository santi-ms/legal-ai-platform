---
title: "Docs"
source:
  - "apps/docs/**"
generated: true
lastSync:
  sourceCommit: "4030ba85a7923a0fce905433b06bf876327f34a1"
  docHash: "3a5775208292"
---
## Descripción

`apps/docs` es una aplicación Next.js generada como plantilla de inicio dentro del monorepo Turborepo. En este momento funciona como página de bienvenida estándar de Turborepo y **no contiene documentación real del proyecto**. Es un punto de partida pensado para ser reemplazado con contenido propio.

## Estructura

```
apps/docs/
└── app/
    ├── globals.css        # Variables CSS globales (colores light/dark)
    ├── layout.tsx         # Layout raíz con fuentes Geist
    ├── page.module.css    # Estilos específicos de la página principal
    └── page.tsx           # Página de inicio (plantilla Turborepo)
```

## Stack

- **Next.js** con App Router
- **React** y **React DOM**
- **`@repo/ui`** — paquete de componentes compartido del monorepo (se usa el componente `Button` en `page.tsx`)

No tiene base de datos, autenticación ni rutas de API propias.

## Fuentes tipográficas

El layout carga dos fuentes locales mediante `next/font/local`:

| Variable CSS | Archivo |
|---|---|
| `--font-geist-sans` | `app/fonts/GeistVF.woff` |
| `--font-geist-mono` | `app/fonts/GeistMonoVF.woff` |

## Tema claro/oscuro

`globals.css` define las variables `--background` y `--foreground` con soporte automático para `prefers-color-scheme: dark`. El componente `ThemeImage` en `page.tsx` alterna entre dos imágenes (`.imgLight` / `.imgDark`) usando las clases CSS correspondientes.

## Estado actual

La aplicación muestra la pantalla por defecto de Turborepo. Para extenderla como documentación real del proyecto se debe reemplazar el contenido de `app/page.tsx` y agregar las rutas y páginas necesarias. No existe ninguna página adicional más allá de la raíz.
