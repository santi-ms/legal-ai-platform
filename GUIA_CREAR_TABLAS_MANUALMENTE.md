# Guía: Crear Tablas Manualmente en Supabase

Si las migraciones de Prisma fallan con el error "FATAL: Tenant or user not found", podés crear las tablas manualmente usando este script SQL.

## Opción 1: Usar el SQL Editor de Supabase (Recomendado)

1. **Abrí el panel de Supabase:**
   - Ve a tu proyecto en [supabase.com](https://supabase.com)
   - Entrá a tu proyecto

2. **Abrí el SQL Editor:**
   - En el menú lateral, buscá "SQL Editor"
   - Click en "New query"

3. **Copiá y pegá el contenido del archivo:**
   - `apps/api/scripts/create-tables-manually.sql`
   - O copiá todo el SQL que está en este archivo

4. **Ejecutá el script:**
   - Click en "Run" o presioná Ctrl+Enter
   - Deberías ver "Success. No rows returned"

5. **Verificá que las tablas se crearon:**
   - Ve a "Table Editor" en el menú lateral
   - Deberías ver las tablas: `Tenant`, `User`, `Document`, etc.

## Opción 2: Usar psql desde la terminal

Si tenés `psql` instalado localmente:

```bash
psql "postgresql://postgres.xtlmuqbsliszxcpwawgd:Ltqkmmx635@aws-1-us-east-1.pooler.supabase.com:6543/postgres" -f apps/api/scripts/create-tables-manually.sql
```

## Después de crear las tablas

1. **Reiniciá el servidor en Railway:**
   - Las migraciones fallarán pero el servidor iniciará
   - El registro debería funcionar ahora

2. **Verificá que todo funciona:**
   - Intentá registrar un usuario
   - Debería funcionar correctamente

## Nota importante

Este script usa `CREATE TABLE IF NOT EXISTS`, así que es seguro ejecutarlo múltiples veces. No va a borrar datos existentes.

