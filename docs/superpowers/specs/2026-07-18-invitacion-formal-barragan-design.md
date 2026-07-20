# Especificación final — Invitación formal "Soumi & Jos"
### Dirección creativa D1 · "Planos Monumentales" (Cuadra San Cristóbal / Barragán)

**Versión:** 1.0 — lista para revisión de la pareja y del equipo de construcción.
**Ámbito:** una página estática nueva y separada (`invitacion.html`) que **convive** con el Save the Date ya publicado en `soumyjos.com`, **no lo reemplaza**.
**Este documento es un spec de diseño.** Incluye tokens y esquemas; no incluye código de implementación salvo snippets mínimos. Ya incorpora todas las correcciones de las dos críticas (marca / accesibilidad / rendimiento / ubicación y completitud / consistencia).

---

## 1. Resumen

Invitación digital de boda, formal (es_MX, registro de "usted"), mobile-first, pensada para abrirse desde el navegador in-app de WhatsApp en teléfonos de gama variada. Traduce la arquitectura de Luis Barragán en la Cuadra San Cristóbal —grandes planos planos de color, vacío, luz cálida, agua quieta— a una secuencia editorial sobre fondo crema. La página abre con un sobre lacrado (una sola compuerta), presenta a los novios, la dedicatoria, la historia, los detalles de sede(s), vestimenta, obsequios, hospedaje, una cuenta regresiva silenciosa, un formulario de confirmación (RSVP) que guarda en el Firebase existente, y un cierre con "agregar al calendario". Extiende el canon de marca del proyecto (paleta, tipografía, ritmo) sumándole la familia cromática Barragán, sin romper el "susurro".

---

## 2. Objetivos y No-objetivos

### Objetivos
1. Entregar una invitación formal completa que se lea con dignidad en un teléfono, en menos de dos minutos, desde WhatsApp.
2. Preservar y extender el canon (quiet · refined · heartfelt); nada de kitsch de boda ni estética SaaS.
3. Capturar confirmaciones de asistencia fiables en Firebase, visibles en el dashboard existente.
4. Funcionar como pieza autocontenida en Cloudflare Pages, coexistiendo con el Save the Date sin colisiones (Firebase, storage, `.ics`, fuentes).
5. Cumplir accesibilidad de sentido común real: contraste AA verificado numéricamente, foco visible sobre cualquier fondo, tap targets ≥44px, `prefers-reduced-motion`, inputs sin zoom en iOS.
6. Rendir bien en el peor caso (WebView de WhatsApp en Android de gama baja): presupuesto de peso acotado, imágenes diferidas, fuentes no bloqueantes.

### No-objetivos
- No reemplazar ni modificar el Save the Date (`index.html`).
- No construir backend propio; se reutiliza Realtime Database.
- No implementar toggle de idioma ES/EN en v1 (diferido; la audiencia es es_MX).
- No implementar tokens por invitado / links personalizados (ver §7: RSVP abierto).
- No incrustar iframes de mapas (rendimiento).
- No autoplay de sonido, ni música, ni confeti, ni reloj de cuenta regresiva animado.

---

## 3. Usuarios

Invitados de la boda: familiares y amigos de edades diversas, la mayoría abriendo un enlace reenviado por WhatsApp, en su teléfono, sin contexto previo. Tareas: entender **cuándo** y **dónde**, sentir el peso y la calidez del momento, **confirmar asistencia** y **guardar la fecha en su calendario**. Subgrupo relevante: **invitados foráneos** que necesitan hospedaje, traslado y una ubicación de mapa **exacta** (la sede tiene varias obras de Barragán alrededor; un pin equivocado es un problema real).

---

## 4. Relación con el Save the Date existente (coexistencia)

Verificado en el repo. La invitación es una **segunda página plana** en el mismo sitio; el Save the Date (`/`, `index.html`) **no se toca**.

| Recurso | Save the Date (existe) | Invitación formal (nueva) | Colisión |
|---|---|---|---|
| Archivo / ruta | `index.html` → `/` | `invitacion.html` → `/invitacion` (rewrite 200) | Ninguna |
| Firebase | nodo `tracking/visits/<sid>` | nodo hermano **`rsvp/<pushId>`** | Ninguna (init idempotente) |
| Claves storage | `_soumyjos_sid`, `_soumyjos_dash_auth` | `_sj_inv_opened`, `_soumyjos_rsvp_id`, `_soumyjos_rsvp_done` | Ninguna; `_soumyjos_sid` se **comparte** a propósito (correlación visita↔RSVP) |
| `.ics` | `Soumi-Jos-SaveTheDate.ics` (all-day, 3 VEVENT espejo) | **`Soumi-Jos-Invitacion.ics`** (hora real, 1 VEVENT + VALARM relativos) | Ninguna (nombres distintos) |
| Fuentes / favicon | mismo `<link>` Google Fonts + `favicon.svg` | reutilizados (cache compartido) | Deseable |
| Dashboard | lee `tracking/visits` | se le **añade** tarjeta que lee `rsvp` | Aditivo |

Regla dura: la página nueva **no importa el CSS del `index.html`** (que hard-codea hex); define su propio `:root` con custom properties (patrón del dashboard) más la familia Barragán.

---

## 5. Sistema de diseño D1 "Planos Monumentales"

Adopta custom properties en `:root`. Cremas = reino humano (fondo, lectura, interacción). Muros de color = reino ecuestre (momentos, un gesto por muro). **Más crema que muro, siempre.**

### 5.1 Tokens de color (crudos)

