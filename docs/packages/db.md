---
title: "Db"
source:
  - "packages/db/**"
generated: true
lastSync:
  sourceCommit: "4030ba85a7923a0fce905433b06bf876327f34a1"
  docHash: "028a79a5f8dc"
---
El paquete `db` (nombre de paquete: `db`) centraliza la instancia de Prisma Client compartida por las aplicaciones del monorepo. Su punto de entrada es `packages/db/index.ts`.

## Uso

Importar desde cualquier aplicación del monorepo que declare `db` como dependencia:

```ts
import { prisma } from "db";
// o
import db from "db";
const { prisma } = db;
```

## Singleton de PrismaClient

En entornos de desarrollo con hot reload (Next.js, tsx watch, etc.) cada recarga de módulo podría crear una nueva conexión a la base de datos. Para evitarlo, la instancia se almacena en `globalThis`:

```ts
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prismaInstance =
  globalForPrisma.prisma ??
  new PrismaClient({ ... });

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prismaInstance;
}
```

Solo se crea una instancia por proceso.

## Límite de conexiones

La función interna `buildUrl` agrega automáticamente `connection_limit=3` a `DATABASE_URL` si el parámetro no está ya presente. Esto evita agotar el pool de sesiones de Supabase:

```
postgresql://user:pass@host/db?connection_limit=3
```

Si la variable `DATABASE_URL` ya incluye `connection_limit=`, la URL se usa tal cual.

## Logging

El nivel de log varía según el entorno:

| `NODE_ENV`     | Niveles activos              |
|----------------|------------------------------|
| `development`  | `error`, `warn`, `query`     |
| Cualquier otro | `error`, `warn`              |

El formato de errores es siempre `"pretty"`.

## Verificación de conexión

La función exportada `checkDatabaseConnection` ejecuta `SELECT 1` y devuelve `true` si la base de datos responde, o `false` y loguea el error en caso contrario:

```ts
import { checkDatabaseConnection } from "db";

const ok = await checkDatabaseConnection();
if (!ok) {
  // manejar fallo de conexión
}
```

## Variables de entorno

| Variable       | Descripción                                      |
|----------------|--------------------------------------------------|
| `DATABASE_URL` | URL de conexión PostgreSQL. Requerida en runtime.|

## Exports

El paquete expone dos formas de importación:

```ts
// Named exports (ESM preferido)
export const prisma: PrismaClient;
export function checkDatabaseConnection(): Promise<boolean>;

// Default export (compatibilidad CJS)
export default { prisma, checkDatabaseConnection };
```
