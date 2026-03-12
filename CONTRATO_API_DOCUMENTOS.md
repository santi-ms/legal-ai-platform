# 📋 Contrato API - Generación de Documentos

## Endpoint

```
POST /documents/generate
```

## Request/Response por Tipo Documental

---

## 1. Service Contract (`service_contract`)

### Request - Caso Mínimo

```json
{
  "documentType": "service_contract",
  "jurisdiction": "caba",
  "tone": "commercial_clear",
  "proveedor_nombre": "Servicios ABC SRL",
  "proveedor_doc": "20-12345678-9",
  "proveedor_domicilio": "Av. Corrientes 1234, CABA",
  "cliente_nombre": "Cliente XYZ SA",
  "cliente_doc": "30-98765432-1",
  "cliente_domicilio": "Av. Santa Fe 5678, CABA",
  "descripcion_servicio": "Servicios de consultoría contable mensual",
  "monto": "150000",
  "moneda": "ARS",
  "periodicidad": "mensual",
  "forma_pago": "transferencia_bancaria",
  "plazo_pago": "30_dias",
  "preferencias_fiscales": "responsable_inscripto",
  "inicio_vigencia": "2025-02-01",
  "plazo_minimo_meses": 12
}
```

### Request - Caso Completo

```json
{
  "documentType": "service_contract",
  "jurisdiction": "cordoba",
  "tone": "formal_technical",
  "proveedor_nombre": "Estudio Legal Avanzado SRL",
  "proveedor_doc": "20-11111111-1",
  "proveedor_domicilio": "San Martín 500, Córdoba Capital",
  "cliente_nombre": "Empresa Innovadora SA",
  "cliente_doc": "30-22222222-2",
  "cliente_domicilio": "Av. Colón 1000, Córdoba Capital",
  "descripcion_servicio": "Servicios legales integrales",
  "alcance": "Incluye hasta 10 horas mensuales",
  "entregables": "Informes legales mensuales",
  "monto": "500000",
  "moneda": "ARS",
  "periodicidad": "mensual",
  "forma_pago": "transferencia_bancaria",
  "plazo_pago": "15_dias",
  "precio_incluye_impuestos": false,
  "ajuste_precio": "inflacion",
  "preferencias_fiscales": "responsable_inscripto",
  "inicio_vigencia": "2025-03-01",
  "plazo_minimo_meses": 24,
  "renovacion_automatica": true,
  "preaviso_renovacion": 60,
  "penalizacion_rescision": true,
  "penalizacion_monto": "ARS 1000000 o 2 meses de servicio",
  "preaviso_rescision": 30,
  "propiedad_intelectual": true,
  "tipo_propiedad_intelectual": "cesion_total",
  "confidencialidad": true,
  "plazo_confidencialidad": 5,
  "domicilio_notificaciones": "domicilio_contratante"
}
```

### Response

```json
{
  "ok": true,
  "documentId": "uuid-here",
  "contrato": "CONTRATO DE SERVICIOS\n\nPRIMERA: IDENTIFICACIÓN...",
  "pdfUrl": "https://...",
  "warnings": [
    {
      "id": "warning-123",
      "ruleId": "sin_confidencialidad",
      "message": "No se incluyó una cláusula de confidencialidad...",
      "suggestion": "Considera activar la opción de confidencialidad...",
      "severity": "warning"
    }
  ],
  "metadata": {
    "documentType": "service_contract",
    "jurisdiction": "caba",
    "tone": "commercial_clear",
    "templateVersion": "1.0.0",
    "aiModel": "gpt-4o-mini",
    "aiCostUsd": 0.002,
    "hashSha256": "...",
    "generatedAt": "2025-01-11T..."
  }
}
```

### Campos Requeridos

