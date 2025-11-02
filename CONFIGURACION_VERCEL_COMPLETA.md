# ✅ Configuración Completa para Vercel

## Variables de Entorno Necesarias

Configura estas variables en **Vercel Settings → Environment Variables**:

### 1. `DATABASE_URL`
```
postgresql://postgres.xtlmuqbsliszxcpwawgd:Ltqkmmx635@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```
✅ Ya configurada

### 2. `NEXTAUTH_SECRET`
```
wYnWuxJRsSvwvEQx3qXeGvQrW/5W98SIcYn76Y6ffqo=
```
🔑 Generado con crypto.randomBytes

### 3. `NEXTAUTH_URL`
```
https://legal-ai-platform.vercel.app
```
⚠️ Cambiá por tu URL real de Vercel

---

## Configuración del Proyecto

### Root Directory
```
apps/web
```

### Build Command
```
npm run build
```
(Déjalo vacío si Next.js lo detecta automáticamente)

### Output Directory
```
.next
```
(Déjalo vacío para Next.js o poné `.next`)

### Install Command
```
npm install
```

---

## Pasos Finales

1. ✅ Push el código a GitHub (ya hecho)
2. ⚙️ Configurar variables de entorno en Vercel
3. 🔄 Hacer redeploy
4. ✅ Probar que funcione

---

## Verificar Deployment

Después del deploy, verificá:
- ✅ Landing page carga (`/`)
- ✅ Login funciona (`/auth/login`)
- ✅ Redirige a login si no estás autenticado
- ✅ Dashboard carga (`/documents`)