```css
:root {
  /* — cremas / reino humano — */
  --cream-paper:  #faf5ef;   /* tarjeta, superficie de contenido, texto claro sobre muros oscuros */
  --cream-ground: #ede4d8;   /* fondo del body / ground entre secciones */
  --cream-veil:   #e7ddce;   /* velo intermedio (uso decorativo, NO como portador de contraste) */
  --sand:         #b59a85;   /* arena / laja: pisos, líneas de tierra; nunca fondo de sección */

  /* — muros Barragán / reino ecuestre — */
  --rose:       #c98a83;     /* muro rosa del granero: plano protagonista */
  --rose-deep:  #b56f6b;     /* CORREGIDO (era #bd7a77): re-tintado para cumplir AA con --ink */
  --mauve:      #9a8a9c;     /* muro bajo malva: la nota íntima, una sola vez */
  --terracotta: #a04535;     /* muro terracota: peso cálido (alias de --rust del canon) */
  --burgundy:   #8b2e2e;     /* borgoña: acento tipográfico, reglas, foco, muro del cierre */

  /* — tintas / cafés — */
  --ink:    #3b1f10;         /* tinta principal */
  --walnut: #6b4432;         /* tinta secundaria SOLO sobre crema; PROHIBIDA sobre muros */
  --sepia:  #9a6855;         /* detalle sepia sobre crema */

  /* — utilitarios — */
  --sage:  #4d6b40;          /* CORREGIDO (era #5a7d4a): éxito RSVP, ahora AA sobre crema */
  --water: rgba(154,138,156,.14);
  --slit:  rgba(59,31,16,.10);
}
```

**Dos cambios de hex frente al borrador previo, exigidos por la crítica de contraste (recalculada con fórmula WCAG):**
- `--rose-deep` pasa de `#bd7a77` (daba 4.47:1 con `--ink`, **falla** AA normal) a **`#b56f6b`** (cruza 4.5:1). Si por fidelidad a la foto real se quisiera un rosa más claro, entonces el texto sobre él queda **restringido a tamaño display (≥24px o ≥18.66px bold)**, nunca microcopy.
- `--sage` pasa de `#5a7d4a` (4.34:1, **falla**) a **`#4d6b40`** (~5:1). Además el éxito **no depende solo del color**: lleva texto y una marca ✓.

### 5.2 Tokens semánticos y regla de portador

```css
:root {
  --bg:      var(--cream-ground);
  --surface: var(--cream-paper);

  /* portadores validados (ver tabla §11.2) */
  --text-on-cream:      var(--ink);          /* 13.9:1 */
  --text-on-cream-soft: var(--walnut);       /* solo crema */
  --text-on-rose:       var(--ink);          /* 5.36:1 */
  --text-on-mauve:      var(--ink);          /* 4.67:1 */
  --text-on-terracotta: var(--cream-paper);  /* 5.70:1 */
  --text-on-burgundy:   var(--cream-paper);  /* 7.66:1 */

  --accent:      var(--burgundy);
  --accent-warm: var(--terracotta);
  --seal:        var(--terracotta);

  /* reglas finas canónicas */
  --rule:       rgba(139,46,46,.30);
  --rule-faint: rgba(139,46,46,.12);
  --rule-warm:  rgba(160,69,53,.28);

  /* FOCO — dependiente del fondo (corrección crítica) */
  --focus-on-cream: var(--burgundy);   /* engrosado a 3px sobre crema */
  --focus-on-wall:  var(--cream-paper);/* crema sobre muros oscuros */
}
```

> **Regla mnemónica de portador (dura):** muros claros (`rose`, `rose-deep`, `mauve`) → texto **`--ink`**. Muros oscuros (`terracotta`, `burgundy`) → texto **`--cream-paper`**. **Nunca `--walnut` ni ningún café intermedio sobre un muro** (2.6–3.0:1). Cuerpo largo y formularios: **solo sobre crema**.

### 5.3 Tipografía

Mismo `<link>` de Google Fonts que el Save the Date (cache compartido): Cormorant Garamond `0,300;0,400;1,300;1,400` + Jost `200;300;400;500`. Carga optimizada en §10.

```css
:root {
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-label:   'Jost', system-ui, sans-serif;

  --fs-names:   clamp(3.4rem, 12vw, 5.75rem);  /* Cormorant 300 italic */
  --fs-display: clamp(2.1rem, 7vw, 3.25rem);   /* Cormorant 300 italic */
  --fs-date:    clamp(1.9rem, 6vw, 2.75rem);   /* Cormorant 400 roman  */
  --fs-quote:   clamp(1.35rem, 4.4vw, 1.75rem);/* Cormorant 400 italic */
  --fs-count:   clamp(2.4rem, 8vw, 3.4rem);    /* cuenta regresiva (ver §6.10, ya NO en muro) */
  --fs-lead:    1.25rem;

  --fs-eyebrow: clamp(.62rem, 2vw, .72rem);    /* Jost uppercase */
  --fs-label:   .8rem;
  --fs-micro:   .68rem;
  --fs-btn:     .78rem;
  --fs-body:    1rem;                            /* inputs ≥16px reales, ver §11 */

  --ls-eyebrow: .42em; --ls-label: .26em; --ls-micro: .34em; --ls-wide: .55em; --ls-names: .015em;
  --lh-tight: 1.04; --lh-snug: 1.28; --lh-body: 1.62;
}
```

Reglas: **todo Jost va en MAYÚSCULAS con tracking**, salvo cuerpo funcional largo (direcciones, inputs: `--fs-body`, tracking 0). **Cormorant nunca en mayúsculas ni con tracking alto.**

### 5.4 Espaciado, radios, sombras, movimiento

