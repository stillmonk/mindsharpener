# Política de privacidad de MindSharpener

*Última actualización: 22 de noviembre de 2026* · [English below](#privacy-policy-english)

**MindSharpener no recopila, envía ni vende ningún dato.** No hay servidores, cuentas, analítica, telemetría ni cookies de terceros.

## Qué se guarda y dónde

Todo se guarda únicamente en el almacenamiento local de tu navegador (`chrome.storage.local`) y nunca sale de él:

- Tus perfiles (listas de webs bloqueadas o permitidas), horarios y ajustes.
- La sesión de foco en curso y los pases temporales del día.
- Estadísticas: totales por día (minutos de foco, sesiones completadas y número de intentos de entrar en una web bloqueada). **No se guarda qué webs visitas ni cuáles intentaste abrir.**

Puedes exportar estos datos a un archivo JSON y borrarlos desinstalando la extensión.

## Permisos y para qué se usan

- **declarativeNetRequest**: el bloqueo. El navegador compara cada URL con tus listas y redirige las bloqueadas a la página de foco, sin que la extensión vea las URLs.
- **Acceso a todos los sitios (`<all_urls>`)**:
  - para poder redirigir cualquier web de tus listas a la página de foco;
  - en youtube.com, un script oculta Shorts, la página de inicio, las recomendaciones o los comentarios (según tus ajustes). Para encontrar los Shorts mira los enlaces de la página, en tu navegador; no guarda ni envía nada;
  - en instagram.com, x.com, reddit.com, facebook.com y linkedin.com, un script oculta el feed, los Reels, Explorar o las tendencias (según tus ajustes). Solo mira la dirección de la página para saber qué ocultar; no lee publicaciones ni mensajes, y no guarda ni envía nada;
  - cuando caduca un pase temporal, la extensión revisa las direcciones de las pestañas abiertas para recargar solo las de esa web, de modo que vuelva a aparecer la página de foco. Esta comprobación se hace en el momento y no se guarda.
- **storage**: guardar lo descrito arriba.
- **alarms**: saber cuándo termina una sesión, un descanso, un horario o un pase.
- **notifications**: avisarte cuando termina una sesión o un descanso, o confirmar que has bloqueado una web desde el menú contextual.
- **contextMenus**: añadir «Bloquear esta web» al clic derecho. Solo se usa la dirección de la página o del enlace en el que pulsas, y solo para añadir su dominio a tu lista; no da acceso a tu navegación.
- **sidePanel** (Chrome): mostrar MindSharpener en el panel lateral del navegador. No da acceso a ninguna web.

El código es abierto: puedes comprobar todo lo anterior en https://github.com/stillmonk/mindsharpener.

---

## Privacy policy (English)

*Last updated: November 22, 2026*

**MindSharpener does not collect, send or sell any data.** There are no servers, accounts, analytics, telemetry or third-party cookies.

### What is stored and where

Everything is stored only in your browser's local storage (`chrome.storage.local`) and never leaves it:

- Your profiles (lists of blocked or allowed sites), schedules and settings.
- The current focus session and the day's temporary passes.
- Statistics: daily totals (focus minutes, completed sessions and number of attempts to open a blocked site). **Which sites you visit or tried to open is never stored.**

You can export this data to a JSON file, and delete it by uninstalling the extension.

### Permissions and what they are used for

- **declarativeNetRequest**: blocking. The browser matches each URL against your lists and redirects blocked ones to the focus page, without the extension seeing the URLs.
- **Access to all sites (`<all_urls>`)**:
  - to redirect any site on your lists to the focus page;
  - on youtube.com, a script hides Shorts, the home feed, recommendations or comments (depending on your settings). To find Shorts it looks at the links on the page, inside your browser; it stores and sends nothing;
  - on instagram.com, x.com, reddit.com, facebook.com and linkedin.com, a script hides the feed, Reels, Explore or trends (depending on your settings). It only looks at the page address to know what to hide; it does not read posts or messages, and stores and sends nothing;
  - when a temporary pass expires, the extension checks the addresses of open tabs to reload only those on that site, so the focus page shows up again. This check happens on the spot and is not stored.
- **storage**: to save what is described above.
- **alarms**: to know when a session, break, schedule or pass ends.
- **notifications**: to tell you when a session or break ends, or to confirm that you blocked a site from the context menu.
- **contextMenus**: to add “Block this site” to the right-click menu. Only the address of the page or link you click is used, and only to add its domain to your list; it gives no access to your browsing.
- **sidePanel** (Chrome): to show MindSharpener in the browser's side panel. It gives no access to any website.

The code is open source: you can verify all of the above at https://github.com/stillmonk/mindsharpener.
