# 📊 Informe Resumido del Proyecto - Legal AI Platform

**Fecha:** Noviembre 2025  
**Estado:** En Producción (con problemas de autenticación pendientes)

---

## 🎯 Descripción General

**Legal AI Platform** es una plataforma SaaS de generación de documentos legales con Inteligencia Artificial, diseñada específicamente para el mercado argentino. Permite generar contratos, NDAs y cartas documento listos para firmar en minutos, con cumplimiento total de normativa argentina.

---

## 🏗️ Arquitectura del Sistema

### Estructura Monorepo (Turborepo)

```
legal-ai-platform/
├── apps/
│   ├── web/          # Frontend Next.js 16 (Vercel)
│   ├── api/          # Backend Fastify (Railway)
│   ├── pdf/          # Servicio de generación PDFs
│   └── docs/         # Documentación
├── packages/
│   ├── db/           # Prisma + Schema compartido
│   ├── ui/           # Componentes UI compartidos
│   ├── eslint-config/
│   └── typescript-config/
└── e2e/              # Tests E2E con Playwright
```

### Stack Tecnológico

#### Frontend (`apps/web`)
- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS
- **Autenticación:** NextAuth.js v4
- **Validación:** Zod, React Hook Form
- **TypeScript:** 5.9.2

#### Backend (`apps/api`)
- **Framework:** Fastify 4.28
- **ORM:** Prisma 5.22
- **Base de Datos:** PostgreSQL (producción) / SQLite (desarrollo)
- **IA:** OpenAI API (GPT-4o-mini, fallback a GPT-3.5-turbo)
- **Autenticación:** JWT con jsonwebtoken
- **Email:** Nodemailer

#### Servicio PDF (`apps/pdf`)
- **Generación:** PDFKit
- **Standalone:** Servicio independiente

---

## 🔐 Sistema de Autenticación

### Flujo Actual
1. **Login:** Usuario → NextAuth → Backend API (`/api/auth/login`)
2. **Sesión:** NextAuth genera JWT almacenado en cookie
3. **Proxy:** Route Handler `/api/_proxy/*` intercepta requests
4. **Token Backend:** Proxy extrae sesión NextAuth y genera nuevo JWT para backend
5. **Backend:** Valida JWT y procesa request

### Problema Actual
- **Error:** `401 Unauthorized` en requests al backend
- **Causa:** El proxy no está encontrando/decodificando correctamente la cookie de sesión de NextAuth
- **Estado:** En diagnóstico con logging detallado agregado

---

## 📊 Modelo de Datos (Prisma)

### Entidades Principales

1. **Tenant** (Multi-tenant)
   - Aislamiento de datos por empresa
   - Relación 1:N con Users y Documents

2. **User**
   - Autenticación con email/password (bcrypt)
   - Roles: owner, admin, editor, viewer
   - Vinculado a Tenant

3. **Document**
   - Tipos: contrato_servicios, NDA, carta_documento, etc.
   - Estados: generated_text, ready_pdf, error
   - Tracking de costos (costUsd)
   - Versionado automático

4. **DocumentVersion**
   - Historial completo de versiones
   - Almacena rawText y pdfUrl

5. **IAUsageLog**
   - Tracking de uso de IA
   - Costos por documento
   - Métricas por tenant

---

## 🌐 Despliegue en Producción

### Frontend (Vercel)
- **URL:** `legal-ai-platform-orcin.vercel.app`
- **Variables de Entorno:**
  - `NEXTAUTH_URL` ✅
  - `NEXTAUTH_SECRET` ✅
  - `NEXT_PUBLIC_API_URL` ✅

### Backend API (Railway)
- **URL:** `api-production-8cad.up.railway.app`
- **Variables de Entorno:**
  - `DATABASE_URL` (PostgreSQL) ✅
  - `NEXTAUTH_SECRET` ✅ (agregado recientemente)
  - `OPENAI_API_KEY` ✅
  - `FRONTEND_URL` ✅

### Servicio PDF (Railway)
- Servicio independiente para generación de PDFs

---

## ⚠️ Problemas Conocidos

