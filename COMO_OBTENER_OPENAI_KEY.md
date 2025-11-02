# 🔑 Cómo Obtener tu OpenAI API Key

## Pasos:

1. **Ir a:** https://platform.openai.com/api-keys
2. **Iniciar sesión** con tu cuenta de OpenAI
3. **Click en:** "Create new secret key"
4. **Copiar la key** (algo como `sk-proj-abc123...`)
5. **Guardarla** porque solo se muestra una vez

---

## ⚠️ Importante

**NO expongas tu API key públicamente.**

Úsala SOLO para:
- Variables de entorno en Railway
- Variables de entorno en Vercel (si es necesario)
- Nunca en GitHub
- Nunca en logs

---

## Después de Obtenerla

Cuando la tengas, configurarla en:

### Railway (Backend):
- Variable: `OPENAI_API_KEY`
- Valor: `sk-proj-tu_key_aqui`

### Vercel (si se usa en el frontend):
- Variable: `OPENAI_API_KEY` 
- Valor: `sk-proj-tu_key_aqui`

---

## Costos de OpenAI

- **GPT-4o-mini** (el que usás): Muy barato
- ~$0.15 por cada MILLÓN de tokens de entrada
- ~$0.60 por cada MILLÓN de tokens de salida

Para 100 abogados generando ~100 documentos/mes:
- ~$5-20 USD/mes

---

## Test Local

Después de obtener tu key, probarla localmente:

1. Editar `.env` en la raíz:
   ```
   OPENAI_API_KEY="sk-proj-tu_key_real"
   ```

2. Reiniciar el servidor
3. Probar generar un documento

