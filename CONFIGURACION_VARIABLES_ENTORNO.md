# Configuración de Variables de Entorno

## 🚂 Railway (API Backend)

### Variables REQUERIDAS:

1. **`DATABASE_URL`** (OBLIGATORIA)
   - **Puerto: 5432** (pooler de Supabase)
   - Formato: `postgresql://postgres.xxxxx:password@aws-1-us-east-1.pooler.supabase.com:5432/postgres`
   - **Usar el pooler para queries normales** (más eficiente, soporta más conexiones)

2. **`DATABASE_MIGRATION_URL`** (OPCIONAL - solo si las migraciones fallan)
   - **Puerto: 6543** (conexión directa de Supabase)
   - Formato: `postgresql://postgres.xxxxx:password@aws-1-us-east-1.pooler.supabase.com:6543/postgres`
   - **Usar solo para migraciones** si el pooler falla
   - Si no está configurada, se usa `DATABASE_URL` para migraciones

3. **`FRONTEND_URL`** (RECOMENDADA)
   - URL de tu frontend en Vercel
   - Ejemplo: `https://legal-ai-platform.vercel.app`

4. **`PORT`** (OPCIONAL)
   - Puerto donde corre el servidor (Railway lo configura automáticamente)
   - Default: `4001`

---

## 🌐 Vercel (Frontend)

### Variables REQUERIDAS:

1. **`NEXT_PUBLIC_API_URL`** (OBLIGATORIA)
   - URL de tu API en Railway
   - Ejemplo: `https://tu-api.railway.app`
   - **NO incluir `/api` al final**

2. **`NEXTAUTH_SECRET`** (OBLIGATORIA)
   - Secret para NextAuth (generar con: `openssl rand -base64 32`)
   - Debe ser la misma en todos los ambientes

3. **`NEXTAUTH_URL`** (RECOMENDADA)
   - URL completa de tu frontend
   - Ejemplo: `https://legal-ai-platform.vercel.app`
   - Vercel la configura automáticamente como `VERCEL_URL`

### Variables NO NECESARIAS:

- ❌ **`DATABASE_URL`** - **NO LA NECESITÁS**
  - NextAuth usa JWT (no Prisma)
  - El frontend NO se conecta directamente a la base de datos
  - Solo hace requests HTTP a la API

---

## 🔧 Configuración Correcta

### Railway:
```
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-1-us-east-1.pooler.supabase.com:5432/postgres
FRONTEND_URL=https://legal-ai-platform.vercel.app
```

### Vercel:
```
NEXT_PUBLIC_API_URL=https://tu-api.railway.app
NEXTAUTH_SECRET=tu-secret-generado
NEXTAUTH_URL=https://legal-ai-platform.vercel.app
```

---

## ⚠️ Problema Común

Si tenés `DATABASE_URL` en Vercel con un puerto diferente (6543), **eliminala**. No la necesitás y puede causar confusión.

Si las migraciones fallan en Railway con el pooler (5432), agregá `DATABASE_MIGRATION_URL` con el puerto directo (6543).