```css
:root {
  --sp-1:.25rem; --sp-2:.5rem; --sp-3:.75rem; --sp-4:1rem; --sp-5:1.5rem; --sp-6:2rem; --sp-7:3rem; --sp-8:4.5rem;
  --sp-wall: clamp(4.5rem,14vw,8rem);   /* aire dentro de un muro */
  --sp-void: clamp(6rem,20vw,11rem);    /* silencio entre planos */
  --measure: 34rem; --card-max: 43rem; --tap-min: 44px;

  --radius-0:0; --radius-sm:2px; --radius-seal:50%;   /* Barragán = recto; radio solo donde el tacto lo pide */

  --shadow-card:  0 12px 60px rgba(59,31,16,.16), 0 3px 10px rgba(59,31,16,.08);
  --shadow-soft:  0 4px 18px rgba(59,31,16,.12);
  --shadow-wall:  0 24px 80px -20px rgba(59,31,16,.22);
  --shadow-inset: inset 0 1px 2px rgba(59,31,16,.06);

  --ease-quiet: cubic-bezier(.22,1,.36,1);   /* LA curva del proyecto — única permitida */
  --dur-fast:.28s; --dur-base:.6s; --dur-rise:1.1s; --dur-flap:.4s; --delay-step:.18s;
}
```

> **Corrección de movimiento (crítica de marca):** se elimina `--ease-seal` (el rebote). El techo de movimiento del canon es la entrada `rise`; la apertura del sobre se resuelve como **un solo gesto de solapa ≤400ms** animando **solo `transform`/`opacity`**, sin rebote y sin coreografía de seis pasos. Ver §6.1 y §12.

### 5.5 Reglas de composición "planos"

- **Máximo 2–3 muros a sangre en toda la página** (bajado de 4 por la crítica). Reparto final:
  1. **Portada** — `--rose` (nota luminosa; la apertura del sobre es su reverso, misma tela rosa → sin corte de color).
  2. **Dedicatoria** — `--mauve` (nota íntima, una sola vez).
  3. **Cierre** — `--burgundy` (gravedad final).
  La **cuenta regresiva ya NO es muro** (ver §6.10): un susurro no merece un plano monumental.
- Todo lo demás (Historia, Ceremonia, Recepción, Vestimenta, Obsequios, Hospedaje, RSVP) vive **sobre crema**.
- Un muro = una pantalla o más, `--sp-wall` de aire interno, `--sp-void` de crema antes y después. **Un solo gesto por muro.** Entre Portada (rosa) y Dedicatoria (malva) media `--sp-void` **crema**: no son adyacentes.
- **Motivos con mesura, cero ornamento literal (nada de caballos/herraduras):**
  - Ranuras verticales (`--slit`): **una sola vez**, detrás del sobre en la apertura.
  - **Agua/reflejo: un solo gesto en toda la invitación.** Decisión fijada (resuelve el triple-reservado): **reflejo en Portada** por defecto; el "hilo" de traslado (`--rule-warm`) solo aparece **si hay dos sedes** (ver §6.6 y Pregunta Abierta A).
  - Vanos rectangulares: marco de la foto a color (Portada) y de las imágenes de mapa.
- Fotografía: B&N canónico `grayscale(100%) contrast(1.08)` en Historia/grids; **una sola foto a color** (Portada).
- **Monograma "SJ": una sola vez** (el sello). No se reprisa en el cierre ni en sellos de esquina con numeración romana (restraint).

---

## 6. Arquitectura de información y spec por sección

**Orden narrativo (scroll vertical único, sin tabs):**
`Apertura → Portada → Dedicatoria → Historia → Ceremonia → (Recepción) → Vestimenta → Obsequios → Hospedaje → Cuenta regresiva → Confirmación → Cierre.`

**Dos motores de reveal, un solo guardrail:**
- **Motor A** — cascada `quietFade` escalonada (`--delay-step`), solo tras abrir el sobre (Portada).
- **Motor B** — IntersectionObserver por escena (`.scene → .scene--in`, fundido `--dur-base` + `translateY(16→0)`, umbral 0.18, `rootMargin: 0 0 -12% 0`, `unobserve` tras revelar).
- **Guardrail:** con `prefers-reduced-motion: reduce`, toda `.scene` nace visible (sin translate, sin fundido); animaciones a `.001ms`; el gate se salta o exige tap, **nunca auto-abre**.

> **Nota de densidad (crítica):** 12 secciones es el tope. Historia es opcional (puede plegarse si la pareja no entrega fotos/texto). Hospedaje y Obsequios se tratan como pie discreto, nunca como reclamo. Si el contenido escasea, plegar antes que rellenar.

### 6.1 Apertura / Sobre
La compuerta. Única pantalla a primera carga: sobre cerrado sobre muro `--rose` a sangre (`100dvh`) con `slit-wall` a baja opacidad (única aparición de las ranuras).
- Sobre en `--cream-paper`, `--shadow-wall`. **El pliegue de la solapa se lee por sombra + hairline `--rule-faint`, no por color** (corrección: `--cream-veil` sobre `--cream-paper` da 1.24:1, invisible).
- Sello de cera: círculo `--seal`/terracota, `--shadow-soft`, monograma "SJ" en Cormorant italic **`--cream-paper`** (crema sobre terracota = 5.70:1). Nunca tinta dentro del sello.
- Microcopy `TOCA PARA ABRIR` (Jost 200, `--ls-micro`) bajo el sobre. Pulsación de opacidad muy sutil (.55↔1) solo sin reduced-motion.
- Interacción: todo el sobre es un `<button>` (foco y teclado gratis). Al activar: `.is-open`, botón `disabled`, **un solo gesto de solapa ≤400ms (transform/opacity, sin rebote)**, el muro rosa se funde hacia la Portada (también rosa) → sin flash de color. Total ≤ ~600ms hasta contenido interactivo.
- Memoria de sesión: `sessionStorage['_sj_inv_opened']='1'`. En recarga o revisita dentro de la sesión, o si la URL trae hash (`#rsvp`), **se salta el gate**. `<main>` siempre en el DOM (SEO + preview de WhatsApp).
- Reduced-motion: solapa ya abierta sin transición; al tap, fundido único de 150ms; jamás auto-apertura.
- Se registra `invitationOpened` en tracking de forma opcional; nunca bloquea.

