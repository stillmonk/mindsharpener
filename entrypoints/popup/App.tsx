import { useEffect, useState, type ReactNode } from 'react';
import {
  blockingStateItem,
  historyItem,
  profilesItem,
  sessionItem,
  updateSettings,
  type DayStats,
  type FocusSession,
  type Profile,
  type Settings,
} from '@/lib/storage';
import {
  focusToday,
  formatClock,
  formatMinutes,
  formatRemaining,
  normalizeSession,
  skipBreak,
  startFocus,
  stopSession,
} from '@/lib/session';
import { loadProfiles, profileBlocksSomething, resolveProfile } from '@/lib/profiles';
import { dayKey, streak } from '@/lib/policy';
import { useNow, useSettings, useStorageItem, useT } from '@/lib/hooks';
import type { ResolvedLang, T } from '@/lib/i18n';
import { FrictionGate, ghostBtn, primaryPill } from '@/components/FrictionGate';
import { Ring } from '@/components/Ring';

const DURATIONS = [25, 50, 90];
const EDGE = 'var(--color-edge)';
const CALM = 'var(--color-calm)';

/** Lo que se ve del día: minutos, objetivo, racha y sesiones. */
interface Day {
  minutes: number;
  goal: number;
  streakDays: number;
  sessions: number;
}

