# 🚀 Guía de Deploy a Vercel - Legal AI Platform

## 📋 Prerrequisitos

- ✅ Cuenta en Vercel (gratis)
- ✅ Cuenta en Supabase (gratis)
- ✅ Código en GitHub

---

## 🗄️ PASO 1: Setup Supabase (20 min)

### 1.1 Crear Proyecto en Supabase
1. Ir a https://supabase.com
2. Sign Up con GitHub
3. Click en "New Project"
4. Llenar datos:
   - **Name**: legal-ai-platform
   - **Database Password**: Generar contraseña fuerte
   - **Region**: South America (Sao Paulo) - más cerca a Argentina
   - **Pricing Plan**: Free

### 1.2 Obtener Connection String
1. Ir a Settings → Database
2. Buscar "Connection string"
3. Copiar "URI" (que dice "postgresql://postgres...")
4. Ejemplo:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxx.supabase.co:5432/postgres
   ```

### 1.3 Aplicar Migraciones
```bash
# En tu máquina local
cd packages/db

# Configurar DATABASE_URL temporalmente
$env:DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Aplicar migraciones
npx prisma migrate deploy

# Verificar con Prisma Studio
npx prisma studio
```

---

## 🌐 PASO 2: Deploy a Vercel (15 min)

### 2.1 Preparar Código
```bash
# Push a GitHub si no lo hiciste
git add .
git commit -m "Ready for production"
git push origin main
```

### 2.2 Importar en Vercel
1. Ir a https://vercel.com
2. Sign Up con GitHub
3. Click "Add New Project"
4. Importar tu repo de GitHub
5. Configurar:

#### Root Directory
```
apps/web
```

#### Build Settings (Auto-detected):
- Framework: Next.js
- Build Command: `cd ../.. && npm install && cd apps/web && npm run build`
- Output Directory: `.next`

#### Environment Variables:
Agregar estas variables:

```env
# Database (Session Pooler de Supabase)
DATABASE_URL=postgresql://postgres.xtlmuqbsliszxcpwawgd:Ltqkmmx635@aws-1-us-east-1.pooler.supabase.com:5432/postgres

# NextAuth
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=[generar con: node scripts/generate-secrets.js]

# OpenAI
OPENAI_API_KEY=sk-proj-tu-key-real-aqui

# API Backend
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
```

### 2.3 Deploy Automático
1. Click "Deploy"
2. Esperar build (~3 minutos)
3. Abrir URL generada: `https://legal-ai-platform.vercel.app`

---

## 🔧 PASO 3: Setup Backend API (Railway) (20 min)

### 3.1 Importar en Railway
1. Ir a https://railway.app
2. Sign Up con GitHub
3. New Project → Deploy from GitHub
4. Seleccionar tu repo
5. Agregar "Empty Service"

### 3.2 Configurar API Service
1. Click en el servicio
2. Settings → Variables
3. Agregar:

```env
DATABASE_URL=postgresql://postgres.xtlmuqbsliszxcpwawgd:Ltqkmmx635@aws-1-us-east-1.pooler.supabase.com:5432/postgres
PORT=4001
OPENAI_API_KEY=sk-proj-tu-key-real-aqui
```

4. Settings → Generate Domain → Copiar URL (ej: `legal-ai.railway.app`)

### 3.3 Actualizar Frontend
Vuelve a Vercel:
1. Environment Variables
2. Editar `NEXT_PUBLIC_API_URL`: `https://legal-ai.railway.app`
3. Redeploy

---

## 🔒 PASO 4: Generar Secrets Seguros

### 4.1 Generar NEXTAUTH_SECRET
```bash
node scripts/generate-secrets.js
```

Copiar el valor generado a:
- Vercel: `NEXTAUTH_SECRET`
- No commitearlo al repo

### 4.2 Verificar Variables
**En Vercel deben estar:**
- ✅ DATABASE_URL
- ✅ NEXTAUTH_URL
- ✅ NEXTAUTH_SECRET
- ✅ OPENAI_API_KEY
- ✅ NEXT_PUBLIC_API_URL

**En Railway deben estar:**
- ✅ DATABASE_URL
- ✅ PORT=4001
- ✅ OPENAI_API_KEY

---

## 🎯 PASO 5: Dominio Personalizado (Opcional) (15 min)

### 5.1 Comprar Dominio
- Namecheap, GoDaddy, etc.
- Precio: ~$10-15/año

### 5.2 Configurar DNS en Vercel
1. Vercel → Settings → Domains
2. Add Domain: `tu-dominio.com`
3. Seguir instrucciones de DNS

### 5.3 Actualizar NEXTAUTH_URL
1. Variables de entorno
2. Cambiar: `NEXTAUTH_URL=https://tu-dominio.com`
3. Redeploy

---

## ✅ PASO 6: Verificar Todo Funciona

### 6.1 Testing
- [ ] Acceder a tu app
- [ ] Registrarse como usuario
- [ ] Login
- [ ] Generar documento
- [ ] Descargar PDF

### 6.2 Monitoreo
- [ ] Vercel → Analytics ver logs
- [ ] Supabase → Database → Tables ver datos
- [ ] Railway → Metrics ver uso

---

## 🐛 Troubleshooting

### Error: "Authentication failed"
- Verificar DATABASE_URL en Supabase
- Verificar que migrations estén aplicadas

### Error: "Module not found"
- Verificar que `apps/web` sea el root directory
- Verificar build command

### Error: "API timeout"
- Verificar NEXT_PUBLIC_API_URL
- Verificar que Railway esté corriendo

### CORS Error
- Verificar que Railway permita requests de Vercel
- Revisar `apps/api/src/server.ts` - CORS config

---

## 💰 Costos Mensuales

### Plan Gratis (Primeros 3 meses):
- **Vercel**: Gratis (100GB bandwidth)
- **Supabase**: Gratis (500MB DB)
- **Railway**: $5/mes (primer mes gratis)
- **Dominio**: $10-15/año
- **OpenAI**: Variable según uso
- **Total**: ~$5-20/mes

### Para Escalar:
- Vercel Pro: $20/mes
- Supabase Pro: $25/mes
- Railway: $20/mes
- **Total**: ~$65/mes

---

## 📊 Escalabilidad

### 100 usuarios (Gratis) ✅
- Vercel: suficiente
- Supabase: suficiente
- Railway: suficiente

### 1000 usuarios (Pro) 💰
- Necesitás upgrades a Vercel Pro
- Supabase sigue gratis
- Railway upgrade

### 10,000+ usuarios (Enterprise) 💰💰
- Dedicated infra necesario
- Supabase Enterprise
- Vercel Enterprise

---

## 🎓 Buenas Prácticas

1. **Backups**: Supabase los hace automáticamente
2. **Monitoreo**: Configurar Sentry para errores
3. **Logs**: Revisar Vercel logs semanalmente
4. **Updates**: Actualizar dependencias mensualmente
5. **Security**: Rotar NEXTAUTH_SECRET cada 6 meses

---

## 📞 Soporte

- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/support
- Railway: https://railway.app/support

---

**¡Tu plataforma está lista para producción! 🎉**

