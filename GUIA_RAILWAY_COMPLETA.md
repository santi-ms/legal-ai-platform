# 🚂 Guía Completa: Deploy Backend a Railway

## ✅ Estado Actual

Todos los cambios necesarios ya están implementados:
- ✅ URLs configurables con variables de entorno
- ✅ CORS configurado para producción
- ✅ Scripts de build y start listos
- ✅ Puerto configurado correctamente
- ✅ PDF service usa `process.env.PORT`

---

## 📋 Paso 1: Crear Cuenta en Railway

1. Ir a https://railway.app
2. Click en "Start a New Project"
3. Conectar con GitHub
4. Autorizar acceso al repo `legal-ai-platform`
5. Railway debería detectar automáticamente el repo

---

## 📋 Paso 2: Crear Backend API Service

### 2.1 Agregar Nuevo Service
1. En el dashboard de Railway, click "**+ New**"
2. Seleccionar "**Deploy from GitHub repo**"
3. Elegir el repo `legal-ai-platform`

### 2.2 Configurar Service

Railway intentará auto-detectar. Si no funciona, configurar manualmente:

**Settings → Root Directory:**
```
apps/api
```

**Settings → Build Command:**
```
npm install
npm run build
```

**Settings → Start Command:**
```
npm start
```

### 2.3 Configurar Variables de Entorno

**Settings → Variables → Add Variable:**

```env
PORT=4001
DATABASE_URL=postgresql://postgres.xtlmuqbsliszxcpwawgd:Ltqkmmx635@aws-1-us-east-1.pooler.supabase.com:5432/postgres
OPENAI_API_KEY=sk-proj-tu_api_key_aqui
FRONTEND_URL=https://legal-ai-platform-orcin.vercel.app
PDF_SERVICE_URL=https://pdf-production.up.railway.app
```

⚠️ **NOTA:** `PDF_SERVICE_URL` la agregarás DESPUÉS de deployar el PDF service.

### 2.4 Guardar y Deploy

Railway debería empezar a hacer deploy automáticamente.

### 2.5 Obtener URL del Service

Después del deploy, Railway te dará una URL tipo:
```
https://backend-production-xxxx.up.railway.app
```

**Guardá esta URL** - la vas a necesitar para el PDF service y el frontend.

---

## 📋 Paso 3: Crear PDF Service

### 3.1 Agregar Segundo Service
1. Click "**+ New**" nuevamente
2. Seleccionar "**Deploy from GitHub repo**" (mismo repo)
3. Configurar:

**Settings → Root Directory:**
```
services/pdf
```

**Settings → Build Command:**
```
npm install
npm run build
```

**Settings → Start Command:**
```
npm start
```

### 3.2 Variables de Entorno

Para PDF service solo necesitas:
```env
PORT=4100
```

(La URL la configurará automáticamente Railway)

### 3.3 Obtener URL

La URL será algo como:
```
https://pdf-service-production-xxxx.up.railway.app
```

**Guardá esta URL.**

---

## 📋 Paso 4: Configurar Variables Cruzadas

### 4.1 Backend API → PDF Service URL

Editar Backend API service:
**Settings → Variables → Add:**
```env
PDF_SERVICE_URL=https://pdf-service-production-xxxx.up.railway.app
```

**Reemplazar** `xxxx` con tu ID real.

### 4.2 Backend API → Frontend URL

Ya configuramos `FRONTEND_URL` en el paso 2.3, pero verificar que sea la correcta.

---

## 📋 Paso 5: Configurar Vercel (Frontend)

### 5.1 Agregar Variables de Entorno

Ir a Vercel → Tu proyecto → Settings → Environment Variables

Agregar:
```env
NEXT_PUBLIC_API_URL=https://backend-production-xxxx.up.railway.app
NEXT_PUBLIC_PDF_SERVICE_URL=https://pdf-service-production-xxxx.up.railway.app
```

⚠️ **Ya tenías estas variables**:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### 5.2 Redeploy Frontend

1. Ir a Deployments
2. Click "Redeploy" en el último deployment
3. Esperar que termine

---

## 📋 Paso 6: Verificar Que Funcione