export default function App({ panel = false }: { panel?: boolean }) {
  const { t, lang } = useT();
  const rawSession = useStorageItem(sessionItem);
  const state = useStorageItem(blockingStateItem);
  const profiles = useStorageItem(profilesItem);
  const history = useStorageItem(historyItem);
  const settings = useSettings();
  const now = useNow();
  const [pickedId, setPickedId] = useState<string>();
  useEffect(() => {
    loadProfiles(); // crea el perfil «General» si vienes de la v0.2
  }, []);

  if (rawSession === undefined || !state || !profiles || !history || !settings) {
    return <div className={panel ? 'w-full min-h-screen glow-idle' : 'w-80 h-[560px] glow-idle'} />;
  }

  const session = rawSession ? normalizeSession(rawSession) : null;
  const shownProfile = resolveProfile(
    profiles,
    session ? session.profileId : (pickedId ?? settings.lastProfileId),
  );
  const day: Day = {
    minutes: focusToday(history, session, now),
    goal: settings.dailyGoalMinutes,
    streakDays: streak(history, settings.dailyGoalMinutes, now),
    sessions: todayStats(history, now).sessions,
  };
  // El nombre del perfil solo aporta si hay más de uno.
  const profileLine = [
    profiles.length > 1 && shownProfile ? t('profileNamed', { name: shownProfile.name }) : '',
    shownProfile ? profileSummary(shownProfile, t) : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const kind = session?.kind ?? 'idle';
  const glow = kind === 'focus' ? 'glow-focus' : kind === 'break' ? 'glow-break' : 'glow-idle';

  return (
    <div className={`${panel ? 'w-full min-h-screen' : 'w-80'} ${glow} transition-colors`}>
      <div className={`${panel ? 'max-w-md mx-auto' : ''} px-[22px] py-5 flex flex-col gap-5`}>
        <header className="flex items-center justify-between gap-3">
          {session ? (
            <StatusLabel kind={session.kind} t={t} cycle={session.cycle} />
          ) : (
            <Greeting now={now} lang={lang} t={t} />
          )}
          <div className="flex items-center gap-1">
            {!panel && <PinButton t={t} />}
            <IconButton label={t('settings')} onClick={() => browser.runtime.openOptionsPage()}>
              <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
              <circle cx="16" cy="7" r="2" />
              <circle cx="10" cy="17" r="2" />
            </IconButton>
          </div>
        </header>

        {state.source === 'schedule' && state.until && (
          <div className="rounded-2xl bg-edge/10 px-4 py-3 text-sm">
            <div className="text-edge font-medium">{t('scheduleActive')}</div>
            <div className="text-soft text-xs mt-0.5">
              {t('scheduleUntil', {
                name: state.scheduleName ?? '',
                time: formatClock(state.until, lang),
              })}
            </div>
          </div>
        )}

        {session?.kind === 'focus' ? (
          <FocusView
            session={session}
            now={now}
            settings={settings}
            day={day}
            profileLine={profileLine}
            lang={lang}
            t={t}
          />
        ) : session?.kind === 'break' ? (
          <BreakView session={session} now={now} t={t} />
        ) : (
          <>
            <DayOverview day={day} t={t} />
            <StartForm profiles={profiles} selected={shownProfile} onSelect={setPickedId} t={t} />
            <footer className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-muted">
              <span>{shownProfile ? profileSummary(shownProfile, t) : ''}</span>
              <ShortcutHint t={t} />
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

function todayStats(history: Record<string, DayStats>, now: number): DayStats {
  return history[dayKey(new Date(now))] ?? { focus: 0, sessions: 0, blocked: 0 };
}

function profileSummary(p: Profile, t: T): string {
  if (p.mode === 'allowlist') return t('footerAllow', { n: p.allowlist.length });
  return p.blocklist.length === 1 ? t('footerSitesOne') : t('footerSites', { n: p.blocklist.length });
}

function Greeting({ now, lang, t }: { now: number; lang: ResolvedLang; t: T }) {
  const date = new Date(now);
  const h = date.getHours();
  const greet = h >= 6 && h < 13 ? 'greetMorning' : h >= 13 && h < 21 ? 'greetAfternoon' : 'greetEvening';
  return (
    <div className="flex flex-col gap-0.5">
      <span className="eyebrow text-muted">
        {date.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'short' })}
      </span>
      <span className="text-[17px] font-medium">{t(greet)}</span>
    </div>
  );
}

function StatusLabel({ kind, cycle, t }: { kind: 'focus' | 'break'; cycle: number; t: T }) {
  const focus = kind === 'focus';
  return (
    <span
      className={`eyebrow flex items-center gap-2 tracking-[0.16em] ${focus ? 'text-edge' : 'text-calm'}`}
    >
      <span className={`size-1.5 rounded-full ${focus ? 'bg-edge' : 'bg-calm'}`} />
      {focus ? t('inFocus') : t('onBreak')}
      {cycle > 1 || !focus ? ` · ${t('sessionN', { n: cycle })}` : ''}
    </span>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="size-9 rounded-full bg-white/5 text-soft hover:text-paper hover:bg-white/10 flex items-center justify-center transition-colors"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}

/** El anillo del día: minutos de foco frente al objetivo, con una frase que lo explica. */
function DayOverview({ day, t }: { day: Day; t: T }) {
  const { minutes, goal, streakDays, sessions } = day;
  const insight =
    goal <= 0
      ? t('insightNoGoal')
      : minutes >= goal
        ? t('insightMet')
        : minutes < 1
          ? t('insightStart')
          : t('insightOnTrack', { left: formatMinutes(goal - minutes) });

  return (
    <section className="flex flex-col items-center gap-3.5">
      <div
        role={goal > 0 ? 'progressbar' : undefined}
        aria-valuemin={goal > 0 ? 0 : undefined}
        aria-valuemax={goal > 0 ? goal : undefined}
        aria-valuenow={goal > 0 ? Math.min(minutes, goal) : undefined}
        aria-label={t('dailyGoal')}
      >
        <Ring size={156} stroke={5} progress={goal > 0 ? minutes / goal : 0} color={EDGE}>
          <span className="text-[10px] tracking-[0.16em] uppercase text-muted">{t('focusTodayLabel')}</span>
          <span className="text-[34px] font-light tracking-tight tabular leading-tight">
            {formatMinutes(minutes)}
          </span>
          {goal > 0 && (
            <span className="text-xs text-muted">{t('ofGoal', { goal: formatMinutes(goal) })}</span>
          )}
        </Ring>
      </div>
      <p className="text-[13px] leading-relaxed text-center text-[#c3cad5] max-w-[250px]">{insight}</p>
      {(streakDays > 0 || sessions > 0) && (
        <div className="flex gap-2 text-[11px]">
          {streakDays > 0 && (
            <span className="rounded-full px-2.5 py-1 bg-edge/12 text-edge">
              {streakDays === 1 ? t('streakChipOne') : t('streakChip', { n: streakDays })}
            </span>
          )}
          {sessions > 0 && (
            <span className="rounded-full px-2.5 py-1 bg-white/6 text-soft">
              {sessions === 1 ? t('sessionsChipOne') : t('sessionsChip', { n: sessions })}
            </span>
          )}
        </div>
      )}
    </section>
  );
}

function StartForm({
  profiles,
  selected,
  onSelect,
  t,
}: {
  profiles: Profile[];
  selected: Profile | undefined;
  onSelect: (id: string) => void;
  t: T;
}) {
  const [minutes, setMinutes] = useState(25);
  const [customMode, setCustomMode] = useState(false);
  const [custom, setCustom] = useState('');
  const [task, setTask] = useState('');

  const effective = customMode ? Number(custom) : minutes;
  const valid = Number.isFinite(effective) && effective >= 1 && effective <= 600;
  const canStart = profileBlocksSomething(selected);

  const segment = (active: boolean) =>
    `h-9 rounded-full text-[13px] transition-colors ${
      active ? 'bg-white/12 text-paper font-medium' : 'text-soft hover:text-paper'
    }`;

  return (
    <form
      className="flex flex-col gap-3.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid || !canStart || !selected) return;
        updateSettings({ lastProfileId: selected.id });
        startFocus(effective, task, selected.id);
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="eyebrow text-muted">{t('nextSession')}</span>
        <input
          autoFocus
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder={t('whatWorkOn')}
          maxLength={80}
          className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-3.5 py-3 text-sm outline-none focus:border-edge/60 transition-colors"
        />
      </label>

      {profiles.length > 1 && (
        <div role="group" aria-label={t('profile')} className="flex flex-wrap gap-1.5">
          {profiles.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => onSelect(p.id)}
              aria-pressed={selected?.id === p.id}
              className={`h-8 px-3.5 rounded-full text-[13px] border transition-colors ${
                selected?.id === p.id
                  ? 'border-edge/50 bg-edge/10 text-edge'
                  : 'border-white/[0.08] text-soft hover:text-paper'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      <div
        role="group"
        aria-label={t('duration')}
        className="grid grid-cols-4 gap-1 p-1 rounded-full bg-white/[0.04]"
      >
        {DURATIONS.map((d) => (
          <button
            type="button"
            key={d}
            aria-pressed={!customMode && minutes === d}
            onClick={() => {
              setMinutes(d);
              setCustomMode(false);
            }}
            className={segment(!customMode && minutes === d)}
          >
            {d} m
          </button>
        ))}
        {customMode ? (
          <input
            autoFocus
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))}
            placeholder={t('minutesShort')}
            inputMode="numeric"
            aria-label={t('customMinutes')}
            className="h-9 w-full min-w-0 rounded-full bg-white/12 text-center text-[13px] text-paper outline-none"
          />
        ) : (
          <button type="button" onClick={() => setCustomMode(true)} className={segment(false)}>
            {t('otherDuration')}
          </button>
        )}
      </div>

      <button type="submit" disabled={!valid || !canStart} className={`${primaryPill} h-12 text-sm`}>
        {t('startFocus')}
      </button>
      {!canStart && <p className="text-xs text-muted -mt-1.5 text-center">{t('addSitesFirst')}</p>}
    </form>
  );
}

/** Cuenta atrás dentro del anillo; el arco avanza con el tiempo transcurrido. */
function Countdown({
  session,
  now,
  color,
  caption,
}: {
  session: FocusSession;
  now: number;
  color: string;
  caption: string;
}) {
  const remaining = session.endsAt - now;
  const total = session.endsAt - session.startedAt;
  const progress = total > 0 ? 1 - remaining / total : 1;
  return (
    <Ring size={224} progress={progress} color={color}>
      <span className="text-[56px] font-light tracking-tighter tabular leading-none" role="timer">
        {formatRemaining(remaining)}
      </span>
      <span className="text-xs text-muted mt-1.5">{caption}</span>
    </Ring>
  );
}

function FocusView({
  session,
  now,
  settings,
  day,
  profileLine,
  lang,
  t,
}: {
  session: FocusSession;
  now: number;
  settings: Settings;
  day: Day;
  profileLine: string;
  lang: ResolvedLang;
  t: T;
}) {
  const { minutes, goal, streakDays, sessions } = day;
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col items-center gap-4 pt-2">
        <Countdown
          session={session}
          now={now}
          color={EDGE}
          caption={t('endsAt', { time: formatClock(session.endsAt, lang) })}
        />
        <div className="flex flex-col items-center gap-1 text-center">
          {session.task && <span className="text-[15px] font-medium">{session.task}</span>}
          {profileLine && <span className="text-xs text-muted">{profileLine}</span>}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label={t('today')} value={formatMinutes(minutes)}>
          {goal > 0 && (
            <div className="h-[3px] rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full bg-edge" style={{ width: `${Math.min(1, minutes / goal) * 100}%` }} />
            </div>
          )}
        </StatCard>
        {streakDays > 0 ? (
          <StatCard
            label={t('statStreak')}
            value={streakDays === 1 ? t('streakDay') : t('streakDays', { n: streakDays })}
          >
            {goal > 0 && <span className="text-[11px] text-muted">{t('goalLine', { goal: formatMinutes(goal) })}</span>}
          </StatCard>
        ) : (
          <StatCard label={t('statSessions')} value={String(sessions)} />
        )}
      </div>

      <EndEarly settings={settings} t={t} />
    </div>
  );
}

function StatCard({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] px-3.5 py-3 flex flex-col gap-1 min-w-0">
      <span className="text-[10px] tracking-[0.14em] uppercase text-muted truncate">{label}</span>
      <span className="text-lg tabular">{value}</span>
      {children}
    </div>
  );
}

function BreakView({ session, now, t }: { session: FocusSession; now: number; t: T }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col items-center gap-4 pt-2">
        <Countdown
          session={session}
          now={now}
          color={CALM}
          caption={t('thenSession', { n: session.cycle + 1 })}
        />
        <div className="flex flex-col items-center gap-1.5 text-center max-w-[270px]">
          <span className="text-[15px] font-medium">{t('breakTitle')}</span>
          <span className="text-[13px] leading-relaxed text-soft">{t('breakDesc')}</span>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => skipBreak()} className={`${primaryPill} h-12 px-2 text-[13px] whitespace-nowrap`}>
          {t('skipBreak')}
        </button>
        <button onClick={() => stopSession()} className={`${ghostBtn} h-12`}>
          {t('stop')}
        </button>
      </div>
    </div>
  );
}

/** Botón de terminar antes de tiempo con la fricción elegida en Ajustes. */
function EndEarly({ settings, t }: { settings: Settings; t: T }) {
  const [open, setOpen] = useState(false);

  if (settings.friction === 'locked') {
    return <p className="text-xs text-muted text-center">{t('strictNoEnd')}</p>;
  }

  if (!open) {
    return (
      <button className={ghostBtn} onClick={() => setOpen(true)}>
        {t('endEarly')}
      </button>
    );
  }

  return (
    <FrictionGate
      settings={settings}
      purpose="end"
      confirmLabel={t('endSession')}
      confirmClass="rounded-full bg-red-500/80 text-paper h-11 px-3 text-sm font-medium hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      onConfirm={() => stopSession()}
      onCancel={() => setOpen(false)}
      t={t}
    />
  );
}

/**
 * Abre la extensión en el panel lateral para tener el temporizador siempre a la
 * vista. Los dos navegadores exigen que open() se llame dentro del clic, sin
 * esperar antes a otra promesa: por eso la ventana se averigua al montar.
 */
function PinButton({ t }: { t: T }) {
  const [windowId, setWindowId] = useState<number>();
  useEffect(() => {
    browser.windows.getCurrent().then((w) => setWindowId(w.id));
  }, []);

  const firefox = import.meta.env.FIREFOX;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sidebar = (browser as any).sidebarAction as { open(): Promise<void> } | undefined;
  const supported = firefox ? !!sidebar : typeof browser.sidePanel?.open === 'function';
  if (!supported) return null;

  const pin = () => {
    const opened = firefox
      ? sidebar!.open()
      : windowId !== undefined
        ? browser.sidePanel.open({ windowId })
        : Promise.reject();
    opened.then(() => window.close()).catch(() => {});
  };

  return (
    <IconButton label={t('pinPanel')} onClick={pin}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M15 4v16" />
    </IconButton>
  );
}

/** Muestra el atajo real (el usuario puede haberlo cambiado) o cómo configurarlo. */
function ShortcutHint({ t }: { t: T }) {
  const [keys, setKeys] = useState<string | null>(null);
  useEffect(() => {
    browser.commands
      .getAll()
      .then((cmds) => setKeys(cmds.find((c) => c.name === '_execute_action')?.shortcut ?? ''))
      .catch(() => setKeys(''));
  }, []);
  if (keys === null) return null;
  const open = () => browser.tabs.create({ url: 'chrome://extensions/shortcuts' });
  return (
    <button onClick={open} className="shrink-0 hover:text-paper transition-colors" title={t('setShortcut')}>
      {keys || t('setShortcut')}
    </button>
  );
}
