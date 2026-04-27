---
title: "Pdf"
source:
  - "apps/pdf/**"
generated: true
lastSync:
  sourceCommit: "4030ba85a7923a0fce905433b06bf876327f34a1"
  docHash: "ce52695f7b95"
---
## Descripción general

`apps/pdf` es un microservicio independiente construido con Fastify que genera archivos PDF a partir de texto legal en formato plano. Corre por defecto en el puerto **4100** y expone una pequeña API REST. El servicio principal (`apps/api`) lo consume internamente para producir los documentos que el usuario descarga.

## Tecnologías

- **Fastify** — servidor HTTP
- **`@fastify/multipart`** — soporte para subida de archivos (límite: 10 MB)
- **Puppeteer** — generación de PDF de alta fidelidad (motor principal)
- **PDFKit** — generador alternativo basado en streams (archivo `pdfGenerator.ts`, no activo en producción)
- **Zod** — validación del cuerpo de los requests

## Estructura de archivos

```
apps/pdf/src/
├── server.ts                   # Punto de entrada, registra plugins y arranca Fastify
├── routes.pdf.ts               # Definición de todos los endpoints
├── pdfGeneratorPuppeteer.ts    # Generador activo (Puppeteer + HTML tipográfico)
└── pdfGenerator.ts             # Generador alternativo con PDFKit (no usado en rutas)
```

Los PDFs generados se escriben en `../generated/` (relativo al directorio de compilación) o en la ruta que indique la variable de entorno `PDF_OUTPUT_DIR`. Los PDFs de referencia subidos por los usuarios van a `../references/` o a `PDF_REFERENCES_DIR`.

## Variables de entorno

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `PORT` | `4100` | Puerto de escucha |
| `PDF_OUTPUT_DIR` | `<dist>/../generated` | Directorio de PDFs generados |
| `PDF_REFERENCES_DIR` | `<dist>/../references` | Directorio de PDFs de referencia |

## API

### `POST /pdf/generate`

Genera un PDF a partir de texto plano y devuelve el nombre del archivo resultante.

**Body (JSON):**

```ts
{
  title: string;        // Título del documento (requerido)
  rawText: string;      // Contenido en texto plano o markdown ligero (requerido)
  fileName?: string;    // Nombre del archivo de salida (debe terminar en .pdf)
  logoDataUri?: string; // Logo del estudio como base64 data URI o URL
}
```

**Respuesta exitosa:**

```json
{
  "ok": true,
  "filePath": "/ruta/absoluta/al/archivo.pdf",
  "fileName": "1234567890-uuid.pdf"
}
```

Si `fileName` no se provee, se genera automáticamente con el patrón `{timestamp}-{uuid}.pdf`. El campo `fileName` debe contener solo caracteres alfanuméricos, puntos, guiones o underscores, y terminar en `.pdf`.

---

### `GET /pdf/:fileName`

Descarga un PDF previamente generado.

- Protegido contra path traversal: se rechaza cualquier `fileName` que contenga `..` o `/`.
- Responde con `Content-Type: application/pdf` y `Content-Disposition: attachment`.
- Devuelve `404` si el archivo no existe.

---

### `POST /pdf/upload-reference`

Sube un PDF de referencia (multipart/form-data).

| Campo | Tipo | Descripción |
|---|---|---|
| archivo (file part) | `application/pdf` | El archivo PDF |
| `fileName` | campo de formulario | Nombre destino, validado con `/^[a-zA-Z0-9._-]+\.pdf$/` |

---

### `GET /pdf/reference/:fileName`

Descarga un PDF de referencia previamente subido.

---

### `DELETE /pdf/reference/:fileName`

Elimina un PDF de referencia. Devuelve `404` si no existe.

## Generación de PDF con Puppeteer

`pdfGeneratorPuppeteer.ts` es el motor activo. El proceso es:

1. **Limpieza de markdown** (`stripMarkdown`): elimina etiquetas HTML, negritas, cursivas y encabezados `#`.
2. **Clasificación de líneas** (`classifyLine`): asigna un tipo semántico a cada línea del texto.

   | Tipo | Descripción |
   |---|---|
   | `title` | Título principal del documento |
   | `location_date` | Línea de ciudad y fecha |
   | `clause_header` | Encabezado de cláusula (`PRIMERA.`, `CLÁUSULA SEGUNDA:`, etc.) |
   | `subclause` | Sub-inciso (`a)`, `i)`, `1.1`) |
   | `section_title` | Subtítulo en mayúsculas |
   | `signature_line` | Línea de guiones bajos para firma |
   | `signature_label` | Etiqueta bajo la línea de firma |
   | `separator` | Línea separadora (`---`) |
   | `body` | Párrafo normal |

3. **Construcción de HTML** (`buildHtmlBody`): convierte los bloques clasificados en elementos HTML con estilos tipográficos legales (fuente Times New Roman, márgenes, interlineado).
4. **Renderizado con Puppeteer**: Puppeteer abre el HTML en un browser headless y exporta a PDF en formato A4.
5. El archivo resultante se escribe en `OUTPUT_DIR` y se devuelve su ruta y nombre.

El campo opcional `logoDataUri` permite incluir el logo del estudio jurídico en el encabezado del documento.

## Generador alternativo (PDFKit)

`pdfGenerator.ts` implementa `generatePdfFromContract` usando PDFKit con streams. Realiza la misma limpieza de markdown, escribe el contenido línea por línea y agrega un bloque de firma al final. **No está conectado a ninguna ruta actualmente**; `routes.pdf.ts` importa exclusivamente desde `pdfGeneratorPuppeteer.ts`.

## Arranque local

```bash
# Desde la raíz del monorepo
cd apps/pdf
tsx src/server.ts

# O con variable de entorno personalizada
PDF_OUTPUT_DIR=/tmp/pdfs PORT=4100 tsx src/server.ts
```
