# Prompt para Claude Design — Carrusel Instagram DocuLex (v2)

> Este prompt arma un carrusel **distinto** del que ya existe (dark editorial,
> estructura "problema → solución × 3 → cierre"). Acá cambiamos concepto,
> formato, paleta y voz.

---

## Prompt (copiar y pegar en Claude Design)

Diseñá un **carrusel para Instagram** de **8 slides** en formato **vertical 4:5
(1080 × 1350 px)** para **DocuLex**, una plataforma argentina de software legal
para abogados y estudios jurídicos (LegalTech · Argentina).

**Importante:** ya existe un carrusel previo de DocuLex con paleta *navy
oscuro + violeta*, tipografía sans bold y estructura declarativa
"problema → solución 1 → solución 2 → solución 3". **No lo repitas.** Quiero
algo claramente diferenciado en concepto, paleta y tono.

---

### Concepto narrativo

Un **mini case study** contado como historia: **"Un martes en el estudio
Méndez"**.

Seguimos a **la Dra. Lucía Méndez**, abogada civilista de Buenos Aires, socia
de un estudio chico (4 personas), durante un martes común. Cada slide es un
momento del día con **timestamp** ("08:42", "11:15", "16:30") que muestra
cómo DocuLex le cambia ese momento puntual: un contrato urgente, un cliente
que pregunta por WhatsApp, una providencia nueva en MEV, un vencimiento
casi olvidado.

El cierre lo trae números concretos del estudio (ficcionales pero realistas)
y un llamado a la acción. **Storytelling, no feature list.**

---

### Dirección visual

- **Estética editorial / magazine**, NO dashboard techie.
- **Fondo crema cálido** (`#F5EFE6` / papel manteca apenas teñido), nada de
  navy oscuro.
- **Tinta principal navy profundo** (`#0E1A2B`).
- **Acentos cálidos**, distintos del violeta del deck anterior:
  - Mostaza tostado (`#C9923B`) para destacados y números.
  - Coral apagado (`#D2563A`) para tags y subrayados.
  - Verde oliva (`#5C6B3A`) para checks/positivos.
- **Tipografía display**: serif editorial con personalidad (estilo *GT Sectra*,
  *Tiempos Headline* o *Canela*) para titulares grandes. **Nunca el mismo
  sans bold del deck anterior.**
- **Texto cuerpo**: sans humanista (estilo *Söhne* o *Inter*) tamaño chico,
  con buen interlineado.
- **Layout magazine**: márgenes generosos, **mucho aire**, grilla de 12
  columnas visible en algunos slides como detalle, *drop caps* en el slide 1,
  pull quotes con comillas tipográficas grandes.
- **Timestamps** como elemento gráfico recurrente: arriba a la derecha, en
  caja monoespaciada (`08:42 · MAR`), color mostaza.
- **Ilustración** estilo *risograph* o *line art* monocromo (no fotos
  stock). Una silueta de Lucía dibujada con trazo fino, escritorio, mate,
  expediente. Mantenelo simple y consistente.
- **Numeración**: "01 / 08" abajo a la izquierda, contador horizontal
  minimal.
- Logo DocuLex chico arriba a la izquierda en todos los slides; pill
  "Caso · Estudio Méndez" arriba a la derecha (excepto cover y CTA final).

---

### Voz y tono

- **Castellano rioplatense (vos)**: "te ahorrás", "abrís", "mirá".
- **Sensorial y específico**: "el café ya se enfrió esperando que cargue
  MEV", "tres pestañas abiertas, ninguna cargó", "el cliente vuelve a
  preguntar por WhatsApp".
- **Mostrar, no declarar**. Nada de "ahorrá tiempo" o "más eficiente".
  Mostrá la escena.
- **Citas textuales** entre comillas como si fuera Lucía hablando
  ("—Antes esto me llevaba la mañana entera").

---

### Estructura slide por slide

1. **Cover — "Un martes cualquiera en el estudio Méndez"**
   Drop cap enorme con la "U". Subtítulo: "Cómo una abogada civilista
   recuperó 14 horas a la semana sin contratar a nadie." Etiqueta:
   `CASO · ARGENTINA · 2026`. Ilustración risograph de un escritorio
   con mate, anteojos y expediente.

2. **08:42 — Un contrato de locación que entra por mail.**
   Cliente pide ajuste por IPC trimestral *para hoy*. Antes: copiar
   plantilla 2019, cruzar con Ley 27.551, 90 minutos. Ahora: prompt a
   Doku Genera, contrato listo en 40 segundos con cláusula validada.
   Pull quote de Lucía abajo.

3. **10:15 — La cláusula gris.**
   Doku Analiza marca un riesgo en una indemnización pactada. Mostrá
   un fragmento de contrato con un *highlight* coral sobre la cláusula
   conflictiva y al costado el comentario de la IA citando el artículo
   del CCyC. Tono: "lo que tu socia veterana hubiera marcado en
   lapicera roja".

4. **11:15 — Mientras tanto, en MEV.**
   Antes: Lucía abriendo PJN, MEV, SCBA en pestañas separadas. Ahora:
   notificación push *"Exp. 8812/24 — Traslado de contestación.
   Vence en 7 días."*. Mockup minimal de la notificación, no del
   dashboard completo.

5. **13:40 — El cliente que pregunta por WhatsApp.**
   "—¿Cómo va lo mío?". Antes: 20 minutos buscando el último estado.
   Ahora: el cliente entra al portal y se contesta solo. Mostrá un
   chat de WhatsApp con el mensaje *no enviado* y, abajo, captura
   del portal del cliente.

6. **16:30 — Lo que antes se le pasaba.**
   Vencimientos cruzados entre mail, agenda y cuaderno. Hoy: una sola
   timeline con tres alertas. Visual: tres post-its descoloridos
   tachados, al lado una línea de tiempo limpia.

7. **19:00 — Cierre del día. Los números del trimestre.**
   Tres stats grandes en mostaza, tipografía display:
   `+14h / sem` recuperadas, `+47%` documentos gestionados,
   `0` vencimientos perdidos. Pull quote final de Lucía:
   *"Ahora cuando me siento a redactar, ya estoy redactando."*

8. **CTA — "El próximo martes puede verse distinto."**
   `doculex.com.ar` en grande, mostaza sobre crema. Pill abajo:
   "Probá DocuLex 14 días gratis · sin tarjeta". Ilustración de la
   misma escena del slide 1, pero con el mate humeando.

---

### Restricciones

- **No** uses fondo oscuro en ningún slide.
- **No** uses violeta (`#7C5CFC` y similares) salvo como acento muy puntual
  si lo necesitás; preferí mostaza/coral.
- **No** repitas mockups de dashboard tipo "Panel de Control" como en el
  deck anterior. Si mostrás UI, que sea **un fragmento** (notificación,
  cláusula resaltada, mensaje), no una pantalla completa.
- **No** uses íconos genéricos de Lucide/Heroicons. Si necesitás íconos,
  que sean trazo a mano risograph.
- **No** caigas en frases vacías tipo "potenciá tu estudio", "soluciones
  inteligentes", "transformación digital".

---

### Entregables

- 8 artboards 1080 × 1350 px.
- Misma grilla y márgenes en todos.
- Paleta exportada como swatches.
- Versión alternativa del slide 1 (cover) con un titular alternativo:
  *"La mañana que Lucía dejó de copiar plantillas viejas."*
