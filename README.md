# ⚖️ Legal AI Platform

> Plataforma de generación de documentos legales con Inteligencia Artificial

Generá contratos, NDAs y cartas documento listos para firmar en minutos. Cumplimiento total con normativa argentina.

---

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- npm
- Docker Desktop (opcional, para PostgreSQL)

### Instalación Rápida

**Opción 1: Con SQLite (más rápido)**
```bash
# Clonar repositorio
git clone [tu-repo]
cd legal-ai-platform

# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev
```

**Opción 2: Con PostgreSQL + Docker (producción)**
```bash
# Ver README_DOCKER.md para setup completo
docker-compose up -d
npm install
npm run dev
```

### Acceder
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4001
- **PDF Service**: http://localhost:4100

---

## ✨ Características Principales

### 🎯 Generación Inteligente
- IA GPT-4o-mini para generación de documentos
- Cláusulas específicas por jurisdicción argentina
- Tonos: formal y comercial
- Fallback automático a GPT-3.5-turbo
- Listo para firmar

### 👥 Multi-Tenant
- Soporte de múltiples empresas
- Roles: owner, admin, editor, viewer
- Aislamiento de datos
- Escalable

### 📄 Gestión de Documentos
- Versionado automático
- Historial de cambios
- Download de PDFs
- Tracking de costos

### 🔐 Seguridad
- Autenticación con NextAuth
- Contraseñas hasheadas (bcrypt)
- JWT sessions
- Protección de rutas

---

## 🏗️ Arquitectura

```
legal-ai-platform/
├── apps/
│   ├── api/          # Backend Fastify
│   ├── web/          # Frontend Next.js 16
│   └── docs/         # Documentación
├── packages/
│   ├── db/           # Prisma + SQLite/PostgreSQL
│   └── ui/           # Componentes compartidos
└── services/
    └── pdf/          # Generación PDFs
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 16** - Framework React
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **NextAuth** - Autenticación

### Backend
- **Fastify** - API server
- **Prisma** - ORM
- **SQLite** - Base de datos (dev)
- **PostgreSQL** - Base de datos (prod)
- **OpenAI** - Generación IA
- **PDFKit** - Generación PDFs

---

## 📚 Documentación

- **README.md** - Este archivo
- **INICIO_RAPIDO.md** - Setup rápido con Docker (recomendado)
- **README_DOCKER.md** - Setup detallado de PostgreSQL
- **GUIA_POSTGRESQL.md** - Guía completa de migración
- **CHECKLIST_PRODUCCION.md** - Lista de tareas pre-producción
- **RESUMEN_CRITICO_COMPLETADO.md** - Mejoras implementadas

---

## 🔧 Comandos

```bash
# Desarrollo
npm run dev              # Iniciar todos los servicios
npm run build            # Build de producción
npm run lint             # Linting

# Base de datos
cd packages/db
npx prisma studio        # UI de base de datos
npx prisma migrate dev   # Nueva migración
npx prisma generate      # Regenerar client
```

---

## 🎯 Roadmap

### ✅ Completado
- [x] Sistema de autenticación
- [x] Generación de documentos con IA
- [x] Descarga de PDFs
- [x] Dashboard de documentos
- [x] Mejoras de UX/UI
- [x] Multi-tenant

### 🔄 En Progreso
- [ ] Deploy a producción
- [ ] Integración de pagos
- [ ] Android App (React Native)

### 📅 Planificado
- [ ] Recuperación de contraseña
- [ ] Verificación de email
- [ ] Roles avanzados
- [ ] API pública
- [ ] Analytics avanzado

---

## 💰 Pricing

### Planes Sugeridos
- **Starter**: $49/mes - 10 documentos
- **Pro**: $149/mes - 100 documentos
- **Enterprise**: $399/mes - Ilimitado

---

## 📖 Uso

### 1. Registro
1. Ir a http://localhost:3000
2. Click "Registrarse Gratis"
3. Completar formulario
4. Iniciar sesión automáticamente

### 2. Crear Documento
1. Click "Nuevo documento"
2. Completar wizard (4 pasos)
3. Generar con IA
4. Descargar PDF

### 3. Gestionar
- Ver lista de documentos
- Editar detalles
- Descargar PDFs
- Ver histórico

---

## 🔒 Seguridad

- Contraseñas encriptadas
- JWT tokens
- CORS configurado
- Validación de inputs
- Rate limiting (pendiente)
- HTTPS en producción

---

## 🌐 Producción

### Para Deploy
Opciones recomendadas:
- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Render
- **Database**: Supabase (PostgreSQL), Neon
- **Storage**: Cloudflare R2, AWS S3

---

## 📞 Soporte

¿Problemas? Revisa:
1. Logs del servidor
2. Variables de entorno (.env.example)
3. Prisma migrations

---

## 📄 Licencia

Propietario - Todos los derechos reservados

---

**Hecho con ❤️ en Argentina** 🇦🇷