- `documentType`: `"service_contract"`
- `jurisdiction`: `"caba" | "buenos_aires" | "cordoba" | "santa_fe" | "mendoza" | "corrientes_capital" | "posadas_misiones"`
- `tone`: `"formal_technical" | "commercial_clear" | "balanced_professional"`
- `proveedor_nombre`, `proveedor_doc`, `proveedor_domicilio`
- `cliente_nombre`, `cliente_doc`, `cliente_domicilio`
- `descripcion_servicio`
- `monto`, `moneda`, `periodicidad`, `forma_pago`, `plazo_pago`
- `preferencias_fiscales`
- `inicio_vigencia`, `plazo_minimo_meses`

### Campos Opcionales

- `alcance`, `entregables`
- `precio_incluye_impuestos`, `ajuste_precio`
- `renovacion_automatica`, `preaviso_renovacion`
- `penalizacion_rescision`, `penalizacion_monto`, `preaviso_rescision`
- `propiedad_intelectual`, `tipo_propiedad_intelectual`
- `confidencialidad`, `plazo_confidencialidad`
- `domicilio_notificaciones`, `domicilio_especial`

---

## 2. NDA (`nda`)

### Request - Caso Mínimo

```json
{
  "documentType": "nda",
  "jurisdiction": "caba",
  "tone": "commercial_clear",
  "revelador_nombre": "Empresa Reveladora SA",
  "revelador_doc": "30-11111111-1",
  "revelador_domicilio": "Av. Corrientes 1000, CABA",
  "receptor_nombre": "Consultoría Externa SRL",
  "receptor_doc": "20-22222222-2",
  "receptor_domicilio": "Av. Santa Fe 2000, CABA",
  "definicion_informacion": "Información técnica, comercial y estratégica relacionada con el desarrollo de productos, incluyendo especificaciones técnicas, planes de negocio, y datos de clientes",
  "finalidad_permitida": "Evaluación de propuesta comercial y análisis de viabilidad técnica del proyecto",
  "plazo_confidencialidad": 3,
  "inicio_vigencia": "2025-02-01"
}
```

### Request - Caso Completo

```json
{
  "documentType": "nda",
  "jurisdiction": "cordoba",
  "tone": "formal_technical",
  "revelador_nombre": "Tech Startup SA",
  "revelador_doc": "30-33333333-3",
  "revelador_domicilio": "San Martín 500, Córdoba",
  "receptor_nombre": "Consultor Legal SRL",
  "receptor_doc": "20-44444444-4",
  "receptor_domicilio": "Av. Colón 1000, Córdoba",
  "definicion_informacion": "Información confidencial incluyendo código fuente, algoritmos propietarios, estrategias de marketing, listas de clientes, información financiera, y cualquier dato que pueda considerarse sensible o competitivo",
  "finalidad_permitida": "Análisis técnico y legal para evaluación de inversión y due diligence",
  "exclusiones": "Información de dominio público, información previamente conocida por el receptor, información desarrollada independientemente sin acceso a la información confidencial",
  "plazo_confidencialidad": 5,
  "inicio_vigencia": "2025-03-01",
  "devolucion_destruccion": true,
  "plazo_devolucion": 30,
  "penalidad_incumplimiento": "ARS 5.000.000 o el equivalente a 10 veces el valor del daño causado, el que sea mayor"
}
```

### Response

```json
{
  "ok": true,
  "documentId": "uuid-here",
  "contrato": "ACUERDO DE CONFIDENCIALIDAD (NDA)\n\nPRIMERA: IDENTIFICACIÓN...",
  "pdfUrl": "https://...",
  "warnings": [
    {
      "id": "warning-456",
      "ruleId": "plazo_muy_corto",
      "message": "El plazo de confidencialidad es menor a 2 años...",
      "suggestion": "Para información sensible, se recomienda un plazo de al menos 3-5 años.",
      "severity": "warning"
    }
  ],
  "metadata": {
    "documentType": "nda",
    "jurisdiction": "caba",
    "tone": "commercial_clear",
    "templateVersion": "1.0.0",
    "aiModel": "gpt-4o-mini",
    "aiCostUsd": 0.001,
    "hashSha256": "...",
    "generatedAt": "2025-01-11T..."
  }
}
```