### 6.2 Portada
El "sí, esto es real". Debe caber **el bloque de texto sin scroll** tras abrir (la foto puede quedar bajo el pliegue).
- Muro `--rose` (reverso del sobre; nombres en `--ink`).
- Nombres `Soumi & Jos` (Cormorant 300 italic, `--fs-names`), regla fina 48px, fecha `20 de marzo de 2027` (Cormorant 400), sede en Jost label. **Única foto a color** como vano rectangular.
- Motivo: **reflejo** de la línea de nombres (`scaleY(-1)`, opacity .14, máscara de desvanecido). Es el único gesto de agua de la página.
- Reveal: Motor A (cascada).

### 6.3 Dedicatoria
Registro formal, voz heartfelt. **Muro `--mauve`** (único), texto `--ink`, `max-width: --measure`, mucho aire. Regla fina separa bendición del bloque de padres. Sin foto (silencio).
- Bloque de padres: Jost 300 caja normal (legibilidad de nombres propios). En móvil una columna; en desktop dos con hairline vertical.
- Reveal: Motor B.

### 6.4 Nuestra historia (opcional)
Crema. Rejilla B&N canónica (grid 2 col, gap 3px, `object-fit:cover`, alturas ~180px móvil / ~260px desktop) con 1–3 frases Cormorant italic intercaladas. Imágenes como **archivos `.webp` externos con `loading="lazy"`** (ver §10), con `width`/`height` explícitos para evitar CLS.
- Reveal: Motor B, stagger por celda.

### 6.5 Ceremonia
Crema, tarjeta de contenido. Estructura: eyebrow → nombre de sede → hora → dirección → mapa (imagen estática como botón, §6.11) → "Cómo llegar" + "Copiar dirección". Hairline bajo el eyebrow. Rótulo temporal claro (`CEREMONIA · [hora]`).
- Reveal: Motor B.

### 6.6 Recepción (condicional — ver Pregunta Abierta A)
Tarjeta gemela de Ceremonia (misma retícula) **solo si la recepción es en sede distinta**. Incluye microcopy de traslado (`Aproximadamente [N] minutos entre ambas sedes.`) y el **hilo `--rule-warm`** que conecta las dos tarjetas (único uso del "hilo de agua", válido solo en el caso de dos sedes).
- **Si ceremonia y recepción son en la Cuadra (un solo domicilio):** se **colapsa** en una sola tarjeta "Ceremonia y recepción", se elimina el traslado, el segundo mapa y el hilo. El diseño se construye como componente "sede" parametrizable (1..2 instancias) para no rehacer.
- Nota práctica siempre visible: `SIN ESTACIONAMIENTO EN SITIO · ACCESO POR RESERVACIÓN`.
- Reveal: Motor B.

### 6.7 Código de vestimenta
Crema, breve y aireada. Eyebrow + etiqueta (Cormorant display) + una línea de guía (Cormorant italic). Opcional: dos micro-columnas ELLAS/ELLOS. Nota opcional de calzado por piso de piedra/jardín.
- Reveal: Motor B.

### 6.8 Obsequios
Crema, discreta. Título neutro `UN DETALLE`. Agradecimiento primero (Cormorant italic), luego 1–3 filas key/value (lluvia de sobres · mesa de regalos · transferencia) con datos copiables. Sin montos, sin presión.
- Reveal: Motor B.

### 6.9 Hospedaje
Crema. Intro por zona + lista de 2–3 hoteles (nombre Cormorant, detalle Jost, enlace ≥44px, distancia a la sede). Para foráneos.
- Reveal: Motor B, stagger por ítem.

### 6.10 Cuenta regresiva (degradada a línea sobre crema)
**Corrección de marca:** el canon lista "countdown clocks" como anti-referencia; la pareja la pidió. Se reconcilia como **anotación editorial silenciosa sobre CREMA**, no como muro a sangre (se libera ese muro; ver §5.5).
- Eyebrow `LA ESPERA`; cifra Cormorant 300 `--fs-count`; leyenda partida Jost/Cormorant/Jost (`Faltan` · `128` · `días`). Solo días, sin horas/min/seg, sin flip, sin conteo animado.
- JS: reutiliza `updateCountdown()`; fecha `new Date(2027, 2, 20)` (marzo = mes 2, 0-indexed). Añadir ramas del copy §6.x: `days===1 → "Falta 1 día"`, `days===0 → "Hoy es el día"`, `days<0 → "Gracias por acompañarnos"`. Una llamada al cargar; refresco opcional en `visibilitychange`.
- Reveal: Motor B, fundido simple.

### 6.11 Confirmación de asistencia (RSVP)
Crema **obligatoria** (nunca formulario sobre muro). Ver §7 completo. Copy formal arriba, campos apilados con el estilo canónico del dashboard, botón outline borgoña. Estados con feedback **real** (callback de `set()`), no optimista.
- Reveal: Motor B; los campos no se animan individualmente.

### 6.12 Cierre
**Muro `--burgundy`** (texto `--cream-paper`, 7.66:1). Un gesto: despedida (Cormorant italic) + botón `AGREGAR AL CALENDARIO`.
- **Foco/botón crítico:** el botón sobre borgoña es **crema sólido con texto `--burgundy`** (contraste garantizado); su foco usa `--focus-on-wall` (crema). Enlace opcional a Google Calendar.
- `.ics`: descarga `Soumi-Jos-Invitacion.ics`. Reutiliza detección `isInAppBrowser` + `.wa-banner` (WhatsApp bloquea descargas de `.ics`).
- Reveal: Motor B.

