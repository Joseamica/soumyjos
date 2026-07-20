# Plan de implementación — Invitación formal "Soumi & Jos" (D1 · Planos Monumentales)

**REQUIRED SUB-SKILL:** `superpowers:executing-plans` (ejecución por checkpoints con revisión). **TDD adaptado:** este repo no tiene framework de pruebas (ni jest ni npm test); cada tarea cierra con (a) una VERIFICACIÓN concreta — abrir `invitacion.html` en navegador/preview y observar un comportamiento, o para lógica JS pura (cuenta regresiva, validación RSVP, `.ics`) un script Node con `assert` — y (b) un COMMIT. Pasos bite-sized: escribir → verificar-que-aún-no → implementar → verificar-que-sí → commit.

**Goal:** Entregar `invitacion.html`, una segunda página estática autocontenida en `soumyjos.com` que **coexiste** con el Save the Date (`index.html`, intocable), traduce la arquitectura de Barragán a una secuencia editorial sobre crema, captura confirmaciones (RSVP) en el Firebase RTDB existente bajo el nodo hermano `rsvp/`, y las expone en el dashboard existente. **Dos sedes distintas** (Decisión A), **RSVP con tope global** `MAX_PASES=2` con copy no personalizado (Decisión B), y **login anónimo de Firebase** en el dashboard para leer `/rsvp` protegido (Decisión E).

**Architecture:** Página plana única con scroll vertical (12 secciones), sin framework, sin build step obligatorio. `:root` con custom properties propias (NO importa el CSS de `index.html`, que hard-codea hex). Firebase compat SDK v10.12.0 desde gstatic (app + database; +auth solo en el dashboard). Reveal por dos motores (cascada `quietFade` tras abrir el sobre + IntersectionObserver por escena). Mapas como imágenes `.webp` estáticas que abren la app nativa vía deep-link `lat,lng`. Deploy por drag-upload a Cloudflare Pages; `/invitacion` como rewrite 200.

**Tech Stack:** HTML/CSS/JS vanilla (ES5-compatible, patrón IIFE del repo) · Firebase RTDB compat 10.12.0 (+auth-compat en dashboard) · Cloudflare Pages (`_headers`, `_redirects`) · Google Fonts (Cormorant Garamond + Jost, cache compartido) · Node (solo para scripts de verificación locales, no en runtime).

---

## FILE STRUCTURE

| Ruta absoluta | Acción | Responsabilidad (1 línea) |
|---|---|---|
| `/Users/amieva/Documents/Programming/SoumyJos/invitacion.html` | **Create** | Página completa autocontenida: `:root` (tokens D1), las 12 secciones, y todo el JS (sobre, reveal, sedes, countdown, RSVP, cierre). Base64 solo para portada + sello. |
| `/Users/amieva/Documents/Programming/SoumyJos/Soumi-Jos-Invitacion.ics` | **Create** | 1 `VEVENT` a hora real de la **ceremonia** (`DTSTART/DTEND`), `LOCATION` con dirección canónica, recepción en `DESCRIPTION`, `VALARM` relativos (`-P1D`, `-PT3H`). |
| `/Users/amieva/Documents/Programming/SoumyJos/assets/og-invitacion.jpg` | **Create** | Imagen OG 1200×630 para preview de WhatsApp. |
| `/Users/amieva/Documents/Programming/SoumyJos/assets/mapa-ceremonia.webp` | **Create** | Mapa estático ligero (~30–50KB) de la ceremonia; actúa como botón. |
| `/Users/amieva/Documents/Programming/SoumyJos/assets/mapa-recepcion.webp` | **Create** | Mapa estático ligero de la recepción (dos sedes, Decisión A). |
| `/Users/amieva/Documents/Programming/SoumyJos/assets/historia-*.webp` | **Create** | Fotos B&N de "Nuestra historia", `.webp` externas con `width`/`height` fijos (anti-CLS). |
| `/Users/amieva/Documents/Programming/SoumyJos/_headers` | **Modify** | Añadir bloque para `/Soumi-Jos-Invitacion.ics` (MIME + `Content-Disposition: attachment`) y cache para `.webp` nuevos + OG. NO tocar bloques existentes. |
| `/Users/amieva/Documents/Programming/SoumyJos/_redirects` | **Modify** | Añadir `/invitacion  /invitacion.html  200` (rewrite). NO tocar los redirects existentes. |
| `/Users/amieva/Documents/Programming/SoumyJos/database.rules.json` | **Modify** | Añadir nodo `rsvp` (escritura pública validada, lectura `auth != null`), conservando `tracking`. **Publicar en Firebase Console.** |
| `/Users/amieva/Documents/Programming/SoumyJos/dashboard/index.html` | **Modify** | Añadir `<section class="scene scene-6" data-scene="6">` (tarjeta RSVP) tras scene-5 + `<script>` de `firebase-auth-compat`. |
| `/Users/amieva/Documents/Programming/SoumyJos/dashboard/app.js` | **Modify** | `signInAnonymously()` + listener `rsvp` + `computeRsvp()` + `renderRsvp()` + export CSV. |
| `/Users/amieva/Documents/Programming/SoumyJos/sitemap.xml` | **Modify** | Decidir indexar `/invitacion` o dejarlo `noindex`; añadir entrada si se indexa. |
| `/Users/amieva/Documents/Programming/SoumyJos/CLAUDE.md` | **Modify** | Corregir ubicación ("Ciudad de México" → Cuadra San Cristóbal, Atizapán, Edo. de México) y documentar la excepción consciente de la cuenta regresiva. |
| `/Users/amieva/Documents/Programming/SoumyJos/config.js` | **Reuse (read-only)** | `FIREBASE_CONFIG` global; se carga con `<script src="/config.js">`. Sin cambios. |
| `/Users/amieva/Documents/Programming/SoumyJos/favicon.svg` | **Reuse (read-only)** | Favicon compartido. Sin cambios. |
| `/Users/amieva/Documents/Programming/SoumyJos/index.html` | **DO NOT TOUCH** | Save the Date. Solo se **leen** patrones (tracking write, `isInAppBrowser`, `updateCountdown`, `.wa-banner`). |
| `/Users/amieva/Documents/Programming/SoumyJos/tools/verify-ics.mjs` | **Create (scaffold)** | Script Node de verificación del `.ics` (asserts sobre VEVENT/VALARM/DTSTART). No se despliega. |
| `/Users/amieva/Documents/Programming/SoumyJos/tools/verify-rsvp.mjs` | **Create (scaffold)** | Script Node que ejercita `validateRsvp()`/`buildRsvpPayload()` con asserts. No se despliega. |

---

## Global Constraints (verbatim del spec — reglas duras)

Estas reglas son fuente de verdad y aplican a TODAS las tareas.

**Ámbito y coexistencia**
- *"una página estática nueva y separada (`invitacion.html`) que **convive** con el Save the Date ya publicado en `soumyjos.com`, **no lo reemplaza**."*
- *"No reemplazar ni modificar el Save the Date (`index.html`)."*
- *"Regla dura: la página nueva **no importa el CSS del `index.html`** (que hard-codea hex); define su propio `:root` con custom properties (patrón del dashboard) más la familia Barragán."*
- Claves storage de la invitación (sin colisión): `_sj_inv_opened`, `_soumyjos_rsvp_id`, `_soumyjos_rsvp_done`; `_soumyjos_sid` se **comparte** a propósito.
- *"No incrustar iframes de mapas (rendimiento)."* · *"No autoplay de sonido, ni música, ni confeti, ni reloj de cuenta regresiva animado."*

**SDK / Firebase (pisos de versión)**
- *"SDK Firebase compat v10.12.0 desde gstatic (app + database). Añadir `firebase-auth-compat` solo para el dashboard."*
- *"`config.js` — `FIREBASE_CONFIG` global, init idempotente. Reutilizar sin cambios."* · guard `firebase.apps.length`, `try/catch` silencioso.

**Paleta (tokens crudos, hex exactos — dos correcciones AA obligatorias)**
```
--cream-paper:#faf5ef; --cream-ground:#ede4d8; --cream-veil:#e7ddce; --sand:#b59a85;
--rose:#c98a83; --rose-deep:#b56f6b; --mauve:#9a8a9c; --terracotta:#a04535; --burgundy:#8b2e2e;
--ink:#3b1f10; --walnut:#6b4432; --sepia:#9a6855; --sage:#4d6b40;
--water:rgba(154,138,156,.14); --slit:rgba(59,31,16,.10);
```
- `--rose-deep` es **`#b56f6b`** (no `#bd7a77`); `--sage` es **`#4d6b40`** (no `#5a7d4a`).
- **Regla mnemónica de portador (dura):** *"muros claros (`rose`, `rose-deep`, `mauve`) → texto `--ink`. Muros oscuros (`terracotta`, `burgundy`) → texto `--cream-paper`. **Nunca `--walnut` ni ningún café intermedio sobre un muro**. Cuerpo largo y formularios: **solo sobre crema**."*
- *"Máximo 2–3 muros a sangre en toda la página"*: Portada (`--rose`), Dedicatoria (`--mauve`), Cierre (`--burgundy`). La cuenta regresiva **ya NO es muro** (va sobre crema). *"Más crema que muro, siempre."*

**Tipografía**
- Mismo `<link>` de Google Fonts: `Cormorant Garamond 0,300;0,400;1,300;1,400` + `Jost 200;300;400;500`.
- *"todo Jost va en MAYÚSCULAS con tracking, salvo cuerpo funcional largo (direcciones, inputs: `--fs-body`, tracking 0). **Cormorant nunca en mayúsculas ni con tracking alto.**"*
- Registro es_MX **formal ("usted"), sin emoji ni exclamaciones.** *"Whisper, don't announce."*

**Movimiento**
- *"se elimina `--ease-seal` (el rebote)… la apertura del sobre se resuelve como **un solo gesto de solapa ≤400ms** animando **solo `transform`/`opacity`**, sin rebote y sin coreografía de seis pasos."* Única curva: `--ease-quiet: cubic-bezier(.22,1,.36,1)`.
- **Guardrail:** *"con `prefers-reduced-motion: reduce`, toda `.scene` nace visible… el gate se salta o exige tap, **nunca auto-abre**."*

**Accesibilidad (AA verificado numéricamente)**
- Contraste AA normal ≥4.5, grande/UI ≥3. Portadores validados: ink/cream 13.9:1; ink/rose 5.36:1; ink/mauve 4.67:1; cream/terracotta 5.70:1; cream/burgundy 7.66:1; sage/crema ~5:1.
- **Foco dependiente del fondo:** sobre crema/muros claros `outline:3px solid var(--burgundy)`; sobre muros oscuros `outline:2px solid var(--cream-paper)`; siempre `outline-offset:2px`. Nunca `outline:none` sin reemplazo.
- Tap targets ≥44px reales; inputs `font-size ≥16px` (evita zoom iOS) + `inputmode`/`autocomplete`; `100dvh` en pantallas completas; gate `role="dialog" aria-modal` con focus-trap; éxito RSVP **no depende solo de color** (texto + ✓).

**Rendimiento (juez: WebView de WhatsApp en gama baja)**
- *"base64 **solo** para portada (color) y sello… Historia y mapas como `.webp` externos con `loading="lazy"`… Presupuesto: **<300KB de HTML crítico**, resto diferido."*
- Fuentes: `font-display: swap`, `preconnect` a `fonts.gstatic.com`, `preload` solo de los 2 cortes above-the-fold. `width`/`height` explícitos en toda imagen (anti-CLS).

**Privacidad / datos**
- **Sin PII en URLs / query strings.** Sin token por invitado. RSVP abierto con `MAX_PASES` (default **2**) y copy no personalizado.
- `.ics` deep-link/mapas por **coordenadas `lat,lng`**, nunca texto ni datos del invitado en la URL.
- `rsvp/.read:false` público (los nombres son PII); lectura solo con `auth != null`. Render en dashboard con `textContent` (nunca `innerHTML`).

**`.ics` / deploy**
- MIME obligatorio: `Content-Type: text/calendar; charset=utf-8` + `Content-Disposition: attachment`.
- *"editar el archivo `database.rules.json` **no basta** — hay que **publicar las reglas** en Firebase Console… Verificar que `tracking` sigue funcionando tras el deploy."*
- Deploy: drag-upload de la carpeta a Cloudflare Pages; `config.js` no está gitignored (se despliega); 100% estático, sin backend.

---


---

## Tareas — pasos de implementación (bite-sized)

I have everything I need — spec §5/§6/§10, the dashboard's `setupObserver` pattern, the shared font `<link>`, `_redirects`, and `config.js`. Here are the complete bite-sized steps for GROUP 1.

---


Cubre **Task 1** (scaffold `invitacion.html` + `:root` D1 + fuentes + meta OG + rewrite `/invitacion` + CSS base) y **Task 2** (Motor B IntersectionObserver + guardrail `prefers-reduced-motion`). Motor A (`cascadeReveal`) NO entra aquí: solo se invoca tras abrir el sobre, se implementa en Task 3.

Convención de pasos (TDD adaptado, sin framework): **escribir → verificar-que-aún-no → implementar → verificar-que-sí → commit**. La verificación es abrir la página en un preview y observar un comportamiento; no hay `npm test`.

---

### Task 1: Scaffold `invitacion.html` + `:root` (tokens D1) + fuentes + meta OG + rewrite `/invitacion`

**Files**
- **Create** `/Users/amieva/Documents/Programming/SoumyJos/invitacion.html`
- **Modify** `/Users/amieva/Documents/Programming/SoumyJos/_redirects`

**Interfaces**
- **Produces (`_redirects`):** línea `/invitacion  /invitacion.html  200`.
- **Produces (`<head>`):** `<link>` Google Fonts idéntico al dashboard; `preconnect` gstatic; meta OG propios; `<script src="/config.js">` + `firebase-app-compat` + `firebase-database-compat` 10.12.0.
- **Produces (CSS):** `:root` completo de §5 (crudos + semánticos + tipografía + espaciado/radios/sombras/movimiento, con `--rose-deep:#b56f6b` y `--sage:#4d6b40`), reset y CSS base (`body` crema, `.scene`, tipografía base).
- **Consumes:** `config.js` (`FIREBASE_CONFIG`), `favicon.svg`.

---

- [ ] **Paso 1.1 — Añadir el rewrite `/invitacion` a `_redirects`.** Edita `/Users/amieva/Documents/Programming/SoumyJos/_redirects`; NO toques las 3 líneas existentes (www→apex, `/calendar`, `/calendario`), solo **añade al final**:

```
# Invitación formal (segunda página; convive con el Save the Date)
/invitacion /invitacion.html 200
```

  **Verificar-que-aún-no:** `grep -n "invitacion" /Users/amieva/Documents/Programming/SoumyJos/_redirects` debe mostrar solo la línea nueva y `git diff _redirects` no debe alterar las líneas 1–7 previas.

- [ ] **Paso 1.2 — Crear `invitacion.html` con `<head>` completo, `<main>` vacío y los `<script>` (sin `:root` todavía).** Escribe `/Users/amieva/Documents/Programming/SoumyJos/invitacion.html` con este contenido exacto:

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>Invitación · Soumi &amp; Jos</title>
<meta name="description" content="Tenemos el honor de invitarle a celebrar nuestro matrimonio. 20 de marzo de 2027 · Cuadra San Cristóbal, Atizapán, Estado de México.">
<meta name="theme-color" content="#c98a83">

<link rel="icon" type="image/svg+xml" href="/favicon.svg">

<!-- OpenGraph / WhatsApp link preview (propios de la invitación) -->
<meta property="og:type" content="website">
<meta property="og:title" content="Invitación · Soumi &amp; Jos">
<meta property="og:description" content="20 de marzo de 2027 · Cuadra San Cristóbal, Atizapán, Estado de México">
<meta property="og:url" content="https://soumyjos.com/invitacion">
<meta property="og:image" content="https://soumyjos.com/assets/og-invitacion.jpg">
<meta property="og:image:secure_url" content="https://soumyjos.com/assets/og-invitacion.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Invitación · Soumi & Jos · 20 de marzo de 2027">
<meta property="og:locale" content="es_MX">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Invitación · Soumi &amp; Jos">
<meta name="twitter:description" content="20 de marzo de 2027 · Cuadra San Cristóbal, Atizapán, Estado de México">
<meta name="twitter:image" content="https://soumyjos.com/assets/og-invitacion.jpg">

<!-- Fuentes: mismo <link> y preconnect que el Save the Date y el dashboard (cache compartido) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap" rel="stylesheet">

<style>
/* :root y CSS base se añaden en los pasos 1.3 y 1.4 */
</style>
</head>
<body>

<main id="invitacion">
  <!-- Las 12 secciones se añaden en las tareas siguientes (cada una es una .scene) -->
</main>

<!-- SDK Firebase compat v10.12.0 (app + database). auth-compat solo en el dashboard. -->
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js"></script>
<script src="/config.js"></script>

<script>
/* Lógica de la invitación (IIFE). Los motores de reveal se añaden en Task 2. */
(function () {
  'use strict';
})();
</script>

</body>
</html>
```

  Nota de rendimiento (decisión consciente, no un TODO): el `preload` por-corte de fuentes que menciona §10 se **omite deliberadamente** aquí porque Google Fonts CSS2 sirve los `.woff2` bajo URLs con hash que no podemos fijar a mano sin arriesgar un 404; se conserva `preconnect` + `display=swap` (no bloqueante) y se revisita en Task 20 (QA de peso) si Lighthouse lo exige.

  **Verificar-que-aún-no:** el `<style>` está vacío, así que la página no tendrá fondo crema ni `.scene`. Prosigue.

- [ ] **Paso 1.3 — Insertar el bloque `:root` completo (tokens D1, hex corregidos).** Reemplaza la línea `/* :root y CSS base se añaden en los pasos 1.3 y 1.4 */` dentro de `<style>` por el `:root` íntegro de §5:

```css
:root {
  /* ── COLOR CRUDO ─────────────────────────────── */
  /* cremas / reino humano */
  --cream-paper:  #faf5ef;
  --cream-ground: #ede4d8;
  --cream-veil:   #e7ddce;
  --sand:         #b59a85;
  /* muros Barragán / reino ecuestre */
  --rose:       #c98a83;
  --rose-deep:  #b56f6b;   /* CORREGIDO (era #bd7a77): AA con --ink */
  --mauve:      #9a8a9c;
  --terracotta: #a04535;
  --burgundy:   #8b2e2e;
  /* tintas / cafés */
  --ink:    #3b1f10;
  --walnut: #6b4432;       /* SOLO sobre crema; prohibido sobre muros */
  --sepia:  #9a6855;
  /* utilitarios */
  --sage:  #4d6b40;        /* CORREGIDO (era #5a7d4a): AA sobre crema */
  --water: rgba(154,138,156,.14);
  --slit:  rgba(59,31,16,.10);

  /* ── SEMÁNTICOS ──────────────────────────────── */
  --bg:      var(--cream-ground);
  --surface: var(--cream-paper);
  --text-on-cream:      var(--ink);          /* 13.9:1 */
  --text-on-cream-soft: var(--walnut);       /* solo crema */
  --text-on-rose:       var(--ink);          /* 5.36:1 */
  --text-on-mauve:      var(--ink);          /* 4.67:1 */
  --text-on-terracotta: var(--cream-paper);  /* 5.70:1 */
  --text-on-burgundy:   var(--cream-paper);  /* 7.66:1 */
  --accent:      var(--burgundy);
  --accent-warm: var(--terracotta);
  --seal:        var(--terracotta);
  --rule:       rgba(139,46,46,.30);
  --rule-faint: rgba(139,46,46,.12);
  --rule-warm:  rgba(160,69,53,.28);
  /* FOCO dependiente del fondo (§9.2) */
  --focus-on-cream: var(--burgundy);
  --focus-on-wall:  var(--cream-paper);

  /* ── TIPOGRAFÍA ──────────────────────────────── */
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-label:   'Jost', system-ui, sans-serif;
  --fs-names:   clamp(3.4rem, 12vw, 5.75rem);
  --fs-display: clamp(2.1rem, 7vw, 3.25rem);
  --fs-date:    clamp(1.9rem, 6vw, 2.75rem);
  --fs-quote:   clamp(1.35rem, 4.4vw, 1.75rem);
  --fs-count:   clamp(2.4rem, 8vw, 3.4rem);
  --fs-lead:    1.25rem;
  --fs-eyebrow: clamp(.62rem, 2vw, .72rem);
  --fs-label:   .8rem;
  --fs-micro:   .68rem;
  --fs-btn:     .78rem;
  --fs-body:    1rem;                 /* inputs ≥16px reales en §11 */
  --ls-eyebrow: .42em;
  --ls-label:   .26em;
  --ls-micro:   .34em;
  --ls-wide:    .55em;
  --ls-names:   .015em;
  --lh-tight: 1.04;
  --lh-snug:  1.28;
  --lh-body:  1.62;

  /* ── ESPACIADO / RADIOS / SOMBRAS / MOVIMIENTO ── */
  --sp-1:.25rem; --sp-2:.5rem; --sp-3:.75rem; --sp-4:1rem;
  --sp-5:1.5rem; --sp-6:2rem; --sp-7:3rem; --sp-8:4.5rem;
  --sp-wall: clamp(4.5rem, 14vw, 8rem);
  --sp-void: clamp(6rem, 20vw, 11rem);
  --measure: 34rem;
  --card-max: 43rem;
  --tap-min: 44px;
  --radius-0: 0;
  --radius-sm: 2px;
  --radius-seal: 50%;
  --shadow-card:  0 12px 60px rgba(59,31,16,.16), 0 3px 10px rgba(59,31,16,.08);
  --shadow-soft:  0 4px 18px rgba(59,31,16,.12);
  --shadow-wall:  0 24px 80px -20px rgba(59,31,16,.22);
  --shadow-inset: inset 0 1px 2px rgba(59,31,16,.06);
  --ease-quiet: cubic-bezier(.22, 1, .36, 1);  /* única curva permitida */
  --dur-fast: .28s;
  --dur-base: .6s;
  --dur-rise: 1.1s;
  --dur-flap: .4s;
  --delay-step: .18s;
}
```

  **Verificar-que-aún-no:** todavía no hay reglas para `body`/`.scene`, así que la página sigue con fondo blanco por defecto del navegador. Prosigue al 1.4.

- [ ] **Paso 1.4 — Añadir reset + CSS base (body crema, tipografía base, `.scene`).** Justo **después** del cierre `}` del bloque `:root` (aún dentro de `<style>`), añade:

```css
/* Reset mínimo (igual criterio que index.html) */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { -webkit-text-size-adjust: 100%; }