### Campos Requeridos

- `documentType`: `"nda"`
- `jurisdiction`: (mismo que service_contract)
- `tone`: (mismo que service_contract)
- `revelador_nombre`, `revelador_doc`, `revelador_domicilio`
- `receptor_nombre`, `receptor_doc`, `receptor_domicilio`
- `definicion_informacion` (mínimo 20 caracteres)
- `finalidad_permitida` (mínimo 20 caracteres)
- `plazo_confidencialidad` (número positivo)
- `inicio_vigencia`

### Campos Opcionales

- `exclusiones`
- `devolucion_destruccion`, `plazo_devolucion` (si `devolucion_destruccion` es `true`, `plazo_devolucion` es requerido)
- `penalidad_incumplimiento`

### Validaciones Semánticas

- Si `devolucion_destruccion` es `true`, `plazo_devolucion` es requerido
- `definicion_informacion` debe tener al menos 20 caracteres
- `finalidad_permitida` debe tener al menos 20 caracteres

### Warnings

- `plazo_muy_corto`: Si `plazo_confidencialidad` < 2 años
- `sin_devolucion`: Si no se activa `devolucion_destruccion`
- `exclusiones_poco_claras`: Si `exclusiones` existe pero tiene menos de 30 caracteres

---

## 3. Legal Notice (`legal_notice`)

### Request - Caso Mínimo

```json
{
  "documentType": "legal_notice",
  "jurisdiction": "caba",
  "tone": "formal_technical",
  "remitente_nombre": "Empresa Reclamante SA",
  "remitente_doc": "30-11111111-1",
  "remitente_domicilio": "Av. Corrientes 1000, CABA",
  "destinatario_nombre": "Deudor Moroso SRL",
  "destinatario_doc": "20-22222222-2",
  "destinatario_domicilio": "Av. Santa Fe 2000, CABA",
  "relacion_previa": "Contrato de servicios celebrado el 15 de enero de 2024",
  "hechos": "El 15 de enero de 2024 se celebró un contrato de servicios. Se facturaron servicios por un total de ARS 500.000 correspondientes a los meses de enero, febrero y marzo de 2024. Las facturas fueron emitidas y entregadas en tiempo y forma",
  "incumplimiento": "El destinatario no ha realizado el pago de las facturas mencionadas, a pesar de haber transcurrido más de 90 días desde su vencimiento",
  "intimacion": "Se intima al destinatario a pagar la suma de ARS 500.000 más intereses y costas dentro del plazo establecido",
  "plazo_cumplimiento": "10_dias"
}
```

### Request - Caso Completo

```json
{
  "documentType": "legal_notice",
  "jurisdiction": "cordoba",
  "tone": "formal_technical",
  "remitente_nombre": "Estudio Legal Avanzado SA",
  "remitente_doc": "30-33333333-3",
  "remitente_domicilio": "San Martín 500, Córdoba",
  "destinatario_nombre": "Empresa Incumplidora SRL",
  "destinatario_doc": "20-44444444-4",
  "destinatario_domicilio": "Av. Colón 1000, Córdoba",
  "relacion_previa": "Contrato de locación comercial celebrado el 1 de enero de 2023, con vigencia hasta el 31 de diciembre de 2024",
  "hechos": "El 1 de enero de 2023 se celebró un contrato de locación comercial. El inquilino se comprometió a pagar un alquiler mensual de ARS 200.000. Desde el mes de octubre de 2024, el inquilino ha dejado de pagar el alquiler correspondiente",
  "incumplimiento": "El destinatario ha incumplido con el pago de los alquileres correspondientes a los meses de octubre, noviembre y diciembre de 2024, totalizando ARS 600.000",
  "intimacion": "Se intima al destinatario a pagar la suma de ARS 600.000 más intereses moratorios calculados al 3% mensual desde la fecha de vencimiento de cada cuota, más costas y honorarios, dentro del plazo establecido",
  "plazo_cumplimiento": "15_dias",
  "plazo_custom": null,
  "apercibimiento": "En caso de incumplimiento, se iniciará acción ejecutiva por el total adeudado más intereses, costas y honorarios, y se solicitará el desalojo del inmueble"
}
```