### 6.13 Tratamiento de los dos mapas
- **Nunca iframe.** Cada mapa es una **imagen estática ligera** (`.webp` ~30–50KB, `width`/`height` explícitos, `loading="lazy"`) que actúa como botón; al tocar, abre la app de mapas nativa.
- **Deep-link con coordenadas, no texto** (corrección): `https://maps.google.com/?q=<lat>,<lng>`. Query por texto puede resolver a la Fuente de los Amantes u otra obra de Barragán en Los Clubes → pin equivocado para foráneos. Obtener lat/lng exactas del acceso por reservación.
- "Copiar dirección" con `navigator.clipboard.writeText` (HTTPS ok) + fallback de selección de texto para WebViews recalcitrantes.
- Diferenciación temporal explícita por tarjeta; nunca datos del invitado en la URL.

---

## 7. RSVP — formulario, datos, reglas, dashboard

### 7.1 Arquitectura: formulario ABIERTO (recomendado)
Un solo link masivo por WhatsApp, sin token por invitado (los tokens no sobreviven al reenvío y meter el nombre en la URL viola "sin PII en query strings"). El conteo se controla con un **cap de pases** y el copy, no con tokens.

> **Contradicción resuelta (crítica):** el copy "Hemos reservado N lugares en su honor" **presupone un N por invitado que el form abierto no tiene**. Decisión por defecto: **cap global** `MAX_PASES` (default 2) + copy reescrito no-personalizado: *"Indíquenos cuántas personas nos acompañarán (hasta [MAX])."* Camino opcional que degrada con gracia: parámetro **no-PII** `?g=<código>` mapeando a "N pases por grupo" (sin nombres). Ver Pregunta Abierta B.

### 7.2 Campos
| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| Nombre completo | text | Sí | `maxlength 80`, trim, ≥2 tras trim |
| ¿Nos acompañará? | radio Sí/No | Sí | `fieldset/legend`; controla lo condicional |
| Nº de pases | select `1..MAX` | Sí si asiste | incluye al titular; oculto si "No" |
| Nombres de acompañantes | textarea | No | visible si pases>1; array por líneas, cap `pases−1` |
| Restricciones alimentarias | textarea | No | `maxlength 280`; solo si asiste |
| Mensaje para los novios | textarea | No | `maxlength 500` |
| _Honeypot_ `website` | hidden | — | oculto `aria-hidden tabindex=-1`; si viene lleno → éxito simulado, no escribe |

Sin teléfono ni email (minimización). Al elegir "No asiste" se colapsan pases/acompañantes/dietas.

### 7.3 Estados UX
`idle → enviando (botón disabled, "Enviando…", espera el callback real) → éxito | error`. Éxito solo tras resolver `set()`: asiste → *"Hemos recibido su confirmación. Será un honor recibirle."* (con ✓ y `--sage`, no solo color); declina → *"Lamentamos que no pueda acompañarnos…"*. Error (rechazo, sin red, timeout ~10s) → *"No pudimos registrar su confirmación…"*, se rehabilita, **no borra lo capturado**. `aria-live="polite"`. Se guarda `_soumyjos_rsvp_done` con opción discreta "Modificar mi respuesta".

### 7.4 Modelo de datos (`/rsvp/<pushId>`)
`push()` con clave autogenerada. Campos: `nombre, asiste, pases (0 si no), acompanantes[], restricciones?, mensaje?, grupo?, sid, createdAt (ServerValue.TIMESTAMP), updatedAt, userAgent, device`. Se guarda `sid` (el mismo `_soumyjos_sid`) para dedupe/correlación. Edición: reusa `pushId` de `localStorage` con `.update()`.

### 7.5 Reglas de seguridad (`database.rules.json`)
Escritura pública validada, **sin lectura pública** (los nombres son PII).

```json
{
  "rules": {
    "tracking": { ".read": true, ".write": true },
    "rsvp": {
      ".read": false, ".write": false,
      "$id": {
        ".write": "!data.exists() || (auth === null && newData.child('sid').val() === data.child('sid').val())",
        ".validate": "newData.hasChildren(['nombre','asiste','createdAt'])",
        "nombre":        { ".validate": "newData.isString() && newData.val().length >= 2 && newData.val().length <= 80" },
        "asiste":        { ".validate": "newData.isBoolean()" },
        "pases":         { ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 12" },
        "restricciones": { ".validate": "!newData.exists() || (newData.isString() && newData.val().length <= 280)" },
        "mensaje":       { ".validate": "!newData.exists() || (newData.isString() && newData.val().length <= 500)" },
        "grupo":         { ".validate": "!newData.exists() || (newData.isString() && newData.val().length <= 16)" },
        "sid":           { ".validate": "newData.isString() && newData.val().length <= 64" },
        "createdAt":     { ".validate": "newData.isNumber()" },
        "$other":        { ".validate": false }
      }
    }
  }
}
```

> **Gotchas obligatorios:** (1) editar el archivo **no basta** — hay que **publicar las reglas** en Firebase Console (o `firebase deploy --only database`) o el RSVP falla en silencio. (2) Verificar que `tracking` sigue funcionando tras el deploy. (3) Con `rsvp/.read:false`, el listener del dashboard **fallará** salvo que se autentique (§7.7).