body {
  background: var(--bg);
  color: var(--text-on-cream);
  font-family: var(--font-label);
  font-weight: 300;
  line-height: var(--lh-body);
  min-height: 100dvh;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  overflow-x: hidden;
}

/* Tipografía base: el cuerpo largo y las citas son Cormorant; los rótulos, Jost */
.display, .quote, .names, .date-line { font-family: var(--font-display); }

.eyebrow {
  font-family: var(--font-label);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: var(--ls-eyebrow);
  font-size: var(--fs-eyebrow);
  color: var(--text-on-cream-soft);
}

/* Regla fina canónica */
.rule {
  width: 48px; height: 1px; border: 0;
  background: var(--rule);
  margin: var(--sp-5) auto;
}

/* Foco visible por defecto (sobre crema); los muros oscuros lo sobrescriben en su sección */
:focus-visible {
  outline: 3px solid var(--focus-on-cream);
  outline-offset: 2px;
}

/* ── Motor B: estado base de cada escena (revelada por IntersectionObserver) ── */
.scene {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity var(--dur-base) var(--ease-quiet),
              transform var(--dur-base) var(--ease-quiet);
  will-change: opacity, transform;
}
.scene--in {
  opacity: 1;
  transform: translateY(0);
}
/* Tras revelar, soltar will-change lo asigna el JS al desobservar */
```

  **Verificar-que-sí (navegador):** desde la raíz del repo levanta un preview estático y abre `/invitacion`:

```bash
cd /Users/amieva/Documents/Programming/SoumyJos && python3 -m http.server 8788
```

  Abre `http://localhost:8788/invitacion.html` (con `python3 -m http.server` el rewrite de `_redirects` no aplica; usa el `.html` directo). Confirma en DevTools:
  - Fondo del `body` = crema `#ede4d8` (Computed → `background-color: rgb(237, 228, 216)`).
  - `getComputedStyle(document.documentElement).getPropertyValue('--rose-deep').trim()` devuelve `#b56f6b` y `--sage` devuelve `#4d6b40`.
  - Las fuentes cargan: en Network filtra `gstatic` y verás `Cormorant` + `Jost`; `document.fonts.check("300 1rem 'Jost'")` → `true` tras cargar.
  - `document.querySelector('main#invitacion')` existe.
  - Sin errores en Console (los `<script>` de Firebase cargan aunque aún no se inicialice nada).

  Para probar además el **rewrite** `/invitacion` (URL limpia), usa wrangler si está disponible: `npx wrangler pages dev . --port 8788` y abre `http://localhost:8788/invitacion` → debe servir el mismo HTML con 200.

- [ ] **Paso 1.5 — Commit.**

```bash
cd /Users/amieva/Documents/Programming/SoumyJos && git add invitacion.html _redirects && git commit -m "$(cat <<'EOF'
feat(invitacion): scaffold página + tokens D1 + rewrite /invitacion

- invitacion.html: head con meta OG propias, fuentes compartidas,
  SDK Firebase compat 10.12.0 (app+database), config.js, favicon
- :root con tokens §5 (crudos+semánticos+tipografía+espaciado),
  hex corregidos --rose-deep #b56f6b y --sage #4d6b40
- CSS base: body crema, reset, .scene / .scene--in, foco sobre crema
- _redirects: rewrite 200 /invitacion → /invitacion.html (no toca los previos)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Motor B (IntersectionObserver `.scene → .scene--in`) + guardrail `prefers-reduced-motion`

**Files**
- **Modify** `/Users/amieva/Documents/Programming/SoumyJos/invitacion.html`

**Interfaces**
- **Produces:** `prefersReducedMotion()` → `boolean` (`matchMedia('(prefers-reduced-motion: reduce)').matches`).
- **Produces:** `observeScenes()` → `void`. IO por `.scene` (`threshold:0.18`, `rootMargin:'0px 0px -12% 0px'`), añade `.scene--in`, `unobserve` tras revelar y limpia `will-change`. Fallback sin `IntersectionObserver` revela todo. Con reduced-motion revela todo sin observar.
- **Consumes:** clases `.scene` / `.scene--in` (Task 1), `--dur-base`, `--ease-quiet`.
- Patrón base: `dashboard/app.js:setupObserver` (líneas 57–70), endurecido con `unobserve` + `rootMargin` + guardrail.

---

- [ ] **Paso 2.1 — Añadir el guardrail CSS de `prefers-reduced-motion`.** Al **final** del `<style>` (después del bloque `.scene--in`), añade:

```css
/* ── Guardrail de accesibilidad (§6, §9.3): sin movimiento ── */
@media (prefers-reduced-motion: reduce) {
  .scene {
    opacity: 1;
    transform: none;
    transition: none;
    will-change: auto;
  }
  *, *::before, *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
    scroll-behavior: auto !important;
  }
}
```

  **Verificar-que-aún-no:** aún sin JS, las `.scene` que se agreguen más adelante nacerían ocultas salvo bajo reduced-motion. No hay nada que observar todavía; prosigue.

- [ ] **Paso 2.2 — Implementar `prefersReducedMotion()` y `observeScenes()` dentro del IIFE.** Reemplaza el cuerpo del IIFE (la línea `/* Lógica de la invitación (IIFE)... */` y el `'use strict';` vacío) por:

```html
<script>
/* Lógica de la invitación (IIFE). Motor B de reveal + guardrail reduced-motion.
   Motor A (cascadeReveal, solo tras abrir el sobre) se añade en Task 3. */
(function () {
  'use strict';

  // ── Guardrail ──────────────────────────────────────────
  function prefersReducedMotion() {
    return typeof window.matchMedia === 'function' &&
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ── Motor B: reveal por escena ─────────────────────────
  function revealAll(scenes) {
    for (var i = 0; i < scenes.length; i++) {
      scenes[i].classList.add('scene--in');
      scenes[i].style.willChange = 'auto';
    }
  }

  function observeScenes() {
    var scenes = document.querySelectorAll('.scene');
    if (!scenes.length) return;

    // Con reduced-motion o sin soporte de IO: revelar todo de una vez.
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      revealAll(scenes);
      return;
    }

    var io = new IntersectionObserver(function (entries, obs) {
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (!e.isIntersecting) continue;
        e.target.classList.add('scene--in');
        e.target.style.willChange = 'auto';   // liberar tras revelar
        obs.unobserve(e.target);              // una sola vez
      }
    }, {
      threshold: 0.18,
      rootMargin: '0px 0px -12% 0px'
    });

    for (var j = 0; j < scenes.length; j++) io.observe(scenes[j]);
  }

  // ── Boot ───────────────────────────────────────────────
  function boot() {
    observeScenes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Exponer para tareas siguientes (envelope, secciones) sin recrear el observer.
  window.__inv = window.__inv || {};
  window.__inv.prefersReducedMotion = prefersReducedMotion;
  window.__inv.observeScenes = observeScenes;
})();
</script>
```

- [ ] **Paso 2.3 — Sembrar dos `.scene` de prueba temporales para verificar el reveal.** Dentro de `<main id="invitacion">`, pega **temporalmente** (se elimina en el mismo paso tras verificar):

```html
  <section class="scene" style="min-height:90vh;display:grid;place-items:center;">
    <p class="quote" style="font-size:var(--fs-quote);font-style:italic;">Escena de prueba 1</p>
  </section>
  <section class="scene" style="min-height:90vh;display:grid;place-items:center;">
    <p class="quote" style="font-size:var(--fs-quote);font-style:italic;">Escena de prueba 2</p>
  </section>
```

  **Verificar-que-sí (navegador).** Con el preview corriendo (`python3 -m http.server 8788`), abre `http://localhost:8788/invitacion.html`:
  1. **Reveal normal:** la escena 1 aparece con fundido + leve subida al entrar en viewport; haz scroll y la escena 2 se revela igual. En Console, `document.querySelectorAll('.scene--in').length` crece de 1 a 2 al hacer scroll, y `document.querySelector('.scene').style.willChange` queda `"auto"` tras revelarse.
  2. **Reduced-motion:** en DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce", recarga. Verifica que **ambas** `.scene` nacen visibles sin fundido: `Array.from(document.querySelectorAll('.scene')).every(s => getComputedStyle(s).opacity === '1')` → `true`, y ninguna transición corre.
  3. **Sin errores** en Console.

  Tras confirmar, **elimina las dos `<section class="scene">` de prueba** para dejar `<main>` con solo el comentario de placeholder (las secciones reales llegan en Tasks 3+).

- [ ] **Paso 2.4 — Commit.**

```bash
cd /Users/amieva/Documents/Programming/SoumyJos && git add invitacion.html && git commit -m "$(cat <<'EOF'
feat(invitacion): Motor B (IntersectionObserver) + guardrail reduced-motion

- observeScenes(): revela .scene→.scene--in (threshold 0.18,
  rootMargin 0 0 -12% 0), unobserve tras revelar, libera will-change
- fallback sin IntersectionObserver y con prefers-reduced-motion:
  revela todo de una vez; nunca deja escenas ocultas
- prefersReducedMotion() expuesto en window.__inv para Task 3+
- CSS @media (prefers-reduced-motion: reduce): .scene nace visible

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Notas de contrato para las tareas siguientes (no implementar aquí)

- El IIFE expone `window.__inv.prefersReducedMotion` y `window.__inv.observeScenes` para que Task 3 (sobre) reutilice el mismo guardrail/observer sin recrearlos. Si prefieres no exponer globals, Task 3 puede mover estas funciones a un scope compartido; el contrato de firmas (`observeScenes()`, `prefersReducedMotion()`) se mantiene.
- Motor A (`cascadeReveal(rootEl)`) y la keyframe `quietFade` NO se definen en Grupo 1: pertenecen a Task 3–4 (solo se disparan tras abrir el sobre, sobre la Portada).
- Los `<script>` de Firebase ya están cargados pero **sin inicializar**; `initFirebase()` llega en Task 13. No añadir `firebase-auth-compat` a `invitacion.html` (auth es solo del dashboard, Task 18).
- `<main>` queda siempre en el DOM (requisito SEO + preview de WhatsApp, §6.1): el gate del sobre de Task 3 se superpone, no reemplaza `<main>`.

Read complete. I have the patterns I need (`isInAppBrowser`/`updateCountdown`/`sid` in `index.html`, `.scene`/`.scene--in` + reduced-motion in the dashboard). Here are the complete GROUP 2 tasks.

---


Estas tareas asumen que **GRUPO 1 ya entregó**: `invitacion.html` con `<head>` (fuentes + OG + Firebase), `:root` con todos los tokens D1 (§5), un `<main id="inv-main">` vacío, y una IIFE `<script>` con una función `init()` invocada en `DOMContentLoaded`. Asumen también que **Task 2 (Motor A/B)** ya definió y expuso dentro de la IIFE: `observeScenes()`, `cascadeReveal(rootEl)` y `prefersReducedMotion()`.

**Contrato de reveal que GRUPO 2 consume (fijado, sin deriva):**
- **Motor B** observa `.scene` y le añade `.scene--in`. Portada **no** lleva la clase `.scene` (la revela Motor A, no Motor B).
- **Motor A** `cascadeReveal(rootEl)` recorre los descendientes de `rootEl` que tengan `[data-cascade]`, les fija un `transition-delay` incremental (`--delay-step`) inline y les añade la clase `.is-cascaded`. GRUPO 2 aporta el CSS de estado (oculto/visible) de esos elementos; Task 2 solo alterna la clase y el delay. Con `prefersReducedMotion()` verdadero, `cascadeReveal` revela sin stagger.

**Punto de inserción JS (todas las tareas):** las funciones nuevas viven dentro de la IIFE existente; sus llamadas se añaden al cuerpo de `init()`.

Verificación local en todas las tareas:
```bash
cd /Users/amieva/Documents/Programming/SoumyJos && python3 -m http.server 8000
# abrir http://localhost:8000/invitacion.html
```

---

### Task 3: Apertura / Sobre (gate de una sola compuerta) + `sessionStorage` + focus-trap

**Files:** Modify `/Users/amieva/Documents/Programming/SoumyJos/invitacion.html`.

**Interfaces**
- **Produces:** `setupEnvelope() → void`, `openEnvelope() → void`, `shouldSkipGate() → boolean`.
- **Produces (DOM):** `#inv-gate` (`role="dialog" aria-modal="true"`), `#inv-envelope` (`<button>`).
- **Produces (datos):** clave `sessionStorage['_sj_inv_opened'] = '1'`.
- **Consumes:** `prefersReducedMotion()`, `cascadeReveal()` (Task 2); `.scene--portada` (Task 4, aún no existe → el gate degrada sin ella).
- **Consumes (tokens):** `--rose`, `--cream-paper`, `--seal`, `--slit`, `--rule-faint`, `--shadow-wall`, `--shadow-soft`, `--radius-seal`, `--radius-sm`, `--font-display`, `--font-label`, `--fs-micro`, `--ls-micro`, `--focus-on-cream`, `--dur-flap`, `--ease-quiet`, `--sp-5`, `--sp-6`.

**Pasos**

- [ ] **3.1 — Insertar el markup del gate.** Justo después de la etiqueta `<body>` (antes de `<main id="inv-main">`), pegar:
  ```html
  <div id="inv-gate" class="gate" role="dialog" aria-modal="true" aria-label="Invitación de boda de Soumi y Jos">
    <div class="gate__slits" aria-hidden="true"></div>
    <button type="button" class="envelope" id="inv-envelope" aria-label="Abrir la invitación">
      <span class="envelope__flap" aria-hidden="true"></span>
      <span class="envelope__seal" aria-hidden="true"><span class="seal__mono">SJ</span></span>
      <span class="envelope__hint">Toca para abrir</span>
    </button>
  </div>
  ```
  *Verificar-que-aún-no:* recargar → aparece el texto "SJ / Toca para abrir" sin estilo, apilado sobre el fondo del body. Sin CSS todavía.

- [ ] **3.2 — Añadir el CSS del gate y del sobre.** Dentro del `<style>` de la página, pegar:
  ```css
  /* ===== Apertura / Sobre (§6.1) ===== */
  .gate{
    position:fixed; inset:0; z-index:100;
    display:flex; align-items:center; justify-content:center;
    min-height:100dvh; padding:var(--sp-6);
    background:var(--rose);
    opacity:1;
    transition:opacity var(--dur-flap) var(--ease-quiet);
  }
  .gate.is-closing{ opacity:0; }
  .gate.is-hidden{ display:none; }

  /* Ranuras verticales (--slit) — única aparición en toda la página */
  .gate__slits{
    position:absolute; inset:0; pointer-events:none; opacity:.5;
    background:repeating-linear-gradient(90deg,
      transparent 0, transparent 46px,
      var(--slit) 46px, var(--slit) 48px);
  }

  .envelope{
    position:relative; z-index:1;
    display:flex; flex-direction:column; align-items:center; justify-content:flex-end;
    gap:var(--sp-5);
    width:min(78vw,320px); aspect-ratio:7/5;
    padding:var(--sp-6);
    background:var(--cream-paper);
    border:0; border-radius:var(--radius-sm);
    box-shadow:var(--shadow-wall);
    cursor:pointer; color:var(--ink);
  }
  .envelope:focus-visible{ outline:3px solid var(--focus-on-cream); outline-offset:2px; }
  .envelope[disabled]{ cursor:default; }

  /* La solapa se lee por sombra + hairline, NUNCA por color (--cream-veil es invisible sobre crema) */
  .envelope__flap{
    position:absolute; top:0; left:0; right:0; height:52%;
    transform-origin:top center;
    background:linear-gradient(180deg, rgba(59,31,16,.05), transparent);
    border-bottom:1px solid var(--rule-faint);
    box-shadow:var(--shadow-soft);
    transition:transform var(--dur-flap) var(--ease-quiet), opacity var(--dur-flap) var(--ease-quiet);
    pointer-events:none;
  }
  /* Un solo gesto ≤400ms, solo transform/opacity, sin rebote */
  .envelope.is-open .envelope__flap{ transform:translateY(-8%) scaleY(0); opacity:0; }

  .envelope__seal{
    position:relative; z-index:1;
    display:flex; align-items:center; justify-content:center;
    width:74px; height:74px; border-radius:var(--radius-seal);
    background:var(--seal); box-shadow:var(--shadow-soft);
  }
  .seal__mono{
    font-family:var(--font-display); font-style:italic; font-weight:400;
    font-size:1.6rem; letter-spacing:.02em; color:var(--cream-paper); /* crema sobre terracota = 5.70:1 */
  }
  .envelope__hint{
    font-family:var(--font-label); font-weight:200;
    font-size:var(--fs-micro); letter-spacing:var(--ls-micro);
    text-transform:uppercase; color:var(--ink);
  }
  @media (prefers-reduced-motion: no-preference){
    .envelope:not(.is-open) .envelope__hint{ animation:hintPulse 2.6s var(--ease-quiet) infinite; }
  }
  @keyframes hintPulse{ 0%,100%{opacity:.55} 50%{opacity:1} }

  /* Guardrail: reduced-motion → solapa ya abierta, sin transición; jamás auto-apertura */
  @media (prefers-reduced-motion: reduce){
    .gate{ transition-duration:.15s; }
    .envelope__flap{ transform:translateY(-8%) scaleY(0); opacity:0; transition:none; }
    .envelope:not(.is-open) .envelope__hint{ animation:none; }
  }
  ```
  *Verificar:* recargar → sobre crema centrado a pantalla completa sobre muro rosa, sello terracota con "SJ" en crema, ranuras verticales tenues, microcopy con pulso suave. Con DevTools emulando `prefers-reduced-motion: reduce`, el sobre nace con la solapa colapsada y sin pulso.

- [ ] **3.3 — Añadir la lógica del gate en la IIFE.** Pegar estas tres funciones dentro de la IIFE (antes de `init`):
  ```javascript
  function shouldSkipGate(){
    try { if (sessionStorage.getItem('_sj_inv_opened') === '1') return true; } catch (e) {}
    if (location.hash && location.hash.length > 1) return true; // p.ej. #rsvp
    return false;
  }

  function revealPortada(){
    var portada = document.querySelector('.scene--portada');
    if (!portada) return;
    portada.focus();               // primer elemento de la Portada (tabindex=-1 en el markup)
    cascadeReveal(portada);        // Motor A
  }

  function openEnvelope(){
    var gate = document.getElementById('inv-gate');
    var envelope = document.getElementById('inv-envelope');
    if (!gate || !envelope || envelope.disabled) return;

    envelope.classList.add('is-open');
    envelope.disabled = true;
    try { sessionStorage.setItem('_sj_inv_opened', '1'); } catch (e) {}

    var reduced = prefersReducedMotion();
    var flapMs = reduced ? 0 : 400;    // gesto de solapa
    var fadeMs = reduced ? 150 : 400;  // fundido del muro rosa → Portada (también rosa)

    window.setTimeout(function(){
      gate.classList.add('is-closing');
      window.setTimeout(function(){
        gate.classList.add('is-hidden');
        revealPortada();
      }, fadeMs);
    }, flapMs);
  }

  function setupEnvelope(){
    var gate = document.getElementById('inv-gate');
    var envelope = document.getElementById('inv-envelope');
    if (!gate || !envelope) return;

    if (shouldSkipGate()){
      gate.classList.add('is-hidden');
      revealPortada();
      return;
    }

    // Focus-trap: mientras el gate está visible, el foco no escapa del sobre
    gate.addEventListener('keydown', function(e){
      if (e.key === 'Tab' && !gate.classList.contains('is-hidden')){
        e.preventDefault();
        envelope.focus();
      }
    });

    envelope.addEventListener('click', openEnvelope); // Enter/Space ya los emite <button>
    envelope.focus();
  }
  ```
  Luego, en el cuerpo de `init()`, añadir la llamada **al inicio** (antes de `observeScenes()`):
  ```javascript
  setupEnvelope();
  ```
  *Verificar-que-aún-no:* la Portada todavía no existe (Task 4), así que `revealPortada()` no hace nada visible aún; el gate debe seguir mostrándose y responder al tap fundiéndose a rosa (sin flash de color).
  *Verificar:* (a) tap/Enter/Espacio sobre el sobre → solapa sube en un gesto y el muro se funde en ≤~600ms; (b) recargar la pestaña → el gate **se salta** (sessionStorage); (c) abrir `http://localhost:8000/invitacion.html#rsvp` → gate saltado; (d) `Tab` con el gate abierto no saca el foco del sobre; (e) emular reduced-motion → nunca auto-abre, y al tap el fundido dura ~150ms sin animar la solapa.

- [ ] **3.4 — Commit.**
  ```bash
  cd /Users/amieva/Documents/Programming/SoumyJos && git add invitacion.html && git commit -m "Add envelope gate: single-flap open, session skip, focus-trap"
  ```

---

### Task 4: Portada (muro `--rose`) + foto a color + reflejo (único gesto de agua)

**Files:** Modify `/Users/amieva/Documents/Programming/SoumyJos/invitacion.html` (foto a color base64 inline en el markup).

**Interfaces**
- **Produces (DOM):** `<section class="scene--portada" tabindex="-1">` con eyebrow, nombres, regla, fecha, sede, tagline, foto y reflejo; elementos marcados con `[data-cascade]` para Motor A.
- **Produces (CSS estado cascada):** reglas `[data-cascade]` (oculto) y `[data-cascade].is-cascaded` (visible), consumidas por `cascadeReveal()`.
- **Produces (utilidades compartidas):** `.eyebrow`, `.rule`, `.rule--48` (reutilizadas por Tasks 5 y 6).
- **Consumes:** `cascadeReveal()` (Task 2); tokens `--rose`, `--text-on-rose (=--ink)`, `--ink`, `--fs-names`, `--fs-date`, `--fs-quote`, `--fs-eyebrow`, `--ls-eyebrow`, `--ls-label`, `--ls-names`, `--lh-tight`, `--rule`, `--card-max`, `--measure`, `--radius-sm`, `--shadow-soft`, `--sp-*`, `--sp-wall`, `--dur-base`, `--ease-quiet`.
- **Datos:** `[PLACEHOLDER] PORTADA_PHOTO` = data-URI (ejemplo seguro: rectángulo gris 3:4; reemplazar por base64 JPEG a color real).

