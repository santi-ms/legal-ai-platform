# 🚀 Instrucciones para Iniciar la Plataforma Legal AI

## Requisitos Previos
- Node.js instalado
- Base de datos PostgreSQL configurada
- Variables de entorno configuradas

---

## ⚡ Inicio Rápido (Recomendado)

### Opción 1: Iniciar todo desde la raíz

Abre **1 terminal** en la raíz del proyecto:

```bash
cd C:\Users\Educacion\Desktop\legal-ai-platform-main
npm run dev
```

Esto iniciará automáticamente:
- ✅ Frontend en `http://localhost:3000`
- ✅ Backend en `http://localhost:4001`

---

### Opción 2: Iniciar cada servicio por separado

#### Terminal 1 - Backend (API)
```bash
cd C:\Users\Educacion\Desktop\legal-ai-platform-main\apps\api
npm run dev
```

Deberías ver:
```
[api] listening on 4001
```

#### Terminal 2 - Frontend (Web)
```bash
cd C:\Users\Educacion\Desktop\legal-ai-platform-main\apps\web
npm run dev
```

Deberías ver:
```
▲ Next.js 16.0.0
- Local:        http://localhost:3000
```

---

## 🔍 Verificar que Todo Funciona

### 1. Verificar Backend
Abre en tu navegador o usa curl:
```
http://localhost:4001/documents
```

Deberías recibir una respuesta JSON:
```json
{
  "ok": true,
  "documents": []
}
```

### 2. Verificar Frontend
Abre en tu navegador:
```
http://localhost:3000
```

Deberías ver el dashboard sin errores en la consola.

---

## ❌ Errores Comunes

### Error: "Failed to fetch"
**Causa**: El backend no está corriendo
**Solución**: Inicia el backend en el puerto 4001

### Error: "EADDRINUSE: address already in use"
**Causa**: El puerto ya está siendo usado
**Solución**: 
- Cierra el proceso que está usando el puerto
- O cambia el puerto en el código

Para encontrar qué está usando el puerto 4001:
```bash
netstat -ano | findstr :4001
```

Para matar el proceso (reemplaza PID con el número que aparece):
```bash
taskkill /PID <PID> /F
```

### Error: Base de datos no conecta
**Causa**: Variables de entorno no configuradas
**Solución**: Crea un archivo `.env` en `packages/db/` con:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/legal_ai"
```

---

## 📦 Estructura del Proyecto

```
legal-ai-platform-main/
├── apps/
│   ├── api/          ← Backend (Puerto 4001)
│   │   └── src/
│   │       └── server.ts
│   └── web/          ← Frontend (Puerto 3000)
│       └── app/
├── packages/
│   └── db/           ← Prisma Database
└── package.json      ← Scripts raíz
```

---

## 🔄 Flujo de Datos

```
Usuario → Frontend (3000) → Backend (4001) → PostgreSQL → Respuesta
```

---

## 📝 Comandos Útiles

### Ver logs del backend
```bash
cd apps/api
npm run dev
```

### Limpiar caché de Next.js
```bash
cd apps/web
Remove-Item -Recurse -Force .next
npm run dev
```

### Reiniciar base de datos (⚠️ Borra datos)
```bash
cd packages/db
npx prisma migrate reset
npx prisma db push
```

---

## ✅ Checklist de Inicio

- [ ] Base de datos PostgreSQL corriendo
- [ ] Archivo `.env` configurado en `packages/db/`
- [ ] OpenAI API Key configurada en `apps/api/.env`
- [ ] Backend corriendo en puerto 4001
- [ ] Frontend corriendo en puerto 3000
- [ ] No hay errores en las consolas

---

## 🆘 Soporte

Si sigues teniendo problemas:

1. Verifica los logs en ambas terminales
2. Revisa la consola del navegador (F12)
3. Asegúrate de que todos los `node_modules` estén instalados:
   ```bash
   npm install
   ```

