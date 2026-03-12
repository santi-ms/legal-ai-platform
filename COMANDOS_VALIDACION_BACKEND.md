# 🔧 Comandos de Validación - Backend

## 📋 Secuencia de Comandos

### 1. Aplicar Migración de Prisma

```bash
# Desde la raíz del proyecto
cd packages/db
npx prisma migrate deploy --schema prisma/schema.prisma
```

**Qué observar**:
- Debe mostrar: `Applied migration: 20250111195936_add_structured_document_fields`
- No debe haber errores de conexión
- Si hay errores, verificar que `DATABASE_URL` esté configurado

### 2. Regenerar Prisma Client

```bash
# Desde packages/db
npx prisma generate --schema prisma/schema.prisma

# O desde apps/api (si usa schema local)
cd ../../apps/api
npx prisma generate --schema prisma/schema.prisma
```

**Qué observar**:
- Debe mostrar: `Generated Prisma Client`
- No debe haber errores de TypeScript
- Los tipos de `DocumentVersion` deben incluir los nuevos campos

### 3. Reiniciar Backend

```bash
# Detener proceso actual si está corriendo
# Luego desde apps/api:
cd apps/api
npm run dev
```

**Qué observar**:
- Debe iniciar sin errores
- Debe mostrar: `[server] Document registry initialized`
- Debe mostrar: `[api] listening on 4001` (o el puerto configurado)
- No debe haber errores de Prisma sobre columnas faltantes

### 4. Ejecutar Tests

```bash
# Desde apps/api (en otra terminal, con backend corriendo)
cd apps/api
npm run test:generation
```

**Qué observar en los resultados**:

#### ✅ Caso Mínimo Válido
- Status: **200** (no 500)
- Response debe tener: `documentId`, `contrato`, `warnings`, `metadata`
- En logs de persistencia:
  ```
  ✓ StructuredData persisted: true
  ✓ ClausePlan persisted: true
  ✓ Warnings persisted: true
  ✓ TemplateVersion persisted: 1.0.0
  ✓ Status persisted: generated
  ```

#### ✅ Caso Completo
- Status: **200**
- Contrato debe contener cláusulas opcionales (confidencialidad, IP, rescisión)
- `clausePlan.optional` debe tener elementos
- `structuredData` debe tener todos los campos opcionales

#### ✅ Caso Inválido
- Status: **400** (no 500)
- Error debe ser: `"validation_error"`
- Message debe contener: "Si defines un monto de penalización..."

#### ✅ Caso con Warnings
- Status: **200** (warnings no bloquean)
- `response.warnings` debe ser un array con al menos 1 warning
- Warnings deben tener: `id`, `ruleId`, `message`, `severity`

#### ✅ Backward Compatible
- Status: **200**
- `document.type` en DB debe ser `"contrato_servicios"` (formato viejo preservado)
- `structuredData` debe existir (mapeado desde formato viejo)

### 5. Verificación en Base de Datos (Opcional)

```sql
-- Verificar que las columnas existen
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'DocumentVersion'
  AND column_name IN ('structuredData', 'clausePlan', 'generationWarnings', 'templateVersion', 'status');

-- Verificar registros nuevos tienen los campos
SELECT 
  id,
  "versionNumber",
  "structuredData" IS NOT NULL as has_structured_data,
  "clausePlan" IS NOT NULL as has_clause_plan,
  "templateVersion",
  "status"
FROM "DocumentVersion"
ORDER BY "createdAt" DESC
LIMIT 5;
```

## ✅ Checklist de Validación

- [ ] Migración aplicada sin errores
- [ ] Prisma Client regenerado
- [ ] Backend inicia sin errores
- [ ] Tests pasan (5/5)
- [ ] Persistencia de `structuredData` confirmada
- [ ] Persistencia de `clausePlan` confirmada
- [ ] Persistencia de `generationWarnings` confirmada
- [ ] Persistencia de `templateVersion` confirmada
- [ ] Persistencia de `status` confirmada
- [ ] Backward compatibility funciona
- [ ] Validación semántica retorna 400 (no 500)

## 🚨 Problemas Comunes

### Error: "column does not exist"
**Solución**: La migración no se aplicó. Ejecutar `npx prisma migrate deploy` nuevamente.

### Error: "Prisma Client out of sync"
**Solución**: Regenerar Prisma Client con `npx prisma generate`.

### Error: "Validation failed" retorna 500
**Solución**: Reiniciar backend para cargar código actualizado.

### Tests fallan con "fetch failed"
**Solución**: Backend no está corriendo. Iniciar con `npm run dev`.

