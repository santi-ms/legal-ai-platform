# ✅ Listo para deploy en Railway

## Fix aplicado

Se corrigió el error `ERR_UNKNOWN_FILE_EXTENSION` que impedía que Railway ejecutara el backend. Los cambios fueron:

1. **Copiado `prisma` a `apps/api`**: Prisma necesita encontrar `schema.prisma` en el mismo directorio durante el build
2. **Reemplazo de `db` package**: En lugar de importar desde el package `db` (que es `.ts`), ahora se importa directamente `PrismaClient` desde `@prisma/client`
3. **Scripts actualizados**: `postinstall` ahora genera Prisma Client correctamente

## Variables para Railway

Cuando Railway esté desplegando automáticamente, agregá estas variables:

### Base
```
PORT=4001
```

### Database
```
DATABASE_URL=postgresql://postgres.xtlmuqbsliszxcpwawgd:Ltqkmmx635@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

### OpenAI
```
OPENAI_API_KEY=tu_api_key_aqui
```
*(Ver `COMO_OBTENER_OPENAI_KEY.md` para obtener la API key)*

### Frontend
```
FRONTEND_URL=https://legal-ai-platform-orcin.vercel.app
```

### PDF Service
```
PDF_SERVICE_URL=http://pdf-service.railway.app:4100
```
*(Este URL lo vas a tener después del deploy del PDF service)*

---

## Próximos pasos

1. ✅ Código pusheado
2. ⏳ Railway va a detectar los cambios automáticamente
3. ⏳ Agregá las variables de entorno cuando el deploy falle por falta de variables
4. ⏳ Deploy del PDF service (segundo servicio en Railway)

