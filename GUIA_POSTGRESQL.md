# 🗄️ Guía de Migración a PostgreSQL

## ¿Por qué PostgreSQL para Producción?

Para una base de datos con 100 usuarios y escalabilidad para Android/web, PostgreSQL es la mejor opción:
- ✅ **Concurrencia**: Múltiples usuarios simultáneos sin bloqueos
- ✅ **Escalabilidad**: Maneja millones de registros eficientemente
- ✅ **Relaciones**: JOINs complejos sin problema de performance
- ✅ **Backups**: Herramientas profesionales de backup automático
- ✅ **Integración**: Perfecto con Supabase para hosting gratuito

---

## 🚀 Migración con Supabase (Recomendado)

### Paso 1: Crear cuenta en Supabase
1. Ir a https://supabase.com
2. Crear cuenta gratuita
3. Nuevo proyecto

### Paso 2: Obtener DATABASE_URL
1. Settings → Database
2. Copiar la **Connection String** (URI)
   ```
   postgresql://postgres:[TU_PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### Paso 3: Actualizar Schema
```bash
cd packages/db
```

Editar `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Paso 4: Ejecutar Migraciones
```bash
# Regenerar cliente Prisma
npx prisma generate

# Crear migración
npx prisma migrate dev --name init_postgresql

# Aplicar migraciones a producción
npx prisma migrate deploy
```

---

## 🔄 PostgreSQL Local con Docker (MÁS FÁCIL)

La forma más fácil de tener PostgreSQL en tu máquina es con Docker.

### Opción 1: Docker Compose (Recomendado)

Creá un archivo `docker-compose.yml` en la raíz del proyecto:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: legal-ai-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
      POSTGRES_DB: legal_ai
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

Luego ejecutá:

```bash
# Iniciar PostgreSQL
docker-compose up -d

# Ver logs
docker-compose logs -f postgres

# Detener
docker-compose down

# Detener y eliminar datos
docker-compose down -v
```

**DATABASE_URL para `.env.local`:**
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/legal_ai"
```

### Opción 2: Docker Run Simple

Si no querés usar docker-compose:

```bash
# Ejecutar PostgreSQL en contenedor
docker run --name legal-ai-postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=legal_ai \
  -p 5432:5432 \
  -d postgres:16

# Ver logs
docker logs -f legal-ai-postgres

# Detener
docker stop legal-ai-postgres

# Eliminar
docker rm legal-ai-postgres
```

---

## ⚠️ Diferencias Importantes SQLite → PostgreSQL

### 1. Tipos de Datos
- SQLite es más permisivo con tipos
- PostgreSQL es estricto: `Boolean` debe ser `true/false`, no `0/1`

### 2. Auto-increment
- SQLite: `@default(autoincrement())`
- PostgreSQL: `@default(uuid())` ✅ (ya lo usamos)

### 3. Consultas
- PostgreSQL requiere JOINs explícitos
- SQLite es más flexible con WHERE

### 4. Transacciones
- PostgreSQL usa row-level locking
- Mejor performance con concurrencia

---

## 🧪 Verificar Migración

### 1. Probar Conexión
```bash
cd packages/db
npx prisma db pull  # Traer schema desde PostgreSQL
npx prisma studio   # Abrir UI de la BD
```

### 2. Datos de Prueba
```bash
# Insertar tenant de prueba
npx prisma db seed
```

### 3. Verificar Aplicación
```bash
# Desde la raíz
npm run dev

# Probar login/registro y generación de documentos
```

---

## 🔐 Seguridad PostgreSQL

### Variables de Entorno
```env
# Producción (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Connection Pooling (recomendado)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true"
```

### Buenas Prácticas
1. ✅ Usar Connection Pooling
2. ✅ Credenciales en variables de entorno
3. ✅ Backups automáticos (Supabase lo hace)
4. ✅ SSL obligatorio en producción
5. ✅ IP whitelist en Supabase

---

## 📊 Performance

### Índices Recomendados
```sql
-- Ya incluidos en Prisma @unique
CREATE INDEX idx_documents_tenant ON "Document"(tenantId);
CREATE INDEX idx_documents_created ON "Document"(createdAt DESC);
CREATE INDEX idx_users_email ON "User"(email);
```

### Connection Pooling
Supabase incluye PgBouncer automático. Usar puerto **6543** en lugar de **5432**.

---

## 🆘 Troubleshooting

### Error: "password authentication failed"
- Verificar password en DATABASE_URL
- Reset password en Supabase Dashboard

### Error: "SSL required"
- Agregar `?sslmode=require` a DATABASE_URL
- Supabase lo requiere

### Error: "too many connections"
- Usar connection pooling (puerto 6543)
- Limitar max connections en Prisma

### Error: "relation does not exist"
- Ejecutar `npx prisma migrate deploy`
- Verificar que migrations estén aplicadas

---

## ✅ Checklist Post-Migración

- [ ] Schema Prisma actualizado a `postgresql`
- [ ] DATABASE_URL configurado correctamente
- [ ] Migraciones ejecutadas (`migrate deploy`)
- [ ] Prisma generate ejecutado
- [ ] Login/registro funcionando
- [ ] Generación de documentos funcionando
- [ ] Prisma Studio muestra datos
- [ ] Backups automáticos activados

---

## 📚 Recursos

- [Supabase Docs](https://supabase.com/docs)
- [Prisma + PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)

---

**Nota:** Para desarrollo local, podés seguir usando SQLite. La migración a PostgreSQL es solo para producción.

