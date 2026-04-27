---
title: "Typescript config"
source:
  - "packages/typescript-config/**"
generated: true
lastSync:
  sourceCommit: "4030ba85a7923a0fce905433b06bf876327f34a1"
  docHash: "5a83bfd0e0ab"
---
El paquete `@repo/typescript-config` centraliza las configuraciones de TypeScript del monorepo. Otros paquetes y aplicaciones extienden estos archivos en lugar de definir sus propias `compilerOptions` desde cero.

## Archivos disponibles

| Archivo | Uso previsto |
|---|---|
| `base.json` | Base común para todos los entornos |
| `nextjs.json` | Aplicaciones Next.js (`apps/web`, `apps/docs`) |
| `react-library.json` | Paquetes de componentes React (`packages/ui`) |

## `base.json`

Define las opciones compartidas por todas las configuraciones derivadas:

- **`target` / `lib`**: compila a `ES2022` con las libs `es2022`, `DOM` y `DOM.Iterable`.
- **`module` / `moduleResolution`**: usa `NodeNext` en ambos, lo que requiere extensiones explícitas en los imports.
- **`strict`**: activa el modo estricto completo de TypeScript.
- **`noUncheckedIndexedAccess`**: el acceso por índice a arrays y objetos devuelve `T | undefined`, previniendo errores silenciosos.
- **`isolatedModules`**: cada archivo debe ser un módulo independiente; necesario para herramientas como `esbuild` o `tsx`.
- **`declaration` + `declarationMap`**: genera archivos `.d.ts` y sus mapas de fuente, útil para paquetes internos consumidos por otras apps.
- **`incremental: false`**: desactiva la caché incremental para evitar artefactos inesperados en el monorepo.
- **`resolveJsonModule`**: permite importar archivos `.json` directamente.
- **`skipLibCheck`**: omite la verificación de tipos en archivos `.d.ts` de dependencias externas.

## `nextjs.json`

Extiende `base.json` y ajusta opciones para proyectos Next.js:

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowJs": true,
    "jsx": "preserve",
    "noEmit": true
  }
}
```

- Cambia `module` a `ESNext` y `moduleResolution` a `Bundler` porque Next.js gestiona la resolución de módulos internamente.
- `jsx: "preserve"` deja que Next.js transforme el JSX.
- `noEmit: true` delega la emisión de archivos completamente al compilador de Next.js.
- `allowJs: true` permite mezclar archivos `.js` y `.ts` en el mismo proyecto.

## `react-library.json`

Extiende `base.json` para paquetes de componentes React que sí emiten archivos:

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

Usa `jsx: "react-jsx"` (el runtime automático de React 17+), sin necesidad de importar `React` en cada archivo. A diferencia de `nextjs.json`, no activa `noEmit`, por lo que TypeScript genera los `.d.ts` declarados en `base.json`.

## Cómo extender en un paquete o app

En el `tsconfig.json` de cada proyecto, referencia la configuración correspondiente:

```json
// apps/web/tsconfig.json
{
  "extends": "@repo/typescript-config/nextjs.json",
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

```json
// packages/ui/tsconfig.json
{
  "extends": "@repo/typescript-config/react-library.json",
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

No es necesario instalar el paquete como dependencia de producción; basta con declararlo en `devDependencies` o aprovechando la resolución del workspace de Turbo.