### 1. Autenticación en Producción (CRÍTICO)
- **Síntoma:** Error 401 en todas las requests al backend
- **Logs:** `tieneAuthToken: false` en proxy
- **Causa Probable:** Cookie de sesión NextAuth no se encuentra o no se decodifica correctamente
- **Acción:** Logging detallado agregado para diagnóstico

### 2. Variables de Entorno
- ✅ Resuelto: `NEXTAUTH_SECRET` agregado en Railway
- ⚠️ Pendiente: Verificar que todas las cookies se envíen correctamente desde el cliente

---

## ✅ Funcionalidades Implementadas

### Autenticación
- [x] Registro de usuarios
- [x] Login con NextAuth
- [x] Sesiones JWT
- [x] Protección de rutas
- [x] Multi-tenant

### Generación de Documentos
- [x] Wizard de 4 pasos
- [x] Integración con OpenAI (GPT-4o-mini)
- [x] Cláusulas específicas por jurisdicción argentina
- [x] Tonos: formal y comercial
- [x] Fallback a GPT-3.5-turbo

### Gestión
- [x] Dashboard de documentos
- [x] Lista paginada con filtros
- [x] Descarga de PDFs
- [x] Historial de versiones
- [x] Tracking de costos

### UI/UX
- [x] Diseño moderno con Tailwind CSS
- [x] Tema oscuro
- [x] Componentes reutilizables (Radix UI)
- [x] Formularios con validación

---

## 📈 Métricas y Monitoreo

### Logging
- Logs estructurados en backend (Fastify)
- Logs detallados en proxy para diagnóstico
- Console logs en frontend para debugging

### Health Checks
- Endpoint `/healthz` en backend
- Configurado en Railway para monitoreo

---

## 🔄 Flujo de Desarrollo

### Comandos Principales
```bash
# Desarrollo
npm run dev              # Levanta todos los servicios

# Base de datos
cd apps/api
npm run migrate:dev      # Nueva migración
npm run migrate:deploy   # Deploy migraciones
npm run db:seed          # Seed inicial

# Tests
npm run e2e              # Tests E2E con Playwright
```

### Git Workflow
- Branch: `main`
- Deploy automático: Vercel (frontend) y Railway (backend)
- Último commit: "Agregar logging detallado para diagnosticar problema de autenticación en proxy"

---

## 📋 Próximos Pasos

### Inmediatos
1. **Resolver problema de autenticación**
   - Analizar logs detallados del proxy
   - Verificar cookies disponibles en request
   - Corregir decodificación de token NextAuth

2. **Verificar variables de entorno**
   - Confirmar que todas las cookies se envían correctamente
   - Validar configuración de NextAuth en producción

### Corto Plazo
- [ ] Integración de pagos
- [ ] Recuperación de contraseña
- [ ] Verificación de email
- [ ] Rate limiting mejorado

### Largo Plazo
- [ ] Android App (React Native)
- [ ] API pública
- [ ] Analytics avanzado
- [ ] Roles avanzados

---

## 📚 Documentación Disponible

- `README.md` - Documentación principal
- `INICIO_RAPIDO.md` - Setup rápido
- `GUIA_POSTGRESQL.md` - Guía de migración a PostgreSQL
- `CHECKLIST_PRODUCCION.md` - Checklist pre-producción
- `DEPLOY_PASO_A_PASO.md` - Guía de deploy
- `RESUMEN_CRITICO_COMPLETADO.md` - Mejoras implementadas

---

## 👥 Equipo y Contacto

**Desarrollador:** Santi  
**Plataforma:** Argentina 🇦🇷  
**Licencia:** Propietario - Todos los derechos reservados

---

## 📊 Estadísticas del Proyecto

- **Líneas de código:** ~15,000+ (estimado)
- **Servicios:** 3 (web, api, pdf)
- **Paquetes compartidos:** 4
- **Tests E2E:** 2 suites (auth, dashboard)
- **Tiempo de desarrollo:** ~2-3 meses (estimado)

---

**Última actualización:** Noviembre 13, 2025  
**Estado general:** 🟡 En producción con problemas de autenticación

