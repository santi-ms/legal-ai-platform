# 🚀 Pasos Finales para Vercel

## 1️⃣ Variables de Entorno

Ve a **Vercel Dashboard** → Tu Proyecto → **Settings** → **Environment Variables**

### Agregar estas 3 variables:

#### ✅ `DATABASE_URL`
```
postgresql://postgres.xtlmuqbsliszxcpwawgd:Ltqkmmx635@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

#### 🔑 `NEXTAUTH_SECRET`
```
wYnWuxJRsSvwvEQx3qXeGvQrW/5W98SIcYn76Y6ffqo=
```

#### 🌐 `NEXTAUTH_URL`
```
https://legal-ai-platform.vercel.app
```
⚠️ **Cambiá por tu URL real de Vercel**

---

## 2️⃣ Configuración del Proyecto

Ve a **Settings** → **General**

- **Root Directory:** `apps/web`
- **Build Command:** (vacío, Next.js lo detecta)
- **Output Directory:** (vacío o `.next`)
- **Install Command:** `npm install`

---

## 3️⃣ Deploy

Después de agregar las variables:

1. Ir a **Deployments**
2. Click en el último deployment
3. **"Redeploy"**
4. Esperar que termine

---

## 4️⃣ Probar

Verificar:
- ✅ Landing page carga: `/`
- ✅ Login funciona: `/auth/login`
- ✅ Redirige a login si no estás autenticado
- ✅ Dashboard funciona: `/documents`

---

## ✅ Checklist

- [ ] Variables de entorno configuradas
- [ ] Root Directory: `apps/web`
- [ ] Redeploy hecho
- [ ] Probar login
- [ ] Probar crear documento

