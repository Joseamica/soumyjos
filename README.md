# SoumyJos – Save the Date

Invitación digital para la boda de **Soumi & Jos** — 20 de Marzo 2027, Ciudad de México.

Sitio estático listo para deploy a **Cloudflare Pages** con dominio custom **soumyjos.com**.

---

## Estructura

```
SoumyJos/
├── index.html                      # Invitación interactiva (HTML principal)
├── Soumi-Jos-SaveTheDate.ics       # Archivo de calendario con 4 recordatorios
├── preview.png                     # Imagen 2040x3588 para OpenGraph / WhatsApp preview
├── _headers                        # Config de headers (MIME, cache, seguridad)
├── _redirects                      # Redirects (www → apex, shortcuts /calendar)
├── robots.txt
├── sitemap.xml
└── README.md
```

---

## Deploy rápido a Cloudflare Pages

### Paso 1 — Crear el proyecto

1. Entra a [`dash.cloudflare.com`](https://dash.cloudflare.com) y crea cuenta si no tienes.
2. En el panel izquierdo busca **"Workers & Pages"** → click **"Create"**.
3. Selecciona pestaña **"Pages"** → **"Upload assets"** (evita conectar GitHub).
4. Nombre del proyecto: `soumyjos` (este será el subdominio temporal `soumyjos.pages.dev`).
5. Arrastra toda la carpeta `SoumyJos/` a la caja de upload (o zipéala primero y sube el zip).
6. Click **"Deploy site"**. En ~30 segundos estará vivo en `soumyjos.pages.dev`.

### Paso 2 — Conectar tu dominio soumyjos.com

Tienes dos opciones dependiendo de dónde tienes el DNS del dominio:

**Opción A — Mover el dominio a Cloudflare (recomendado, más simple a largo plazo):**

1. En el dashboard de Cloudflare, arriba a la izquierda: **"Add a site"** → escribe `soumyjos.com`.
2. Cloudflare te dará 2 nameservers (ej: `anna.ns.cloudflare.com`, `bob.ns.cloudflare.com`).
3. Entra al registrador donde compraste el dominio y cambia los nameservers por los que te dio Cloudflare.
4. Espera que Cloudflare detecte el cambio (5 minutos a 24 horas).
5. Una vez activo, ve al proyecto Pages → **"Custom domains"** → **"Set up a custom domain"** → escribe `soumyjos.com` y `www.soumyjos.com`. Cloudflare configura DNS y SSL automáticamente.

**Opción B — Mantener DNS en tu registrador:**

1. En tu registrador (GoDaddy, Namecheap, etc.), agrega estos records:
   - `CNAME` · nombre `@` (o vacío) → valor `soumyjos.pages.dev`
   - `CNAME` · nombre `www` → valor `soumyjos.pages.dev`
   - *(Si tu registrador no acepta CNAME en apex, usa ALIAS o ANAME — GoDaddy sí, Namecheap sí)*
2. En el proyecto Pages → **"Custom domains"** → agrega `soumyjos.com` y `www.soumyjos.com`.
3. Cloudflare verificará el DNS y emitirá el certificado SSL (gratis) en unos minutos.

### Paso 3 — Verificar

Abre `https://soumyjos.com` en tu celular. Debería:

- Cargar con candado de HTTPS
- Verse el diseño exacto del Save the Date
- Al tocar **"Guardar en Calendario"** descargar el `.ics` y abrir la app de Calendario con los 4 recordatorios preconfigurados
- Mostrar preview bonita al pegar el link en WhatsApp (gracias a los meta tags OG)

---

## Deploy alternativo — Netlify Drop

Si prefieres Netlify:

1. Entra a [`app.netlify.com/drop`](https://app.netlify.com/drop) — **no necesita cuenta**.
2. Arrastra la carpeta `SoumyJos/` a la caja.
3. Te da URL temporal tipo `random-name-123.netlify.app`.
4. Para conectar `soumyjos.com`: crea cuenta gratis, ve a **Domain settings** → **Add custom domain** → sigue las instrucciones DNS.

Los archivos `_headers` y `_redirects` funcionan igual en Netlify que en Cloudflare.

---

## Enviar por WhatsApp

Una vez desplegado, **mandas solo el link**: `https://soumyjos.com`

WhatsApp mostrará automáticamente una preview con la imagen `preview.png` y el título "Save the Date · Soumi & Jos". El invitado toca la preview, se abre la invitación, y con un tap en **"Guardar en Calendario"** tiene los 4 recordatorios (1 mes, 10 días, 5 días y 1 día antes) listos en su calendario.

**Shortcuts útiles:**
- `https://soumyjos.com/calendar` → descarga directa del `.ics`
- `https://soumyjos.com/calendario` → descarga directa del `.ics` (alias en español)

---

## Detalles técnicos

- **Evento en el `.ics`:** 20 de Marzo 2027, todo el día, zona horaria local del invitado.
- **Recordatorios (VALARM):** `-P30D`, `-P10D`, `-P5D`, `-P1D`.
- **Banner WhatsApp:** se auto-activa si detecta el UA del navegador interno de WhatsApp / Instagram / Facebook, con instrucciones específicas para iOS vs Android.
- **Fallback Google Calendar:** link directo a `calendar.google.com` si el invitado prefiere esa app (sin recordatorios personalizados, se usan los default del usuario).
- **OG tags:** preview grande con `preview.png` al compartir por WhatsApp, iMessage, Twitter, Facebook, etc.
- **SSL:** automático vía Cloudflare/Netlify (Let's Encrypt).

---

## Actualizar contenido

Para editar algo (fecha, texto, fotos):

1. Edita `index.html` localmente.
2. Si cambiaste el evento, regenera `Soumi-Jos-SaveTheDate.ics` con la nueva fecha.
3. Para re-deploy: en Cloudflare Pages → proyecto `soumyjos` → **"Create new deployment"** → arrastra la carpeta actualizada.

---

Hecho con ❤️ para Soumi & Jos.
