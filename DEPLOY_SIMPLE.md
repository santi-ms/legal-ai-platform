# 🚀 Deploy Simple a Vercel (Sin PostgreSQL por ahora)

## ✅ Lo que VAS A HACER

Vercel automáticamente usa **SQLite** si no configurás PostgreSQL. Para producción podés migrar después.

---

## 📋 PASOS (15 minutos)

### 1️⃣ Preparar Código
```bash
# Volver a SQLite para deploy inicial
# (ya está configurado)
```

### 2️⃣ Push a GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 3️⃣ Deploy en Vercel
1. Ir a https://vercel.com
2. Sign Up con GitHub
3. Click "Add New Project"
4. Importar tu repo

### 4️⃣ Configurar Build
- **Root Directory**: `apps/web`
- **Build Command**: (dejar por defecto)
- **Output Directory**: `.next` (automático)

### 5️⃣ Agregar Variables de Entorno
Click en "Environment Variables" y agregar:

```env
# NextAuth
NEXTAUTH_URL=https://tu-proyecto.vercel.app
NEXTAUTH_SECRET=<generar con script>

# OpenAI
OPENAI_API_KEY=<tu key real>

# Database (SQLite para empezar)
DATABASE_URL=file:./data/dev.db
```

### 6️⃣ Deploy Backend (Railway)
1. Ir a https://railway.app
2. New Project → Deploy from GitHub
3. Variables:
   - `DATABASE_URL=file:./data/dev.db`
   - `OPENAI_API_KEY=<tu key>`
   - `PORT=4001`

### 7️⃣ Actualizar Frontend
En Vercel, agregar:
```env
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
```

---

## 🎯 Después del Deploy Inicial

Una vez funcionando, podés migrar a Supabase:
1. Configurar Supabase con pooler
2. Actualizar DATABASE_URL
3. Redeploy

---

**¿Seguimos con este enfoque más simple?**