### 6.1 Test Backend Directo

Abrir en el navegador:
```
https://backend-production-xxxx.up.railway.app/documents
```

Debería devolver JSON (probablemente vacío, pero sin error).

### 6.2 Test PDF Service

```bash
curl -X POST https://pdf-service-production-xxxx.up.railway.app/pdf/generate \
  -H "Content-Type: application/json" \
  -d '{"title":"TEST","rawText":"test content"}'
```

Debería devolver JSON con `ok: true` y `filePath`.

### 6.3 Test Frontend Completo

1. Ir a tu URL de Vercel
2. Crear un usuario
3. Intentar generar un documento

---

## 🐛 Problemas Comunes

### ❌ "Cannot find module 'db'"

**Causa:** Railway no está ejecutando `postinstall`.

**Fix:** Verificar que `postinstall` esté en `package.json`:
```json
{
  "scripts": {
    "postinstall": "cd ../../packages/db && npx prisma generate"
  }
}
```

Railway debería ejecutarlo automáticamente después de `npm install`.

---

### ❌ "Prisma client not generated"

**Causa:** El `postinstall` no se ejecutó o falló.

**Fix 1:** Verificar que el Root Directory esté bien configurado.

**Fix 2:** Agregar manualmente como Build Command:
```bash
npm install && cd ../../packages/db && npx prisma generate && cd ../../apps/api && npm run build
```

---

### ❌ "Port already in use" o puerto incorrecto

**Causa:** Hardcoded port en código.

**Fix:** Ya está arreglado. Usamos `process.env.PORT` en:
- `apps/api/src/server.ts` ✅
- `services/pdf/src/server.ts` ✅

---

### ❌ CORS Error en Frontend

**Causa:** Frontend URL no está en allowed origins.

**Fix:** Verificar `FRONTEND_URL` en Backend API variables:
```env
FRONTEND_URL=https://legal-ai-platform-orcin.vercel.app
```

**Importante:** Sin barra `/` al final.

---

### ❌ "Module not found: @prisma/client"

**Causa:** Prisma no se generó en el lugar correcto.

**Fix:** Verificar que el `postinstall` del backend haga:
```bash
cd ../../packages/db && npx prisma generate
```

---

### ❌ Railway no detecta el monorepo

**Causa:** Railway por defecto busca en la raíz.

**Fix:** Configurar manualmente:
- Root Directory: `apps/api` (para backend)
- Root Directory: `services/pdf` (para PDF service)

---

## 💰 Costos

- **Free Tier:** $5 créditos gratis/mes
- **Hobby Plan:** ~$20/mes (recomendado para producción)
- **Pro Plan:** Desde $100/mes (para scale masivo)

Para 100 usuarios, probablemente necesites **Hobby Plan**.

---

## 📊 Monitoring

Railway Dashboard te muestra:
- **Deploy logs** (últimos 5000 líneas)
- **Metrics** (CPU, RAM, Network)
- **Events** (deploy completado, errores, etc.)

---

## 🚀 Próximos Pasos

1. ✅ Deploy Backend API
2. ✅ Deploy PDF Service
3. ✅ Configurar variables cruzadas
4. ✅ Redeploy Frontend
5. ✅ Test completo
6. ✅ Crear usuario de prueba en producción
7. ✅ Generar documento de prueba

---

## 📝 Checklist Final

Antes de dar por terminado:

- [ ] Backend API deployado y respondiendo
- [ ] PDF Service deployado y respondiendo
- [ ] Variables de entorno configuradas en Railway
- [ ] Variables de entorno configuradas en Vercel
- [ ] Frontend redeployado
- [ ] CORS funcionando
- [ ] Usuario creado en producción
- [ ] Login funcionando
- [ ] Generación de documentos funcionando
- [ ] PDF descargando correctamente

---

## 🆘 Ayuda

Si algo no funciona:
1. Revisar logs en Railway Dashboard
2. Revisar logs en Vercel Functions
3. Verificar que todas las variables estén configuradas
4. Verificar que URLs no tengan `/` al final
5. Verificar que Root Directory esté bien configurado

¿Necesitás ayuda con algún paso específico?