**Pasos**

- [ ] **4.1 — Insertar el markup de la Portada.** Como **primer** hijo de `<main id="inv-main">`, pegar (la foto usa un placeholder gris 3:4 seguro; reemplazar `src` por el base64 JPEG real):
  ```html
  <section class="scene--portada" data-scene="portada" tabindex="-1" aria-labelledby="portada-names">
    <div class="portada__inner">
      <p class="eyebrow" data-cascade>Nuestra boda</p>
      <h1 class="portada__names" id="portada-names" data-cascade>Soumi &amp; Jos</h1>
      <div class="portada__reflection" aria-hidden="true">Soumi &amp; Jos</div>
      <span class="rule rule--48" data-cascade aria-hidden="true"></span>
      <p class="portada__date" data-cascade>20 de marzo de 2027</p>
      <p class="portada__venue" data-cascade>Cuadra San Cristóbal · Atizapán, Edo. de México</p>
      <p class="portada__tagline" data-cascade>Tenemos el honor de invitarle a celebrar nuestro matrimonio.</p>
      <figure class="portada__photo" data-cascade>
        <!-- [PLACEHOLDER] PORTADA_PHOTO: reemplazar por base64 JPEG a color (single foto a color de la página) -->
        <img width="900" height="1200" decoding="async" alt="Soumi y Jos"
          src="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='900'%20height='1200'%3E%3Crect%20width='900'%20height='1200'%20fill='%23d8c9b8'/%3E%3C/svg%3E">
      </figure>
    </div>
  </section>
  ```
  Nota: `.eyebrow` usa mayúsculas vía CSS (`text-transform`), por eso el texto va en caja normal en el HTML.
  *Verificar-que-aún-no:* recargar y saltar el gate (recargar dos veces) → el bloque aparece sin estilo de muro; los `[data-cascade]` aún ocultos si el CSS de estado no existe.

- [ ] **4.2 — Añadir el CSS del muro, utilidades compartidas y estado de cascada.** Pegar en el `<style>`:
  ```css
  /* ===== Utilidades compartidas (eyebrow, reglas) ===== */
  .eyebrow{
    font-family:var(--font-label); font-weight:400;
    font-size:var(--fs-eyebrow); letter-spacing:var(--ls-eyebrow);
    text-transform:uppercase; color:inherit; margin:0;
  }
  .rule{ display:block; height:1px; border:0; background:var(--rule); }
  .rule--48{ width:48px; margin:var(--sp-3) 0; }

  /* ===== Estado de cascada (Motor A) — GRUPO 2 aporta el estilo; Task 2 alterna la clase ===== */
  [data-cascade]{ opacity:0; transform:translateY(14px); }
  [data-cascade].is-cascaded{
    opacity:1; transform:none;
    transition:opacity var(--dur-base) var(--ease-quiet), transform var(--dur-base) var(--ease-quiet);
  }
  @media (prefers-reduced-motion: reduce){
    [data-cascade]{ opacity:1; transform:none; }
    [data-cascade].is-cascaded{ transition:none; }
  }

  /* ===== Portada (§6.2) — muro --rose, texto --ink ===== */
  .scene--portada{
    background:var(--rose); color:var(--text-on-rose);
    min-height:100dvh; display:flex; align-items:center; justify-content:center;
    padding:var(--sp-wall) var(--sp-5);
  }
  .scene--portada:focus{ outline:none; } /* contenedor solo recibe foco programático al abrir */
  .portada__inner{
    width:100%; max-width:var(--card-max);
    display:flex; flex-direction:column; align-items:center; text-align:center;
    gap:var(--sp-4);
  }
  .portada__names{
    font-family:var(--font-display); font-style:italic; font-weight:300;
    font-size:var(--fs-names); line-height:var(--lh-tight); letter-spacing:var(--ls-names);
    color:var(--ink); margin:0;
  }
  /* Reflejo: único gesto de agua de toda la invitación */
  .portada__reflection{
    font-family:var(--font-display); font-style:italic; font-weight:300;
    font-size:var(--fs-names); line-height:var(--lh-tight); letter-spacing:var(--ls-names);
    color:var(--ink); transform:scaleY(-1); opacity:.14; margin-top:-.42em;
    -webkit-mask-image:linear-gradient(180deg, rgba(0,0,0,.85), transparent 68%);
            mask-image:linear-gradient(180deg, rgba(0,0,0,.85), transparent 68%);
    pointer-events:none; user-select:none;
  }
  .portada__date{
    font-family:var(--font-display); font-weight:400; font-style:normal;
    font-size:var(--fs-date); color:var(--ink); margin:0;
  }
  .portada__venue{
    font-family:var(--font-label); font-weight:300;
    font-size:var(--fs-eyebrow); letter-spacing:var(--ls-label);
    text-transform:uppercase; color:var(--ink); margin:0;
  }
  .portada__tagline{
    font-family:var(--font-display); font-style:italic; font-weight:400;
    font-size:var(--fs-quote); color:var(--ink); max-width:var(--measure); margin:var(--sp-2) 0 0;
  }
  .portada__photo{ margin:var(--sp-5) 0 0; width:min(70vw,300px); }
  .portada__photo img{
    display:block; width:100%; height:auto;
    border-radius:var(--radius-sm); box-shadow:var(--shadow-soft);
  }
  ```
  *Verificar:* recargar dos veces (para saltar el gate y ver la Portada revelada por Motor A) → muro rosa a sangre, nombres en tinta oscura con reflejo tenue justo debajo, regla de 48px, fecha, sede en Jost mayúsculas, tagline en Cormorant italic; la foto placeholder queda bajo el pliegue.

- [ ] **4.3 — Verificar apertura real + encaje sin scroll en móvil.**
  *Verificar:* abrir en DevTools a 375×812; borrar `sessionStorage` (`sessionStorage.clear()` en consola) y recargar → aparece el gate; tocar el sobre → tras el fundido, el bloque **nombres/fecha/sede cabe sin scroll** y el foco cae en la Portada (comprobar con `document.activeElement` → la `<section class="scene--portada">`). Los nombres en `--ink` sobre rosa se leen con holgura.

- [ ] **4.4 — Commit.**
  ```bash
  cd /Users/amieva/Documents/Programming/SoumyJos && git add invitacion.html && git commit -m "Add Portada wall: rose ground, ink names with single reflection, color photo"
  ```

---

### Task 5: Dedicatoria (muro `--mauve`, único) + bloque de padres

**Files:** Modify `/Users/amieva/Documents/Programming/SoumyJos/invitacion.html`.

**Interfaces**
- **Produces (DOM):** `<section class="scene scene--dedicatoria">` (lleva `.scene` → la revela **Motor B**), con eyebrow, cuerpo, regla, y bloque `NUESTROS PADRES`.
- **Consumes:** `observeScenes()` (Task 2, ya observa `.scene`); `.eyebrow`, `.rule--48` (Task 4); tokens `--mauve`, `--text-on-mauve (=--ink)`, `--ink`, `--measure`, `--fs-quote`, `--fs-body`, `--rule-faint`, `--sp-*`, `--sp-wall`, `--sp-void`.
- **Datos:** `[PLACEHOLDER] PADRES` (nombres de madre/padre de novia y novio); `[PLACEHOLDER] PADRINOS` (opcional).

**Pasos**

- [ ] **5.1 — Insertar el markup de la Dedicatoria.** Dentro de `<main>`, **inmediatamente después** de `.scene--portada`, pegar:
  ```html
  <section class="scene scene--dedicatoria" data-scene="dedicatoria" aria-labelledby="dedicatoria-eyebrow">
    <div class="dedicatoria__inner">
      <p class="eyebrow" id="dedicatoria-eyebrow">Con el corazón</p>
      <p class="dedicatoria__body">Con la bendición de Dios y de nuestros padres, tenemos el honor de invitarle a la celebración de nuestro matrimonio. Su presencia dará a este día su verdadero sentido.</p>
      <span class="rule rule--48" aria-hidden="true"></span>
      <p class="eyebrow dedicatoria__parents-title">Nuestros padres</p>
      <div class="dedicatoria__parents">
        <div class="parents__col">
          <p class="parents__name">[PLACEHOLDER: Madre de la novia]</p>
          <p class="parents__name">[PLACEHOLDER: Padre de la novia]</p>
        </div>
        <div class="parents__col">
          <p class="parents__name">[PLACEHOLDER: Madre del novio]</p>
          <p class="parents__name">[PLACEHOLDER: Padre del novio]</p>
        </div>
      </div>
      <!-- [PLACEHOLDER] PADRINOS (opcional): descomentar si aplica
      <p class="eyebrow dedicatoria__parents-title">Con el padrinazgo de</p>
      <div class="dedicatoria__parents">
        <div class="parents__col"><p class="parents__name">[PLACEHOLDER: Padrino]</p></div>
        <div class="parents__col"><p class="parents__name">[PLACEHOLDER: Madrina]</p></div>
      </div>
      -->
    </div>
  </section>
  ```
  *Verificar-que-aún-no:* recargar (saltando gate) → aparece el texto sin estilo de muro y, por ser `.scene` sin CSS aún, puede estar oculto (Motor B no tiene estado visible definido para este muro). Se resuelve en 5.2.

- [ ] **5.2 — Añadir el CSS de la Dedicatoria (incluye estado reveal `.scene--in` propio del muro).** Pegar en el `<style>`:
  ```css
  /* ===== Dedicatoria (§6.3) — muro --mauve, único; --sp-void crema antes y después ===== */
  .scene--dedicatoria{
    background:var(--mauve); color:var(--text-on-mauve);
    margin:var(--sp-void) 0;            /* banda crema del body a ambos lados: no adyacente a Portada */
    padding:var(--sp-wall) var(--sp-5);
    /* estado reveal Motor B */
    opacity:0; transform:translateY(16px);
    transition:opacity var(--dur-base) var(--ease-quiet), transform var(--dur-base) var(--ease-quiet);
  }
  .scene--dedicatoria.scene--in{ opacity:1; transform:none; }
  @media (prefers-reduced-motion: reduce){
    .scene--dedicatoria{ opacity:1; transform:none; transition:none; }
  }
  .dedicatoria__inner{
    max-width:var(--measure); margin:0 auto;
    display:flex; flex-direction:column; align-items:center; text-align:center; gap:var(--sp-4);
  }
  .dedicatoria__body{
    font-family:var(--font-display); font-style:italic; font-weight:400;
    font-size:var(--fs-quote); line-height:var(--lh-body); color:var(--ink); margin:0;
  }
  .dedicatoria__parents-title{ margin-top:var(--sp-3); }
  .parents__name{
    font-family:var(--font-label); font-weight:300; font-size:var(--fs-body);
    letter-spacing:.02em; text-transform:none; color:var(--ink); margin:.15em 0;
  }
  .dedicatoria__parents{
    display:grid; grid-template-columns:1fr; gap:var(--sp-4); width:100%;
    margin-top:var(--sp-2);
  }
  @media (min-width:600px){
    .dedicatoria__parents{ grid-template-columns:1fr 1fr; align-items:start; }
    .dedicatoria__parents .parents__col:first-child{
      border-right:1px solid var(--rule-faint); padding-right:var(--sp-5); text-align:right;
    }
    .dedicatoria__parents .parents__col:last-child{ padding-left:var(--sp-5); text-align:left; }
  }
  ```
  *Verificar:* recargar → entre el muro rosa (Portada) y el malva (Dedicatoria) hay una **banda de crema** (no son adyacentes); al entrar en viewport el muro malva se funde (Motor B). Los nombres de padres van en una columna en móvil y en dos con hairline vertical a partir de 600px. Texto `--ink` legible sobre malva.

- [ ] **5.3 — Commit.**
  ```bash
  cd /Users/amieva/Documents/Programming/SoumyJos && git add invitacion.html && git commit -m "Add Dedicatoria wall: mauve ground, formal blessing, parents block"
  ```

---

### Task 6: Nuestra historia (opcional, crema) — grid B&N `.webp` diferido

**Files:** Modify `/Users/amieva/Documents/Programming/SoumyJos/invitacion.html`; Create `/Users/amieva/Documents/Programming/SoumyJos/assets/historia-1.webp` … `historia-4.webp`.

**Interfaces**
- **Produces (DOM):** `<section class="scene scene--historia">` (Motor B) con grid 2-col de `.webp` diferidas (`loading="lazy"`, `width`/`height` explícitos, B&N canónico) y frases Cormorant italic; stagger por celda vía CSS.
- **Consumes:** `observeScenes()` (Task 2); `.eyebrow` (Task 4); tokens `--bg`, `--text-on-cream (=--ink)`, `--ink`, `--card-max`, `--measure`, `--fs-quote`, `--sp-*`, `--sp-void`, `--dur-base`, `--ease-quiet`.
- **Datos:** `[PLACEHOLDER] HISTORIA` (fotos + frases). **Sección plegable:** si la pareja no entrega contenido, eliminar toda la `<section>` (no dejar placeholders vacíos en producción).

**Pasos**

- [ ] **6.1 — Crear assets placeholder `.webp` (para verificar el layout anti-CLS).** Generar cuatro `.webp` 640×480 grises temporales:
  ```bash
  cd /Users/amieva/Documents/Programming/SoumyJos && mkdir -p assets && \
  if command -v magick >/dev/null 2>&1; then CONV="magick"; else CONV="convert"; fi && \
  for n in 1 2 3 4; do $CONV -size 640x480 xc:'#c9b7a6' assets/historia-$n.webp; done && \
  ls -la assets/historia-*.webp
  ```
  Si no hay ImageMagick, colocar manualmente cuatro `.webp` 640×480. Reemplazar por las fotos reales B&N cuando la pareja las entregue.
  *Verificar-que-aún-no:* los archivos existen pero aún no se referencian en el HTML.

- [ ] **6.2 — Insertar el markup de Historia.** Dentro de `<main>`, **después** de `.scene--dedicatoria`, pegar:
  ```html
  <!-- [PLACEHOLDER] HISTORIA — sección OPCIONAL: eliminar por completo si no hay contenido -->
  <section class="scene scene--historia" data-scene="historia" aria-labelledby="historia-eyebrow">
    <div class="historia__inner">
      <p class="eyebrow" id="historia-eyebrow">Nuestra historia</p>
      <p class="historia__lead">[PLACEHOLDER: una o dos líneas de arranque, editables.]</p>
      <div class="historia__grid">
        <figure class="historia__cell"><img src="/assets/historia-1.webp" width="640" height="480" loading="lazy" decoding="async" alt=""></figure>
        <figure class="historia__cell"><img src="/assets/historia-2.webp" width="640" height="480" loading="lazy" decoding="async" alt=""></figure>
        <figure class="historia__cell"><img src="/assets/historia-3.webp" width="640" height="480" loading="lazy" decoding="async" alt=""></figure>
        <figure class="historia__cell"><img src="/assets/historia-4.webp" width="640" height="480" loading="lazy" decoding="async" alt=""></figure>
      </div>
      <p class="historia__phrase">[PLACEHOLDER: una frase breve que enmarque las imágenes.]</p>
    </div>
  </section>
  ```
  Nota: los `alt=""` son intencionales (imágenes decorativas de galería); la narrativa va en las frases de texto.
  *Verificar-que-aún-no:* recargar → el grid se ve sin estilo (imágenes a tamaño natural, apiladas), sección `.scene` posiblemente oculta hasta 6.3.

- [ ] **6.3 — Añadir el CSS de Historia (grid, B&N, reveal + stagger por celda).** Pegar en el `<style>`:
  ```css
  /* ===== Nuestra historia (§6.4) — crema, grid B&N diferido ===== */
  .scene--historia{
    background:var(--bg); color:var(--text-on-cream);
    padding:var(--sp-void) var(--sp-5);
    /* estado reveal Motor B */
    opacity:0; transform:translateY(16px);
    transition:opacity var(--dur-base) var(--ease-quiet), transform var(--dur-base) var(--ease-quiet);
  }
  .scene--historia.scene--in{ opacity:1; transform:none; }
  .historia__inner{ max-width:var(--card-max); margin:0 auto; text-align:center; }
  .historia__grid{
    display:grid; grid-template-columns:1fr 1fr; gap:3px; margin:var(--sp-5) 0;
  }
  .historia__cell{ margin:0; overflow:hidden; }
  .historia__cell img{
    display:block; width:100%; height:180px; object-fit:cover;
    filter:grayscale(100%) contrast(1.08); /* B&N canónico */
    /* stagger por celda */
    opacity:0; transform:translateY(14px);
    transition:opacity var(--dur-base) var(--ease-quiet), transform var(--dur-base) var(--ease-quiet);
  }
  @media (min-width:600px){ .historia__cell img{ height:260px; } }
  .scene--historia.scene--in .historia__cell img{ opacity:1; transform:none; }
  .scene--historia.scene--in .historia__cell:nth-child(2) img{ transition-delay:.08s; }
  .scene--historia.scene--in .historia__cell:nth-child(3) img{ transition-delay:.16s; }
  .scene--historia.scene--in .historia__cell:nth-child(4) img{ transition-delay:.24s; }
  .historia__lead, .historia__phrase{
    font-family:var(--font-display); font-style:italic; font-weight:400;
    font-size:var(--fs-quote); color:var(--ink); max-width:var(--measure); margin:var(--sp-4) auto 0;
  }
  @media (prefers-reduced-motion: reduce){
    .scene--historia{ opacity:1; transform:none; transition:none; }
    .scene--historia .historia__cell img{ opacity:1; transform:none; transition:none; }
  }
  ```
  *Verificar:* recargar → grid 2×2 en B&N con `gap:3px`, frases en Cormorant italic; al entrar en viewport, las celdas se revelan con leve stagger. En **DevTools → Network**, filtrar por `webp`: confirmar que las imágenes cargan **`lazy`** (no en el HTML crítico) y que sus cajas reservan altura fija (sin salto de layout / CLS al cargar). Con reduced-motion, todo nace visible sin stagger.

- [ ] **6.4 — Commit.**
  ```bash
  cd /Users/amieva/Documents/Programming/SoumyJos && git add invitacion.html assets/historia-1.webp assets/historia-2.webp assets/historia-3.webp assets/historia-4.webp && git commit -m "Add Historia section: lazy B&W webp grid with per-cell stagger"
  ```

---

**Notas de contrato para GRUPO 2 (sin deriva):** funciones expuestas `setupEnvelope()`, `openEnvelope()`, `shouldSkipGate()`; clave `sessionStorage['_sj_inv_opened']='1'`. Portada **no** usa `.scene` (Motor A la revela vía `cascadeReveal(portada)` sobre `[data-cascade]` → clase `.is-cascaded`); Dedicatoria e Historia **sí** usan `.scene` (Motor B → `.scene--in`). Utilidades compartidas creadas aquí y reutilizadas por tareas posteriores: `.eyebrow`, `.rule`, `.rule--48`, y el estado CSS de `[data-cascade]`. Regla de portador respetada: solo `--ink` sobre rosa y malva; crema (`--cream-paper`) solo dentro del sello terracota. Un solo muro por sección; banda `--sp-void` de crema entre Portada y Dedicatoria.

I have the spec and the existing `updateCountdown()` / `isInAppBrowser` patterns. Here are the complete bite-sized steps for **GROUP 3**, ready to drop into the plan between Task 6 and the RSVP tasks. All code is real and complete; only couple-supplied content is marked `[PLACEHOLDER]` as clearly-named constants with safe example values.

---

### Task 7: Componente `renderSede` + Ceremonia + Recepción (dos sedes) + mapas deep-link + copiar dirección + hilo de traslado

**Files:** Modify `/Users/amieva/Documents/Programming/SoumyJos/invitacion.html`; Create `/Users/amieva/Documents/Programming/SoumyJos/assets/mapa-ceremonia.webp`, `/Users/amieva/Documents/Programming/SoumyJos/assets/mapa-recepcion.webp`.

**Interfaces**
- **Produces:** `renderSede(config, mountEl)` → `void` (invocado 2 veces).
- **Produces:** `buildMapsUrl(lat, lng)` → `string` (= `https://maps.google.com/?q=<lat>,<lng>`, solo coords).
- **Produces:** `copyAddress(text)` → `Promise<boolean>` (`navigator.clipboard.writeText` + fallback `textarea`/`execCommand`).
- **Produces:** clases CSS compartidas `.section`, `.section__inner`, `.eyebrow`, `.btn`, `.btn--outline`, `.sr-only` (base para Tasks 8–11).
- **Consumes:** `.scene`/`.scene--in` (Motor B de Task 2); tokens de `:root` (Task 1): `--surface`, `--rule`, `--rule-warm`, `--accent`, `--focus-on-cream`, `--text-on-cream`, `--text-on-cream-soft`, `--fs-display`, `--fs-quote`, `--tap-min`.
- **Datos (forma `config` de sede):** `{ id, eyebrow, hora, nombre, direccion, lat, lng, mapImg, mapW, mapH, traslado, nota }`.

**Pasos**

- [ ] **Crear los dos assets de mapa.** Exporta dos capturas estáticas de mapa a `.webp` ligeros (~30–50KB, 640×400) desde tu herramienta de mapas y guárdalas:
  `/Users/amieva/Documents/Programming/SoumyJos/assets/mapa-ceremonia.webp` y `/Users/amieva/Documents/Programming/SoumyJos/assets/mapa-recepcion.webp`.
  Verifica peso y dimensiones: `identify -format "%wx%h %B bytes\n" assets/mapa-*.webp` (o `ls -la assets/`). Deben ser <50KB cada una.

- [ ] **Añadir el CSS compartido de secciones + tarjeta de sede + hilo.** En el `<style>` de `invitacion.html`, tras los tokens de `:root`, pega el bloque completo (define utilidades que Tasks 8–11 reutilizan):

