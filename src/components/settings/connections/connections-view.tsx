'use client';

import {
  clearConnection,
  getConnections,
  saveConnections,
  testConnection,
} from '@/actions/settings-actions';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CircleDollarSign,
  ExternalLink,
  KeyRound,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

type ProviderId = 'dataforseo' | 'seranking';

type FieldId =
  | 'dataforseoLogin'
  | 'dataforseoPassword'
  | 'serankingApiKey';

type ProviderLink = {
  label: string;
  url: string;
  icon: 'keys' | 'docs' | 'pricing';
};

type ProviderDef = {
  id: ProviderId;
  title: string;
  /** One line: what this key unlocks. */
  powers: string;
  /** The accent the console's charts use for this provider's data. */
  accent: string;
  fields: { id: FieldId; label: string; placeholder: string }[];
  links: ProviderLink[];
  /** Set to hold the provider behind "Coming soon". Fields stay read-only. */
  locked?: string;
};

/**
 * Connections.
 *
 * Only the providers the research console actually calls. Values are stored
 * AES-256-GCM encrypted and are never sent back to the browser: a saved field
 * renders as a mask, and typing over it replaces it. An empty field falls
 * back to the matching environment variable, so a .env-only setup works
 * with no UI step.
 *
 * Drawn with the console's own palette (see results/charts/palette.ts) rather
 * than the shadcn defaults, so Settings reads as the same product as the
 * dashboards: the same surfaces, the same amber accent, the same green and
 * red for good and bad.
 */
const PROVIDERS: ProviderDef[] = [
  {
    id: 'dataforseo',
    title: 'DataForSEO',
    powers: 'Keyword research, SERP analysis, volume, CPC, intent, trends, and AI search visibility.',
    accent: '#F2A65A',
    fields: [
      { id: 'dataforseoLogin', label: 'Login', placeholder: 'you@example.com' },
      { id: 'dataforseoPassword', label: 'Password', placeholder: 'API password' },
    ],
    links: [
      { label: 'API access', url: 'https://app.dataforseo.com/api-access', icon: 'keys' },
      { label: 'Docs', url: 'https://docs.dataforseo.com/v3/', icon: 'docs' },
      { label: 'Pricing', url: 'https://dataforseo.com/pricing', icon: 'pricing' },
    ],
  },
  {
    id: 'seranking',
    title: 'SE Ranking',
    powers: 'Keyword research, ranking data, search volume, and competitor analysis.',
    accent: '#3D72ED',
    fields: [
      { id: 'serankingApiKey', label: 'API Key', placeholder: 'API token from SE Ranking' },
    ],
    links: [
      { label: 'API access', url: 'https://online.seranking.com/', icon: 'keys' },
      { label: 'Docs', url: 'https://seranking.com/api.html', icon: 'docs' },
      { label: 'Pricing', url: 'https://seranking.com/pricing.html', icon: 'pricing' },
    ],
  },
];

const PROVIDER_FIELDS: Record<ProviderId, FieldId[]> = {
  dataforseo: ['dataforseoLogin', 'dataforseoPassword'],
  seranking: ['serankingApiKey'],
};

const LINK_ICONS = {
  keys: KeyRound,
  docs: BookOpen,
  pricing: CircleDollarSign,
} as const;

const COMMUNITIES = [
  {
    title: 'AI Marketing Hub',
    tier: 'Free community',
    url: 'https://www.skool.com/ai-marketing-hub',
    colors: ['#F1B43C', '#3D8FD1', '#D64A43'],
  },
  {
    title: 'AI Marketing Hub Pro',
    tier: 'Pro community',
    url: 'https://www.skool.com/ai-marketing-hub-pro',
    colors: ['#D64A43', '#E2A33A', '#4D9B65'],
  },
] as const;

type TestOutcome = { ok: boolean; text: string };

