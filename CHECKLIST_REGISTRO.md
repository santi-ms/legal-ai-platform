# Checklist: Solucionar Problema de Registro

## Problemas Identificados

1. ✅ **Error 405 Method Not Allowed** - Ya corregido en el código
2. ⚠️ **Migraciones de base de datos** - Necesitan ejecutarse
3. ⚠️ **Supabase pausado** - Ya reanudado

## Pasos para Solucionar

### 1. Verificar que Supabase esté activo
- [ ] Ir a supabase.com
- [ ] Verificar que el proyecto esté "Active" (no pausado)
- [ ] Esperar 2-3 minutos después de reanudar

### 2. Verificar las migraciones en Railway
- [ ] Ir a Railway → Tu servicio API → Logs
- [ ] Buscar en los logs: `[migrate] ✅ Migraciones aplicadas correctamente`
- [ ] Si ves `[migrate] ❌ Error ejecutando migraciones`, las migraciones fallaron

### 3. Si las migraciones fallan, crear tablas manualmente
- [ ] Ir a Supabase → SQL Editor
- [ ] Copiar el contenido de `apps/api/scripts/create-tables-manually.sql`
- [ ] Pegar y ejecutar en SQL Editor
- [ ] Verificar que las tablas se crearon en "Table Editor"

### 4. Hacer nuevo deploy en Vercel (para el error 405)
- [ ] Ir a Vercel → Tu proyecto
- [ ] Click en "Redeploy" o hacer un push nuevo a GitHub
- [ ] Esperar a que el deploy termine

### 5. Verificar que el registro funcione
- [ ] Ir a la página de registro
- [ ] Intentar registrar un usuario
- [ ] Verificar que no aparezca el error 405
- [ ] Verificar que el usuario se cree correctamente

## Estado Actual

- ✅ Middleware corregido para permitir `/api/_auth`
- ✅ Proxy de registro corregido (mapeo de companyName)
- ✅ Manejo de errores mejorado
- ⚠️ Migraciones pendientes (depende de Supabase)
- ⚠️ Deploy en Vercel puede necesitar actualización

## Próximos Pasos

1. Verificar logs de Railway para ver si las migraciones se ejecutaron
2. Si no, ejecutar el script SQL manualmente en Supabase
3. Hacer redeploy en Vercel si el error 405 persiste

