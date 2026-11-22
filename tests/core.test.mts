import { buildRules, domainRegex } from '../lib/rules.ts';
import {
  DEFAULT_FEEDS,
  FEED_SITES,
  activeRedirects,
  feedSite,
  feedSiteForHost,
  redirectFor,
  redirectPathRegex,
  redirectUrlRegex,
} from '../lib/feeds.ts';
import { normalizeDomain } from '../lib/domains.ts';
import { ALLOW_CATEGORIES, BLOCK_CATEGORIES, missingDomains } from '../lib/categories.ts';
import { domainToBlock, menuItems, parseMenuId } from '../lib/menus.ts';
import { isScheduleActive, scheduleEnd } from '../lib/schedule.ts';
import {
  currentPasses,
  effectivePolicy,
  lastDays,
  minutesByDay,
  passDomainFor,
  pruneHistory,
  streak,
} from '../lib/policy.ts';

let fail = 0;
const check = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} -> ${JSON.stringify(got)}`);
};

// Dominios
check('url completa', normalizeDomain('https://www.YouTube.com/watch?v=abc'), 'youtube.com');
check('puerto', normalizeDomain('reddit.com:443'), 'reddit.com');
check('invalido', normalizeDomain('hola'), null);

// Regex de dominio
const re = new RegExp(domainRegex('youtube.com'), 'i');
for (const [url, want] of [
  ['https://www.youtube.com/watch?v=1', true],
  ['http://YOUTUBE.com:8080/', true],
  ['https://notyoutube.com/', false],
  ['https://youtube.com.evil.com/', false],
  ['https://google.com/?q=youtube.com', false],
] as const) check(`dominio ${url}`, re.test(url), want);

// Shorts
const sr = new RegExp(redirectUrlRegex(feedSite('youtube'), feedSite('youtube').options[0]!), 'i');
check('shorts', sr.test('https://www.youtube.com/shorts/abc'), true);
check('shorts sin barra', sr.test('https://youtube.com/shorts'), true);
check('video normal', sr.test('https://www.youtube.com/watch?v=shorts'), false);
check('canal "shortsfan"', sr.test('https://www.youtube.com/shortsfan'), false);

// Construcción de reglas
const bl = (blocklist: string[]) => ({ id: 'b', name: 'b', mode: 'blocklist' as const, blocklist, allowlist: [] });
const al = (allowlist: string[]) => ({ id: 'a', name: 'a', mode: 'allowlist' as const, blocklist: [], allowlist });
const SHORTS = [redirectUrlRegex(feedSite('youtube'), feedSite('youtube').options[0]!)];
const none = { passes: [], feedRedirects: [] };
check('inactivo = 0 reglas', buildRules({ ...none, policy: effectivePolicy([]) }, 'x').length, 0);
check('lista negra = 2 reglas', buildRules({ ...none, policy: effectivePolicy([bl(['a.com', 'b.com'])]) }, 'x').length, 2);
const allow = buildRules({ policy: effectivePolicy([al(['work.com'])]), passes: [], feedRedirects: SHORTS }, 'x');
check('lista blanca: prioridades', allow.map((r) => [r.action.type, r.priority]), [
  ['redirect', 1],
  ['allow', 2],
  ['redirect', 5],
]);
check('ids únicos', new Set(allow.map((r) => r.id)).size, allow.length);
check('solo shorts fuera del foco', buildRules({ policy: null, passes: [], feedRedirects: SHORTS }, 'x').length, 1);
const withPass = buildRules({ policy: effectivePolicy([bl(['a.com'])]), passes: ['a.com'], feedRedirects: SHORTS }, 'x');
check('pase gana al bloqueo, no a Shorts', withPass.map((r) => [r.action.type, r.priority]), [
  ['redirect', 3],
  ['allow', 4],
  ['redirect', 5],
]);
check('pase sin bloqueo = ignorado', buildRules({ policy: null, passes: ['a.com'], feedRedirects: [] }, 'x').length, 0);
check('redirección conserva la URL', (allow[0]!.action.redirect as any).regexSubstitution, 'x#\\0');

// Perfiles combinados: gana lo más estricto
check('dos listas negras se suman', effectivePolicy([bl(['a.com']), bl(['b.com', 'a.com'])]), {
  blockAll: false, allow: [], block: ['a.com', 'b.com'],
});
check('listas blancas se intersecan', effectivePolicy([al(['x.com', 'y.com']), al(['y.com', 'z.com'])]), {
  blockAll: true, allow: ['y.com'], block: [],
});
check('negra + blanca', effectivePolicy([al(['a.com', 'w.com']), bl(['a.com'])]), {
  blockAll: true, allow: ['a.com', 'w.com'], block: ['a.com'],
});
const pol = effectivePolicy([bl(['youtube.com'])])!;
check('pase al dominio bloqueado', passDomainFor('m.youtube.com', pol), 'youtube.com');
check('pase en lista blanca = host', passDomainFor('www.news.com', effectivePolicy([al([])])!), 'news.com');

// Pases del día
const t0 = new Date('2026-11-09T10:00').getTime();
check('pases: mismo día', currentPasses({ day: '2026-11-09', used: 1, active: [{ domain: 'a.com', until: t0 + 1 }] }, t0), {
  day: '2026-11-09', used: 1, active: [{ domain: 'a.com', until: t0 + 1 }],
});
check('pases: nuevo día reinicia', currentPasses({ day: '2026-11-08', used: 2, active: [{ domain: 'a.com', until: t0 - 1 }] }, t0), {
  day: '2026-11-09', used: 0, active: [],
});

// Historial
check('reparto por días (cruza medianoche)', minutesByDay(new Date('2026-11-09T23:40').getTime(), new Date('2026-11-10T00:30').getTime()), {
  '2026-11-09': 20, '2026-11-10': 30,
});
const h = { '2026-11-07': { focus: 130, sessions: 2, blocked: 0 }, '2026-11-08': { focus: 120, sessions: 1, blocked: 0 } };
check('racha viva aunque hoy aún no', streak(h, 120, t0), 2);
check('racha cuenta hoy si se cumple', streak({ ...h, '2026-11-09': { focus: 125, sessions: 1, blocked: 0 } }, 120, t0), 3);
check('racha rota', streak({ '2026-11-07': { focus: 200, sessions: 1, blocked: 0 } }, 120, t0), 0);
check('últimos 7 días', lastDays(h, 7, t0).map((d) => d.key), [
  '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09',
]);
check('poda', Object.keys(pruneHistory({ '2020-01-01': h['2026-11-07'], ...h }, t0)), ['2026-11-07', '2026-11-08']);

// Horarios (fechas locales). 2026-11-09 es lunes.
const work = { id: '1', name: 'w', days: [1, 2, 3, 4, 5], start: '09:00', end: '13:00', enabled: true };
const at = (d: string) => new Date(d);
check('lunes 10:00 activo', isScheduleActive(work, at('2026-11-09T10:00')), true);
check('lunes 13:00 inactivo', isScheduleActive(work, at('2026-11-09T13:00')), false);
check('lunes 08:59 inactivo', isScheduleActive(work, at('2026-11-09T08:59')), false);
check('domingo 10:00 inactivo', isScheduleActive(work, at('2026-11-08T10:00')), false);
check('desactivado', isScheduleActive({ ...work, enabled: false }, at('2026-11-09T10:00')), false);
check('fin hoy 13:00', new Date(scheduleEnd(work, at('2026-11-09T10:00'))).toString(), at('2026-11-09T13:00').toString());

const night = { ...work, days: [5], start: '22:00', end: '02:00' }; // viernes noche
check('viernes 23:00', isScheduleActive(night, at('2026-11-13T23:00')), true);
check('sábado 01:00 (sigue)', isScheduleActive(night, at('2026-11-14T01:00')), true);
check('sábado 03:00', isScheduleActive(night, at('2026-11-14T03:00')), false);
check('jueves 23:00', isScheduleActive(night, at('2026-11-12T23:00')), false);
check('fin noche = sábado 02:00', new Date(scheduleEnd(night, at('2026-11-13T23:00'))).toString(), at('2026-11-14T02:00').toString());

// Categorías
const allCats = [...BLOCK_CATEGORIES, ...ALLOW_CATEGORIES];
check('categorías: ids únicos', new Set(allCats.map((c) => c.id)).size, allCats.length);
for (const c of allCats) {
  check(`categoría ${c.id}: dominios limpios`, c.domains.filter((d) => normalizeDomain(d) !== d), []);
  check(`categoría ${c.id}: sin duplicados`, c.domains.length - new Set(c.domains).size, 0);
  check(`categoría ${c.id}: sin redundancias`, c.domains.filter((d) => c.domains.some((o) => o !== d && (d.endsWith(`.${o}`)))), []);
}
const blockSet = new Set(BLOCK_CATEGORIES.flatMap((c) => c.domains));
check('categorías: nada a la vez en bloquear y permitir', ALLOW_CATEGORIES.flatMap((c) => c.domains).filter((d) => blockSet.has(d)), []);
const office = ALLOW_CATEGORIES.find((c) => c.id === 'office')!;
check('categoría: google.com cubre docs.google.com', missingDomains(office, ['google.com']).includes('docs.google.com'), false);
check('categoría: completa', missingDomains(office, office.domains), []);

// Menú contextual
const tt = (key: string) => key;
const prof = (id: string, mode: 'blocklist' | 'allowlist') => ({ id, name: id.toUpperCase(), mode, blocklist: [], allowlist: [] });
check('menú: sin perfiles de lista negra', menuItems([prof('w', 'allowlist')], tt as never), []);
check('menú: un perfil, sin submenú', menuItems([prof('general', 'blocklist'), prof('w', 'allowlist')], tt as never).map((i) => i.id), ['page:general', 'link:general', 'action:general']);
const multi = menuItems([prof('a', 'blocklist'), prof('b', 'blocklist')], tt as never);
check('menú: varios perfiles, submenú', multi.filter((i) => i.kind === 'page').map((i) => `${i.parentId ?? '-'}>${i.id}:${i.title}`), ['->page:menuBlockPageIn', 'page>page:a:A', 'page>page:b:B']);
check('menú: id', parseMenuId('link:general'), { kind: 'link', profileId: 'general' });
check('menú: id raíz', parseMenuId('page'), null);
check('menú: id extraño', parseMenuId('otro:x'), null);
check('bloquear: url', domainToBlock('https://www.YouTube.com/watch?v=1'), 'youtube.com');
check('bloquear: subdominio', domainToBlock('https://docs.google.com/x'), 'docs.google.com');
check('bloquear: chrome://', domainToBlock('chrome://extensions'), null);
check('bloquear: file://', domainToBlock('file:///home/a.html'), null);
check('bloquear: localhost', domainToBlock('http://localhost:3000/'), null);
check('bloquear: sin url', domainToBlock(undefined), null);

// Feeds de redes sociales
const fakeSettings = (over: Record<string, unknown> = {}) =>
  ({
    youtube: { shorts: true, home: true, recommendations: true, comments: false, always: false },
    feeds: structuredClone(DEFAULT_FEEDS),
    ...over,
  }) as any;
check('host: www.instagram.com', feedSiteForHost('www.instagram.com')?.id, 'instagram');
check('host: old.reddit.com', feedSiteForHost('old.reddit.com')?.id, 'reddit');
check('host: twitter.com = x', feedSiteForHost('mobile.twitter.com')?.id, 'x');
check('host: notx.com', feedSiteForHost('notx.com'), undefined);
check('ids de opción únicos por red', FEED_SITES.every((s) => new Set(s.options.map((o) => o.key)).size === s.options.length), true);
check('cada red tiene ajustes por defecto', FEED_SITES.filter((s) => s.id !== 'youtube').every((s) => s.options.every((o) => typeof (DEFAULT_FEEDS as any)[s.id][o.key] === 'boolean')), true);
check('sin foco ni «siempre» = sin redirecciones', activeRedirects(fakeSettings(), false).length, 0);
check('en foco = Shorts, Reels, vídeo FB', activeRedirects(fakeSettings(), true).length, 3);
const ig = fakeSettings({ feeds: { ...DEFAULT_FEEDS, instagram: { ...DEFAULT_FEEDS.instagram, always: true } } });
check('reel suelto', redirectFor('https://www.instagram.com/reel/abc/', ig, false)?.site.id, 'instagram');
check('pestaña Reels', redirectFor('https://www.instagram.com/reels/', ig, false)?.option.key, 'reels');
check('perfil "reelsfan" no', redirectFor('https://www.instagram.com/reelsfan/', ig, false), null);
check('post normal no', redirectFor('https://www.instagram.com/p/abc/', ig, false), null);
check('shorts en foco', redirectFor('https://m.youtube.com/shorts/x', fakeSettings(), true)?.site.id, 'youtube');
check('shorts fuera del foco no', redirectFor('https://m.youtube.com/shorts/x', fakeSettings(), false), null);
check('fb watch', redirectFor('https://www.facebook.com/watch/?v=1', fakeSettings(), true)?.site.id, 'facebook');
const igReels = feedSite('instagram').options.find((o) => o.key === 'reels')!;
check('ruta /reels/ (SPA)', redirectPathRegex(igReels).test('/reels/'), true);
check('ruta /reelsfan (SPA)', redirectPathRegex(igReels).test('/reelsfan'), false);
const rdHome = new RegExp(feedSite('reddit').options[0]!.page!.path, 'i');
check('reddit portada', ['/', '/best/', '/r/popular/', '/r/all'].map((p) => rdHome.test(p)), [true, true, true, true]);
check('reddit subreddit no', ['/r/typescript/', '/r/allergies/', '/user/x'].map((p) => rdHome.test(p)), [false, false, false]);

if (fail) throw new Error(`${fail} pruebas fallidas`);
console.log('\nTodo OK');