```css
/* ===== Secciones sobre crema (Grupo 3) ===== */
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
  clip:rect(0,0,0,0);white-space:nowrap;border:0}
.section{padding:var(--sp-void) var(--sp-4);background:var(--bg)}
.section__inner{max-width:var(--card-max);margin:0 auto}

.eyebrow{font-family:var(--font-label);font-size:var(--fs-eyebrow);
  letter-spacing:var(--ls-eyebrow);text-transform:uppercase;color:var(--accent);margin:0 0 var(--sp-4)}
.eyebrow::after{content:"";display:block;width:48px;height:1px;margin-top:var(--sp-3);background:var(--rule)}

/* botones compartidos (crema): tap target real >=44px, foco sobre crema 3px */
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:var(--tap-min);
  padding:var(--sp-3) var(--sp-5);font-family:var(--font-label);font-size:var(--fs-btn);
  letter-spacing:var(--ls-label);text-transform:uppercase;text-decoration:none;cursor:pointer;
  background:transparent;color:var(--accent);border:1px solid var(--rule);border-radius:var(--radius-sm)}
.btn--outline{background:transparent}
.btn:focus-visible{outline:3px solid var(--focus-on-cream);outline-offset:2px}

/* tarjeta de sede */
.sedes__mount + .sedes__mount{margin-top:var(--sp-7)}
.sede{background:var(--surface);box-shadow:var(--shadow-soft);border-radius:var(--radius-sm);
  padding:var(--sp-6) var(--sp-5)}
.sede__nombre{font-family:var(--font-display);font-weight:400;font-size:var(--fs-display);
  color:var(--text-on-cream);margin:0 0 var(--sp-2)}
.sede__hora{font-family:var(--font-label);font-size:var(--fs-label);letter-spacing:var(--ls-label);
  text-transform:uppercase;color:var(--text-on-cream-soft);margin:0 0 var(--sp-4)}
.sede__dir{font-family:var(--font-display);font-size:var(--fs-body);line-height:var(--lh-body);
  color:var(--text-on-cream);margin:0 0 var(--sp-5);max-width:var(--measure)}
.sede__map{display:block;width:100%;padding:0;border:1px solid var(--rule-warm);
  border-radius:var(--radius-sm);background:none;cursor:pointer;overflow:hidden}
.sede__map img{display:block;width:100%;height:auto}
.sede__map:focus-visible{outline:3px solid var(--focus-on-cream);outline-offset:2px}
.sede__actions{display:flex;flex-wrap:wrap;gap:var(--sp-3);margin-top:var(--sp-5)}
.sede__nota{margin-top:var(--sp-5);font-family:var(--font-label);font-size:var(--fs-micro);
  letter-spacing:var(--ls-micro);text-transform:uppercase;color:var(--text-on-cream-soft)}
/* microcopy de traslado + HILO --rule-warm entre las dos sedes (único uso, válido por dos sedes) */
.sede__traslado{font-family:var(--font-display);font-style:italic;font-size:var(--fs-quote);
  color:var(--text-on-cream);text-align:center;max-width:var(--measure);margin:0 auto var(--sp-6);
  position:relative;padding-top:var(--sp-7)}
.sede__traslado::before{content:"";position:absolute;top:0;left:50%;width:1px;height:var(--sp-6);
  background:var(--rule-warm)}
```

- [ ] **Añadir el markup de montaje** (dos contenedores gemelos) dentro de `<main>`, en el orden narrativo tras "Nuestra historia" (Task 6) y antes de "Vestimenta":

```html
<section class="scene section" data-scene="sedes" aria-labelledby="sedesHeading">
  <div class="section__inner">
    <h2 id="sedesHeading" class="sr-only">Ceremonia y recepción</h2>
    <div class="sedes__mount" id="sedeCeremonia"></div>
    <div class="sedes__mount" id="sedeRecepcion"></div>
  </div>
</section>
```

- [ ] **Verificar-que-aún-no:** carga `/invitacion` en el navegador (`npx wrangler pages dev .` o `python3 -m http.server`); confirma que ves la banda crema con la sección pero **vacía** (los mounts sin contenido), sin errores en consola.

- [ ] **Añadir los helpers `buildMapsUrl` + `copyAddress`** dentro del IIFE principal (el mismo de Tasks 1–3), en un bloque nuevo `// ---- Grupo 3: sedes ----`:

```js
function buildMapsUrl(lat, lng) {
  return 'https://maps.google.com/?q=' + lat + ',' + lng; // solo coords, nunca texto ni PII
}

function fallbackCopy(text) {
  try {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    var ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) { return false; }
}

function copyAddress(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text)
      .then(function () { return true; })
      .catch(function () { return fallbackCopy(text); });
  }
  return Promise.resolve(fallbackCopy(text));
}
```

- [ ] **Añadir `renderSede`** (construye la tarjeta con `textContent`, nunca `innerHTML`; feedback de copia con texto + ✓, no solo color):

```js
function renderSede(config, mountEl) {
  if (!mountEl) return;
  mountEl.textContent = '';

  // hilo de traslado: solo la recepción trae microcopy + rule-warm
  if (config.traslado) {
    var thread = document.createElement('p');
    thread.className = 'sede__traslado';
    thread.textContent = config.traslado;
    mountEl.appendChild(thread);
  }

  var card = document.createElement('article');
  card.className = 'sede sede--' + config.id;

  var eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = config.eyebrow;
  card.appendChild(eyebrow);

  var nombre = document.createElement('h3');
  nombre.className = 'sede__nombre';
  nombre.textContent = config.nombre;
  card.appendChild(nombre);

  var hora = document.createElement('p');
  hora.className = 'sede__hora';
  hora.textContent = config.hora + ' h';
  card.appendChild(hora);

  var dir = document.createElement('p');
  dir.className = 'sede__dir';
  dir.textContent = config.direccion;
  card.appendChild(dir);

  var mapsUrl = buildMapsUrl(config.lat, config.lng);

  var mapBtn = document.createElement('button');
  mapBtn.type = 'button';
  mapBtn.className = 'sede__map';
  mapBtn.setAttribute('aria-label', 'Abrir ' + config.nombre + ' en mapas');
  var img = document.createElement('img');
  img.src = config.mapImg;
  img.width = config.mapW;
  img.height = config.mapH;
  img.loading = 'lazy';
  img.alt = 'Mapa de ' + config.nombre;
  mapBtn.appendChild(img);
  mapBtn.addEventListener('click', function () {
    window.open(mapsUrl, '_blank', 'noopener');
  });
  card.appendChild(mapBtn);

  var actions = document.createElement('div');
  actions.className = 'sede__actions';

  var comoLlegar = document.createElement('a');
  comoLlegar.className = 'btn btn--outline';
  comoLlegar.href = mapsUrl;
  comoLlegar.target = '_blank';
  comoLlegar.rel = 'noopener';
  comoLlegar.textContent = 'CÓMO LLEGAR';
  actions.appendChild(comoLlegar);

  var copiar = document.createElement('button');
  copiar.type = 'button';
  copiar.className = 'btn btn--outline';
  copiar.textContent = 'COPIAR DIRECCIÓN';
  copiar.addEventListener('click', function () {
    copyAddress(config.direccion).then(function (ok) {
      copiar.textContent = ok ? 'DIRECCIÓN COPIADA ✓' : 'COPIE MANUALMENTE';
      setTimeout(function () { copiar.textContent = 'COPIAR DIRECCIÓN'; }, 2600);
    });
  });
  actions.appendChild(copiar);

  card.appendChild(actions);

  if (config.nota) {
    var nota = document.createElement('p');
    nota.className = 'sede__nota';
    nota.textContent = config.nota;
    card.appendChild(nota);
  }

  mountEl.appendChild(card);
}
```

- [ ] **Definir los datos `[PLACEHOLDER]` e invocar 2 veces** (ceremonia como `DTSTART` del `.ics` en Task 15; recepción trae el `traslado` + hilo):

```js
var SEDE_CEREMONIA = {
  id: 'ceremonia',
  eyebrow: 'LA CEREMONIA',
  hora: '17:00',                                   // [PLACEHOLDER] Decisión C (hora real de la ceremonia)
  nombre: 'Parroquia de San Cristóbal',            // [PLACEHOLDER] Decisión D
  direccion: 'Calle Manantial s/n, Los Clubes, 52957, Atizapán de Zaragoza, Edo. de México', // [PLACEHOLDER] Decisión D (canónica única)
  lat: 19.5620,                                    // [PLACEHOLDER] Decisión D (lat exacta del acceso por reservación)
  lng: -99.2560,                                   // [PLACEHOLDER] Decisión D (lng exacta)
  mapImg: '/assets/mapa-ceremonia.webp', mapW: 640, mapH: 400,
  traslado: null,
  nota: 'ACCESO POR RESERVACIÓN'
};

var SEDE_RECEPCION = {
  id: 'recepcion',
  eyebrow: 'LA RECEPCIÓN',
  hora: '19:00',                                   // [PLACEHOLDER] Decisión C
  nombre: 'Cuadra San Cristóbal',                  // [PLACEHOLDER] Decisión D
  direccion: 'Av. Juárez 59, Los Clubes, 52957, Cd. López Mateos, Atizapán de Zaragoza, Edo. de México', // [PLACEHOLDER] Decisión D
  lat: 19.5635,                                    // [PLACEHOLDER] Decisión D
  lng: -99.2548,                                   // [PLACEHOLDER] Decisión D
  mapImg: '/assets/mapa-recepcion.webp', mapW: 640, mapH: 400,
  traslado: 'A continuación nos trasladaremos a la recepción, a unos 15 minutos.', // [PLACEHOLDER] Decisión C (N minutos)
  nota: 'SIN ESTACIONAMIENTO EN SITIO · ACCESO POR RESERVACIÓN'
};

renderSede(SEDE_CEREMONIA, document.getElementById('sedeCeremonia'));
renderSede(SEDE_RECEPCION, document.getElementById('sedeRecepcion'));
```

- [ ] **Verificar-que-sí (navegador):** recarga `/invitacion`. Confirma: (1) dos tarjetas gemelas sobre crema; (2) tocar la imagen del mapa o "CÓMO LLEGAR" abre `https://maps.google.com/?q=19.5620,-99.2560` — inspecciona la URL, debe llevar **solo coordenadas, sin texto ni datos del invitado**; (3) "COPIAR DIRECCIÓN" cambia a "DIRECCIÓN COPIADA ✓" y al pegar (Cmd+V en un editor) aparece la dirección; (4) sobre la recepción aparece el microcopy de traslado con el hilo vertical `--rule-warm` encima.

- [ ] **Commit:** `git add invitacion.html assets/mapa-ceremonia.webp assets/mapa-recepcion.webp && git commit -m "Task 7: componente renderSede (ceremonia + recepción), mapas deep-link por coords, copiar dirección, hilo de traslado"`

---

### Task 8: Código de vestimenta (crema)

**Files:** Modify `/Users/amieva/Documents/Programming/SoumyJos/invitacion.html`.

**Interfaces**
- **Produces:** markup `.scene--vestimenta`; helper `setText(id, text)` → `void` (compartido con Tasks 9–10).
- **Consumes:** `.eyebrow`, `.section`, Motor B (Task 2).
- **Datos:** `DRESSCODE = { etiqueta, guia, ellas, ellos, calzado }` (contenido `[PLACEHOLDER]`).

**Pasos**

- [ ] **Añadir el CSS de vestimenta** en el `<style>`:

```css
.dress__label{font-family:var(--font-display);font-weight:400;font-size:var(--fs-display);
  color:var(--text-on-cream);margin:0 0 var(--sp-3)}
.dress__guide{font-family:var(--font-display);font-style:italic;font-size:var(--fs-quote);
  line-height:var(--lh-body);color:var(--text-on-cream);max-width:var(--measure);margin:0 0 var(--sp-6)}
.dress__cols{display:grid;grid-template-columns:1fr;gap:var(--sp-5)}
@media (min-width:640px){.dress__cols{grid-template-columns:1fr 1fr;gap:var(--sp-7)}}
.dress__col-h{font-family:var(--font-label);font-size:var(--fs-micro);letter-spacing:var(--ls-micro);
  text-transform:uppercase;color:var(--accent);margin:0 0 var(--sp-2)}
.dress__col-b{font-family:var(--font-display);font-size:var(--fs-body);line-height:var(--lh-body);
  color:var(--text-on-cream);margin:0}
.dress__note{margin-top:var(--sp-6);font-family:var(--font-display);font-style:italic;
  font-size:var(--fs-body);color:var(--text-on-cream-soft)}
```

- [ ] **Añadir el markup** tras la sección de sedes y antes de Obsequios:

```html
<section class="scene section" data-scene="vestimenta" aria-labelledby="vestimentaHeading">
  <div class="section__inner">
    <p class="eyebrow" id="vestimentaHeading">CÓDIGO DE VESTIMENTA</p>
    <p class="dress__label" id="dressLabel"></p>
    <p class="dress__guide" id="dressGuide"></p>
    <div class="dress__cols">
      <div class="dress__col"><p class="dress__col-h">ELLAS</p><p class="dress__col-b" id="dressEllas"></p></div>
      <div class="dress__col"><p class="dress__col-h">ELLOS</p><p class="dress__col-b" id="dressEllos"></p></div>
    </div>
    <p class="dress__note" id="dressNote"></p>
  </div>
</section>
```

- [ ] **Añadir el helper `setText` + datos + relleno** dentro del IIFE (bloque `// ---- Grupo 3: vestimenta ----`):

```js
function setText(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text;
}

var DRESSCODE = {
  etiqueta: 'Etiqueta rigurosa',                                              // [PLACEHOLDER]
  guia: 'Le pedimos vestir de etiqueta rigurosa: vestido largo para ellas, esmoquin para ellos.', // [PLACEHOLDER]
  ellas: 'Vestido largo.',                                                    // [PLACEHOLDER]
  ellos: 'Esmoquin o traje oscuro.',                                          // [PLACEHOLDER]
  calzado: 'Sugerimos calzado cómodo para caminar sobre piedra y jardín.'     // [PLACEHOLDER]
};

setText('dressLabel', DRESSCODE.etiqueta);
setText('dressGuide', DRESSCODE.guia);
setText('dressEllas', DRESSCODE.ellas);
setText('dressEllos', DRESSCODE.ellos);
setText('dressNote', DRESSCODE.calzado);
```

- [ ] **Verificar (navegador):** recarga `/invitacion`; confirma la jerarquía correcta — eyebrow Jost mayúsculas con hairline, etiqueta en Cormorant display, guía Cormorant italic, dos micro-columnas ELLAS/ELLOS en desktop (una sola columna en móvil 375px) y la nota de calzado en itálica suave. Texto legible sobre crema.

- [ ] **Commit:** `git add invitacion.html && git commit -m "Task 8: sección código de vestimenta sobre crema con helper setText"`

---

### Task 9: Obsequios (crema, discreta) + copiar CLABE

**Files:** Modify `/Users/amieva/Documents/Programming/SoumyJos/invitacion.html`.

**Interfaces**
- **Produces:** markup `.scene--obsequios`; helper `wireCopyButtons(root)` → `void` (delegación sobre `[data-copy]`, reutiliza `copyAddress()`).
- **Consumes:** `copyAddress()` (Task 7), `setText()` (Task 8), Motor B.
- **Datos:** `OBSEQUIOS = { intro, mesa, titular, banco, clabe }` (sin montos; contenido `[PLACEHOLDER]`).

**Pasos**

- [ ] **Añadir el CSS de obsequios:**

```css
.gift__intro{font-family:var(--font-display);font-style:italic;font-size:var(--fs-quote);
  line-height:var(--lh-body);color:var(--text-on-cream);max-width:var(--measure);margin:0 0 var(--sp-6)}
.gift__row{padding:var(--sp-4) 0;border-top:1px solid var(--rule-faint)}
.gift__row:last-child{border-bottom:1px solid var(--rule-faint)}
.gift__k{font-family:var(--font-label);font-size:var(--fs-micro);letter-spacing:var(--ls-micro);
  text-transform:uppercase;color:var(--accent);margin:0 0 var(--sp-1)}
.gift__v{font-family:var(--font-display);font-size:var(--fs-body);line-height:var(--lh-body);
  color:var(--text-on-cream);margin:0}
.gift__row .btn{margin-top:var(--sp-3)}
```

- [ ] **Añadir el markup** tras Vestimenta y antes de Hospedaje (el botón CLABE recibe su valor por `data-copy` en JS):

```html
<section class="scene section" data-scene="obsequios" aria-labelledby="obsequiosHeading">
  <div class="section__inner">
    <p class="eyebrow" id="obsequiosHeading">UN DETALLE</p>
    <p class="gift__intro" id="obsequiosIntro"></p>

    <div class="gift__row">
      <p class="gift__k">Lluvia de sobres</p>
      <p class="gift__v">El día de la boda.</p>
    </div>

    <div class="gift__row">
      <p class="gift__k">Mesa de regalos</p>
      <p class="gift__v" id="obsequiosMesa"></p>
    </div>

    <div class="gift__row">
      <p class="gift__k">A distancia</p>
      <p class="gift__v"><span id="obsequiosTitular"></span> · <span id="obsequiosBanco"></span></p>
      <p class="gift__v">CLABE <span id="obsequiosClabe"></span></p>
      <button type="button" class="btn btn--outline" id="obsequiosClabeBtn" data-copy="">COPIAR CLABE</button>
    </div>
  </div>
</section>
```

- [ ] **Añadir `wireCopyButtons` + datos + relleno** dentro del IIFE (`// ---- Grupo 3: obsequios ----`):

```js
function wireCopyButtons(root) {
  var btns = root.querySelectorAll('[data-copy]');
  Array.prototype.forEach.call(btns, function (b) {
    b.addEventListener('click', function () {
      var val = b.getAttribute('data-copy');
      if (!val) return;
      var original = b.textContent;
      copyAddress(val).then(function (ok) {
        b.textContent = ok ? 'COPIADO ✓' : 'COPIE MANUALMENTE';
        setTimeout(function () { b.textContent = original; }, 2600);
      });
    });
  });
}

var OBSEQUIOS = {
  intro: 'Su compañía es, para nosotros, el mejor de los regalos. Quien desee tener un detalle con nosotros podrá hacerlo por alguna de estas vías.',
  mesa: 'Liverpool · evento núm. 00000000',   // [PLACEHOLDER]
  titular: 'Soumi & Jos',                      // [PLACEHOLDER]
  banco: 'BBVA',                               // [PLACEHOLDER]
  clabe: '000000000000000000'                  // [PLACEHOLDER] CLABE de 18 dígitos, ejemplo seguro
};

setText('obsequiosIntro', OBSEQUIOS.intro);
setText('obsequiosMesa', OBSEQUIOS.mesa);
setText('obsequiosTitular', OBSEQUIOS.titular);
setText('obsequiosBanco', OBSEQUIOS.banco);
setText('obsequiosClabe', OBSEQUIOS.clabe);

var clabeBtn = document.getElementById('obsequiosClabeBtn');
if (clabeBtn) clabeBtn.setAttribute('data-copy', OBSEQUIOS.clabe);
wireCopyButtons(document);
```

- [ ] **Verificar (navegador):** recarga `/invitacion`; confirma filas discretas key/value sin montos, y que "COPIAR CLABE" cambia a "COPIADO ✓"; pega (Cmd+V) y verifica que se copió `000000000000000000`. Foco visible (outline borgoña 3px) al tabular al botón.

- [ ] **Commit:** `git add invitacion.html && git commit -m "Task 9: sección obsequios discreta con copiar CLABE (wireCopyButtons)"`

---

### Task 10: Hospedaje (crema) — lista para foráneos

**Files:** Modify `/Users/amieva/Documents/Programming/SoumyJos/invitacion.html`.

**Interfaces**
- **Produces:** markup `.scene--hospedaje`; `renderHospedaje(list, mountEl)` → `void`.
- **Consumes:** `.btn`, Motor B (stagger por ítem).
- **Datos:** `HOTELES = [{ nombre, zona, distancia, url }]` (contenido `[PLACEHOLDER]`).

**Pasos**

- [ ] **Añadir el CSS de hospedaje:**

```css
.hotel-list{list-style:none;margin:0;padding:0}
.hotel{padding:var(--sp-5) 0;border-top:1px solid var(--rule-faint)}
.hotel:last-child{border-bottom:1px solid var(--rule-faint)}
.hotel__nombre{font-family:var(--font-display);font-size:var(--fs-display);color:var(--text-on-cream);margin:0 0 var(--sp-2)}
.hotel__detalle{font-family:var(--font-label);font-size:var(--fs-micro);letter-spacing:var(--ls-micro);
  text-transform:uppercase;color:var(--text-on-cream-soft);margin:0 0 var(--sp-3)}
.hospedaje__intro{font-family:var(--font-display);font-style:italic;font-size:var(--fs-quote);
  line-height:var(--lh-body);color:var(--text-on-cream);max-width:var(--measure);margin:0 0 var(--sp-6)}
```

- [ ] **Añadir el markup** tras Obsequios y antes de Cuenta regresiva:

```html
<section class="scene section" data-scene="hospedaje" aria-labelledby="hospedajeHeading">
  <div class="section__inner">
    <p class="eyebrow" id="hospedajeHeading">PARA NUESTROS INVITADOS FORÁNEOS</p>
    <p class="hospedaje__intro" id="hospedajeIntro"></p>
    <ul class="hotel-list" id="hospedajeMount"></ul>
  </div>
</section>
```

- [ ] **Añadir `renderHospedaje` + datos + invocación** dentro del IIFE (`// ---- Grupo 3: hospedaje ----`):