export function ConnectionsView() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [configured, setConfigured] = useState<Record<string, boolean>>({});
  const [fromEnv, setFromEnv] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingProvider, setSavingProvider] = useState<ProviderId | null>(null);
  const [testingProvider, setTestingProvider] = useState<ProviderId | null>(null);
  const [outcomes, setOutcomes] = useState<Partial<Record<ProviderId, TestOutcome>>>({});

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getConnections();
      const data = result?.data;
      if (data?.success) {
        setConfigured(data.configured as Record<string, boolean>);
        setFromEnv(data.env as unknown as Record<string, boolean>);
      }
    } catch {
      toast.error('Could not load connections.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (provider: ProviderDef) => {
    setSavingProvider(provider.id);
    try {
      const payload = Object.fromEntries(
        provider.fields
          .map((field) => [field.id, values[field.id]?.trim()])
          .filter(([, value]) => Boolean(value)),
      );
      if (Object.keys(payload).length === 0) {
        toast.error('Nothing to save.');
        return;
      }
      const result = await saveConnections(payload);
      if (!result?.data?.success) {
        toast.error('Could not save.');
        return;
      }
      setValues((current) => {
        const next = { ...current };
        for (const field of provider.fields) delete next[field.id];
        return next;
      });
      await load();
      toast.success(`${provider.title} saved`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save.');
    } finally {
      setSavingProvider(null);
    }
  };

  const handleTest = async (provider: ProviderDef) => {
    setTestingProvider(provider.id);
    try {
      const result = await testConnection({ provider: provider.id });
      const data = result?.data;
      const outcome: TestOutcome = data?.success
        ? { ok: true, text: data.message ?? 'Connection works.' }
        : { ok: false, text: data?.error ?? 'Test failed.' };
      setOutcomes((current) => ({ ...current, [provider.id]: outcome }));
    } catch (error) {
      setOutcomes((current) => ({
        ...current,
        [provider.id]: {
          ok: false,
          text: error instanceof Error ? error.message : 'Test failed.',
        },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleClear = async (provider: ProviderDef) => {
    setSavingProvider(provider.id);
    try {
      await clearConnection({ fields: PROVIDER_FIELDS[provider.id] });
      await load();
      setOutcomes((current) => ({ ...current, [provider.id]: undefined }));
      toast.success(`${provider.title} cleared`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not clear.');
    } finally {
      setSavingProvider(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center py-16">
        <Loader2 className="size-4 animate-spin text-[#7D7870]" />
      </div>
    );
  }

  return (
    <div className="grid w-full max-w-3xl gap-3">
      {PROVIDERS.map((provider) => {
        const providerConfigured = PROVIDER_FIELDS[provider.id].every(
          (field) => configured[field],
        );
        const usingEnv = !providerConfigured && fromEnv[provider.id];
        const locked = provider.locked ?? null;
        const busy = savingProvider === provider.id;
        const testing = testingProvider === provider.id;
        const outcome = outcomes[provider.id];

        return (
          <section
            aria-label={provider.title}
            className={cn(
              'group/provider relative min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-2xs transition',
              locked && 'select-none',
            )}
            key={provider.id}
            title={locked ?? undefined}
          >
            {/* The provider's chart colour as a thin identifying rule. */}
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-0.5"
              style={{ backgroundColor: provider.accent, opacity: locked ? 0.35 : 1 }}
            />

            <div className={cn('p-4 pl-5 sm:p-5 sm:pl-6', locked && 'opacity-55')}>
              <header className="grid gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-foreground text-sm">{provider.title}</h2>
                    {locked ? (
                      <Pill tone="muted">{locked}</Pill>
                    ) : providerConfigured ? (
                      <Pill icon={Check} tone="good">
                        Saved
                      </Pill>
                    ) : usingEnv ? (
                      <Pill tone="info">Using .env</Pill>
                    ) : (
                      <Pill icon={AlertTriangle} tone="warn">
                        Not set
                      </Pill>
                    )}
                  </div>
                  <p className="mt-1 text-muted-foreground text-xs leading-5">{provider.powers}</p>
                </div>

                {/* Where the key comes from, what it does, what it costs: one
                    row, always in the same place. */}
                <ul className="flex flex-wrap items-center gap-1">
                  {provider.links.map((link) => {
                    const Icon = LINK_ICONS[link.icon];
                    return (
                      <li key={link.url}>
                        <a
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2 py-1 text-muted-foreground text-[11px] transition hover:border-border/80 hover:text-foreground"
                          href={link.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <Icon className="size-3" style={{ color: provider.accent }} />
                          {link.label}
                          <ExternalLink className="size-2.5 opacity-50" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </header>

              <div
                className={cn(
                  'mt-4 grid gap-3',
                  provider.fields.length > 1 && 'sm:grid-cols-2',
                )}
              >
                {provider.fields.map((field) => (
                  <label className="grid gap-1" key={field.id}>
                    <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                      {field.label}
                    </span>
                    <input
                      autoComplete="off"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-foreground text-sm outline-none transition placeholder:text-muted-foreground/60 focus-visible:border-[#0062ff] focus-visible:ring-1 focus-visible:ring-[#0062ff]/30 disabled:cursor-not-allowed"
                      disabled={busy || locked !== null}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [field.id]: event.target.value,
                        }))
                      }
                      placeholder={
                        configured[field.id] ? 'Saved, write-only. Type to replace.' : field.placeholder
                      }
                      type="password"
                      value={values[field.id] ?? ''}
                    />
                  </label>
                ))}
              </div>

              <footer className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-muted-foreground text-xs font-medium transition hover:border-border/80 hover:bg-muted hover:text-foreground shadow-2xs disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={testing || locked !== null}
                  onClick={() => handleTest(provider)}
                  type="button"
                >
                  {testing ? <Loader2 className="size-3 animate-spin" /> : null}
                  Test
                </button>

                {outcome ? (
                  <span
                    className={cn(
                      'inline-flex min-w-0 items-center gap-1.5 text-xs font-medium',
                      outcome.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500',
                    )}
                    role="status"
                  >
                    {outcome.ok ? (
                      <Check className="size-3 shrink-0" />
                    ) : (
                      <AlertTriangle className="size-3 shrink-0" />
                    )}
                    <span className="truncate">{outcome.text}</span>
                  </span>
                ) : null}

                <div className="ml-auto flex items-center gap-2">
                  {providerConfigured && !locked ? (
                    <button
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-muted-foreground text-xs font-medium transition hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                      disabled={busy}
                      onClick={() => handleClear(provider)}
                      type="button"
                    >
                      <Trash2 className="size-3" />
                      Clear
                    </button>
                  ) : null}
                  <button
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0062ff] px-4 font-semibold text-white text-xs transition hover:bg-[#0052d9] shadow-2xs disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={busy || locked !== null}
                    onClick={() => handleSave(provider)}
                    type="button"
                  >
                    {busy ? <Loader2 className="size-3 animate-spin" /> : null}
                    Save
                  </button>
                </div>
              </footer>
            </div>

            {locked ? (
              <span
                aria-hidden
                className="pointer-events-none absolute top-3 right-3 rounded-lg border border-border bg-popover px-2.5 py-1 text-popover-foreground text-[11px] opacity-0 shadow-md transition-opacity duration-150 group-hover/provider:opacity-100"
              >
                {locked}
              </span>
            ) : null}
          </section>
        );
      })}

      <p className="px-1 text-muted-foreground text-[11px] leading-5">
        Keys are encrypted at rest and never sent back to the browser. An empty
        field falls back to the matching variable in <code className="text-foreground font-mono">.env</code>.
      </p>

      <section
        aria-labelledby="community-heading"
        className="mt-3 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs"
      >
        <div>
          <h2
            className="font-bold text-foreground text-sm"
            id="community-heading"
          >
            Join the community
          </h2>
          <p className="mt-1 text-muted-foreground text-xs leading-5">
            Connect with AI marketers, share what you learn, and get support.
          </p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {COMMUNITIES.map((community) => (
            <a
              aria-label={`Join ${community.title}, ${community.tier}`}
              className="group/community flex min-w-0 items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3 transition hover:border-white/18 hover:bg-white/[0.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A65A]/55"
              href={community.url}
              key={community.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <CommunityMark colors={community.colors} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-[#EDE7DC] text-sm">
                  {community.title}
                </span>
                <span className="mt-0.5 block text-[#7D7870] text-xs">
                  {community.tier}
                </span>
              </span>
              <ExternalLink className="size-3.5 shrink-0 text-[#5E5A54] transition group-hover/community:text-[#F2A65A]" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function CommunityMark({
  colors,
}: {
  colors: readonly [string, string, string];
}) {
  const heights = ['h-3', 'h-5', 'h-4'] as const;

  return (
    <span
      aria-hidden
      className="flex size-10 shrink-0 items-end justify-center gap-1 rounded-xl border border-border bg-muted/40 px-2 pb-2 shadow-2xs"
    >
      {colors.map((color, index) => (
        <span
          className={cn('w-1 rounded-full', heights[index])}
          key={color}
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  );
}

function Pill({
  children,
  icon: Icon,
  tone,
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone: 'good' | 'warn' | 'info' | 'muted';
}) {
  const tones = {
    good: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold',
    warn: 'border-amber-500/35 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold',
    info: 'border-blue-500/35 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold',
    muted: 'border-border bg-muted/40 text-muted-foreground font-medium',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em]',
        tones[tone],
      )}
    >
      {Icon ? <Icon className="size-2.5" /> : null}
      {children}
    </span>
  );
}