### Response

```json
{
  "ok": true,
  "documentId": "uuid-here",
  "contrato": "CARTA DOCUMENTO\n\nPRIMERA: CONTEXTO Y RELACIÓN PREVIA...",
  "pdfUrl": "https://...",
  "warnings": [
    {
      "id": "warning-789",
      "ruleId": "intimacion_ambigua",
      "message": "La intimación podría ser más específica...",
      "suggestion": "Especifica exactamente qué se requiere: monto a pagar, acción a realizar, plazo concreto, etc.",
      "severity": "warning"
    }
  ],
  "metadata": {
    "documentType": "legal_notice",
    "jurisdiction": "caba",
    "tone": "formal_technical",
    "templateVersion": "1.0.0",
    "aiModel": "gpt-4o-mini",
    "aiCostUsd": 0.001,
    "hashSha256": "...",
    "generatedAt": "2025-01-11T..."
  }
}
```

### Campos Requeridos

- `documentType`: `"legal_notice"`
- `jurisdiction`: (mismo que service_contract)
- `tone`: (mismo que service_contract)
- `remitente_nombre`, `remitente_doc`, `remitente_domicilio`
- `destinatario_nombre`, `destinatario_doc`, `destinatario_domicilio`
- `relacion_previa`
- `hechos` (mínimo 30 caracteres)
- `incumplimiento` (mínimo 20 caracteres)
- `intimacion` (mínimo 30 caracteres)
- `plazo_cumplimiento`: `"3_dias" | "5_dias" | "10_dias" | "15_dias" | "30_dias" | "custom"`

### Campos Opcionales

- `plazo_custom`: Si `plazo_cumplimiento` es `"custom"`, este campo es requerido
- `apercibimiento`

### Validaciones Semánticas

- `intimacion` debe tener al menos 30 caracteres
- `hechos` debe tener al menos 30 caracteres
- `incumplimiento` debe tener al menos 20 caracteres
- Si `plazo_cumplimiento` es `"custom"`, `plazo_custom` es requerido

### Warnings

- `intimacion_ambigua`: Si la intimación es genérica o ambigua
- `sin_relacion_previa`: Si `relacion_previa` tiene menos de 30 caracteres
- `apercibimiento_generico`: Si `apercibimiento` tiene menos de 40 caracteres

---

## Errores Comunes

### 400 Bad Request - Validación Semántica

```json
{
  "ok": false,
  "error": "validation_error",
  "message": "Validation failed",
  "details": [
    "Si defines un monto de penalización, debes activar la opción de rescisión anticipada"
  ]
}
```

### 400 Bad Request - DTO Inválido

```json
{
  "ok": false,
  "error": "invalid_body",
  "message": "Zod validation error: ..."
}
```

### 500 Internal Server Error

```json
{
  "ok": false,
  "message": "Internal error"
}
```

---

## Persistencia

Todos los documentos generados se guardan en la base de datos con:

- `structuredData`: JSON con todos los campos del request
- `clausePlan`: JSON con el plan de cláusulas generado
- `generationWarnings`: JSON con los warnings generados
- `templateVersion`: Versión del template usado (ej: `"1.0.0"`)
- `status`: Estado del documento (`"generated"`)

---

## Backward Compatibility

El endpoint también acepta el formato antiguo (`GenerateDocumentSchema`) y lo mapea automáticamente al nuevo formato estructurado.

