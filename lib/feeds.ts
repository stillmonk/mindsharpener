import type { Key } from './i18n';
import type { FeedSiteSettings, Settings } from './storage';

// Catálogo de redes sociales a las que se les puede quitar el feed.
//
// Los selectores dependen del HTML de cada web, que cambia de vez en cuando:
// si algo deja de ocultarse, este es el archivo que hay que tocar (YouTube, que
// tiene una lógica propia más fina, vive en entrypoints/youtube.content.ts).
//
// Siempre que se puede ocultamos por *ruta* (p. ej. «el contenido de la
// portada») en vez de por clases internas: las rutas cambian mucho menos.

export type FeedSiteId = 'youtube' | 'instagram' | 'x' | 'reddit' | 'facebook' | 'linkedin';

export interface FeedOption {
  key: string;
  label: Key;
  /** Se ocultan en cualquier página mientras la opción esté activa. */
  hide?: string[];
  /**
   * En las rutas que casan con `path` (sobre location.pathname) se ocultan
   * `hide` y se muestra un aviso dentro de `msg`.
   */
  page?: { path: string; hide: string[]; msg?: string };
  /**
   * Rutas que llevan a la página de bloqueo (vídeos cortos). Se aplica con una
   * regla de red y, como son SPAs, también desde el content script.
   * Es el principio del pathname, sin "^" ni final (p. ej. "/shorts").
   * Sintaxis compatible con RE2 (declarativeNetRequest): nada de lookaheads.
   */
  redirect?: { path: string; noun: Key };
}

export interface FeedSite {
  id: FeedSiteId;
  name: string;
  domains: string[];
  options: FeedOption[];
}

const IG_LOGGED_IN = 'body:has(a[href^="/direct/"])';

export const FEED_SITES: FeedSite[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    domains: ['youtube.com'],
    // Solo etiquetas: los selectores están en youtube.content.ts.
    options: [
      { key: 'shorts', label: 'ytShorts', redirect: { path: '/shorts', noun: 'nounShorts' } },
      { key: 'home', label: 'ytHome' },
      { key: 'recommendations', label: 'ytRecs' },
      { key: 'comments', label: 'ytComments' },
    ],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    domains: ['instagram.com'],
    options: [
      {
        // Sin sesión, la portada es el formulario de acceso: solo actuamos si
        // hay enlace a los mensajes (= sesión iniciada).
        key: 'feed',
        label: 'igFeed',
        page: { path: '^/$', hide: [`${IG_LOGGED_IN} main > *`], msg: `${IG_LOGGED_IN} main` },
      },
      {
        key: 'reels',
        label: 'igReels',
        hide: ['a[href="/reels/"]'],
        redirect: { path: '/reels?', noun: 'nounReels' },
      },
      {
        // Solo la cuadrícula: /explore/search/ (el buscador en móvil) sigue funcionando.
        key: 'explore',
        label: 'igExplore',
        page: { path: '^/explore/?$', hide: ['main > *'], msg: 'main' },
      },
    ],
  },
  {
    id: 'x',
    name: 'X',
    domains: ['x.com', 'twitter.com'],
    options: [
      {
        // El cuadro para publicar queda arriba; desaparece la cronología.
        key: 'home',
        label: 'xHome',
        page: {
          path: '^/home/?$',
          hide: ['[data-testid="primaryColumn"] section[role="region"]'],
          msg: '[data-testid="primaryColumn"]',
        },
      },
      {
        key: 'trends',
        label: 'xTrends',
        hide: ['[data-testid="sidebarColumn"] section', '[data-testid="sidebarColumn"] aside'],
        page: {
          path: '^/explore(/|$)',
          hide: ['[data-testid="primaryColumn"] section[role="region"]'],
          msg: '[data-testid="primaryColumn"]',
        },
      },
    ],
  },
  {
    id: 'reddit',
    name: 'Reddit',
    domains: ['reddit.com'],
    options: [
      {
        // Portada, Popular y All. Los subreddits concretos siguen visibles.
        // #siteTable y .content[role=main] son de old.reddit.com.
        key: 'home',
        label: 'rdHome',
        hide: ['a[href="/r/popular/"]', 'a[href="/r/all/"]'],
        page: {
          path: '^/((best|hot|new|top|rising|home)/?)?$|^/r/(popular|all)(/|$)',
          hide: ['main > *', '#siteTable'],
          msg: 'main, .content[role="main"]',
        },
      },
      {
        key: 'sidebar',
        label: 'rdSidebar',
        hide: ['#right-sidebar-container', '[slot="right-sidebar"]', 'pdp-right-rail', '.side'],
      },
      {
        key: 'comments',
        label: 'rdComments',
        hide: ['shreddit-comment-tree', '#comment-tree', 'comment-composer-host', '.commentarea'],
      },
    ],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    domains: ['facebook.com'],
    options: [
      {
        key: 'feed',
        label: 'fbFeed',
        page: { path: '^/(home\\.php)?$', hide: ['[role="main"] > *'], msg: '[role="main"]' },
      },
      {
        key: 'video',
        label: 'fbVideo',
        hide: ['a[href="/watch/"]', 'a[href$="facebook.com/watch/"]'],
        redirect: { path: '/(reels?|watch)', noun: 'nounFbVideo' },
      },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    domains: ['linkedin.com'],
    options: [
      {
        key: 'feed',
        label: 'liFeed',
        page: {
          path: '^/feed/?$',
          hide: ['main > *', '.scaffold-layout__aside'],
          msg: 'main',
        },
      },
    ],
  },
];

