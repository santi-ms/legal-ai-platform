---
title: "Eslint config"
source:
  - "packages/eslint-config/**"
generated: true
lastSync:
  sourceCommit: "4030ba85a7923a0fce905433b06bf876327f34a1"
  docHash: "5e895c3cc1c7"
---
El paquete `@repo/eslint-config` centraliza las configuraciones de ESLint compartidas en el monorepo. Es privado y no se publica a npm; los demás paquetes y aplicaciones lo consumen mediante el alias de workspace `@repo/eslint-config`.

## Configuraciones disponibles

El `package.json` expone tres entradas:

| Export | Archivo | Uso recomendado |
|--------|---------|-----------------|
| `@repo/eslint-config/base` | `base.js` | Paquetes TypeScript sin UI |
| `@repo/eslint-config/next-js` | `next.js` | Aplicaciones Next.js (`apps/web`, `apps/docs`) |
| `@repo/eslint-config/react-internal` | `react-internal.js` | Paquetes de componentes React (`packages/ui`) |

## Detalle de cada configuración

### `base`

Configuración base para cualquier proyecto TypeScript del monorepo. Incluye:

- `@eslint/js` — reglas recomendadas de JavaScript.
- `typescript-eslint` — reglas recomendadas de TypeScript.
- `eslint-config-prettier` — desactiva las reglas que puedan entrar en conflicto con Prettier.
- `eslint-plugin-turbo` — advierte sobre variables de entorno no declaradas en `turbo.json` (`turbo/no-undeclared-env-vars`).
- `eslint-plugin-only-warn` — convierte todos los errores en advertencias, evitando que el linter bloquee builds durante el desarrollo.
- Ignora el directorio `dist/**`.

### `next-js`

Extiende `base` y añade soporte completo para aplicaciones Next.js:

- `@next/eslint-plugin-next` — reglas `recommended` y `core-web-vitals` de Next.js.
- `eslint-plugin-react` — configuración `flat.recommended` con globals de `serviceworker`.
- `eslint-plugin-react-hooks` — reglas recomendadas de hooks.
- `react/react-in-jsx-scope` desactivado (no es necesario con el nuevo JSX transform).
- Ignora `.next/**`, `out/**`, `build/**` y `next-env.d.ts`.

### `react-internal`

Extiende `base` para paquetes de componentes React que no usan Next.js:

- `eslint-plugin-react` — configuración `flat.recommended`.
- `eslint-plugin-react-hooks` — reglas recomendadas.
- Globals de `serviceworker` y `browser`.
- `react/react-in-jsx-scope` desactivado.

## Uso

En el `eslint.config.js` de la aplicación o paquete correspondiente:

```js
// Aplicación Next.js
import { nextJsConfig } from "@repo/eslint-config/next-js";

export default [...nextJsConfig];
```

```js
// Paquete de componentes React
import { config } from "@repo/eslint-config/react-internal";

export default [...config];
```

```js
// Paquete TypeScript puro
import { config } from "@repo/eslint-config/base";

export default [...config];
```

## Plugins incluidos

| Plugin | Versión declarada |
|--------|------------------|
| `@eslint/js` | `^9.34.0` |
| `typescript-eslint` | `^8.40.0` |
| `eslint-config-prettier` | `^10.1.1` |
| `eslint-plugin-turbo` | `^2.5.0` |
| `eslint-plugin-only-warn` | `^1.1.0` |
| `eslint-plugin-react` | `^7.37.5` |
| `eslint-plugin-react-hooks` | `^5.2.0` |
| `@next/eslint-plugin-next` | `^15.5.0` |
| `globals` | `^16.3.0` |
