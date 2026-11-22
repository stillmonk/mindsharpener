import { blockingStateItem, getSettings, settingsItem, withDefaults } from '@/lib/storage';
import { makeT, resolveLang } from '@/lib/i18n';
import {
  FEED_SITES,
  feedOptionOn,
  feedPrefs,
  feedSiteForHost,
  redirectPathRegex,
  type FeedSite,
} from '@/lib/feeds';

// Quita el feed de las redes sociales del catálogo (lib/feeds.ts). YouTube
// tiene su propio script, más fino: youtube.content.ts.
//
// Cada opción se traduce en un atributo en <html> (data-ms-o-<opción>) y, si
// tiene reglas por ruta, otro que indica que estamos en esa ruta
// (data-ms-p-<opción>). Todo el ocultado es CSS, así que no hay que perseguir
// a la web cada vez que vuelve a pintar.

function buildCss(site: FeedSite): string {
  const rules: string[] = [];
  for (const o of site.options) {
    const on = `html[data-ms-o-${o.key}]`;
    if (o.hide?.length) {
      rules.push(`${o.hide.map((s) => `${on} ${s}`).join(',\n')} { display: none !important; }`);
    }
    if (o.page) {
      const here = `${on}[data-ms-p-${o.key}]`;
      rules.push(`${o.page.hide.map((s) => `${here} ${s}`).join(',\n')} { display: none !important; }`);
      if (o.page.msg) {
        const hosts = o.page.msg.split(',').map((s) => `${here} ${s.trim()}::after`);
        rules.push(`${hosts.join(',\n')} {
  content: var(--ms-feed-msg, "");
  display: block;
  padding: 120px 24px;
  text-align: center;
  font-size: 20px;
  line-height: 1.4;
  opacity: 0.6;
}`);
      }
    }
  }
  return rules.join('\n');
}

export default defineContentScript({
  matches: FEED_SITES.filter((s) => s.id !== 'youtube').flatMap((s) =>
    s.domains.map((d) => `*://*.${d}/*`),
  ),
  runAt: 'document_start',
  async main(ctx) {
    const site = feedSiteForHost(location.hostname);
    if (!site || site.id === 'youtube') return;

    const root = document.documentElement;
    const style = document.createElement('style');
    style.id = 'mindsharpener-feeds';
    style.textContent = buildCss(site);
    root.appendChild(style);

    let settings = await getSettings();
    let state = await blockingStateItem.getValue();

    const apply = () => {
      const prefs = feedPrefs(settings, site.id);
      const path = location.pathname;
      for (const o of site.options) {
        const on = feedOptionOn(prefs, o.key, state.active);
        root.toggleAttribute(`data-ms-o-${o.key}`, on);
        if (o.page) root.toggleAttribute(`data-ms-p-${o.key}`, new RegExp(o.page.path, 'i').test(path));
        // Son SPAs: al abrir un Reel no hay petición nueva que la regla de red
        // pueda interceptar, así que redirigimos desde aquí.
        if (on && o.redirect && redirectPathRegex(o).test(path)) {
          location.replace(`${browser.runtime.getURL('/blocked.html')}#${location.href}`);
          return;
        }
      }
      root.style.setProperty(
        '--ms-feed-msg',
        JSON.stringify(makeT(resolveLang(settings.language))('feedMessage')),
      );
    };

    apply();
    settingsItem.watch((v) => {
      settings = withDefaults(v);
      apply();
    });
    blockingStateItem.watch((v) => {
      state = v ?? { active: false, source: null };
      apply();
    });
    // Estas webs cambian de página sin recargar y no avisan: vigilamos la URL.
    let lastUrl = location.href;
    const check = () => {
      if (location.href === lastUrl) return;
      lastUrl = location.href;
      apply();
    };
    window.addEventListener('popstate', check);
    ctx.setInterval(check, 250);
  },
});