### 7.6 Anti-spam (defensa en capas, sin backend)
Botón disabled en "enviando" + flag en memoria; dedupe por `_soumyjos_rsvp_id` (reenvío actualiza en vez de duplicar); honeypot; throttle si el último envío fue <3s; validación por reglas (`$other:false`). Render en dashboard con `textContent` (nunca `innerHTML`) → sin XSS almacenado.

### 7.7 Tarjeta del dashboard
Añadir `<section class="scene scene-6" data-scene="6">` tras la scene-5 en `dashboard/index.html` (el `setupObserver()` la recoge). En `dashboard/app.js`, dentro de `setupFirebase()`, listener `db.ref('rsvp').on('value', …)` + `computeRsvp()` (dedupe por `sid`, última gana) + `renderRsvp()`. Métricas: confirmados, **total de pases** (número real para banquete), declinan, lista de asistentes (`.meta-list`), restricciones agregadas, y export **CSV en cliente** (Blob).
- **Prerrequisito:** para leer con `.read:false`, cambiar la regla a `".read": "auth != null"` y hacer `firebase.auth().signInAnonymously()` en el dashboard (complementa el gate de password actual, que hoy es seguridad por oscuridad). Es trabajo real, no trivial.

---

## 8. Copy es_MX por sección (con [PLACEHOLDER])

Registro formal, "usted", sin emoji ni exclamaciones. **JOST** = mayúsculas con tracking; **Cormorant** = display/cita.

**1 · Apertura:** sello `S · J` · acción `TOCA PARA ABRIR` · (opcional bajo la solapa, Cormorant italic) *Nos honra que abra estas líneas.*

**2 · Portada:** eyebrow `NUESTRA BODA` · nombres `Soumi & Jos` · fecha `20 de marzo de 2027` · sede `CUADRA SAN CRISTÓBAL · ATIZAPÁN, EDO. DE MÉXICO` · tagline (Cormorant italic) *Tenemos el honor de invitarle a celebrar nuestro matrimonio.*

**3 · Dedicatoria:** eyebrow `CON EL CORAZÓN` · cuerpo (Cormorant italic):
> *Con la bendición de Dios y de nuestros padres, tenemos el honor de invitarle a la celebración de nuestro matrimonio. Su presencia dará a este día su verdadero sentido.*

Bloque `NUESTROS PADRES` → `[PLACEHOLDER: madre · padre de la novia / madre · padre del novio]`. Opcional `CON EL PADRINAZGO DE` → `[PLACEHOLDER]`.

**4 · Historia:** eyebrow `NUESTRA HISTORIA` · cuerpo `[PLACEHOLDER]` (Cormorant, arranque editable).

**5 · Ceremonia:** eyebrow `LA CEREMONIA` · `HORA [PLACEHOLDER] h` · `LUGAR [PLACEHOLDER: sede]` / `[PLACEHOLDER: dirección]` · botones `CÓMO LLEGAR` · `COPIAR DIRECCIÓN`.

**6 · Recepción (si aplica):** eyebrow `LA RECEPCIÓN` · traslado (Cormorant italic) *A continuación nos trasladaremos a la recepción, a unos [PLACEHOLDER: N] minutos.* · `HORA [PLACEHOLDER] h` · sede/dirección · `SIN ESTACIONAMIENTO EN SITIO · ACCESO POR RESERVACIÓN`.

**7 · Vestimenta:** eyebrow `CÓDIGO DE VESTIMENTA` · etiqueta `[PLACEHOLDER: Etiqueta rigurosa / Formal]` · guía (Cormorant italic) *Le pedimos vestir de [etiqueta rigurosa: vestido largo para ellas, esmoquin para ellos].* · opcional *Sugerimos calzado cómodo para caminar sobre piedra y jardín.*

**8 · Obsequios:** eyebrow `UN DETALLE` · (Cormorant italic) *Su compañía es, para nosotros, el mejor de los regalos. Quien desee tener un detalle con nosotros podrá hacerlo por alguna de estas vías.* · `LLUVIA DE SOBRES` · `MESA DE REGALOS [PLACEHOLDER: tienda · evento núm.]` · `A DISTANCIA [PLACEHOLDER: titular · banco · CLABE]` (botón "Copiar CLABE").

**9 · Hospedaje:** eyebrow `PARA NUESTROS INVITADOS FORÁNEOS` · intro (Cormorant italic) · lista `[PLACEHOLDER: hotel · zona · distancia · enlace]` · `VER HOTEL`.

**10 · Cuenta regresiva:** eyebrow `LA ESPERA` · `Faltan [N] días` · estados `Falta 1 día` / `Hoy es el día` / `Gracias por acompañarnos` · pie `20 DE MARZO DE 2027`.

**11 · RSVP:** eyebrow `CONFIRMACIÓN DE ASISTENCIA` · cuerpo (Cormorant italic) *Le agradeceremos confirmar su asistencia antes del [PLACEHOLDER: ~20 de febrero de 2027]. Indíquenos cuántas personas nos acompañarán (hasta [MAX]).* · labels `NOMBRE COMPLETO` · `¿NOS ACOMPAÑARÁ?` → `SÍ, AHÍ ESTARÉ` / `NO PODRÉ ASISTIR` · `NÚMERO DE ACOMPAÑANTES` · `UN MENSAJE PARA LOS NOVIOS` · botón `CONFIRMAR ASISTENCIA` · éxitos/errores (§7.3) · opcional solo-adultos `[PLACEHOLDER]`.

**12 · Cierre:** eyebrow `LE ESPERAMOS` · botón `AGREGAR AL CALENDARIO` · alterno `AGREGAR A GOOGLE CALENDAR` · feedback `EVENTO GUARDADO CON SUS RECORDATORIOS` · despedida (Cormorant italic) *Será un honor compartir con usted este día. Soumi & Jos*.

