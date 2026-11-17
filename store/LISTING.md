# Ficha de la Chrome Web Store

Todo lo necesario para publicar MindSharpener en la Chrome Web Store (también vale para Edge Add-ons). Copia cada bloque en su campo del [panel de desarrollador](https://chrome.google.com/webstore/devconsole).

**Publicada:** https://chromewebstore.google.com/detail/mindsharpener/abiinaokmjcbkhkgmfbmgienkljkkaml
(ID de la extensión: `abiinaokmjcbkhkgmfbmgienkljkkaml`)

## Publicar una versión nueva

1. Sube la versión en `package.json` (p. ej. `0.3.1`). El manifiesto la toma de ahí.
2. Genera el zip con `npm run zip` (o etiqueta `vX.Y.Z` y usa el de la release de GitHub).
3. En el [panel de desarrollador](https://chrome.google.com/webstore/devconsole), abre MindSharpener → **Paquete** → **Subir paquete nuevo** y elige el zip.
4. Si cambian permisos, funciones o la interfaz, actualiza aquí la descripción, la justificación de permisos y las capturas, y cópialas también en el panel.
5. **Enviar a revisión.** Los usuarios reciben la actualización solos cuando se aprueba.

## Primera publicación (ya hecha)

1. Crea la cuenta de desarrollador en el panel (pago único de 5 $) y verifica el correo de contacto.
2. **Nuevo elemento** → sube `mindsharpener-0.3.0-chrome.zip` (el de la release de GitHub o `npm run zip`).
3. Rellena las pestañas **Ficha de Play Store**, **Privacidad** y **Distribución** con lo de abajo.
4. **Enviar a revisión.** Con el permiso de acceso a todos los sitios la revisión puede tardar de unos días a un par de semanas.

## Ficha

| Campo | Valor |
|---|---|
| Nombre | MindSharpener (sale del manifiesto) |
| Resumen | Sale del manifiesto (`public/_locales/*/messages.json`) |
| Categoría | Productividad → Flujo de trabajo y planificación |
| Idioma | Inglés (por defecto) y español: añade el español en *Idiomas* para la ficha traducida |
| Icono de la tienda (128×128) | `store/icon-128.png` (el icono a 96×96 con 16 px de margen transparente, como pide Google) |
| Capturas (1280×800) | `store/screenshots/<idioma>/1…5-*.png`, en ese orden |
| Imagen promocional pequeña (440×280) | `store/screenshots/<idioma>/promo-small-440x280.png` |
| Sitio web | https://github.com/stillmonk/mindsharpener |
| Asistencia | https://github.com/stillmonk/mindsharpener/issues |

### Descripción (español)

```
Bloquea las webs que te roban la atención mientras trabajas o estudias. Gratis, de código abierto y 100% local: sin cuentas, sin servidores y sin registros.

CÓMO FUNCIONA
Pulsa Alt+Mayús+F, escribe en qué vas a trabajar y pulsa Enter. Hasta que acabe la sesión, las webs que te distraen se sustituyen por una página de foco con el tiempo que te queda y tu tarea.

FUNCIONES
• Sesiones de foco de 25, 50, 90 minutos o la duración que quieras.
• Perfiles por actividad: unas webs bloqueadas para estudiar, otras para trabajar.
• Lista negra (bloquea solo algunas webs) o lista blanca (bloquea todo menos lo que necesitas).
• Horarios: el bloqueo se activa solo, por ejemplo de lunes a viernes de 9:00 a 13:00.
• Pomodoro: descansos cortos y largos encadenados, con avisos.
• YouTube sin distracciones: bloquea los Shorts y oculta el inicio, las recomendaciones y los comentarios.
• Fricción para rendirte: elige qué cuesta terminar antes de tiempo (confirmar, esperar, escribir una frase incómoda o modo estricto).
• Pase temporal: si de verdad necesitas una web, pide 5 minutos. Tendrás que ganártelo, y al acabar se vuelve a bloquear sola.
• Progreso: tiempo de foco de hoy frente a tu objetivo diario, racha de días y gráfica de 7 o 30 días.
• Sin trampas fáciles: con el bloqueo activo puedes endurecer las reglas, pero no relajarlas.
• En español e inglés. Exporta e importa tu configuración en JSON.

PRIVACIDAD
Todo se queda en tu navegador. Las estadísticas son solo totales por día: nunca se guarda qué webs visitas. El código está en GitHub para que lo compruebes: https://github.com/stillmonk/mindsharpener
```

### Descripción (inglés)

```
Block the sites that steal your attention while you work or study. Free, open source and 100% local: no accounts, no servers, no tracking.

HOW IT WORKS
Press Alt+Shift+F, type what you are working on and press Enter. Until the session ends, distracting sites are replaced by a focus page showing your time left and your task.

FEATURES
• Focus sessions of 25, 50, 90 minutes or any length you like.
• Profiles per activity: block some sites while you study and others while you work.
• Blocklist (block only some sites) or allowlist (block everything except what you need).
• Schedules: blocking turns on by itself, e.g. Monday to Friday from 9:00 to 13:00.
• Pomodoro: chained short and long breaks, with notifications.
• Distraction-free YouTube: block Shorts and hide the home feed, recommendations and comments.
• Friction to quit: choose what it takes to end early (confirm, wait, type an uncomfortable phrase, or strict mode).
• Temporary pass: if you really need a site, ask for 5 minutes. You have to earn it, and it blocks itself again when time is up.
• Progress: today's focus time against your daily goal, day streak and a 7 or 30-day chart.
• No easy cheating: while blocking is on you can tighten the rules, but not loosen them.
• English and Spanish. Export and import your settings as JSON.

PRIVACY
Everything stays in your browser. Statistics are daily totals only: the sites you visit are never stored. The code is on GitHub so you can check it yourself: https://github.com/stillmonk/mindsharpener
```

## Privacidad (pestaña *Privacy practices*)

La tienda pide estas respuestas en inglés.

**Single purpose**

```
MindSharpener helps users stay focused by blocking distracting websites during focus sessions or scheduled times, and by hiding distracting parts of YouTube.
```

**Permission justifications**

| Permiso | Justificación |
|---|---|
| `declarativeNetRequest` | `Core feature: redirects the websites on the user's block lists to the extension's focus page during focus sessions and schedules. Rules are built only from the user's own lists.` |
| `storage` | `Stores the user's profiles, block/allow lists, schedules, settings, the current session and daily totals (focus minutes, sessions, blocked attempts) locally. Nothing is sent anywhere.` |
| `alarms` | `Ends focus sessions, breaks, temporary passes and schedules on time, even if the service worker was stopped.` |
| `notifications` | `Tells the user when a focus session or a break has finished.` |
| Host permission `<all_urls>` | `The user can block any website, so redirect rules must be able to apply to any URL. On youtube.com a content script hides Shorts, the home feed, recommendations and comments when the user enables those options. When a temporary pass expires, open tabs on that site are reloaded so the block applies again. No page content or browsing data is read, stored or transmitted.` |

**Remote code:** No, I am not using remote code.

**Data usage:** no marques ninguna categoría (la extensión no recoge datos). Marca las tres certificaciones:
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/stillmonk/mindsharpener/blob/main/PRIVACY.md

## Distribución

- Visibilidad: **Pública**.
- Regiones: todas.
- Precio: gratis.

## Regenerar las capturas

Las capturas se hicieron con la extensión real y datos de ejemplo (sin datos personales). Si cambia la interfaz, vuelve a generarlas antes de actualizar la ficha.

---

# Ficha de Firefox Add-ons (AMO)

Se publica en https://addons.mozilla.org/developers/ con una cuenta de Mozilla (gratis). Los textos son los mismos que los de Chrome.

## Paquetes

`npm run zip:firefox` (o la release de GitHub) genera dos archivos en `.output/`:

- `mindsharpener-<versión>-firefox.zip`: la extensión (Manifest V2, Firefox 140 o superior).
- `mindsharpener-<versión>-sources.zip`: el código fuente. AMO lo pide porque el paquete está generado con Vite.

ID de la extensión: `mindsharpener@stillmonk` (en `wxt.config.ts`). **No se puede cambiar después de publicar.**

## Probar antes de subir

1. `npm run build:firefox`
2. En Firefox, abre `about:debugging#/runtime/this-firefox` → **Cargar complemento temporal…** → elige `.output/firefox-mv2/manifest.json`.
3. Comprueba: sesión de foco y redirección a la página de foco, atajo `Alt+Mayús+F`, pase temporal, opciones de YouTube y horarios.

## Primera publicación

1. **Enviar un nuevo complemento** → **En este sitio** (listado en la tienda).
2. Sube `mindsharpener-<versión>-firefox.zip` y revisa los avisos del validador.
3. ¿El código está compilado, minificado o generado? **Sí** → sube `mindsharpener-<versión>-sources.zip`. Notas para los revisores:

```
Built with WXT (Vite). To reproduce:
  npm ci
  npm run zip:firefox
Requires Node.js 22.18 or newer. The unpacked build is in .output/firefox-mv2.
```

4. Ficha:

| Campo | Valor |
|---|---|
| Nombre / resumen | Salen del manifiesto |
| Descripción | La misma que la de Chrome (arriba), en inglés y en español |
| Categoría | Productividad |
| Etiquetas | productivity, focus, blocker |
| Licencia | MIT |
| Política de privacidad | El texto de `PRIVACY.md` |
| Página web | https://github.com/stillmonk/mindsharpener |
| Asistencia | https://github.com/stillmonk/mindsharpener/issues |
| Capturas | `store/screenshots/<idioma>/1…5-*.png` |

5. **Enviar versión.** Con el acceso a todos los sitios la revisión puede ser manual y tardar unos días.

## Versiones nuevas

**Gestionar versiones** → **Subir una nueva versión** → los dos zips de la nueva versión, igual que en la primera publicación.