export const DEFAULT_FEEDS: Record<Exclude<FeedSiteId, 'youtube'>, FeedSiteSettings> = {
  instagram: { feed: true, reels: true, explore: true, always: false },
  x: { home: true, trends: true, always: false },
  reddit: { home: true, sidebar: true, comments: false, always: false },
  facebook: { feed: true, video: true, always: false },
  linkedin: { feed: true, always: false },
};

export function feedSite(id: FeedSiteId): FeedSite {
  return FEED_SITES.find((s) => s.id === id)!;
}

/** La red a la que pertenece un hostname (www.instagram.com → instagram). */
export function feedSiteForHost(host: string): FeedSite | undefined {
  const h = host.toLowerCase();
  return FEED_SITES.find((s) => s.domains.some((d) => h === d || h.endsWith(`.${d}`)));
}

/** Ajustes de una red (YouTube guarda los suyos aparte desde la v0.2). */
export function feedPrefs(settings: Settings, id: FeedSiteId): FeedSiteSettings {
  return id === 'youtube'
    ? (settings.youtube as unknown as FeedSiteSettings)
    : settings.feeds[id];
}

/** Parche de ajustes para cambiar las opciones de una red. */
export function patchFeedPrefs(
  settings: Settings,
  id: FeedSiteId,
  patch: FeedSiteSettings,
): Partial<Settings> {
  if (id === 'youtube') return { youtube: { ...settings.youtube, ...patch } };
  return { feeds: { ...settings.feeds, [id]: { ...settings.feeds[id], ...patch } } };
}

/** ¿Está activa esta opción ahora? (durante el bloqueo, o siempre si así se eligió). */
export function feedOptionOn(prefs: FeedSiteSettings, key: string, blocking: boolean): boolean {
  return (blocking || prefs.always === true) && prefs[key] === true;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Regex de URL completa para la regla de red (RE2) y la página de bloqueo. */
export function redirectUrlRegex(site: FeedSite, option: FeedOption): string {
  const hosts = site.domains.map(escapeRegex).join('|');
  return `^https?://([^/?#]*\\.)?(${hosts})(:[0-9]+)?${option.redirect!.path}([/?#].*)?$`;
}

/** Regex para location.pathname dentro de la propia web. */
export function redirectPathRegex(option: FeedOption): RegExp {
  return new RegExp(`^${option.redirect!.path}(/|$)`, 'i');
}

/** Regexes de las rutas que hay que mandar a la página de bloqueo ahora mismo. */
export function activeRedirects(settings: Settings, blocking: boolean): string[] {
  const out: string[] = [];
  for (const site of FEED_SITES) {
    const prefs = feedPrefs(settings, site.id);
    for (const o of site.options) {
      if (o.redirect && feedOptionOn(prefs, o.key, blocking)) out.push(redirectUrlRegex(site, o));
    }
  }
  return out;
}

/** Si la URL es una ruta bloqueada (Shorts, Reels…), qué opción la bloquea. */
export function redirectFor(
  url: string,
  settings: Settings,
  blocking: boolean,
): { site: FeedSite; option: FeedOption } | null {
  for (const site of FEED_SITES) {
    const prefs = feedPrefs(settings, site.id);
    for (const option of site.options) {
      if (!option.redirect || !feedOptionOn(prefs, option.key, blocking)) continue;
      if (new RegExp(redirectUrlRegex(site, option), 'i').test(url)) return { site, option };
    }
  }
  return null;
}