**Banner WhatsApp:** `PARA GUARDAR LA FECHA EN SU CALENDARIO` · iOS *Abra este enlace en Safari…* · Android *Abra este enlace en Chrome…*

---

## 9. Accesibilidad (correcciones aplicadas)

### 9.1 Contraste (recalculado, WCAG 2.x; AA normal ≥4.5, grande/UI ≥3)
| Texto / fondo | Ratio | Veredicto |
|---|---|---|
| `--ink` / `--cream-paper` | 13.9:1 | ✓✓ |
| `--walnut` / `--cream-paper` | ~7.4:1 | ✓ (solo crema) |
| `--ink` / `--rose` #c98a83 | 5.36:1 | ✓ normal |
| `--ink` / `--rose-deep` **#b56f6b** | ~4.6:1 | ✓ normal (re-tintado) |
| `--ink` / `--mauve` #9a8a9c | 4.67:1 | ✓ normal (justo) |
| `--cream-paper` / `--terracotta` | 5.70:1 | ✓ |
| `--cream-paper` / `--burgundy` | 7.66:1 | ✓✓ |
| `--sage` **#4d6b40** / crema | ~5:1 | ✓ (éxito) |
| _crema / rose·rose-deep·mauve_ | 2.5–3.0 | ✗ prohibido |
| _`--ink` / terracota·burgundy_ | 2.6–2.7 | ✗ prohibido |
| _`--walnut` / cualquier muro_ | 2.6–3.0 | ✗ prohibido |

> Si se afinan `--rose-deep`/`--mauve` contra fotos reales, **re-verificar con checker, no a ojo**; cualquier oscurecimiento del rosa obliga a texto solo en tamaño display.

### 9.2 Foco (corrección crítica — el foco borgoña NO es visible sobre muros)
Foco **dependiente del fondo**: sobre crema y muros claros → `outline: 3px solid var(--focus-on-cream)` (borgoña engrosado); sobre muros oscuros (terracota/burgundy) → `outline: 2px solid var(--focus-on-wall)` (crema). Siempre `outline-offset: 2px`. Garantiza ≥3:1 contra cualquier fondo (WCAG 1.4.11). Los botones de calendario/RSVP en el cierre borgoña son el caso a validar. Nunca `outline:none` sin reemplazo.

### 9.3 Otras
Pliegue del sobre por sombra/hairline. Tap targets ≥44px reales (verificar radios y `<select>`, no solo el label). Inputs `font-size ≥16px` (evita zoom iOS) + `inputmode`/`autocomplete`. `100dvh` en pantallas completas. Gate con `role="dialog" aria-modal` + focus-trap mientras cierra + mover foco a Portada al abrir. Reduced-motion nunca auto-abre. Éxito RSVP no depende solo de color (texto + ✓).

---

## 10. Rendimiento (juez: WebView de WhatsApp en gama baja)

- **Animación de apertura:** solo `transform`/`opacity`; `will-change` acotado y removido al terminar; **sin rebote**. Probar en dispositivo real de gama baja o Lighthouse mobile con CPU 4× throttle; si cae de 60fps, degradar a fundido 2D.
- **Fuentes:** `font-display: swap` (ya presente), `preconnect` a `fonts.gstatic.com`, **`preload` solo de los 2 cortes above-the-fold** (Cormorant 300 italic + Jost 300), subset latino (`&text=`/`unicode-range`). No cargar los ~9 cortes de forma síncrona.
- **Imágenes:** base64 **solo** para portada (color) y sello (críticos, above-the-fold). Historia y mapas como **`.webp` externos** con `loading="lazy"` + cache en `_headers`, `width`/`height` explícitos (anti-CLS). Presupuesto: **<300KB de HTML crítico**, resto diferido. (El Save the Date ya pesa ~900KB por base64; no repetir el patrón.)
- **Mapas:** imagen estática como botón (decisión mantenida, es la correcta). Cero iframes.

---

## 11. Reuse map del repo (qué se reutiliza tal cual)

- **`config.js`** — `FIREBASE_CONFIG` global, init idempotente. Reutilizar sin cambios. Credenciales públicas por diseño (Web SDK). Se carga vía `<script src="/config.js">`.
- **SDK Firebase compat v10.12.0** desde gstatic (app + database). Añadir `firebase-auth-compat` solo para el dashboard (§7.7).
- **Patrón de escritura del tracking** (`index.html:512-565`) — guard `firebase.apps.length`, `try/catch` silencioso, `_soumyjos_sid` de `localStorage`. Base del `submitRsvp()`, pero **esperando el callback real** de `set()`.
- **Detección `isInAppBrowser`** (`index.html:476-490`) + **`.wa-banner`** — reutilizar para el botón `.ics`.
- **`updateCountdown()`** (`index.html:491-510`) — reutilizar cambiando strings y añadiendo ramas (§6.10).
- **Estilos de formulario del dashboard** (`dashboard/style.css:80-133`): `.gate-inner input` (fondo `--card`, `border:1px solid --rule`, focus `--burgundy`), botón outline, `.gate-error`. Base directa del RSVP.
- **`.scene` / `.scene--in`** (dashboard) — patrón del Motor B.
- **Tratamiento fotográfico B&N** `grayscale(100%) contrast(1.08)` — canon.
- **`favicon.svg`** y `<link>` de Google Fonts — compartidos.

**No reutilizar:** el `.ics` all-day del Save the Date (se genera uno nuevo con hora real); los hex hard-coded del `index.html` (se usa `:root`); las rutas `/calendar` y `/calendario` de `_redirects` (apuntan al `.ics` viejo).

---

## 12. Estructura de archivos y deploy

