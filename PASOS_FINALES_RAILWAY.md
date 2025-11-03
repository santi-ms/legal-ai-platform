# Pasos finales en Railway

## Cambiar configuración en Railway

1. Entrá a tu proyecto en Railway
2. Click en el servicio `api`
3. Settings → Deploy
4. Cambiar:
   - **Root Directory:** Dejar vacío o poner ` . ` (un punto y un espacio)
   - **Build Command:** `npm run build --filter=api`
   - **Start Command:** `npm run start --filter=api`

5. Click en **"Save"** o **"Deploy"**

---

## Variables de entorno

Asegurate de tener estas variables configuradas en Settings → Variables:

```
PORT=4001
DATABASE_URL=postgresql://postgres.xtlmuqbsliszxcpwawgd:Ltqkmmx635@aws-1-us-east-1.pooler.supabase.com:5432/postgres
OPENAI_API_KEY=tu_api_key_real
FRONTEND_URL=https://legal-ai-platform-orcin.vercel.app
```

---

## Después del deploy

Si Railway te da una URL del servicio (ej: `https://legal-ai-api.railway.app`):
1. Actualizá `FRONTEND_URL` en Vercel con esa URL
2. Probá que funcione

