# 🚂 Deploy Backend a Railway

## ¿Por Qué Railway?

Tu aplicación tiene **3 servicios separados**:
1. ✅ **Frontend (Next.js)** → Vercel
2. ❌ **Backend API (Fastify)** → puerto 4001
3. ❌ **PDF Service (Fastify)** → puerto 4100

Vercel solo despliega el frontend. El backend y el PDF service **deben ir a Railway**.

---

## Opciones de Deploy

### Opción 1: Railway (Recomendado)

**Ventajas:**
- ✅ Fácil para backend Node.js
- ✅ Soporta monorepos
- ✅ Variables de entorno
- ✅ Logs en tiempo real
- ✅ Deploy automático desde GitHub

**Desventajas:**
- ⚠️ Tienes que crear cuenta

---

### Opción 2: Render.com

Similar a Railway, también recomendado.

---

## Pasos para Deploy en Railway

### 1️⃣ Crear Cuenta
- Ir a https://railway.app
- Conectar con GitHub
- Dar permisos a tu repo

### 2️⃣ Crear Proyecto
- Dashboard → "New Project"
- Seleccionar "Deploy from GitHub repo"
- Elegir `legal-ai-platform`

### 3️⃣ Configurar Servicios

Railway detectará los servicios automáticamente. Tienes que configurar:

#### **Service 1: Backend API**
- **Root Directory:** `apps/api`
- **Start Command:** `npm run dev` o `tsx src/server.ts`
- **Variables de Entorno:**
  ```env
  DATABASE_URL=postgresql://postgres.xtlmuqbsliszxcpwawgd:Ltqkmmx635@aws-1-us-east-1.pooler.supabase.com:5432/postgres
  OPENAI_API_KEY=tu_api_key
  PORT=4001
  ```

#### **Service 2: PDF Service**
- **Root Directory:** `services/pdf`
- **Start Command:** `npm run dev` o `tsx src/server.ts`
- **Variables de Entorno:**
  ```env
  PORT=4100
  ```

### 4️⃣ Configurar URLs

Después del deploy, Railway te dará URLs como:
- `https://api-production.up.railway.app` (backend)
- `https://pdf-production.up.railway.app` (PDF)

### 5️⃣ Actualizar Frontend

**Editar `apps/web/app/lib/api.ts`:**

```typescript
// Antes (localhost):
const API_URL = "http://localhost:4001";
const PDF_SERVICE_URL = "http://localhost:4100";

// Después (producción):
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";
const PDF_SERVICE_URL = process.env.NEXT_PUBLIC_PDF_SERVICE_URL || "http://localhost:4100";
```

**Agregar a Vercel:**
- `NEXT_PUBLIC_API_URL` → `https://api-production.up.railway.app`
- `NEXT_PUBLIC_PDF_SERVICE_URL` → `https://pdf-production.up.railway.app`

---

## Problemas Comunes

### ❌ "Cannot find module 'db'"

Railway no está instalando el package `db`. 

**Fix:** Agregar a cada `package.json`:
```json
{
  "dependencies": {
    "db": "*"
  }
}
```

### ❌ "Prisma client not generated"

**Fix:** Agregar a cada servicio:
```json
{
  "scripts": {
    "postinstall": "cd ../../packages/db && npx prisma generate"
  }
}
```

### ❌ "Port already in use"

Railway asigna puertos dinámicos. **No hardcodear**:

```typescript
// apps/api/src/server.ts
const PORT = process.env.PORT || 4001;
```

---

## Costos

- **Free Tier:** $5 créditos gratis/mes
- **Hobby:** ~$20/mes
- Para 100 usuarios, probablemente necesites **Hobby Plan**

---

## Alternativa Rápida (Temporal)

Si querés probar rápido **sin deployar backend**:

### Mover API Routes a Next.js

Convertir `apps/api/src/routes.documents.ts` a **API Routes de Next.js** en:
- `apps/web/app/api/documents/route.ts`
- `apps/web/app/api/documents/generate/route.ts`
- etc.

**Ventaja:** Todo en Vercel, sin servidor extra.

**Desventaja:** Timeouts de Vercel (10s), no ideal para IA.

---

## Recomendación

**Para producción:** Railway (o Render) para backend  
**Para prototipo rápido:** API Routes de Next.js en Vercel

---

## Próximos Pasos

1. ✅ Crear cuenta en Railway
2. ✅ Conectar GitHub
3. ✅ Deploy backend API
4. ✅ Deploy PDF service
5. ✅ Configurar variables de entorno
6. ✅ Actualizar URLs en Vercel
7. ✅ Probar end-to-end

---

¿Necesitás ayuda con algún paso específico?

