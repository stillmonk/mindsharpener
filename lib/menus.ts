import type { Profile } from './storage';
import type { T } from './i18n';
import { normalizeDomain } from './domains.ts';

// Menú contextual «Bloquear esta web». Lógica pura (sin APIs del navegador)
// para poder probarla con `npm test`.

/** Dónde aparece: en la página, sobre un enlace o en el icono de la extensión. */
export type MenuKind = 'page' | 'link' | 'action';

export interface MenuItem {
  id: string;
  parentId?: string;
  title: string;
  kind: MenuKind;
}

const KINDS: MenuKind[] = ['page', 'link', 'action'];
const TITLE = { page: 'menuBlockPage', link: 'menuBlockLink', action: 'menuBlockPage' } as const;
const TITLE_IN = { page: 'menuBlockPageIn', link: 'menuBlockLinkIn', action: 'menuBlockPageIn' } as const;

/**
 * Solo los perfiles de lista negra: en lista blanca, «bloquear» no tiene
 * sentido y «permitir» relajaría el bloqueo.
 */
export const menuProfiles = (profiles: Profile[]) => profiles.filter((p) => p.mode === 'blocklist');

/**
 * Con un perfil, un elemento directo por sitio; con varios, un submenú con un
 * elemento por perfil. El id de cada elemento que se puede pulsar es
 * `<kind>:<profileId>`.
 */
export function menuItems(profiles: Profile[], t: T): MenuItem[] {
  const targets = menuProfiles(profiles);
  const items: MenuItem[] = [];
  if (targets.length === 0) return items;
  for (const kind of KINDS) {
    const [only] = targets;
    if (targets.length === 1 && only) {
      items.push({ id: `${kind}:${only.id}`, title: t(TITLE[kind]), kind });
      continue;
    }
    items.push({ id: kind, title: t(TITLE_IN[kind]), kind });
    for (const p of targets) items.push({ id: `${kind}:${p.id}`, parentId: kind, title: p.name, kind });
  }
  return items;
}

export function parseMenuId(id: string | number): { kind: MenuKind; profileId: string } | null {
  const [kind, ...rest] = String(id).split(':');
  const profileId = rest.join(':');
  if (!KINDS.includes(kind as MenuKind) || !profileId) return null;
  return { kind: kind as MenuKind, profileId };
}

/** Dominio que se bloquea al pulsar en esa URL; null si no es una web (chrome://, file://…). */
export function domainToBlock(url: string | undefined): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  return normalizeDomain(parsed.hostname);
}
