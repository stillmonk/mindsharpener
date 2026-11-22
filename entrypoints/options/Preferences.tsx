import { useState } from 'react';
import {
  FRICTIONS,
  updateSettings,
  type FeedSiteSettings,
  type Friction,
  type Lang,
  type Profile,
  type Settings,
} from '@/lib/storage';
import { FEED_SITES, feedPrefs, feedSite, patchFeedPrefs, type FeedSiteId } from '@/lib/feeds';
import type { Key, T } from '@/lib/i18n';
import { Group, Section, Select, Toggle } from './ui';

export function FeedPrefs({
  settings,
  profiles,
  locked,
  t,
}: {
  settings: Settings;
  profiles: Profile[];
  locked: boolean;
  t: T;
}) {
  const [siteId, setSiteId] = useState<FeedSiteId>('youtube');
  const site = feedSite(siteId);
  const prefs = feedPrefs(settings, siteId);
  const set = (patch: FeedSiteSettings) => updateSettings(patchFeedPrefs(settings, siteId, patch));
  const onCount = (id: FeedSiteId) => {
    const p = feedPrefs(settings, id);
    return feedSite(id).options.filter((o) => p[o.key]).length;
  };
  // ¿Algún perfil la bloquea entera durante el foco?
  const fullyBlocked = profiles.some((p) =>
    p.mode === 'blocklist'
      ? site.domains.some((d) => p.blocklist.includes(d))
      : !site.domains.some((d) => p.allowlist.includes(d)),
  );

  const tab = (active: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors flex items-center gap-2 ${
      active ? 'border-edge bg-edge/10 text-edge' : 'border-line bg-panel hover:border-muted'
    }`;

  return (
    <Section title={t('feedsTitle')} desc={t('feedsDesc')}>
      <div role="tablist" className="flex gap-2 overflow-x-auto pb-1 -mb-1">
        {FEED_SITES.map((s) => {
          const n = onCount(s.id);
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={s.id === siteId}
              onClick={() => setSiteId(s.id)}
              className={tab(s.id === siteId)}
            >
              {s.name}
              {n > 0 && (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-edge"
                  title={t('feedsOnN', { n })}
                />
              )}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="flex flex-col gap-3">
        {fullyBlocked && (
          <p className="text-sm text-muted">{t('feedsFullyBlocked', { name: site.name })}</p>
        )}
        <Group>
          {site.options.map((o) => (
            <Toggle
              key={o.key}
              label={t(o.label)}
              checked={prefs[o.key] === true}
              // Durante el bloqueo se pueden activar, pero no desactivar.
              disabled={locked && prefs[o.key] === true}
              onChange={(v) => set({ [o.key]: v })}
            />
          ))}
          <Toggle
            label={t('feedsAlways')}
            checked={prefs.always === true}
            onChange={(v) => set({ always: v })}
          />
        </Group>
      </div>
    </Section>
  );
}

export function PomodoroPrefs({ settings, t }: { settings: Settings; t: T }) {
  const p = settings.pomodoro;
  const set = (patch: Partial<Settings['pomodoro']>) =>
    updateSettings({ pomodoro: { ...p, ...patch } });
  const mins = (values: number[]) => values.map((v) => ({ value: v, label: `${v} min` }));

  return (
    <Section title={t('pomoTitle')}>
      <Group>
        <Toggle label={t('pomoEnable')} checked={p.enabled} onChange={(v) => set({ enabled: v })} />
        {p.enabled && (
          <>
            <Select
              label={t('pomoBreak')}
              value={p.breakMinutes}
              options={mins([3, 5, 10, 15])}
              onChange={(v) => set({ breakMinutes: v })}
            />
            <Select
              label={t('pomoLong')}
              value={p.longBreakMinutes}
              options={mins([10, 15, 20, 30])}
              onChange={(v) => set({ longBreakMinutes: v })}
            />
            <Select
              label={t('pomoEvery')}
              value={p.longBreakEvery}
              options={[2, 3, 4, 5, 6].map((n) => ({ value: n, label: t('pomoSessions', { n }) }))}
              onChange={(v) => set({ longBreakEvery: v })}
            />
            <Toggle
              label={t('pomoAutoFocus')}
              checked={p.autoStartFocus}
              onChange={(v) => set({ autoStartFocus: v })}
            />
          </>
        )}
      </Group>
    </Section>
  );
}

export function FrictionPrefs({
  settings,
  locked,
  t,
}: {
  settings: Settings;
  locked: boolean;
  t: T;
}) {
  const current = FRICTIONS.indexOf(settings.friction);

  return (
    <Section title={t('frictionTitle')} desc={t('frictionDesc')}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FRICTIONS.map((f: Friction, i) => {
          const selected = settings.friction === f;
          // Con el bloqueo activo solo se puede subir la exigencia.
          const disabled = locked && i < current;
          return (
            <button
              key={f}
              disabled={disabled}
              onClick={() => updateSettings({ friction: f })}
              className={`text-left rounded-xl border px-4 py-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                selected ? 'border-edge bg-edge/10' : 'border-line bg-panel hover:border-muted'
              }`}
            >
              <div className={`text-sm font-medium ${selected ? 'text-edge' : ''}`}>
                {t(`f_${f}` as Key)}
              </div>
              <div className="text-xs text-muted mt-0.5">{t(`f_${f}Desc` as Key)}</div>
            </button>
          );
        })}
      </div>
      {settings.friction === 'wait' && (
        <Group>
          <Select
            label={t('waitSeconds')}
            value={settings.waitSeconds}
            disabled={locked}
            options={[10, 30, 60, 120, 300].map((n) => ({ value: n, label: t('seconds', { n }) }))}
            onChange={(v) => updateSettings({ waitSeconds: v })}
          />
        </Group>
      )}
    </Section>
  );
}

export function LanguagePrefs({ settings, t }: { settings: Settings; t: T }) {
  return (
    <Section title={t('languageTitle')}>
      <Group>
        <Select<Lang>
          label={t('languageTitle')}
          value={settings.language}
          options={[
            { value: 'auto', label: t('langAuto') },
            { value: 'es', label: 'Español' },
            { value: 'en', label: 'English' },
          ]}
          onChange={(v) => updateSettings({ language: v })}
        />
      </Group>
    </Section>
  );
}

export function PassPrefs({
  settings,
  locked,
  t,
}: {
  settings: Settings;
  locked: boolean;
  t: T;
}) {
  const { pass } = settings;
  const set = (patch: Partial<Settings['pass']>) => updateSettings({ pass: { ...pass, ...patch } });
  // Con el bloqueo activo solo se puede ir a menos (menos pases, más cortos).
  const allowed = (values: number[], current: number) =>
    locked ? values.filter((v) => v <= current) : values;

  return (
    <Section title={t('passTitle')} desc={t('passDesc')}>
      {settings.friction === 'locked' ? (
        <p className="text-sm text-muted">{t('passStrictNote')}</p>
      ) : (
        <Group>
          <Select
            label={t('passPerDay')}
            value={pass.perDay}
            options={allowed([0, 1, 2, 3, 5], pass.perDay).map((n) => ({
              value: n,
              label: n === 0 ? t('passOff') : String(n),
            }))}
            onChange={(v) => set({ perDay: v })}
          />
          {pass.perDay > 0 && (
            <Select
              label={t('passMinutes')}
              value={pass.minutes}
              options={allowed([2, 5, 10, 15], pass.minutes).map((v) => ({
                value: v,
                label: `${v} min`,
              }))}
              onChange={(v) => set({ minutes: v })}
            />
          )}
        </Group>
      )}
    </Section>
  );
}
