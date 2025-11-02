# 🚀 DEPLOY PASO A PASO - Legal AI Platform

## ✅ YA COMPLETADO
- ✅ PostgreSQL configurado en Supabase
- ✅ Migraciones aplicadas
- ✅ Secrets generados
- ✅ Variables de entorno documentadas

---

## 📝 SIGUIENTES 3 PASOS (20 minutos)

### PASO 1: Push a GitHub (5 min)

```bash
# En tu terminal:
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

**Si no tenés repo en GitHub:**
1. Ir a https://github.com/new
2. Crear repo "legal-ai-platform"
3. Ejecutar los comandos de arriba

---

### PASO 2: Deploy a Vercel (10 min)

1. Ir a https://vercel.com
2. Click "Sign Up" → Conectar con GitHub
3. Click "Add New Project"
4. Buscar tu repo "legal-ai-platform"
5. Click "Import"

**Configuración:**

**Root Directory:**
```
apps/web
```

**Framework Preset:** Next.js (automático)

**Environment Variables:**
Copiar desde `VARIABLES_VERCEL.txt`:

```
DATABASE_URL=postgresql://postgres.xtlmuqbsliszxcpwawgd:Ltqkmmx635@aws-1-us-east-1.pooler.supabase.com:5432/postgres

NEXTAUTH_URL=http://localhost:3000
(lo actualizarás después)

NEXTAUTH_SECRET=nfxP4jqJVsUf4dQJJvnOmCR6ypKYQifnUFvhYZH1Kf0=

OPENAI_API_KEY=tu-key-aqui
(reemplazar con tu key real)

NEXT_PUBLIC_API_URL=
(dejar vacío por ahora)
```

6. Click "Deploy"
7. Esperar 3 minutos
8. Copiar la URL generada (ej: `https://legal-ai-platform-xxxxx.vercel.app`)

---

### PASO 3: Actualizar Variables (5 min)

Volver a Vercel Dashboard:

1. Settings → Environment Variables
2. Buscar `NEXTAUTH_URL`
3. Cambiar a tu URL real: `https://tu-url-generada.vercel.app`
4. Guardar
5. Settings → Deployments
6. Click en "⋮" → "Redeploy"

---

## ✅ ¡LISTO!

Tu app estará corriendo en:
- Frontend: `https://tu-url.vercel.app`
- Base de datos: Supabase PostgreSQL
- Próximo paso: Deploy backend (Railway opcional)

---

## 🔧 BACKEND OPCIONAL

Si querés desplegar el backend también:

Ver `GUIA_DEPLOY_VERCEL.md` sección "PASO 3: Setup Backend API (Railway)"

---

## ❓ AYUDA

Si tenés problemas:
- Ver logs en Vercel Dashboard → Deployments
- Verificar que todas las variables estén configuradas
- Revisar `FALTA_PRODUCCION.md` para troubleshooting