```js
function renderHospedaje(list, mountEl) {
  if (!mountEl) return;
  mountEl.textContent = '';
  list.forEach(function (h) {
    var li = document.createElement('li');
    li.className = 'hotel';

    var nombre = document.createElement('p');
    nombre.className = 'hotel__nombre';
    nombre.textContent = h.nombre;
    li.appendChild(nombre);

    var detalle = document.createElement('p');
    detalle.className = 'hotel__detalle';
    detalle.textContent = h.zona + ' · ' + h.distancia;
    li.appendChild(detalle);

    var link = document.createElement('a');
    link.className = 'btn btn--outline';
    link.href = h.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'VER HOTEL';
    li.appendChild(link);

    mountEl.appendChild(li);
  });
}

var HOSPEDAJE_INTRO = 'Para quienes nos acompañan desde otra ciudad, sugerimos las siguientes opciones cercanas a la sede.'; // [PLACEHOLDER]
var HOTELES = [
  { nombre: 'Hotel [PLACEHOLDER]', zona: 'Interlomas', distancia: 'a 10 minutos de la sede', url: 'https://example.com' }, // [PLACEHOLDER]
  { nombre: 'Hotel [PLACEHOLDER]', zona: 'Ciudad Satélite', distancia: 'a 15 minutos de la sede', url: 'https://example.com' } // [PLACEHOLDER]
];

setText('hospedajeIntro', HOSPEDAJE_INTRO);
renderHospedaje(HOTELES, document.getElementById('hospedajeMount'));
```

- [ ] **Verificar (navegador móvil 375×812):** recarga `/invitacion`; confirma la lista de hoteles; inspecciona la caja de cada enlace "VER HOTEL" (DevTools → elemento) y verifica `min-height` renderizado **≥44px** real (tap target). Cada `href` abre en pestaña nueva.

- [ ] **Commit:** `git add invitacion.html && git commit -m "Task 10: sección hospedaje para foráneos con tap targets >=44px"`

---

### Task 11: Cuenta regresiva (línea sobre crema, NO muro) — `updateCountdown()`

**Files:** Modify `/Users/amieva/Documents/Programming/SoumyJos/invitacion.html`; Create `/Users/amieva/Documents/Programming/SoumyJos/tools/verify-countdown.mjs`.

**Interfaces**
- **Produces:** `daysUntilWedding(fromDate)` → `number`; `countdownParts(days)` → `{ lead, number, label }`; `updateCountdown()` → `void`.
- **Consumes:** patrón `index.html:492-510` (`new Date(2027, 2, 20)`, `Math.ceil(... / 86400000)`); tokens crema (`--fs-count`).
- **Datos:** eyebrow `LA ESPERA`, pie `20 DE MARZO DE 2027`. Ramas de copy: `days>1 → "Faltan N días"`, `days===1 → "Falta 1 día"`, `days===0 → "Hoy es el día"`, `days<0 → "Gracias por acompañarnos"`. Sin flip, sin conteo animado, sin muro a sangre (§6.10).

**Pasos**

- [ ] **Añadir el CSS de la cuenta regresiva** (línea silenciosa sobre crema, centrada):

```css
.section--count{text-align:center}
.count{margin:0;display:inline-flex;align-items:baseline;gap:var(--sp-3);flex-wrap:wrap;justify-content:center}
.count__lead,.count__label{font-family:var(--font-label);font-size:var(--fs-label);
  letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--text-on-cream-soft)}
.count__num{font-family:var(--font-display);font-weight:300;font-size:var(--fs-count);
  color:var(--text-on-cream);line-height:var(--lh-tight)}
.count__foot{margin-top:var(--sp-4);font-family:var(--font-label);font-size:var(--fs-micro);
  letter-spacing:var(--ls-micro);text-transform:uppercase;color:var(--text-on-cream-soft)}
```

- [ ] **Añadir el markup** tras Hospedaje y antes de RSVP (la leyenda partida Jost·Cormorant·Jost):

```html
<section class="scene section section--count" data-scene="countdown" aria-labelledby="countHeading">
  <div class="section__inner">
    <p class="eyebrow" id="countHeading">LA ESPERA</p>
    <p class="count">
      <span class="count__lead" id="invCountdownLead"></span>
      <span class="count__num" id="invCountdownDays"></span>
      <span class="count__label" id="invCountdownLabel"></span>
    </p>
    <p class="count__foot">20 DE MARZO DE 2027</p>
  </div>
</section>
```

- [ ] **Añadir las funciones puras + `updateCountdown`** dentro del IIFE (`// ---- Grupo 3: cuenta regresiva ----`). Mantén `daysUntilWedding`/`countdownParts` idénticas a las del script de verificación:

```js
function daysUntilWedding(fromDate) {
  var weddingDate = new Date(2027, 2, 20); // marzo = mes 2 (0-indexed)
  weddingDate.setHours(0, 0, 0, 0);
  var today = new Date(fromDate.getTime());
  today.setHours(0, 0, 0, 0);
  return Math.ceil((weddingDate.getTime() - today.getTime()) / 86400000);
}

function countdownParts(days) {
  if (days > 1)   return { lead: 'Faltan', number: String(days), label: 'días' };
  if (days === 1) return { lead: 'Falta',  number: '1',          label: 'día' };
  if (days === 0) return { lead: '',       number: '',           label: 'Hoy es el día' };
  return              { lead: '',       number: '',           label: 'Gracias por acompañarnos' };
}

function updateCountdown() {
  var daysEl = document.getElementById('invCountdownDays');
  var labelEl = document.getElementById('invCountdownLabel');
  if (!daysEl || !labelEl) return;
  var parts = countdownParts(daysUntilWedding(new Date()));
  var leadEl = document.getElementById('invCountdownLead');
  if (leadEl) leadEl.textContent = parts.lead;
  daysEl.textContent = parts.number;
  labelEl.textContent = parts.label;
}

updateCountdown();
document.addEventListener('visibilitychange', function () {
  if (!document.hidden) updateCountdown();
});
```

- [ ] **Crear el script de verificación Node** `/Users/amieva/Documents/Programming/SoumyJos/tools/verify-countdown.mjs` (mismas funciones puras; asserts sobre las cuatro ramas):

```js
import assert from 'node:assert/strict';

function daysUntilWedding(fromDate) {
  const weddingDate = new Date(2027, 2, 20);
  weddingDate.setHours(0, 0, 0, 0);
  const today = new Date(fromDate.getTime());
  today.setHours(0, 0, 0, 0);
  return Math.ceil((weddingDate.getTime() - today.getTime()) / 86400000);
}

function countdownParts(days) {
  if (days > 1)   return { lead: 'Faltan', number: String(days), label: 'días' };
  if (days === 1) return { lead: 'Falta',  number: '1',          label: 'día' };
  if (days === 0) return { lead: '',       number: '',           label: 'Hoy es el día' };
  return              { lead: '',       number: '',           label: 'Gracias por acompañarnos' };
}

function countdownPhrase(days) {
  const p = countdownParts(days);
  return [p.lead, p.number, p.label].filter(Boolean).join(' ');
}

// 19 mar 2027 -> falta 1 día
assert.equal(countdownPhrase(daysUntilWedding(new Date(2027, 2, 19))), 'Falta 1 día');
// 20 mar 2027 -> hoy
assert.equal(countdownPhrase(daysUntilWedding(new Date(2027, 2, 20))), 'Hoy es el día');
// 21 mar 2027 -> pasado
assert.equal(countdownPhrase(daysUntilWedding(new Date(2027, 2, 21))), 'Gracias por acompañarnos');
// 12 nov 2026 -> plural "Faltan N días"
const n = daysUntilWedding(new Date(2026, 10, 12));
assert.ok(n > 1, 'debe faltar más de un día');
assert.equal(countdownPhrase(n), 'Faltan ' + n + ' días');

console.log('OK verify-countdown:', n, 'días al 20-mar-2027');
```

- [ ] **Verificar-que-sí (Node):** `node tools/verify-countdown.mjs` → debe imprimir `OK verify-countdown: <N> días…` sin lanzar. Si un assert falla, corrige la rama en ambos lugares (HTML + script) antes de continuar.

- [ ] **Verificar (navegador):** recarga `/invitacion`; confirma la línea silenciosa sobre **crema** (no muro), con la cifra en Cormorant y la leyenda partida (`Faltan · N · días`), y el pie `20 DE MARZO DE 2027`. Sin animación de flip ni conteo.

- [ ] **Commit:** `git add invitacion.html tools/verify-countdown.mjs && git commit -m "Task 11: cuenta regresiva sobre crema (updateCountdown) + verify-countdown.mjs"`

---

**Notas de contrato para el resto del plan:** este grupo deja definidos y reutilizables `buildMapsUrl(lat,lng)`, `copyAddress(text)` (→ los consume el botón CLABE de Obsequios y estará disponible para RSVP), `setText(id,text)`, `wireCopyButtons(root)` y las utilidades CSS `.section`/`.section__inner`/`.eyebrow`/`.btn`/`.btn--outline`/`.sr-only`. Todas las secciones son `.scene` (Motor B de Task 2). `updateCountdown()` respeta la firma del contrato y la fecha `new Date(2027, 2, 20)`; la lógica pura vive duplicada a propósito en `invitacion.html` y en `tools/verify-countdown.mjs` (mantener en sync — nota para el ejecutor). Todos los deep-links de mapa usan coordenadas (`?q=lat,lng`), sin PII. Los trailers de commit deben cerrar con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` según la convención del repo.

I have everything I need. Below is the complete Group 4 of the plan. It is written to drop into the plan document after Task 11, respects every signature in the contract, and — importantly — reconciles one real conflict I found between the spec's payload (§7.4) and its security rules (§7.5): the payload carries `acompanantes`, `updatedAt`, `userAgent` and `device`, but §7.5 whitelists only a subset and closes with `"$other": {".validate": false}`, which would **reject every write**. Task 14 below adds the missing `.validate` entries so writes actually succeed. I flag it inline where it matters.

---


> Contexto de reuso verificado en el repo: patrón de init idempotente + `_soumyjos_sid` en `index.html:514-548`; `isInAppBrowser` + `.wa-banner` en `index.html:476-490`; estilos de formulario en `dashboard/style.css:80-133`; `setupObserver()`/`setupFirebase()` en `dashboard/app.js:57-105`; `.ics` viejo en `Soumi-Jos-SaveTheDate.ics` (all-day, **no** reutilizar). Todas las funciones de la invitación viven dentro del IIFE ES5 de `invitacion.html`.

---

### Task 12: RSVP — markup del formulario + validación cliente + honeypot

**Files:** Modify `/Users/amieva/Documents/Programming/SoumyJos/invitacion.html`; Create `/Users/amieva/Documents/Programming/SoumyJos/tools/verify-rsvp.mjs`.

**Interfaces**
- **Produces:** markup `.scene--rsvp` (crema) con `fieldset/legend`, condicionales, honeypot `website`, botón outline borgoña; inputs `font-size:16px`.
- **Produces:** `MAX_PASES` (const `= 2`), `RSVP_DEADLINE` (`[PLACEHOLDER]='20 de febrero de 2027'`).
- **Produces:** `validateRsvp(form)` → `{ ok:boolean, errors:string[] }`.
- **Produces:** `toggleConditional(asiste)` → `void`.
- **Consumes:** tokens `:root` D1 de Task 1; Motor B (`.scene`).

**Pasos**

- [ ] En `invitacion.html`, dentro de `<main>`, tras la escena de cuenta regresiva (Task 11), insertar la escena RSVP (crema obligatoria):

```html
<section class="scene scene--rsvp" data-scene="rsvp" id="rsvp" aria-labelledby="rsvpEyebrow">
  <p class="eyebrow" id="rsvpEyebrow">CONFIRMACIÓN DE ASISTENCIA</p>
  <p class="rsvp-lead">
    Le agradeceremos confirmar su asistencia antes del
    <span id="rsvpDeadline">20 de febrero de 2027</span>.
    Indíquenos cuántas personas nos acompañarán (hasta <span id="rsvpMax">2</span>).
  </p>

  <form id="rsvpForm" class="rsvp-form" novalidate autocomplete="on">
    <label class="rsvp-label" for="rsvpNombre">NOMBRE COMPLETO</label>
    <input class="rsvp-input" id="rsvpNombre" name="nombre" type="text"
           maxlength="80" inputmode="text" autocomplete="name"
           autocapitalize="words" spellcheck="false" required>

    <fieldset class="rsvp-fieldset">
      <legend class="rsvp-label">¿NOS ACOMPAÑARÁ?</legend>
      <label class="rsvp-radio">
        <input type="radio" name="asiste" value="si" id="rsvpAsisteSi"> SÍ, AHÍ ESTARÉ
      </label>
      <label class="rsvp-radio">
        <input type="radio" name="asiste" value="no" id="rsvpAsisteNo"> NO PODRÉ ASISTIR
      </label>
    </fieldset>

    <div class="rsvp-cond" id="rsvpPasesWrap" hidden>
      <label class="rsvp-label" for="rsvpPases">NÚMERO DE PERSONAS</label>
      <select class="rsvp-input" id="rsvpPases" name="pases">
        <option value="1">1</option>
        <option value="2">2</option>
      </select>
    </div>

    <div class="rsvp-cond" id="rsvpAcompWrap" hidden>
      <label class="rsvp-label" for="rsvpAcompanantes">NOMBRES DE ACOMPAÑANTES</label>
      <textarea class="rsvp-input" id="rsvpAcompanantes" name="acompanantes"
                rows="2" maxlength="200"
                placeholder="Un nombre por línea"></textarea>
    </div>

    <div class="rsvp-cond" id="rsvpRestrWrap" hidden>
      <label class="rsvp-label" for="rsvpRestricciones">RESTRICCIONES ALIMENTARIAS</label>
      <textarea class="rsvp-input" id="rsvpRestricciones" name="restricciones"
                rows="2" maxlength="280"></textarea>
    </div>

    <label class="rsvp-label" for="rsvpMensaje">UN MENSAJE PARA LOS NOVIOS</label>
    <textarea class="rsvp-input" id="rsvpMensaje" name="mensaje" rows="3" maxlength="500"></textarea>

    <!-- Honeypot: invisible para humanos, visible para bots -->
    <div class="rsvp-hp" aria-hidden="true">
      <label for="rsvpWebsite">No llenar este campo</label>
      <input id="rsvpWebsite" name="website" type="text" tabindex="-1" autocomplete="off">
    </div>

    <button class="rsvp-submit" id="rsvpSubmit" type="submit">CONFIRMAR ASISTENCIA</button>
    <p class="rsvp-status rsvp-status--idle" id="rsvpStatus" role="status" aria-live="polite"></p>
    <button class="rsvp-edit" id="rsvpEdit" type="button" hidden>Modificar mi respuesta</button>
  </form>
</section>
```

- [ ] En el `<style>` de `invitacion.html`, añadir el bloque de estilos del formulario (base directa de `dashboard/style.css:80-133`, con inputs a 16px reales y honeypot oculto):

```css
.scene--rsvp { background: var(--surface); color: var(--text-on-cream);
  padding: var(--sp-wall) var(--sp-5); }
.rsvp-lead { font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: var(--fs-quote); line-height: var(--lh-body);
  max-width: var(--measure); margin: var(--sp-4) auto var(--sp-6); text-align: center; }
.rsvp-form { max-width: var(--measure); margin: 0 auto; display: block; }
.rsvp-label { display: block; font-family: var(--font-label); font-weight: 400;
  font-size: var(--fs-label); letter-spacing: var(--ls-label); text-transform: uppercase;
  color: var(--text-on-cream); margin: var(--sp-5) 0 var(--sp-2); }
.rsvp-input { width: 100%; padding: 14px 16px; background: var(--cream-paper);
  border: 1px solid var(--rule); color: var(--ink);
  font-family: var(--font-label); font-weight: 300; font-size: 16px; /* evita zoom iOS */
  letter-spacing: 0; line-height: var(--lh-body); border-radius: var(--radius-sm);
  outline: none; transition: border-color var(--dur-fast) var(--ease-quiet); }
.rsvp-input:focus, .rsvp-input:focus-visible {
  border-color: var(--burgundy);
  outline: 3px solid var(--focus-on-cream); outline-offset: 2px; }
.rsvp-fieldset { border: 0; padding: 0; margin: var(--sp-5) 0 0; }
.rsvp-radio { display: block; min-height: var(--tap-min); line-height: var(--tap-min);
  font-family: var(--font-label); font-size: var(--fs-label); letter-spacing: var(--ls-label);
  text-transform: uppercase; color: var(--text-on-cream); cursor: pointer; }
.rsvp-radio input { width: 20px; height: 20px; margin-right: var(--sp-3); vertical-align: middle; }
.rsvp-cond[hidden] { display: none; }
.rsvp-submit { width: 100%; margin-top: var(--sp-6); min-height: var(--tap-min);
  padding: 15px; background: transparent; color: var(--burgundy);
  border: 1px solid var(--burgundy); font-family: var(--font-label); font-weight: 400;
  font-size: var(--fs-btn); letter-spacing: var(--ls-label); text-transform: uppercase;
  cursor: pointer; border-radius: var(--radius-sm);
  transition: background-color var(--dur-fast) var(--ease-quiet), color var(--dur-fast) var(--ease-quiet); }
.rsvp-submit:hover, .rsvp-submit:focus-visible { background: var(--burgundy); color: var(--cream-paper); }
.rsvp-submit:focus-visible { outline: 3px solid var(--focus-on-cream); outline-offset: 2px; }
.rsvp-submit:disabled { opacity: .55; cursor: default; }
.rsvp-status { min-height: 1.6em; margin-top: var(--sp-4); text-align: center;
  font-family: var(--font-display); font-style: italic; font-size: var(--fs-quote); }
.rsvp-status--success { color: var(--sage); }
.rsvp-status--error { color: var(--burgundy); }
.rsvp-check { font-family: var(--font-label); font-style: normal; }
.rsvp-edit { display: block; margin: var(--sp-4) auto 0; background: none; border: 0;
  color: var(--sepia); font-family: var(--font-label); font-size: var(--fs-micro);
  letter-spacing: var(--ls-micro); text-transform: uppercase; text-decoration: underline;
  cursor: pointer; min-height: var(--tap-min); }
.rsvp-hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
```

- [ ] En el `<script>` (IIFE) de `invitacion.html`, declarar constantes y las funciones de lógica pura (antes de cualquier wiring):

```js
var MAX_PASES = 2;
var RSVP_DEADLINE = '20 de febrero de 2027'; // [PLACEHOLDER] Decisión B

function validateRsvp(form) {
  var errors = [];
  var nombre = (form.querySelector('#rsvpNombre').value || '').trim();
  if (nombre.length < 2) errors.push('Indíquenos su nombre completo.');

  var asisteEl = form.querySelector('input[name="asiste"]:checked');
  if (!asisteEl) {
    errors.push('Indíquenos si podrá acompañarnos.');
    return { ok: false, errors: errors };
  }
  if (asisteEl.value === 'si') {
    var sel = form.querySelector('#rsvpPases');
    var pases = sel ? parseInt(sel.value, 10) : NaN;
    if (!(pases >= 1 && pases <= MAX_PASES)) {
      errors.push('Seleccione un número de personas válido.');
    } else if (pases > 1) {
      var raw = (form.querySelector('#rsvpAcompanantes').value || '');
      var names = raw.split('\n')
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return s.length > 0; });
      if (names.length > pases - 1) {
        errors.push('Ha indicado más acompañantes que lugares.');
      }
    }
  }
  return { ok: errors.length === 0, errors: errors };
}

function toggleConditional(asiste) {
  var pasesWrap = document.getElementById('rsvpPasesWrap');
  var acompWrap = document.getElementById('rsvpAcompWrap');
  var restrWrap = document.getElementById('rsvpRestrWrap');
  var sel = document.getElementById('rsvpPases');
  if (!pasesWrap) return;
  if (asiste) {
    pasesWrap.hidden = false;
    restrWrap.hidden = false;
    acompWrap.hidden = !(sel && parseInt(sel.value, 10) > 1);
  } else {
    pasesWrap.hidden = true;
    acompWrap.hidden = true;
    restrWrap.hidden = true;
  }
}
```

- [ ] Wire condicionales (radios + select) dentro del IIFE, tras obtener `form`:

```js
var rsvpForm = document.getElementById('rsvpForm');
if (rsvpForm) {
  document.getElementById('rsvpMax').textContent = String(MAX_PASES);
  document.getElementById('rsvpDeadline').textContent = RSVP_DEADLINE;
  rsvpForm.querySelectorAll('input[name="asiste"]').forEach(function (r) {
    r.addEventListener('change', function () { toggleConditional(r.value === 'si'); });
  });
  var pasesSel = document.getElementById('rsvpPases');
  if (pasesSel) pasesSel.addEventListener('change', function () {
    var asisteSi = document.getElementById('rsvpAsisteSi');
    toggleConditional(!!(asisteSi && asisteSi.checked));
  });
}
```

- [ ] Crear `/Users/amieva/Documents/Programming/SoumyJos/tools/verify-rsvp.mjs` con un shim de DOM que ejecuta el MISMO `validateRsvp` (mantener en sync con `invitacion.html`) más `buildRsvpPayload` (definido en Task 13; aquí se prueba su forma):

```js
// tools/verify-rsvp.mjs — asserts de validación/payload del RSVP.
// MANTENER EN SYNC con las funciones homónimas de invitacion.html.
import assert from 'node:assert/strict';

const MAX_PASES = 2;

function makeForm(v) {
  const map = {
    '#rsvpNombre': { value: v.nombre || '' },
    '#rsvpPases': { value: v.pases == null ? '' : String(v.pases) },
    '#rsvpAcompanantes': { value: v.acompanantes || '' },
    '#rsvpRestricciones': { value: v.restricciones || '' },
    '#rsvpMensaje': { value: v.mensaje || '' },
    '#rsvpWebsite': { value: v.website || '' }
  };
  return {
    querySelector(sel) {
      if (sel === 'input[name="asiste"]:checked') {
        if (v.asiste === true) return { value: 'si' };
        if (v.asiste === false) return { value: 'no' };
        return null;
      }
      return map[sel] || { value: '' };
    }
  };
}

function validateRsvp(form) {
  const errors = [];
  const nombre = (form.querySelector('#rsvpNombre').value || '').trim();
  if (nombre.length < 2) errors.push('Indíquenos su nombre completo.');
  const asisteEl = form.querySelector('input[name="asiste"]:checked');
  if (!asisteEl) { errors.push('Indíquenos si podrá acompañarnos.'); return { ok: false, errors }; }
  if (asisteEl.value === 'si') {
    const sel = form.querySelector('#rsvpPases');
    const pases = sel ? parseInt(sel.value, 10) : NaN;
    if (!(pases >= 1 && pases <= MAX_PASES)) {
      errors.push('Seleccione un número de personas válido.');
    } else if (pases > 1) {
      const names = (form.querySelector('#rsvpAcompanantes').value || '')
        .split('\n').map(s => s.trim()).filter(s => s.length > 0);
      if (names.length > pases - 1) errors.push('Ha indicado más acompañantes que lugares.');
    }
  }
  return { ok: errors.length === 0, errors };
}

