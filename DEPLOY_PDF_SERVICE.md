# Deploy PDF Service en Railway

## En Railway

1. En tu proyecto Railway, **nuevo servicio** → **GitHub Repo**
2. Seleccionar el mismo repositorio
3. Railway detectará automáticamente `apps/pdf`

## Configuración

### Variables de entorno

```
PORT=4100
PDF_OUTPUT_DIR=/app/pdf_output
```

**Nota:** `PDF_OUTPUT_DIR` es opcional si Railway crea la carpeta automáticamente.

### Settings → Deploy

- **Build Command:** `npm run build`
- **Start Command:** `npm run start`

## Conectar con API

Después del deploy, Railway te dará una URL como:
```
https://legal-ai-pdf.railway.app
```

Actualiza en Railway (servicio `api`):
```
PDF_SERVICE_URL=https://legal-ai-pdf.railway.app
```

## Próximo paso

Una vez desplegado el PDF service, actualiza en Vercel:
```
NEXT_PUBLIC_PDF_SERVICE_URL=https://legal-ai-pdf.railway.app
```

