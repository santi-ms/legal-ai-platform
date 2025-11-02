# 🐳 Setup Rápido con Docker

La forma más fácil de tener PostgreSQL funcionando.

---

## 📋 Requisitos Previos

- Docker Desktop instalado ([Descargar](https://www.docker.com/products/docker-desktop))
- Node.js y npm instalados

---

## 🚀 Inicio Rápido (3 pasos)

### 1. Iniciar PostgreSQL con Docker

```bash
# Iniciar contenedor PostgreSQL
docker-compose up -d

# Verificar que está corriendo
docker-compose ps
```

Deberías ver:
```
NAME                  IMAGE               STATUS
legal-ai-postgres     postgres:16-alpine  Up
```

### 2. Configurar Base de Datos

Editar `packages/db/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Ejecutar Migraciones

```bash
cd packages/db

# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones
npx prisma migrate dev --name init_postgresql
```

### 4. Configurar Variables de Entorno

Crear/editar `.env.local` en `apps/web/`:

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/legal_ai"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-aqui"
OPENAI_API_KEY="tu-openai-key"
```

---

## ✅ Verificar que Funciona

```bash
# Abrir Prisma Studio (UI visual de la BD)
cd packages/db
npx prisma studio
```

Se abrirá en http://localhost:5555

---

## 🛠️ Comandos Útiles

```bash
# Ver logs de PostgreSQL
docker-compose logs -f postgres

# Detener PostgreSQL
docker-compose stop

# Reiniciar PostgreSQL
docker-compose restart

# Detener y eliminar contenedor
docker-compose down

# Detener y eliminar contenedor + datos
docker-compose down -v

# Conectarse a PostgreSQL desde terminal
docker-compose exec postgres psql -U postgres -d legal_ai
```

---

## 🐛 Troubleshooting

### Error: "port 5432 already in use"
```bash
# Ver qué está usando el puerto
netstat -ano | findstr :5432  # Windows
lsof -i :5432                # Mac/Linux

# Cambiar puerto en docker-compose.yml:
ports:
  - "5433:5432"  # Usar 5433 en tu máquina
```

### Error: "password authentication failed"
Verificar que `.env.local` tenga la contraseña correcta:
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/legal_ai"
```

### Error: "database does not exist"
```bash
# Crear base de datos manualmente
docker-compose exec postgres psql -U postgres
CREATE DATABASE legal_ai;
\q
```

### Limpiar Todo y Empezar de Nuevo
```bash
# Detener y eliminar contenedor + datos
docker-compose down -v

# Eliminar node_modules y reinstalar
rm -rf node_modules packages/*/node_modules
npm install

# Reiniciar
docker-compose up -d
cd packages/db && npx prisma migrate deploy
```

---

## 📊 SQLite vs PostgreSQL

### Desarrollo Local

**SQLite** (actual):
- ✅ No requiere configuración
- ✅ Archivo simple (`dev.db`)
- ❌ Limitado para producción
- ❌ Sin concurrencia real

**PostgreSQL con Docker**:
- ✅ Igual que producción
- ✅ Performance mejor
- ✅ Concurrencia real
- ⚠️ Requiere Docker

### Recomendación

Para empezar rápido: **SQLite**  
Para prepararte para producción: **PostgreSQL con Docker**

---

## 🔄 Migración de Datos

Si tenés datos en SQLite y querés migrarlos a PostgreSQL:

```bash
# 1. Exportar datos desde SQLite
cd packages/db
npx prisma db push  # Asegurarse de tener todo en schema

# 2. Cambiar a PostgreSQL en schema.prisma
# 3. Iniciar Docker
docker-compose up -d

# 4. Aplicar migraciones
npx prisma migrate dev --name init_postgresql

# Los datos de SQLite se perderán, pero el esquema se creará
```

---

## 🎯 Siguientes Pasos

Una vez que PostgreSQL esté funcionando:

1. ✅ Probar login/registro
2. ✅ Generar documentos con IA
3. ✅ Verificar datos en Prisma Studio
4. 📦 Preparar para deploy a producción (Supabase)

---

**¿Necesitás ayuda?** Abrí Prisma Studio y explorá tu base de datos:
```bash
cd packages/db
npx prisma studio
```

