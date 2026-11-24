import { useEffect, useMemo, useState } from 'react';
import { blockingStateItem, historyItem, passesItem, sessionItem, type Settings } from '@/lib/storage';
import { formatMinutes, formatRemaining, normalizeSession, recordBlocked } from '@/lib/session';
import { currentPasses, dayKey, type PassResponse } from '@/lib/policy';
import { hostnameOf } from '@/lib/domains';
import { redirectFor } from '@/lib/feeds';
import { useNow, useSettings, useStorageItem, useT } from '@/lib/hooks';
import type { Key, T } from '@/lib/i18n';
import { FrictionGate, primaryPill } from '@/components/FrictionGate';
import { Ring } from '@/components/Ring';

const QUOTES: Key[] = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];
const isTopFrame = window.top === window;

export default function App() {
  const { t } = useT();
  const settings = useSettings();
  const state = useStorageItem(blockingStateItem);
  const rawSession = useStorageItem(sessionItem);
  const history = useStorageItem(historyItem);
  const now = useNow();

  // La regla de bloqueo añade la URL original tal cual tras el "#".
  const originalUrl = useMemo(() => location.hash.slice(1), []);
  const host = hostnameOf(originalUrl);
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]!, []);

  // Contamos el intento una sola vez y solo para páginas completas (no iframes).
  useEffect(() => {
    if (!isTopFrame) return;
    recordBlocked();
  }, []);

  if (!settings || !state || rawSession === undefined) return null;

  // Versión compacta si lo bloqueado es un iframe (p. ej. un vídeo incrustado).
  if (!isTopFrame) {
    return (
      <div className="h-screen flex items-center justify-center text-sm text-muted p-4 text-center glow-page">
        {t('embedded')}
      </div>
    );
  }

  const session = rawSession ? normalizeSession(rawSession) : null;
  // Shorts, Reels…: se bloquean aunque no haya sesión si así se eligió.
  const feed = redirectFor(originalUrl, settings, state.active);
  const shortsBlocked = feed !== null;
  const noun = feed?.option.redirect ? t(feed.option.redirect.noun) : '';
  const blocked = (state.active && (!state.until || state.until > now)) || shortsBlocked;

  const closeTab = async () => {
    const tab = await browser.tabs.getCurrent();
    if (tab?.id !== undefined) await browser.tabs.remove(tab.id);
  };

  const btn = `${primaryPill} h-12 px-7 inline-flex items-center`;

  if (!blocked) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 glow-page">
        <div className="max-w-md w-full flex flex-col items-center text-center gap-6">
          <Eyebrow color="calm">{t('bDone')}</Eyebrow>
          <h1 className="text-4xl font-light">{t('bGoodJob')}</h1>
          <p className="text-soft">{t('bDoneDesc')}</p>
          {originalUrl.startsWith('http') && (
            <a href={originalUrl} className={btn}>
              {t('goTo', { host: host ?? t('theSite') })}
            </a>
          )}
        </div>
      </main>
    );
  }

  const label = state.active
    ? state.source === 'schedule'
      ? t('bScheduled')
      : t('bInFocus')
    : t('bShorts', { name: noun });

  // Cuánto falta y qué fracción del bloqueo ha pasado (si sabemos cuándo empezó).
  const until = state.active ? state.until : undefined;
  const remaining = until ? until - now : 0;
  const total = session && until === session.endsAt ? session.endsAt - session.startedAt : 0;
  const progress = total > 0 ? 1 - remaining / total : 0;
  const avoided = history?.[dayKey(new Date(now))]?.blocked ?? 0;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 glow-page">
      <div className="max-w-xl w-full flex flex-col items-center text-center gap-7">
        <Eyebrow color="edge">{label}</Eyebrow>
        <h1 className="text-[40px] font-light leading-tight tracking-tight max-w-lg">
          {shortsBlocked ? (
            t('bShortsTitle', { name: noun })
          ) : host ? (
            <>
              <span className="text-muted">{host}</span> {t('canWait')}
            </>
          ) : (
            t('siteCanWait')
          )}
        </h1>
        {session?.kind === 'focus' && session.task && (
          <p className="text-soft">
            {t('rightNow')} <span className="text-paper">{session.task}</span>
          </p>
        )}
        {until && (
          <Ring size={168} progress={progress} color="var(--color-edge)">
            <span className="text-[40px] font-light tabular leading-none" role="timer">
              {formatRemaining(remaining)}
            </span>
            <span className="text-[11px] text-muted mt-1">{t('remainingLabel')}</span>
          </Ring>
        )}
        <p className="text-[13px] text-muted max-w-sm leading-relaxed">
          {until && avoided > 0
            ? `${avoided === 1 ? t('bAvoidedOne') : t('bAvoided', { n: avoided })} ${t('bWaitFor', {
                time: formatMinutes(Math.max(1, Math.ceil(remaining / 60000))),
              })}`
            : `“${t(quote)}”`}
        </p>
        <button onClick={closeTab} className={btn}>
          {t('backToWork')}
        </button>
        {state.active && !shortsBlocked && originalUrl.startsWith('http') && (
          <PassRequest settings={settings} url={originalUrl} now={now} t={t} />
        )}
      </div>
    </main>
  );
}

function Eyebrow({ color, children }: { color: 'edge' | 'calm'; children: React.ReactNode }) {
  return (
    <span
      className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] ${
        color === 'edge' ? 'text-edge' : 'text-calm'
      }`}
    >
      <span className={`size-1.5 rounded-full ${color === 'edge' ? 'bg-edge' : 'bg-calm'}`} />
      {children}
    </span>
  );
}

/** Pase de unos minutos para entrar en la web, con la misma fricción que terminar antes. */
function PassRequest({ settings, url, now, t }: { settings: Settings; url: string; now: number; t: T }) {
  const stored = useStorageItem(passesItem);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const { minutes, perDay } = settings.pass;

  if (!stored || perDay <= 0 || settings.friction === 'locked') return null;
  const left = Math.max(0, perDay - currentPasses(stored, now).used);

  if (left === 0) return <p className="text-xs text-muted">{t('noPassesLeft')}</p>;

  const request = async () => {
    try {
      const res: PassResponse = await browser.runtime.sendMessage({ type: 'grant-pass', url });
      if (res?.ok) location.href = url;
      else setError(res?.reason === 'none-left' ? t('noPassesLeft') : t('passFailed'));
    } catch {
      setError(t('passFailed'));
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-sm">
      {open ? (
        <FrictionGate
          settings={settings}
          purpose="continue"
          confirmLabel={t('enterPass', { n: minutes })}
          confirmClass={primaryPill}
          onConfirm={request}
          onCancel={() => setOpen(false)}
          t={t}
        />
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-muted underline underline-offset-4 decoration-white/20 hover:text-paper transition-colors"
        >
          {t('getPass', { n: minutes })}
        </button>
      )}
      <p className="text-xs text-muted">
        {left === 1 ? t('passesLeftOne') : t('passesLeft', { n: left })}
      </p>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
