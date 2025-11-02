# ⚡ Inicio Rápido - Legal AI Platform

## 🐳 Setup más Fácil con Docker

### 1️⃣ Iniciar PostgreSQL

```bash
docker-compose up -d
```

¡Listo! PostgreSQL está corriendo en `localhost:5432`.

### 2️⃣ Configurar Prisma

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

### 3️⃣ Ejecutar Migraciones

```bash
npx prisma generate
npx prisma migrate dev --name init_postgresql
```

### 4️⃣ Configurar Variables

Crear `apps/web/.env.local`:
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/legal_ai"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-aqui"
OPENAI_API_KEY="tu-openai-key"
```

### 5️⃣ Iniciar Aplicación

```bash
# Volver a la raíz
cd ../..

# Iniciar todo
npm run dev
```

### 6️⃣ Verificar

- Frontend: http://localhost:3000
- Prisma Studio: `cd packages/db && npx prisma studio`
- Ver Base de Datos: http://localhost:5555

---

## 🎯 Comandos Útiles

```bash
# Ver logs de PostgreSQL
docker-compose logs -f postgres

# Detener PostgreSQL
docker-compose down

# Limpiar todo y empezar de nuevo
docker-compose down -v
cd packages/db && npx prisma migrate deploy
```

---

## ❓ Problemas Comunes

**Puerto ocupado?**
```bash
# Cambiar puerto en docker-compose.yml:
ports:
  - "5433:5432"  # Usa 5433 en tu máquina
```

**No conecta?**
```bash
# Verificar que esté corriendo
docker-compose ps

# Ver logs
docker-compose logs postgres
```

**Sin datos?**
```bash
# Ver Prisma Studio
cd packages/db
npx prisma studio
```

---

## 📚 Más Info

- Setup detallado: `README_DOCKER.md`
- Guía completa: `GUIA_POSTGRESQL.md`
- Checklist producción: `CHECKLIST_PRODUCCION.md`

