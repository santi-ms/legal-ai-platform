# ✅ ¡Todo Listo para Railway!

## 🎯 ¿Qué Hicimos?

Preparamos tu aplicación para deployar el backend en Railway:

1. ✅ **URLs configurables** - Ya no hardcoded `localhost`
2. ✅ **CORS** - Configurado para producción
3. ✅ **Variables de entorno** - Frontend y backend
4. ✅ **Scripts de build** - Todo compila correctamente
5. ✅ **Puerto dinámico** - Railway asigna puertos automáticamente

---

## 📚 Guía Completa

La guía paso a paso está en: **`GUIA_RAILWAY_COMPLETA.md`**

---

## 🚀 Siguiente Paso

**VOS:**

1. Ir a https://railway.app
2. Crear cuenta (con GitHub)
3. Seguir la guía en `GUIA_RAILWAY_COMPLETA.md`

**YO:**

Ya hice todo lo necesario. No puedo acceder a Railway directamente, así que necesitás configurar:

- Root Directory
- Variables de entorno
- URLs de los servicios

---

## ⚡ Inicio Rápido

1. **Railway** → New Project → GitHub repo
2. Agregar 2 services:
   - Backend API (root: `apps/api`)
   - PDF Service (root: `services/pdf`)
3. Configurar variables según la guía
4. Obtener URLs de Railway
5. Configurar URLs en Vercel
6. ¡Deploy!

---

## 📝 Cambios Realizados

### Frontend
- `apps/web/app/lib/config.ts` - Configuración centralizada
- `apps/web/app/lib/api.ts` - Usa variables de entorno
- `apps/web/app/documents/page.tsx` - URLs dinámicas
- `apps/web/app/documents/new/page.tsx` - URLs dinámicas
- `apps/web/app/documents/[id]/page.tsx` - URLs dinámicas

### Backend
- `apps/api/src/server.ts` - CORS para producción
- `apps/api/src/routes.documents.ts` - PDF service URL dinámica
- `apps/api/package.json` - Scripts de build
- `services/pdf/src/server.ts` - Puerto dinámico

---

## 🎉 Código Pusheado

Todo está en GitHub y listo para Railway.

¡A deployar! 🚀