// caso: nombre vacío -> error
assert.equal(validateRsvp(makeForm({ nombre: '', asiste: true, pases: 1 })).ok, false);
// caso: sin elección de asistencia -> error
assert.equal(validateRsvp(makeForm({ nombre: 'Ana' })).ok, false);
// caso: asiste con pases fuera de rango (3 > MAX) -> error
assert.equal(validateRsvp(makeForm({ nombre: 'Ana', asiste: true, pases: 3 })).ok, false);
// caso: más acompañantes que lugares -> error
assert.equal(validateRsvp(makeForm({ nombre: 'Ana', asiste: true, pases: 2, acompanantes: 'X\nY' })).ok, false);
// caso válido: asiste, 2 pases, 1 acompañante
assert.equal(validateRsvp(makeForm({ nombre: 'Ana', asiste: true, pases: 2, acompanantes: 'X' })).ok, true);
// caso válido: declina
assert.equal(validateRsvp(makeForm({ nombre: 'Ana', asiste: false })).ok, true);

console.log('verify-rsvp: OK');
```

- [ ] **Verificación:** `node tools/verify-rsvp.mjs` imprime `verify-rsvp: OK`. Abrir `/invitacion` en preview y confirmar que elegir "NO PODRÉ ASISTIR" colapsa pases/acompañantes/restricciones, y "SÍ" con 2 pases muestra el textarea de acompañantes.
- [ ] **Commit:** `git add invitacion.html tools/verify-rsvp.mjs && git commit -m "RSVP: formulario + validación cliente + honeypot"`

---

### Task 13: RSVP — Firebase init + `submitRsvp()` con callback real + estados + dedupe/edición

**Files:** Modify `/Users/amieva/Documents/Programming/SoumyJos/invitacion.html`; Modify `/Users/amieva/Documents/Programming/SoumyJos/tools/verify-rsvp.mjs`.

**Interfaces**
- **Produces:** `initFirebase()` → `{ db, sid }` (guard `firebase.apps.length`, `try/catch`, `sid` de `localStorage._soumyjos_sid`).
- **Produces:** `buildRsvpPayload(form, sid)` → objeto payload `/rsvp/<pushId>`.
- **Produces:** `submitRsvp(payload)` → `Promise<void>` (push/update, callback real de `set()`, timeout 10s, honeypot, throttle 3s).
- **Produces:** `setRsvpState(state, msg)` → `void` (`idle|sending|success|error`, ✓ + `--sage`).
- **Consumes:** `firebase-app-compat` + `firebase-database-compat` (10.12.0) y `config.js` cargados en `<head>` (Task 1).

**Pasos**

- [ ] Añadir en el IIFE de `invitacion.html` las utilidades de Firebase y estado (reusa el patrón de `index.html:514-548`):

```js
var _fb = null;
var _lastSubmitAt = 0;

function initFirebase() {
  if (_fb) return _fb;
  try {
    if (typeof FIREBASE_CONFIG === 'undefined' ||
        !FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY' ||
        typeof firebase === 'undefined') return null;
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    var db = firebase.database();
    var sid = null;
    try { sid = localStorage.getItem('_soumyjos_sid'); } catch (e) {}
    if (!sid) {
      sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      try { localStorage.setItem('_soumyjos_sid', sid); } catch (e) {}
    }
    _fb = { db: db, sid: sid };
    return _fb;
  } catch (e) { return null; }
}

function buildRsvpPayload(form, sid) {
  var asisteEl = form.querySelector('input[name="asiste"]:checked');
  var asiste = asisteEl ? asisteEl.value === 'si' : false;
  var pases = 0;
  if (asiste) {
    var sel = form.querySelector('#rsvpPases');
    pases = sel ? (parseInt(sel.value, 10) || 1) : 1;
  }
  var acompanantes = [];
  if (asiste && pases > 1) {
    acompanantes = (form.querySelector('#rsvpAcompanantes').value || '')
      .split('\n').map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; })
      .slice(0, pases - 1);
  }
  var restr = (form.querySelector('#rsvpRestricciones').value || '').trim().slice(0, 280);
  var msg = (form.querySelector('#rsvpMensaje').value || '').trim().slice(0, 500);
  var hp = (form.querySelector('#rsvpWebsite').value || '').trim();
  var ua = navigator.userAgent || '';
  var device = /iPad|iPhone|iPod/.test(ua) ? 'iOS' : /Android/i.test(ua) ? 'Android' : 'Other';

  var payload = {
    nombre: (form.querySelector('#rsvpNombre').value || '').trim().slice(0, 80),
    asiste: asiste,
    pases: pases,
    acompanantes: acompanantes,
    sid: sid || '',
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    updatedAt: Date.now(),
    userAgent: ua.slice(0, 512),
    device: device,
    _hp: hp ? true : false
  };
  if (restr) payload.restricciones = restr;
  if (msg) payload.mensaje = msg;
  return payload;
}

function submitRsvp(payload) {
  return new Promise(function (resolve, reject) {
    // Honeypot: éxito simulado, jamás escribe.
    if (payload._hp) { resolve(); return; }
    delete payload._hp;

    var now = Date.now();
    if (now - _lastSubmitAt < 3000) { reject(new Error('throttle')); return; }
    _lastSubmitAt = now;

    var fb = initFirebase();
    if (!fb || !fb.db) { reject(new Error('firebase')); return; }

    var existingId = null;
    try { existingId = localStorage.getItem('_soumyjos_rsvp_id'); } catch (e) {}

    var ref, writePromise;
    if (existingId) {
      ref = fb.db.ref('rsvp/' + existingId);
      delete payload.createdAt;      // no reescribir el createdAt original en edición
      writePromise = ref.update(payload);
    } else {
      ref = fb.db.ref('rsvp').push();
      writePromise = ref.set(payload);
    }

    var settled = false;
    var timer = setTimeout(function () {
      if (settled) return;
      settled = true; reject(new Error('timeout'));
    }, 10000);

    writePromise.then(function () {
      if (settled) return;
      settled = true; clearTimeout(timer);
      try {
        localStorage.setItem('_soumyjos_rsvp_id', ref.key);
        localStorage.setItem('_soumyjos_rsvp_done', '1');
      } catch (e) {}
      resolve();
    }).catch(function (err) {
      if (settled) return;
      settled = true; clearTimeout(timer); reject(err);
    });
  });
}

function setRsvpState(state, msg) {
  var region = document.getElementById('rsvpStatus');
  var btn = document.getElementById('rsvpSubmit');
  if (region) {
    region.className = 'rsvp-status rsvp-status--' + state;
    region.textContent = '';
    if (state === 'success') {
      var check = document.createElement('span');
      check.className = 'rsvp-check'; check.setAttribute('aria-hidden', 'true');
      check.textContent = '✓ ';
      region.appendChild(check);
    }
    region.appendChild(document.createTextNode(msg || ''));
  }
  if (btn) {
    btn.disabled = (state === 'sending');
    if (state === 'sending') btn.textContent = 'Enviando…';
    else if (state !== 'success') btn.textContent = 'CONFIRMAR ASISTENCIA';
  }
}
```

- [ ] Añadir el handler de `submit`, la opción de edición y la restauración al cargar (dentro del `if (rsvpForm)` de Task 12):

```js
function showEditOption() {
  var edit = document.getElementById('rsvpEdit');
  if (edit) edit.hidden = false;
}

rsvpForm.addEventListener('submit', function (ev) {
  ev.preventDefault();
  var res = validateRsvp(rsvpForm);
  if (!res.ok) { setRsvpState('error', res.errors.join(' ')); return; }
  var fb = initFirebase();
  var sid = fb ? fb.sid : '';
  var payload = buildRsvpPayload(rsvpForm, sid);
  var asiste = payload.asiste;
  setRsvpState('sending', '');
  submitRsvp(payload).then(function () {
    setRsvpState('success', asiste
      ? 'Hemos recibido su confirmación. Será un honor recibirle.'
      : 'Lamentamos que no pueda acompañarnos. Le agradecemos habérnoslo hecho saber.');
    showEditOption();
  }).catch(function (err) {
    if (err && err.message === 'throttle') {
      setRsvpState('error', 'Espere un momento antes de reenviar su confirmación.');
      return;
    }
    setRsvpState('error',
      'No pudimos registrar su confirmación. Verifique su conexión e inténtelo de nuevo.');
  });
});

var rsvpEdit = document.getElementById('rsvpEdit');
if (rsvpEdit) rsvpEdit.addEventListener('click', function () {
  setRsvpState('idle', '');
  rsvpEdit.hidden = true;
  document.getElementById('rsvpNombre').focus();
});

// Restaurar: si ya respondió en este dispositivo, ofrecer editar sin bloquear el form.
try {
  if (localStorage.getItem('_soumyjos_rsvp_done') === '1') {
    setRsvpState('success', 'Su confirmación ya fue registrada. Puede modificarla si lo desea.');
    showEditOption();
  }
} catch (e) {}
```

- [ ] Ampliar `tools/verify-rsvp.mjs` con asserts sobre `buildRsvpPayload` (stub de `firebase`/`navigator`), pegando el cuerpo real de la función:

```js
// --- buildRsvpPayload ---
globalThis.firebase = { database: { ServerValue: { TIMESTAMP: { '.sv': 'timestamp' } } } };
globalThis.navigator = { userAgent: 'Mozilla/5.0 (iPhone)' };

function buildRsvpPayload(form, sid) {
  const asisteEl = form.querySelector('input[name="asiste"]:checked');
  const asiste = asisteEl ? asisteEl.value === 'si' : false;
  let pases = 0;
  if (asiste) { const sel = form.querySelector('#rsvpPases'); pases = sel ? (parseInt(sel.value, 10) || 1) : 1; }
  let acompanantes = [];
  if (asiste && pases > 1) {
    acompanantes = (form.querySelector('#rsvpAcompanantes').value || '')
      .split('\n').map(s => s.trim()).filter(s => s.length > 0).slice(0, pases - 1);
  }
  const restr = (form.querySelector('#rsvpRestricciones').value || '').trim().slice(0, 280);
  const msg = (form.querySelector('#rsvpMensaje').value || '').trim().slice(0, 500);
  const hp = (form.querySelector('#rsvpWebsite').value || '').trim();
  const ua = navigator.userAgent || '';
  const device = /iPad|iPhone|iPod/.test(ua) ? 'iOS' : /Android/i.test(ua) ? 'Android' : 'Other';
  const payload = {
    nombre: (form.querySelector('#rsvpNombre').value || '').trim().slice(0, 80),
    asiste, pases, acompanantes, sid: sid || '',
    createdAt: firebase.database.ServerValue.TIMESTAMP, updatedAt: Date.now(),
    userAgent: ua.slice(0, 512), device, _hp: hp ? true : false
  };
  if (restr) payload.restricciones = restr;
  if (msg) payload.mensaje = msg;
  return payload;
}

const p = buildRsvpPayload(makeForm({ nombre: '  Ana Ruiz ', asiste: true, pases: 2, acompanantes: 'Luis\n\nMar' }), 'sid123');
assert.equal(p.nombre, 'Ana Ruiz');
assert.equal(p.asiste, true);
assert.equal(p.pases, 2);
assert.deepEqual(p.acompanantes, ['Luis']);   // cap pases-1
assert.equal(p.sid, 'sid123');
assert.equal(p.device, 'iOS');
assert.equal(p._hp, false);
const d = buildRsvpPayload(makeForm({ nombre: 'Bob', asiste: false }), 'sid9');
assert.equal(d.pases, 0);
assert.equal(d.acompanantes.length, 0);
console.log('verify-rsvp payload: OK');
```

- [ ] **Verificación:** `node tools/verify-rsvp.mjs` imprime ambos `OK`. Con Firebase en vivo (reglas de escritura temporales), enviar el form desde el preview y confirmar el nodo `rsvp/<pushId>` en Firebase Console con los campos esperados; activar red offline en DevTools → estado `error` a los ≤10s, datos conservados en los inputs.
- [ ] **Commit:** `git add invitacion.html tools/verify-rsvp.mjs && git commit -m "RSVP: submitRsvp con callback real + estados + edición"`

---

### Task 14: Reglas de seguridad — nodo `rsvp` en `database.rules.json` + publicar

**Files:** Modify `/Users/amieva/Documents/Programming/SoumyJos/database.rules.json`.

**Interfaces**
- **Produces:** nodo `rsvp` con `.read:"auth != null"` (Decisión E), escritura idempotente por `sid`, `.validate` para **todos** los campos del payload de Task 13, `"$other":{".validate":false}`. Conserva `tracking`.
- **Consumes:** payload de Task 13.

> **Reconciliación obligatoria (spec §7.4 vs §7.5):** el payload de §7.4 incluye `acompanantes`, `updatedAt`, `userAgent`, `device`, que §7.5 **no** lista; con `"$other":{".validate":false}` esas claves harían **fallar toda escritura**. Este nodo añade `.validate` para las cuatro. Además se eleva `.read` de `false` a `"auth != null"` (Decisión E) y se elimina el `auth === null` del `.write` (la página de invitación es anónima; el guard real es la igualdad de `sid`).

**Pasos**

- [ ] Reemplazar el contenido de `database.rules.json` por (conservando `tracking` intacto):

```json
{
  "rules": {
    "tracking": {
      ".read": true,
      ".write": true
    },
    "rsvp": {
      ".read": "auth != null",
      ".write": false,
      "$id": {
        ".write": "!data.exists() || (newData.child('sid').val() === data.child('sid').val())",
        ".validate": "newData.hasChildren(['nombre','asiste','sid'])",
        "nombre":        { ".validate": "newData.isString() && newData.val().length >= 2 && newData.val().length <= 80" },
        "asiste":        { ".validate": "newData.isBoolean()" },
        "pases":         { ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 12" },
        "acompanantes":  { ".validate": "true", "$i": { ".validate": "newData.isString() && newData.val().length <= 80" } },
        "restricciones": { ".validate": "!newData.exists() || (newData.isString() && newData.val().length <= 280)" },
        "mensaje":       { ".validate": "!newData.exists() || (newData.isString() && newData.val().length <= 500)" },
        "grupo":         { ".validate": "!newData.exists() || (newData.isString() && newData.val().length <= 16)" },
        "sid":           { ".validate": "newData.isString() && newData.val().length <= 64" },
        "createdAt":     { ".validate": "newData.isNumber()" },
        "updatedAt":     { ".validate": "!newData.exists() || newData.isNumber()" },
        "userAgent":     { ".validate": "!newData.exists() || (newData.isString() && newData.val().length <= 512)" },
        "device":        { ".validate": "newData.isString() && newData.val().length <= 16" },
        "$other":        { ".validate": false }
      }
    }
  }
}
```

- [ ] Validar el JSON localmente: `node -e "JSON.parse(require('fs').readFileSync('database.rules.json','utf8')); console.log('rules JSON: OK')"`.
- [ ] **Publicar en Firebase Console** (Realtime Database → Reglas → Publicar), o `firebase deploy --only database` si hay CLI. Editar el archivo **no basta**.
- [ ] **Verificación:** en el simulador de reglas de la Console: (a) escritura en `rsvp/nuevo` con `{nombre,asiste,sid,pases,acompanantes,createdAt,updatedAt,userAgent,device}` válido → **permitida**; (b) misma escritura con una clave extra `foo` → **rechazada** (`$other`); (c) lectura de `rsvp` sin auth → **denegada**, con auth → **permitida**; (d) escritura en `tracking/visits/x` → sigue **permitida** (no regresión).
- [ ] **Commit:** `git add database.rules.json && git commit -m "Reglas: nodo rsvp validado (read auth!=null) + reconciliación de payload"`

---

### Task 15: `Soumi-Jos-Invitacion.ics` (hora real ceremonia) + verificación Node `buildIcs`

**Files:** Create `/Users/amieva/Documents/Programming/SoumyJos/Soumi-Jos-Invitacion.ics`; Create `/Users/amieva/Documents/Programming/SoumyJos/tools/verify-ics.mjs`.

**Interfaces**
- **Produces (archivo):** 1 `VEVENT` con `DTSTART/DTEND` a hora real (ceremonia), `LOCATION` canónico, recepción en `DESCRIPTION`, `X-WR-TIMEZONE:America/Mexico_City`, `VALARM` relativos `-P1D` y `-PT3H`.
- **Produces (Node helper):** `buildIcs(evt)` → `string`, `evt = { uid, dtstamp, dtstart, dtend, tz, summary, location, description, alarms }`.

**Pasos**

- [ ] Crear `tools/verify-ics.mjs` con `buildIcs` (exportado) + regeneración + asserts:

```js
// tools/verify-ics.mjs — genera y verifica Soumi-Jos-Invitacion.ics
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ICS_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'Soumi-Jos-Invitacion.ics');

function esc(s) {
  return String(s)
    .replace(/\\/g, '\\\\').replace(/;/g, '\\;')
    .replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildIcs(evt) {
  const alarms = (evt.alarms || []).map(trig => [
    'BEGIN:VALARM', 'ACTION:DISPLAY',
    'DESCRIPTION:' + esc(evt.summary), 'TRIGGER:' + trig, 'END:VALARM'
  ].join('\r\n'));
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Soumi&Jos//Invitacion//ES',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Boda Soumi & Jos',
    'X-WR-TIMEZONE:' + evt.tz,
    'BEGIN:VEVENT',
    'UID:' + evt.uid, 'DTSTAMP:' + evt.dtstamp,
    'DTSTART;TZID=' + evt.tz + ':' + evt.dtstart,
    'DTEND;TZID=' + evt.tz + ':' + evt.dtend,
    'SUMMARY:' + esc(evt.summary),
    'DESCRIPTION:' + esc(evt.description),
    'LOCATION:' + esc(evt.location),
    'STATUS:CONFIRMED', 'TRANSP:OPAQUE',
    ...alarms,
    'END:VEVENT', 'END:VCALENDAR'
  ];
  return lines.join('\r\n') + '\r\n';
}

// [PLACEHOLDER] Decisión C (hora) y Decisión D (dirección canónica + recepción)
export const EVT = {
  uid: 'soumi-jos-boda-20270320@invitacion',
  dtstamp: '20260719T000000Z',
  dtstart: '20270320T170000',   // 17:00 ceremonia [PLACEHOLDER]
  dtend:   '20270320T230000',
  tz: 'America/Mexico_City',
  summary: 'Boda de Soumi & Jos',
  location: 'Cuadra San Cristóbal, Av. Juárez 59, Los Clubes, Atizapán de Zaragoza, Estado de México', // [PLACEHOLDER canónica]
  description: 'Ceremonia a las 17:00 h. La recepción se celebrará a continuación en [PLACEHOLDER: sede de recepción].',
  alarms: ['-P1D', '-PT3H']
};

// Regenera el archivo si se pasa --write
if (process.argv.includes('--write')) {
  writeFileSync(ICS_PATH, buildIcs(EVT), 'utf8');
  console.log('verify-ics: archivo regenerado');
}

const ics = readFileSync(ICS_PATH, 'utf8');
assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 1, 'exactamente un VEVENT');
assert.match(ics, /DTSTART;TZID=America\/Mexico_City:20270320T\d{6}/, 'DTSTART con hora (no VALUE=DATE)');
assert.doesNotMatch(ics, /VALUE=DATE/, 'sin all-day');
assert.equal((ics.match(/BEGIN:VALARM/g) || []).length, 2, 'dos VALARM');
assert.match(ics, /TRIGGER:-P1D/, 'alarma -P1D');
assert.match(ics, /TRIGGER:-PT3H/, 'alarma -PT3H');
assert.match(ics, /LOCATION:.+\S/, 'LOCATION no vacío');
console.log('verify-ics: OK');
```

- [ ] Generar el archivo real: `node tools/verify-ics.mjs --write`. Confirmar que crea/actualiza `Soumi-Jos-Invitacion.ics` con contenido equivalente a:

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Soumi&Jos//Invitacion//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Boda Soumi & Jos
X-WR-TIMEZONE:America/Mexico_City
BEGIN:VEVENT
UID:soumi-jos-boda-20270320@invitacion
DTSTAMP:20260719T000000Z
DTSTART;TZID=America/Mexico_City:20270320T170000
DTEND;TZID=America/Mexico_City:20270320T230000
SUMMARY:Boda de Soumi & Jos
DESCRIPTION:Ceremonia a las 17:00 h. La recepción se celebrará a continuación en [PLACEHOLDER: sede de recepción].
LOCATION:Cuadra San Cristóbal\, Av. Juárez 59\, Los Clubes\, Atizapán de Zaragoza\, Estado de México
STATUS:CONFIRMED
TRANSP:OPAQUE
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Boda de Soumi & Jos
TRIGGER:-P1D
END:VALARM
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Boda de Soumi & Jos
TRIGGER:-PT3H
END:VALARM
END:VEVENT
END:VCALENDAR
```

- [ ] **Verificación:** `node tools/verify-ics.mjs` imprime `verify-ics: OK`. Abrir el `.ics` en Calendar (macOS/iOS) y confirmar que el evento cae el 20 mar 2027 17:00 CDMX con 2 recordatorios (1 día antes, 3 h antes).
- [ ] **Commit:** `git add Soumi-Jos-Invitacion.ics tools/verify-ics.mjs && git commit -m "ICS: evento real de ceremonia + VALARM relativos + verificación Node"`

---

### Task 16: Cierre (muro `--burgundy`) + descarga `.ics` + Google Calendar + `.wa-banner`

**Files:** Modify `/Users/amieva/Documents/Programming/SoumyJos/invitacion.html`.