Archivos a crear/tocar (rutas absolutas):
- **Nuevo:** `/Users/amieva/Documents/Programming/SoumyJos/invitacion.html` (autocontenido; base64 solo crítico).
- **Nuevo:** `/Users/amieva/Documents/Programming/SoumyJos/Soumi-Jos-Invitacion.ics` — 1 `VEVENT` con `DTSTART`/`DTEND` a **hora real** de ceremonia, `LOCATION` con la **dirección canónica** (§13), `VALARM` relativos (`TRIGGER:-P1D`, `-PT3H`).
- **Nuevo (assets):** `og-invitacion.jpg` (1200×630, preview WhatsApp), `mapa-ceremonia.webp`, `mapa-recepcion.webp` (si dos sedes), fotos de Historia `.webp`.
- **Editar `_headers`:** bloque nuevo para `/Soumi-Jos-Invitacion.ics` con `Content-Type: text/calendar; charset=utf-8` + `Content-Disposition: attachment` (obligatorio para iOS/Android). Cache para los `.webp` nuevos y la OG.
- **Editar `_redirects`:** `/invitacion  /invitacion.html  200` (rewrite, URL limpia). No tocar los redirects existentes.
- **Editar `database.rules.json`:** añadir nodo `rsvp` (§7.5) **y publicar en Firebase Console**.
- **Editar `dashboard/index.html` + `dashboard/app.js`:** tarjeta RSVP (§7.7) + auth anónima.
- **Editar `sitemap.xml`:** decidir indexar `/invitacion` o dejar `noindex` (como `/dashboard`). Meta OG propios en la página.
- **Editar `CLAUDE.md`:** corregir "Ciudad de México" → *"Cuadra San Cristóbal, Atizapán de Zaragoza, Estado de México (zona metropolitana de la CDMX)"*; documentar la **excepción consciente de la cuenta regresiva** (anti-referencia del canon, pedida por la pareja, resuelta como pieza silenciosa sobre crema).

**Deploy:** drag-upload de la carpeta a Cloudflare Pages; dominio `soumyjos.com` al frente. `config.js` no está gitignored (se despliega). 100% estático; sin backend.

---

## 13. Reconciliación de ubicación (aplicada al copy y a los datos)

La sede **no está en CDMX**: está en **Cuadra San Cristóbal, colonia Los Clubes, Ciudad López Mateos, Atizapán de Zaragoza, Estado de México, CP 52957**, dentro de la zona metropolitana del Valle de México. El copy ya dice "ATIZAPÁN, EDO. DE MÉXICO"; el `CLAUDE.md` y el `.ics` viejo mienten y deben corregirse (el `.ics` nuevo debe nacer correcto).
- **Dos direcciones válidas circulan:** inmueble `20 Calle Manantial Oriente, Los Clubes, Atizapán` vs. contacto del recinto `Av. Juárez 59, Los Clubes, 52957, Cd. López Mateos`. **Fijar UNA canónica con la pareja/recinto** y usarla idéntica en: etiqueta del mapa, `LOCATION` del `.ics`, y botón "Copiar dirección".
- **Deep-link con lat/lng exactas**, no texto (§6.13). Nota fija: "sin estacionamiento en sitio; acceso por reservación".
- Capacidades verificadas del recinto: Jardín del Muro Rosa (70–150 cóctel) y Bloque de Patios (200–500 banquete) — **ambos espacios están en el mismo domicilio**, lo que hace muy probable el caso "una sola sede" (ver Pregunta A).

---

## 14. Preguntas abiertas / contenido que falta de la pareja

**Bloqueantes (resolver antes de cerrar secciones):**
- **A · Sedes — ✔ RESUELTO (pareja): DOS SEDES DISTINTAS.** Ceremonia y recepción en lugares diferentes → §6.6 **activa**: dos tarjetas gemelas, dos mapas, microcopy de traslado + hilo `--rule-warm`; el `.ics` lleva la sede/hora de la **ceremonia** como `DTSTART` y la recepción en la descripción. Pendiente de la pareja: las **dos** direcciones + horas (ver C/D).
- **B · Cupo RSVP — ✔ RESUELTO (pareja): TOPE GLOBAL.** `MAX_PASES` (default 2), copy no-personalizado ("Indíquenos cuántas personas nos acompañarán (hasta [MAX])"). Sin parámetro de grupo `?g`. Pendiente: valor final de `MAX_PASES` y fecha límite de RSVP.
- **C · Horas exactas** de ceremonia (y recepción). Bloquean `DTSTART/DTEND` del `.ics` y el `dates=YYYYMMDDTHHMMSS` de Google Calendar.
- **D · Dirección canónica única** (§13) y **lat/lng** del acceso.
- **E · Auth del dashboard** (anónima) para poder leer `rsvp` con `.read:false`.

**Diferibles (swap de texto/imagen, no bloquean estructura):** texto de dedicatoria; nombres de padres y padrinos; texto y fotos de "Nuestra historia" (con dimensiones fijas para no reflowear); código de vestimenta definitivo; datos de mesa de regalos / CLABE / lluvia de sobres; hoteles sugeridos; fecha límite de RSVP y `MAX_PASES`; decisión "solo adultos" (y su ubicación: dentro de RSVP o en Detalles); reflejo en Portada confirmado como único gesto de agua; foto a color de portada.

**Decisiones de diseño ya tomadas en este spec (no requieren a la pareja):** 2–3 muros a sangre (no 4); cuenta regresiva sobre crema; apertura del sobre sin rebote, un solo gesto ≤400ms; `--rose-deep` re-tintado a `#b56f6b`; `--sage` a `#4d6b40`; foco dependiente del fondo; monograma una sola vez; base64 solo crítico + `.webp` externos; RSVP con feedback real y `.read:false` + auth.