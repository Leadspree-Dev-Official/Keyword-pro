'use client';

import type { SourceReport } from '@/lib/research/keyword-merge';
import { cn } from '@/lib/utils';
import { AlertTriangle, Check, Loader2, Minus, Receipt } from 'lucide-react';
import { useState } from 'react';

const GROUP_LABELS: Record<string, string> = {
  spine: 'Keyword data',
  demand: 'Demand over time',
  'cross-engine': 'Other engines',
  serp: 'Search results',
  other: 'Other',
};

/**
 * What the keyword bundle's merge reports per endpoint.
 */
export type ReportSource = Omit<SourceReport, 'group'> & { group: string };

/**
 * What the search actually did, and what it cost.
 *
 * A one-box search fires up to nineteen billed calls. Without this the user has no
 * way to tell a clean run from one where fifteen endpoints failed on an
 * unactivated subscription: both produce a keyword table, and both are
 * charged. Collapsed by default, because the answer is usually "it worked".
 */
export function RunReport({
  progress,
  sources,
  totalCost,
}: {
  /** Present while the run streams: turns the receipt into a progress line. */
  progress?: { done: number; total: number; current: string | null } | null;
  sources: ReportSource[];
  totalCost: number | null;
}) {
  const [open, setOpen] = useState(false);
  if (sources.length === 0 && !progress) return null;

  const failed = sources.filter((source) => !source.ok);
  const empty = sources.filter(
    (source) => source.ok && returnedCount(source) === 0,
  );
  const withData = sources.length - failed.length - empty.length;
  const grouped = new Map<string, ReportSource[]>();
  for (const source of sources) {
    const key = source.group ?? 'other';
    grouped.set(key, [...(grouped.get(key) ?? []), source]);
  }

  return (
    <section className="min-w-0 rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
      {progress ? (
        // A thin bar that fills as calls finish, so the receipt reads as a
        // progress line while the run is streaming.
        <div className="h-0.5 w-full overflow-hidden bg-muted">
          <div
            className="h-full bg-[#0062ff] transition-[width] duration-500"
            style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
          />
        </div>
      ) : null}
      <button
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-muted/40"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {progress ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-[#0062ff]" />
        ) : (
          <Receipt className="size-3.5 shrink-0 text-[#0062ff]" />
        )}
        <span className="font-semibold text-foreground text-xs">
          {progress
            ? `Running ${progress.done} of ${progress.total} endpoints`
            : `${withData} with data${empty.length > 0 ? `, ${empty.length} empty` : ''}${failed.length > 0 ? `, ${failed.length} failed` : ''}`}
        </span>
        {progress?.current ? (
          <span className="truncate text-muted-foreground text-[11px]">· {progress.current}</span>
        ) : null}
        {failed.length > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/35 bg-red-500/10 px-2 py-0.5 text-red-500 text-[10px] font-medium">
            <AlertTriangle className="size-2.5" />
            {failed.length} failed
          </span>
        ) : null}
        {empty.length > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-muted-foreground text-[10px] font-medium">
            <Minus className="size-2.5" />
            {empty.length} empty
          </span>
        ) : null}
        <span className="ml-auto shrink-0 tabular-nums font-mono text-muted-foreground text-[11px]">
          {totalCost !== null
            ? totalCost < 0.01
              ? '<$0.01'
              : `$${totalCost.toFixed(3)}`
            : ''}
        </span>
        <span className="shrink-0 text-muted-foreground text-[10px] font-medium">
          {open ? 'Hide' : 'Details'}
        </span>
      </button>

      {open ? (
        <div className="grid gap-3 border-border/60 border-t p-3 bg-muted/10">
          {[...grouped.entries()].map(([group, entries]) => (
            <div className="grid gap-1" key={group}>
              <div className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider">
                {GROUP_LABELS[group] ?? group}
              </div>
              {entries.map((source) => (
                <div
                  className="flex items-baseline gap-2 border-border/30 border-b py-1.5 text-[11px] last:border-0"
                  key={source.type}
                >
                  {!source.ok ? (
                    <AlertTriangle className="size-3 shrink-0 text-red-500" />
                  ) : returnedCount(source) === 0 ? (
                    <Minus className="size-3 shrink-0 text-muted-foreground" />
                  ) : (
                    <Check className="size-3 shrink-0 text-emerald-500" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-foreground font-medium">
                    {source.label}
                    {source.error ? (
                      <span className="ml-1.5 text-red-500 font-normal">
                        {source.error}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 tabular-nums font-mono text-[10px]',
                      source.contributed > 0
                        ? 'text-foreground'
                        : 'text-muted-foreground/70',
                    )}
                    title="Rows this endpoint added or filled in"
                  >
                    {returnedCount(source) === 0
                      ? 'no data'
                      : source.contributed > 0
                        ? `+${source.contributed}`
                        : 'no new fields'}
                  </span>
                  <span className="w-14 shrink-0 text-right tabular-nums font-mono text-muted-foreground text-[10px]">
                    {source.cost !== null ? `$${source.cost.toFixed(4)}` : ''}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function returnedCount(source: ReportSource): number {
  // Saved reports created before this field existed still carry contribution
  // counts, which are the closest truthful fallback available.
  return source.returned ?? source.contributed;
}