**Interfaces**
- **Produces:** `.scene--cierre` (muro `--burgundy`, texto `--cream-paper`) con botón `AGREGAR AL CALENDARIO` (crema sólido, texto borgoña, foco `--focus-on-wall`) + enlace `AGREGAR A GOOGLE CALENDAR`.
- **Produces:** `detectInApp()` → `{ isIOS, isAndroid, isInAppBrowser }` (regex de `index.html:476-482`); `showWaBanner()`.
- **Consumes:** `Soumi-Jos-Invitacion.ics` (Task 15), `.wa-banner`, tokens muro.

**Pasos**

- [ ] Insertar la escena de cierre al final de `<main>` en `invitacion.html`:

```html
<section class="scene scene--cierre" data-scene="cierre" aria-labelledby="cierreEyebrow">
  <p class="eyebrow eyebrow--on-wall" id="cierreEyebrow">LE ESPERAMOS</p>
  <p class="cierre-despedida">
    Será un honor compartir con usted este día.<br>Soumi &amp; Jos
  </p>
  <a class="cierre-btn" id="invSaveIcs" href="/Soumi-Jos-Invitacion.ics"
     download="Soumi-Jos-Invitacion.ics">AGREGAR AL CALENDARIO</a>
  <a class="cierre-link" id="invGoogleCal" target="_blank" rel="noopener"
     href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Boda%20de%20Soumi%20%26%20Jos&dates=20270320T170000/20270320T230000&ctz=America/Mexico_City&location=Cuadra%20San%20Crist%C3%B3bal%2C%20Atizap%C3%A1n%2C%20Edo.%20de%20M%C3%A9xico&details=Ceremonia%2017%3A00%20h.%20Recepci%C3%B3n%20a%20continuaci%C3%B3n.">AGREGAR A GOOGLE CALENDAR</a>
  <p class="cierre-feedback" id="invCalFeedback">EVENTO GUARDADO CON SUS RECORDATORIOS</p>

  <div class="wa-banner" id="invWaBanner" role="note">
    <p class="wa-banner-title">PARA GUARDAR LA FECHA EN SU CALENDARIO</p>
    <p class="wa-banner-step" data-ios>Abra este enlace en Safari desde el menú (···) → “Abrir en Safari”.</p>
    <p class="wa-banner-step" data-android>Abra este enlace en Chrome desde el menú (⋮) → “Abrir en Chrome”.</p>
  </div>
</section>
```

- [ ] Añadir estilos del cierre al `<style>` (muro oscuro → texto crema; botón crema sólido; foco crema):

```css
.scene--cierre { background: var(--burgundy); color: var(--text-on-burgundy);
  padding: var(--sp-wall) var(--sp-5); text-align: center; }
.eyebrow--on-wall { color: var(--cream-paper); }
.cierre-despedida { font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: var(--fs-quote); line-height: var(--lh-body);
  color: var(--cream-paper); max-width: var(--measure);
  margin: var(--sp-5) auto var(--sp-7); }
.cierre-btn { display: inline-block; min-height: var(--tap-min); line-height: 1;
  padding: 16px 28px; background: var(--cream-paper); color: var(--burgundy);
  font-family: var(--font-label); font-weight: 400; font-size: var(--fs-btn);
  letter-spacing: var(--ls-label); text-transform: uppercase; text-decoration: none;
  border-radius: var(--radius-sm); }
.cierre-btn:focus-visible { outline: 2px solid var(--focus-on-wall); outline-offset: 2px; }
.cierre-link { display: inline-block; margin-top: var(--sp-5); min-height: var(--tap-min);
  color: var(--cream-paper); font-family: var(--font-label); font-size: var(--fs-micro);
  letter-spacing: var(--ls-micro); text-transform: uppercase; text-decoration: underline; }
.cierre-link:focus-visible { outline: 2px solid var(--focus-on-wall); outline-offset: 2px; }
.cierre-feedback { margin-top: var(--sp-5); color: var(--cream-paper); opacity: 0;
  font-family: var(--font-label); font-size: var(--fs-micro); letter-spacing: var(--ls-micro);
  text-transform: uppercase; transition: opacity var(--dur-base) var(--ease-quiet); }
.cierre-feedback.show { opacity: .85; }
.wa-banner { display: none; margin: var(--sp-6) auto 0; max-width: var(--measure);
  padding: var(--sp-4); border: 1px solid var(--cream-paper); border-radius: var(--radius-sm);
  color: var(--cream-paper); }
.wa-banner.show { display: block; }
.wa-banner-title { font-family: var(--font-label); font-size: var(--fs-micro);
  letter-spacing: var(--ls-micro); text-transform: uppercase; margin-bottom: var(--sp-2); }
.wa-banner-step { font-family: var(--font-display); font-style: italic; font-size: 1rem; }
```

- [ ] Añadir en el IIFE la detección y el wiring del cierre (reusa regex de `index.html:476-490`):

```js
function detectInApp() {
  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua);
  var isAndroid = /Android/i.test(ua);
  var isInAppBrowser =
    /WhatsApp|FBAN|FBAV|Instagram|Line|MicroMessenger|Twitter/i.test(ua) ||
    (isIOS && /AppleWebKit(?!.*Safari)/i.test(ua));
  return { isIOS: isIOS, isAndroid: isAndroid, isInAppBrowser: isInAppBrowser };
}

function showWaBanner() {
  var d = detectInApp();
  var banner = document.getElementById('invWaBanner');
  if (!banner || !d.isInAppBrowser) return;
  banner.classList.add('show');
  var iosStep = banner.querySelector('[data-ios]');
  var andStep = banner.querySelector('[data-android]');
  if (d.isIOS && andStep) andStep.style.display = 'none';
  if (d.isAndroid && iosStep) iosStep.style.display = 'none';
}

(function wireCierre() {
  showWaBanner();
  var icsBtn = document.getElementById('invSaveIcs');
  var feedback = document.getElementById('invCalFeedback');
  if (icsBtn) icsBtn.addEventListener('click', function () {
    if (feedback) {
      feedback.classList.add('show');
      setTimeout(function () { feedback.classList.remove('show'); }, 7000);
    }
  });
})();
```

- [ ] **Verificación:** en el preview, tocar `AGREGAR AL CALENDARIO` descarga `Soumi-Jos-Invitacion.ics` y muestra el feedback; `AGREGAR A GOOGLE CALENDAR` abre la plantilla con `dates=20270320T170000/…` y `ctz=America/Mexico_City`; emular UA de WhatsApp (`...WhatsApp...`) en DevTools → aparece `.wa-banner` con el paso iOS o Android correcto; `Tab` al botón muestra outline crema visible sobre borgoña.
- [ ] **Commit:** `git add invitacion.html && git commit -m "Cierre: muro borgoña + descarga .ics + Google Calendar + banner WhatsApp"`

---

### Task 17: `_headers` (MIME del `.ics` nuevo + cache webp/OG) + `_redirects` (rewrite `/invitacion`)

**Files:** Modify `/Users/amieva/Documents/Programming/SoumyJos/_headers`; Modify `/Users/amieva/Documents/Programming/SoumyJos/_redirects`.

**Interfaces**
- **Produces (`_headers`):** bloque para `/Soumi-Jos-Invitacion.ics` (MIME + `Content-Disposition: attachment`) + cache de `/assets/*.webp` y `/assets/og-invitacion.jpg`.
- **Produces (`_redirects`):** `/invitacion  /invitacion.html  200` (idempotente respecto a Task 1).

> Coordinación: Task 1 (Grupo 1) también añade el rewrite `/invitacion`. Este paso lo añade **solo si aún no existe** para no duplicar; el bloque de `_headers` es exclusivo de este grupo.

**Pasos**

- [ ] En `_headers`, insertar **antes** del bloque `/*` (sin tocar los bloques existentes de `Soumi-Jos-SaveTheDate.ics`, `preview.png`, `og-preview.jpg`):

```
/Soumi-Jos-Invitacion.ics
  Content-Type: text/calendar; charset=utf-8
  Content-Disposition: attachment; filename="Soumi-Jos-Invitacion.ics"
  Cache-Control: public, max-age=3600

/assets/*.webp
  Cache-Control: public, max-age=604800, immutable

/assets/og-invitacion.jpg
  Content-Type: image/jpeg
  Cache-Control: public, max-age=86400
```

- [ ] En `_redirects`, si no existe ya la línea (añadida por Task 1), agregarla tras el redirect `www` y antes/junto a los shortcuts de calendario, sin tocar los existentes:

```
# URL limpia de la invitación formal (rewrite, no redirect)
/invitacion /invitacion.html 200
```

- [ ] **Verificación:** `npx wrangler pages dev .` y en otra terminal `curl -sI http://localhost:8788/Soumi-Jos-Invitacion.ics` muestra `content-type: text/calendar; charset=utf-8` y `content-disposition: attachment; filename="Soumi-Jos-Invitacion.ics"`; `curl -sI http://localhost:8788/Soumi-Jos-SaveTheDate.ics` sigue intacto; `curl -s http://localhost:8788/invitacion | head` sirve `invitacion.html` (rewrite 200, URL sin `.html`).
- [ ] **Commit:** `git add _headers _redirects && git commit -m "Deploy config: MIME del .ics nuevo + cache assets + rewrite /invitacion"`

---

### Task 18: Dashboard — auth anónima + listener `rsvp` + `computeRsvp` + `renderRsvp` + CSV

**Files:** Modify `/Users/amieva/Documents/Programming/SoumyJos/dashboard/index.html`; Modify `/Users/amieva/Documents/Programming/SoumyJos/dashboard/app.js`.

**Interfaces**
- **Produces (`index.html`):** `<section class="scene scene-6" data-scene="6">` tras scene-5; `<script>` de `firebase-auth-compat` antes de `app.js`.
- **Produces (`app.js`):** `signInAnonymously()` antes del listener `rsvp`; `computeRsvp(rsvpData)` → `{confirmados,totalPases,declinan,asistentes,restricciones}` (+ `todas`); `renderRsvp(metrics)` (con `textContent`); `exportRsvpCsv(list)` (Blob).
- **Consumes:** payload Task 13; reglas Task 14 (`.read:"auth != null"`).

**Pasos**

- [ ] En `dashboard/index.html`, insertar la scene-6 justo después de la scene-5 (línea 96), antes de `</main>`:

```html
  <!-- Scene 6 — Confirmaciones (RSVP) -->
  <section class="scene scene-6" data-scene="6">
    <span class="scene-label">Confirmaciones · RSVP</span>
    <div class="split">
      <div class="split-item">
        <div class="metric-big" id="rsvp-confirmados">—</div>
        <p class="split-label">confirman</p>
      </div>
      <div class="split-divider" aria-hidden="true"></div>
      <div class="split-item">
        <div class="metric-big" id="rsvp-pases">—</div>
        <p class="split-label">pases <span class="split-ext">(banquete)</span></p>
      </div>
      <div class="split-divider" aria-hidden="true"></div>
      <div class="split-item">
        <div class="metric-big" id="rsvp-declinan">—</div>
        <p class="split-label">declinan</p>
      </div>
    </div>
    <div class="meta-list" id="rsvp-list"></div>
    <div class="meta-list" id="rsvp-restricciones"></div>
    <button id="rsvp-csv-btn" class="rsvp-csv-btn" type="button">Exportar CSV</button>
    <p class="scene-note" id="scene-6-note">—</p>
  </section>
```

- [ ] En `dashboard/index.html`, añadir el SDK de auth entre `firebase-database-compat` y `../config.js` (líneas 101-103):

```html
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
```

- [ ] En `dashboard/style.css`, añadir el estilo del botón CSV (reusa el patrón outline del gate):

```css
.rsvp-csv-btn {
  margin-top: 20px; padding: 12px 20px; background: transparent;
  color: var(--burgundy); border: 1px solid var(--burgundy);
  font-family: 'Jost', sans-serif; font-weight: 300; font-size: 10px;
  letter-spacing: .42em; text-transform: uppercase; cursor: pointer;
  transition: background-color .35s var(--ease-quiet), color .35s var(--ease-quiet);
}
.rsvp-csv-btn:hover, .rsvp-csv-btn:focus-visible { background: var(--burgundy); color: var(--card); outline: none; }
```

- [ ] En `dashboard/app.js`, dentro de `setupFirebase()`, tras el listener de `tracking/visits` (línea 101), añadir auth anónima + listener de `rsvp`:

```js
      // --- RSVP (requiere auth por regla .read: auth != null) ---
      firebase.auth().signInAnonymously().then(function () {
        db.ref('rsvp').on('value', function (snap) {
          renderRsvp(computeRsvp(snap.val() || {}));
        });
      }).catch(function (e) {
        setText('scene-6-note', 'RSVP no disponible: ' + e.message);
      });
```

- [ ] En `dashboard/app.js`, añadir las funciones nuevas (junto a `computeMetrics`/`render`), usando `textContent`/DOM (nunca `innerHTML`):

```js
  var _lastRsvp = [];

  function computeRsvp(rsvpData) {
    var bySid = {};
    Object.keys(rsvpData || {}).forEach(function (pushId) {
      var r = rsvpData[pushId];
      if (!r || typeof r !== 'object') return;
      var sid = r.sid || pushId;
      var ts = r.updatedAt || r.createdAt || 0;
      if (!bySid[sid] || ts >= bySid[sid]._ts) {
        r._ts = ts; bySid[sid] = r; // última gana
      }
    });
    var confirmados = 0, totalPases = 0, declinan = 0;
    var asistentes = [], restricciones = [], todas = [];
    Object.keys(bySid).forEach(function (sid) {
      var r = bySid[sid];
      todas.push(r);
      if (r.asiste) {
        confirmados++;
        totalPases += (typeof r.pases === 'number' ? r.pases : 1);
        asistentes.push(r);
        if (r.restricciones) restricciones.push({ nombre: r.nombre, texto: r.restricciones });
      } else {
        declinan++;
      }
    });
    return { confirmados: confirmados, totalPases: totalPases, declinan: declinan,
             asistentes: asistentes, restricciones: restricciones, todas: todas };
  }

  function appendMetaItem(container, k, v) {
    var row = document.createElement('div'); row.className = 'meta-item';
    var ks = document.createElement('span'); ks.className = 'meta-k'; ks.textContent = k;
    var vs = document.createElement('span'); vs.className = 'meta-v'; vs.textContent = v;
    row.appendChild(ks); row.appendChild(vs); container.appendChild(row);
  }

  function renderRsvp(m) {
    setText('rsvp-confirmados', m.confirmados);
    setText('rsvp-pases', m.totalPases);
    setText('rsvp-declinan', m.declinan);

    var list = document.getElementById('rsvp-list');
    if (list) {
      list.textContent = '';
      m.asistentes.forEach(function (r) {
        var pases = (typeof r.pases === 'number' ? r.pases : 1);
        appendMetaItem(list, r.nombre || '(sin nombre)', pases + (pases === 1 ? ' pase' : ' pases'));
      });
    }
    var restr = document.getElementById('rsvp-restricciones');
    if (restr) {
      restr.textContent = '';
      m.restricciones.forEach(function (it) { appendMetaItem(restr, it.nombre, it.texto); });
    }
    setText('scene-6-note',
      (m.confirmados + m.declinan) + ' respuestas · ' + m.totalPases + ' asistentes esperados');
    _lastRsvp = m.todas;
  }

  function exportRsvpCsv(list) {
    var rows = [['nombre', 'asiste', 'pases', 'acompanantes', 'restricciones', 'mensaje', 'device']];
    (list || []).forEach(function (r) {
      rows.push([
        r.nombre || '',
        r.asiste ? 'si' : 'no',
        (typeof r.pases === 'number' ? r.pases : ''),
        (r.acompanantes || []).join(' | '),
        r.restricciones || '',
        r.mensaje || '',
        r.device || ''
      ]);
    });
    var csv = rows.map(function (row) {
      return row.map(function (cell) {
        var s = String(cell);
        if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
        return s;
      }).join(',');
    }).join('\r\n');
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'rsvp-soumyjos.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
```

- [ ] En `dashboard/app.js`, wire el botón CSV dentro de `init()` (línea 51-54):

```js
    var csvBtn = document.getElementById('rsvp-csv-btn');
    if (csvBtn) csvBtn.addEventListener('click', function () { exportRsvpCsv(_lastRsvp); });
```

- [ ] **Verificación:** abrir `/dashboard`, ingresar la contraseña; el chip debe decir "en vivo", `signInAnonymously` resuelve sin error de permisos (revisar consola: sin `PERMISSION_DENIED`), y la scene-6 muestra los RSVP de prueba (confirman / pases / declinan + lista). Pulsar "Exportar CSV" descarga `rsvp-soumyjos.csv` con encabezados y filas. Confirmar que scenes 1-5 (`tracking`) siguen renderizando (no regresión).
- [ ] **Commit:** `git add dashboard/index.html dashboard/app.js dashboard/style.css && git commit -m "Dashboard: auth anónima + tarjeta RSVP (computeRsvp/renderRsvp/CSV)"`

---

### Task 19: `sitemap.xml` + `CLAUDE.md` (ubicación + excepción countdown)

**Files:** Modify `/Users/amieva/Documents/Programming/SoumyJos/sitemap.xml`; Modify `/Users/amieva/Documents/Programming/SoumyJos/CLAUDE.md`.

**Interfaces**
- **Produces (`sitemap.xml`):** decisión de indexar `/invitacion` (recomendado: **indexar**, es contenido público real).
- **Produces (`CLAUDE.md`):** corrección de ubicación + párrafo de la excepción consciente de la cuenta regresiva.

**Pasos**

