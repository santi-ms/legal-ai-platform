# 🔑 Variables de Entorno Necesarias en Vercel

## ✅ **OBLIGATORIAS para Frontend (Web App)**

Configura estas variables en **Settings → Environment Variables** de Vercel:

### 1. `DATABASE_URL`
```
postgresql://postgres.xtlmuqbsliszxcpwawgd:Ltqkmmx635@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```
**✅ Ya la tenés configurada**

### 2. `NEXTAUTH_SECRET`
```
sk-YOUR-SECRET-KEY-HERE-123456789
```
**⚠️ NECESITÁS GENERAR UNO NUEVO**

Generá un secreto seguro:
```bash
openssl rand -base64 32
```
O usá cualquier generador de secretos: https://generate-secret.vercel.app/32

### 3. `NEXTAUTH_URL`
```
https://legal-ai-platform.vercel.app
```
**⚠️ Usá la URL de tu deployment de Vercel**

---

## 📝 Pasos para Configurar

1. **Ir a Vercel Dashboard** → Tu proyecto → Settings → Environment Variables

2. **Agregar cada variable**:
   - Key: `DATABASE_URL`, Value: (tu connection string de Supabase)
   - Key: `NEXTAUTH_SECRET`, Value: (generá uno con openssl)
   - Key: `NEXTAUTH_URL`, Value: `https://tu-dominio-vercel.vercel.app`

3. **Seleccionar "Production", "Preview", y "Development"** para cada una

4. **Hacer Redeploy** para que surtan efecto

---

## 🎯 ¿Dónde las pongo?

**En Vercel:** Settings → Environment Variables

**NO las pongas** en el código ni en GitHub (están en `.gitignore` correctamente)

---

## ⚠️ IMPORTANTE

- `NEXTAUTH_SECRET`: **DEBE ser diferente** al secreto de desarrollo (`.env.local`)
- Si no configurás `NEXTAUTH_SECRET`, NextAuth usará "dev-secret" y puede fallar
- `NEXTAUTH_URL`: Debe ser la URL completa de tu deployment