- [ ] Reemplazar `sitemap.xml` para incluir `/invitacion` (el dashboard sigue fuera por su `noindex`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://soumyjos.com/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://soumyjos.com/invitacion</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
```

- [ ] En `CLAUDE.md`, corregir la ubicación. Reemplazar la frase `The event is **20 de Marzo 2027** in Ciudad de México.` por:

```
The event is **20 de Marzo 2027** at **Cuadra San Cristóbal, Atizapán de Zaragoza, Estado de México** (zona metropolitana de la CDMX). The old copy that said "Ciudad de México" was imprecise; the venue is in Los Clubes, Ciudad López Mateos, Atizapán, CP 52957.
```

- [ ] En `CLAUDE.md`, añadir bajo "Implementation notes" un bullet documentando la excepción consciente:

```
- **Excepción consciente (cuenta regresiva):** el canon lista "countdown clocks" como anti-referencia, pero la pareja la pidió para `invitacion.html`. Se resuelve como anotación editorial silenciosa **sobre crema** (no muro, sin flip, solo días) — no es un reloj animado. Vive únicamente en la invitación formal; el Save the Date conserva su propio `updateCountdown()`.
- **Segunda página `invitacion.html`:** convive con `index.html` (intocable). Firebase comparte `_soumyjos_sid`; RSVP en el nodo hermano `rsvp/` (reglas en `database.rules.json`, hay que **publicarlas** en Firebase Console). `.ics` propio `Soumi-Jos-Invitacion.ics` (hora real, 1 VEVENT).
```

- [ ] **Verificación:** `xmllint --noout sitemap.xml` no reporta errores (o `node -e "require('fs').readFileSync('sitemap.xml')"` + inspección visual si no hay xmllint); `grep -n "Ciudad de México" CLAUDE.md` ya no muestra la sede como CDMX pura; `grep -n "cuenta regresiva" CLAUDE.md` encuentra el párrafo de la excepción.
- [ ] **Commit:** `git add sitemap.xml CLAUDE.md && git commit -m "Docs: indexar /invitacion + corregir ubicación + excepción countdown"`

---

### Task 20: QA final — coexistencia + accesibilidad/contraste/reduced-motion/móvil/peso + checklist de deploy

**Files:** (verificación; solo correcciones puntuales que surjan).

**Interfaces**
- **Consumes:** toda la página, la tabla de portadores §11.2/§9.1, el foco dependiente del fondo §9.2, el presupuesto de peso §10.

**Pasos**

- [ ] **Coexistencia — `index.html` intacto:** `git diff --stat HEAD~<n> -- index.html` no muestra cambios (el Save the Date no se tocó en todo el grupo). Abrir `/` y confirmar que el Save the Date sigue idéntico (portada, su countdown, su `.ics`).
- [ ] **Coexistencia — claves de storage distintas:** en DevTools → Application → Local/Session Storage, tras usar ambas páginas, verificar que la invitación usa `_sj_inv_opened` (session), `_soumyjos_rsvp_id`, `_soumyjos_rsvp_done` (local) y **comparte** `_soumyjos_sid`; que no pisa `_soumyjos_dash_auth` del dashboard.
- [ ] **Coexistencia — tracking sigue vivo:** abrir `/` y `/invitacion`, luego `/dashboard`: confirmar que scenes 1-5 cuentan las visitas (no rotas por las reglas nuevas) y scene-6 muestra RSVP. Verificar en Console que no hay `PERMISSION_DENIED` sobre `tracking`.
- [ ] **Contraste (con checker, no a ojo):** validar los pares clave con un checker WCAG: `--ink`/`--rose` (≥4.5), `--ink`/`--mauve` (≥4.5), `--cream-paper`/`--burgundy` (≥4.5), `--sage`/crema (≥4.5), botón cierre `--burgundy`/`--cream-paper` (≥4.5). Cualquier fallo → ajustar el token, re-verificar.
- [ ] **Foco dependiente del fondo:** `Tab` por el RSVP (crema) → outline borgoña 3px visible; `Tab` por los botones del cierre (borgoña) → outline crema 2px visible. Ningún control con `outline:none` sin reemplazo.
- [ ] **Tap targets + zoom iOS:** inspeccionar caja de radios, `<select>`, botón submit, enlaces del cierre y hoteles → ≥44px reales; confirmar `font-size:16px` en todos los inputs/textarea/select (no dispara zoom en iOS).
- [ ] **Reduced-motion:** en DevTools emular `prefers-reduced-motion: reduce`, recargar `/invitacion`: ninguna `.scene` queda oculta, el sobre **no auto-abre**, y al tap el fundido es ≤150ms.
- [ ] **Presupuesto de peso:** `ls -la invitacion.html` y auditar el base64 inline; el HTML crítico debe pesar **<300KB** (solo portada + sello en base64; Historia/mapas/OG como archivos externos diferidos). En DevTools Network confirmar que `.webp` y OG cargan `lazy`/aparte, no en el documento.
- [ ] **Rendimiento apertura:** Lighthouse mobile con CPU 4× throttle (o dispositivo real) → la apertura del sobre se mantiene ~60fps (solo `transform`/`opacity`); si cae, degradar a fundido 2D.
- [ ] **Checklist de deploy a Cloudflare Pages (drag-upload):**
  - [ ] Reglas `rsvp` **publicadas** en Firebase Console (no solo el archivo) y `tracking` verificado.
  - [ ] `config.js` presente en la carpeta subida (no gitignored) para que el RSVP y el dashboard tengan credenciales.
  - [ ] `invitacion.html`, `Soumi-Jos-Invitacion.ics`, `assets/*.webp`, `assets/og-invitacion.jpg`, `_headers`, `_redirects` incluidos en el drag-upload.
  - [ ] Tras el deploy: `curl -sI https://soumyjos.com/Soumi-Jos-Invitacion.ics` → MIME + `Content-Disposition` correctos; `https://soumyjos.com/invitacion` sirve la página (rewrite 200); `/` y `/dashboard` intactos.
  - [ ] Enviar un RSVP de prueba en producción desde un teléfono real (dentro de WhatsApp) y confirmarlo en el dashboard; luego borrar ese nodo de prueba en la Console.
- [ ] **Commit final:** `git add -A && git commit -m "QA: coexistencia, accesibilidad AA, reduced-motion, peso y checklist de deploy"`

---

**Notas de contrato respetadas en este grupo:** firmas exactas `initFirebase()→{db,sid}`, `buildRsvpPayload(form,sid)`, `submitRsvp(payload)→Promise<void>`, `setRsvpState(state,msg)`, `validateRsvp(form)→{ok,errors}`, `toggleConditional(asiste)`, `computeRsvp(rsvpData)`, `renderRsvp(metrics)`, `exportRsvpCsv(list)`, `buildIcs(evt)`, `detectInApp()`, `showWaBanner()`. Constantes `MAX_PASES=2`; claves `_sj_inv_opened` / `_soumyjos_rsvp_id` / `_soumyjos_rsvp_done` / `_soumyjos_sid` (compartida). **Desviación consciente y justificada del spec** (documentada en Task 14): el nodo `rsvp` añade `.validate` para `acompanantes/updatedAt/userAgent/device` — sin ellas, `"$other":{".validate":false}` haría fallar toda escritura del payload §7.4 — y eleva `.read` a `"auth != null"` (Decisión E).



- [ ] **20.7 — Reduced-motion.** Emular `prefers-reduced-motion: reduce`, recargar `/invitacion`: ninguna `.scene` oculta, el sobre **no auto-abre**, al tap el fundido es ≤150ms sin animar la solapa.
- [ ] **20.8 — Presupuesto de peso (medible).**
  ```bash
  cd /Users/amieva/Documents/Programming/SoumyJos && \
  echo "HTML crítico:" && wc -c invitacion.html && \
  echo "data-URIs inline (debe ser 1: solo la foto de portada):" && grep -c "data:image" invitacion.html
  ```
  El HTML crítico debe pesar **<300KB** (`wc -c` < 307200). El conteo de `data:image` debe ser **1** (solo la foto de portada; el sello es CSS). En DevTools → Network confirmar que `.webp`, mapas y OG cargan `lazy`/aparte, no en el documento.
- [ ] **20.9 — Rendimiento de apertura.** Lighthouse mobile con CPU 4× throttle (o dispositivo real) → la apertura del sobre se mantiene ~60fps (solo `transform`/`opacity`); si cae, degradar a fundido 2D.
- [ ] **20.10 — Checklist de deploy a Cloudflare Pages (drag-upload).**
  - [ ] Reglas `rsvp` **publicadas** en Firebase Console (no solo el archivo) y `tracking` verificado.
  - [ ] `config.js` presente en la carpeta subida (no gitignored) para RSVP y dashboard.
  - [ ] `invitacion.html`, `Soumi-Jos-Invitacion.ics`, `assets/*.webp`, `assets/og-invitacion.jpg`, `_headers`, `_redirects` incluidos.
  - [ ] Tras deploy: `curl -sI https://soumyjos.com/Soumi-Jos-Invitacion.ics` → MIME + `Content-Disposition` correctos; `https://soumyjos.com/invitacion` sirve la página (rewrite 200); `/` y `/dashboard` intactos.
  - [ ] Enviar un RSVP de prueba en producción desde un teléfono real (dentro de WhatsApp) y confirmarlo en el dashboard; luego borrar ese nodo de prueba en la Console.
- [ ] **20.11 — Commit final.**
  ```bash
  cd /Users/amieva/Documents/Programming/SoumyJos && git add -A && git commit -m "$(cat <<'EOF'
  chore(qa): coexistencia, accesibilidad AA, reduced-motion, peso <300KB y checklist de deploy

  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Notas de contrato (firmas exactas, sin deriva)

- **Reveal:** `prefersReducedMotion()`, `observeScenes()`, `cascadeReveal(rootEl)` (definidas en Task 2; expuestas en `window.__inv`). Portada **no** usa `.scene` (la revela Motor A vía `cascadeReveal` sobre `[data-cascade]` → `.is-cascaded`; **no** existe keyframe `quietFade`). Dedicatoria, Historia y todas las secciones de Grupo 3/4 usan `.scene` (Motor B → `.scene--in`).
- **Sobre:** `setupEnvelope()`, `openEnvelope()`, `shouldSkipGate()`, `revealPortada()`; clave `sessionStorage['_sj_inv_opened']='1'`.
- **Sedes:** `renderSede(config, mountEl)`, `buildMapsUrl(lat, lng)`, `copyAddress(text)`; `SEDE_CEREMONIA` es la fuente única de la dirección de ceremonia (reusada por el `.ics` de Task 15 y el enlace Google Calendar de Task 16 — C1 resuelto).
- **Secciones crema:** `setText(id, text)`, `wireCopyButtons(root)`, `renderHospedaje(list, mountEl)`.
- **Countdown:** `daysUntilWedding(fromDate)`, `countdownParts(days)`, `updateCountdown()` con `new Date(2027, 2, 20)`. Lógica pura duplicada a propósito en `invitacion.html` y `tools/verify-countdown.mjs` (**mantener en sync**).
- **RSVP:** `validateRsvp(form)→{ok,errors}`, `toggleConditional(asiste)`, `initFirebase()→{db,sid}`, `buildRsvpPayload(form,sid)`, `submitRsvp(payload)→Promise<void>`, `setRsvpState(state,msg)`. Constante `MAX_PASES=2` (las `<option>` del `<select>` están acopladas; regenerarlas si cambia). Claves `_soumyjos_rsvp_id`, `_soumyjos_rsvp_done`, `_soumyjos_sid` (compartida).
- **`.ics`:** `buildIcs(evt)` con `evt = { uid, dtstamp, dtstart, dtend, tz, summary, location, description, alarms }`.
- **Cierre:** `detectInApp()→{isIOS,isAndroid,isInAppBrowser}`, `showWaBanner()`, `buildGoogleCalUrl()`, `wireCierre()`.
- **Dashboard:** `computeRsvp(rsvpData)→{confirmados,totalPases,declinan,asistentes,restricciones,todas}` (el campo `todas` alimenta el CSV), `renderRsvp(metrics)`, `exportRsvpCsv(list)`.
- **Convenciones:** contenedor `<main id="inv-main">`; arranque único `init()` en `DOMContentLoaded`; `window.__inv` expone `{ prefersReducedMotion, observeScenes, cascadeReveal, SEDE_CEREMONIA }`.

**Desviaciones conscientes documentadas:** (1) el nodo `rsvp` añade `.validate` para `acompanantes/updatedAt/userAgent/device` y eleva `.read` a `"auth != null"` (Decisión E) — sin ello, `"$other":{".validate":false}` haría fallar toda escritura (Task 14); (2) cuenta regresiva sobre crema como anotación editorial, no reloj animado (Task 11 + `CLAUDE.md`); (3) `preload` de fuentes omitido a favor de `preconnect`+`display=swap` (Task 1 + `CLAUDE.md`).

---

El plan está completo: header en formato writing-plans (título + REQUIRED SUB-SKILL + Goal/Architecture/Tech Stack), `## Global Constraints` verbatim, y 20 tareas en orden de dependencias con **Files**, **Interfaces** (Consumes/Produces) y pasos `- [ ]` con código real completo, verificación y commit. Todas las correcciones de la crítica quedaron aplicadas: `cascadeReveal` definida (A1) sin `quietFade` (A2); `<main id="inv-main">` (A3) e `init()` (A4) unificados; `.eyebrow` y `.rule` con definición canónica única + overrides de muro (B1/B2); sede de ceremonia alineada entre tarjeta, `.ics` y Google Calendar vía `SEDE_CEREMONIA` (C1); creación de `og-invitacion.jpg` (D1); preload como excepción documentada (D2/F1); `_redirects` solo en Task 1, Task 17 solo toca `_headers` (E1); QA de peso medible con `wc -c`/`grep -c` (F2); notas menores G1–G4 incorporadas.


---

## Apéndice — correcciones de la crítica (referencia; ya reflejadas en las notas de contrato)

I have verified the load-bearing cross-references against the repo (dashboard `setText`/`init`/`setupObserver` at the cited lines, and `index.html`'s `isInAppBrowser`, `updateCountdown` `new Date(2027,2,20)`, and `_soumyjos_sid` patterns — all accurate). Here is the audit.

---

# Auditoría de completitud y consistencia del PLAN

## A. DERIVA DE INTERFACES (bloqueantes — rompen la ejecución)

**A1 — CRÍTICO · `cascadeReveal(rootEl)` nunca se implementa (cae entre grupos).**
- El esqueleto (Task 2) dice que Task 2 *produce* `cascadeReveal`.
- Grupo 1 Task 2 lo **excluye explícitamente**: *"Motor A (`cascadeReveal`) NO entra aquí… se implementa en Task 3"*, y solo expone `observeScenes` y `prefersReducedMotion` en `window.__inv`.
- Grupo 2 (preámbulo) **asume que Task 2 ya lo definió** y sus Tasks 3 y 4 solo lo *consumen* (`revealPortada()` → `cascadeReveal(portada)`); su nota de cierre dice que pertenece a "Task 3–4" pero **ninguna** de esas tareas escribe la función.
- Resultado: `cascadeReveal` no existe en ningún grupo. Como la Portada **no** es `.scene` (la revela Motor A), sin esta función la Portada queda `opacity:0` para siempre en movimiento normal (solo se ve bajo `prefers-reduced-motion` por el override CSS). Es un blocker de render.
- **Corrección:** añadir un paso explícito (recomendado en Grupo 1 Task 2, o al inicio de Grupo 2 Task 3 **antes** de `setupEnvelope`) que defina la función completa, p. ej.:
  ```js
  function cascadeReveal(rootEl){
    if(!rootEl) return;
    var nodes = rootEl.querySelectorAll('[data-cascade]');
    var reduce = prefersReducedMotion();
    for(var i=0;i<nodes.length;i++){
      if(!reduce) nodes[i].style.transitionDelay = (i*0.18)+'s'; // --delay-step
      nodes[i].classList.add('is-cascaded');
    }
  }
  ```
  y exponerla en `window.__inv` junto a las otras. Actualizar el "Consumes" de Grupo 2 Tasks 3/4 para que apunte a esta definición, no a "Task 2".

**A2 — CRÍTICO · keyframe `quietFade` referenciado pero nunca definido + deriva de mecanismo.** El esqueleto y §6/§204 describen Motor A como *"cascada `quietFade` escalonada"* (animación por keyframe), pero Grupo 2 Task 4.2 lo implementa como **transición** sobre `[data-cascade].is-cascaded`. No hay `@keyframes quietFade` en ningún grupo. No es un hueco fatal (el enfoque por transición es válido), pero el plan menciona `quietFade` sin definirlo. **Corrección:** eliminar la referencia a `quietFade` (usar el mecanismo `.is-cascaded` de A1) **o** añadir el `@keyframes`. Elegir uno y unificar el vocabulario.

**A3 — ALTO · ID de `<main>` inconsistente.** Grupo 1 Task 1.2 crea `<main id="invitacion">`. Grupo 2 (preámbulo, Tasks 3/4/5) asume `<main id="inv-main">`. Grupo 3/4 usan `<main>` a secas. **Corrección:** fijar un único id (recomiendo `inv-main` para no colisionar con nada y porque G2 lo usa más) y corregir Grupo 1 Task 1.2.

**A4 — ALTO · función de arranque: `boot()` (G1) vs `init()` (G2/G3/G4).** Grupo 1 Task 2.2 define la función de arranque como `boot()` (invocada en `DOMContentLoaded`, solo llama `observeScenes()`). Grupo 2 Task 3 dice *"en el cuerpo de `init()`, añadir `setupEnvelope();`"*; Grupo 3 asume *"sus llamadas se añaden al cuerpo de `init()`"*. No existe `init()`. **Corrección:** renombrar `boot()`→`init()` en Grupo 1 Task 2.2 (y su invocación), o corregir G2–G4 para que digan `boot()`. Preferible `init()` por consistencia con el dashboard.

## B. CONFLICTOS DE CSS (mismo selector, reglas divergentes)

**B1 — ALTO · `.eyebrow` definido 3 veces con reglas incompatibles → viola canon y AA.**
- G1 Task 1.4: `.eyebrow { color: var(--text-on-cream-soft) }` (walnut).
- G2 Task 4.2: `.eyebrow { color: inherit; margin:0 }`.
- G3 Task 7: `.eyebrow { color: var(--accent) }` **+ `::after` hairline**.
- Por orden de cascada gana la de G3: **eyebrow borgoña con hairline en todas las secciones**, incluidas Portada (`--rose`) y Dedicatoria (`--mauve`). Borgoña sobre rosa/malva **no es un portador aprobado** (§5.2: solo `--ink` sobre muros claros) → rompe canon y contraste. Además G2 esperaba `inherit` (=ink) en los muros.
- **Corrección:** una sola definición canónica de `.eyebrow` (recomiendo `color: var(--accent)` + `::after` **solo sobre crema**), y un override explícito para muros: en `.scene--portada .eyebrow`, `.scene--dedicatoria .eyebrow`, `.eyebrow--on-wall` → `color: var(--ink)` (muros claros) o `var(--cream-paper)` (cierre borgoña, ya previsto en G4 con `.eyebrow--on-wall`). Consolidar en un único grupo (Task 1 o Task 7) y borrar las otras dos.

**B2 — MEDIO · `.rule` definido 2 veces.** G1 Task 1.4: `.rule { width:48px; height:1px; margin:var(--sp-5) auto }`. G2 Task 4.2: `.rule { display:block; height:1px; background:var(--rule) }` + `.rule--48 { width:48px; margin:var(--sp-3) 0 }`. Conflicto de `width`/`margin`/`display`. **Corrección:** dejar una sola definición base de `.rule` y el modificador `.rule--48`; eliminar la de G1 (o alinearla). El markup de G2/G4 usa `.rule--48`, así que esa es la que debe sobrevivir.

## C. INCONSISTENCIA DE DATOS PLACEHOLDER (mutuamente contradictorios)

**C1 — ALTO · sede de la ceremonia difiere entre tarjeta, `.ics` y Google Calendar.**
- G3 Task 7: `SEDE_CEREMONIA.nombre = 'Parroquia de San Cristóbal'`, dirección "Calle Manantial…".
- G4 Task 15 (`.ics`): `LOCATION = 'Cuadra San Cristóbal, Av. Juárez 59…'` — que es la **recepción**, no la ceremonia.
- G4 Task 16 (Google Cal): `location = Cuadra San Cristóbal`.
- El spec (§14-A, §12) exige: *"el `.ics` lleva la sede/hora de la **ceremonia** como `DTSTART` y la recepción en la descripción."* Los tres puntos deben coincidir en la sede de ceremonia.
- **Corrección:** alinear el `LOCATION` del `.ics` (Task 15) y el `location=` de Google Calendar (Task 16) con `SEDE_CEREMONIA` de Task 7 (misma dirección canónica), y mover la recepción a `DESCRIPTION`. Marcar los tres como el **mismo** `[PLACEHOLDER]` (Decisión D) para que el ejecutor los rellene de una sola fuente.

## D. COBERTURA — huecos frente al spec

**D1 — ALTO · `assets/og-invitacion.jpg` nunca se crea.** Está en la tabla FILE STRUCTURE (Create), lo referencian las meta OG (Task 1) y el cache de `_headers` (Task 17), pero **ningún paso lo genera** (a diferencia de `historia-*.webp` en Task 6 y los mapas en Task 7, que sí tienen paso de creación). Sin el archivo, el preview de WhatsApp (objetivo central del proyecto) da 404. **Corrección:** añadir en Task 1 (o Task 17) un paso concreto que produzca `og-invitacion.jpg` 1200×630 (placeholder seguro con ImageMagick, p. ej. `magick -size 1200x630 xc:'#c98a83' … assets/og-invitacion.jpg`, a reemplazar por la real) con su verificación (`identify`/`ls`).

**D2 — MEDIO · `preload` de fuentes: la Global Constraint lo exige verbatim, el plan lo omite sin cierre firme.** La sección Global Constraints copia como regla dura: *"`preload` solo de los 2 cortes above-the-fold"*. Grupo 1 Task 1.2 lo **omite deliberadamente** con justificación (URLs con hash de Google Fonts) y remite a Task 20 *"si Lighthouse lo exige"* — verificación vaga, no una acción. Queda una regla dura sin implementar y sin decisión final. **Corrección:** decidir explícitamente: (a) suavizar la Global Constraint documentando la excepción (como se hizo con countdown), **o** (b) convertir Task 20 en un paso concreto que auto-hospede/`preload` los 2 `.woff2`. No dejarlo como "si acaso".

**D3 — BAJO · tracking `invitationOpened` (§6.1) no se implementa.** El spec lo marca *"de forma opcional; nunca bloquea"*, así que no es bloqueante, pero ningún task lo cubre. **Corrección:** o añadir una línea opcional en `openEnvelope` (Task 3) que haga `db.ref('tracking/visits/'+sid).update({invitationOpened:true})` dentro de try/catch, o anotar explícitamente que se descarta. (Nota: requeriría `initFirebase()` de Task 13, que es posterior a Task 3 — si se implementa, ubicarlo tras Task 13.)

## E. REDUNDANCIAS / DOBLE-ESCRITURA

**E1 — MEDIO · `_redirects` se modifica en dos tasks.** Grupo 1 Task 1.1 añade `/invitacion /invitacion.html 200`; Grupo 4 Task 17 lo vuelve a añadir *"solo si no existe"*. La tabla FILE STRUCTURE asigna `_redirects` únicamente a Task 1. **Corrección:** que Task 17 toque **solo** `_headers`; eliminar de Task 17 el paso de `_redirects` (o marcarlo como no-op verificable). Evita un segundo commit que reescriba la misma línea.

**E2 — BAJO · reveal duplicado en muros de G2.** `.scene--dedicatoria` y `.scene--historia` redefinen su propio `opacity/transform` + `.scene--in`, ya cubiertos por la regla base `.scene`/`.scene--in` de G1. Es inofensivo (valores coinciden) pero redundante. **Corrección (opcional):** eliminar los overrides y confiar en la base, o dejar nota de que es intencional.

## F. VERIFICACIONES — revisión (mayoría OK)

Las verificaciones son en general concretas (abrir preview y observar comportamiento específico; `node tools/verify-*.mjs` con asserts nombrados; simulador de reglas de Firebase). Excepciones a endurecer:
- **F1 (=D2):** la "verificación" del preload en Task 1/Task 20 es condicional y vaga ("si Lighthouse lo exige"). Convertir en assert/acción concreta o eliminar la regla.
- **F2 · Task 20 peso <300KB:** dice *"auditar el base64 inline"* — hacerlo medible: `wc -c invitacion.html` y un umbral explícito, más `grep -c "data:image" invitacion.html` para confirmar que solo portada+sello van inline. (El sello, además, se implementa como CSS, no base64 — ver nota G1 abajo, así que solo debería haber 1 data-URI.)

## G. NOTAS MENORES (no bloqueantes, para precisión)

- **G1 · "base64 para portada + sello":** la tabla FILE STRUCTURE y §10 dicen base64 para portada **y sello**, pero Task 3 implementa el sello como círculo CSS con texto "SJ" (más ligero, correcto). Ajustar la nota de la tabla para que diga "base64 solo para la foto de portada" y evitar confundir al ejecutor / a la auditoría de peso.
- **G2 · `computeRsvp`** devuelve un campo extra `todas` no listado en el esqueleto (usado por el CSV). Consistente internamente; solo actualizar la firma en las "Notas de contrato" del esqueleto.
- **G3 · `buildIcs(evt)`** usa `evt.dtstamp`, que el esqueleto no listaba en la forma de `evt`. Self-consistente en Task 15; añadir `dtstamp` a la forma documentada.
- **G4 · `<select id="rsvpPases">`** hardcodea `<option>1</option><option>2</option>` acoplado a `MAX_PASES=2`. Correcto para el default, pero añadir comentario de que si `MAX_PASES` cambia hay que regenerar las opciones (o generarlas por JS), para que no quede una inconsistencia silenciosa.

---

## Resumen accionable (orden de corrección sugerido)
1. **A1 + A2** (definir `cascadeReveal`, resolver `quietFade`) — sin esto la Portada no aparece.
2. **A3, A4** (unificar id de `<main>` y `boot`/`init`).
3. **B1, B2** (colapsar `.eyebrow` y `.rule` a una definición canónica + overrides de muro; B1 además es un fallo AA/canon).
4. **C1** (alinear sede de ceremonia en tarjeta/`.ics`/Google Cal).
5. **D1** (paso de creación de `og-invitacion.jpg`).
6. **D2/F1** (decidir preload: excepción documentada o implementación real).
7. **E1** (quitar `_redirects` de Task 17).
8. Menores D3, E2, F2, G1–G4.

Ningún placeholder prohibido (lógica sin escribir / "TODO" / "similar a Task N") en el cuerpo del plan salvo el hueco real de `cascadeReveal` (A1), que es el más grave. El resto del código de las tareas está completo y las firmas del contrato coinciden entre grupos con las salvedades anotadas.
