'use client';

import { cn } from '@/lib/utils';

export type KdTier = 'easy' | 'medium' | 'hard' | 'super-hard';

export function getKdTier(kd: number): KdTier {
  if (kd < 15) return 'easy';
  if (kd < 30) return 'medium';
  if (kd < 70) return 'hard';
  return 'super-hard';
}

export function getKdColor(kd: number): string {
  if (kd < 15) return '#10b981'; // Emerald
  if (kd < 30) return '#84cc16'; // Lime / Yellow-Green
  if (kd < 70) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

export function getKdLabel(tier: KdTier): string {
  switch (tier) {
    case 'easy':
      return 'Easy';
    case 'medium':
      return 'Medium';
    case 'hard':
      return 'Hard';
    case 'super-hard':
      return 'Super hard';
  }
}

export function getBacklinkEstimate(kd: number): string {
  if (kd <= 5) {
    return "We estimate that you will need backlinks from ~1-2 websites to rank in the top 10.";
  }
  if (kd <= 14) {
    return "We estimate that you will need backlinks from ~3-10 websites to rank in the top 10.";
  }
  if (kd <= 29) {
    return "We estimate that you will need backlinks from ~11-25 websites to rank in the top 10.";
  }
  if (kd <= 49) {
    return "We estimate that you will need backlinks from ~26-55 websites to rank in the top 10.";
  }
  if (kd <= 69) {
    return "We estimate that you will need backlinks from ~56-115 websites to rank in the top 10.";
  }
  return "We estimate that you will need backlinks from ~120+ websites to rank in the top 10.";
}

export function AhrefsKdGauge({
  difficulty,
  size = 116,
}: {
  difficulty: number | null;
  size?: number;
}) {
  const isAvailable = difficulty !== null && !Number.isNaN(difficulty);
  const score = isAvailable ? Math.max(0, Math.min(100, Math.round(difficulty))) : 0;
  const tier = isAvailable ? getKdTier(score) : null;
  const color = isAvailable ? getKdColor(score) : '#94a3b8';
  const label = tier ? getKdLabel(tier) : 'Not scored';
  const estimate = isAvailable ? getBacklinkEstimate(score) : 'Difficulty metric is not available for this source.';

  // SVG dimensions
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          className="size-full -rotate-90"
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-muted/60 dark:stroke-muted/30"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active progress stroke */}
          {isAvailable && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />
          )}
        </svg>

        {/* Center Score & Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold tracking-tight text-foreground font-mono tabular-nums">
            {isAvailable ? score : '—'}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            KD
          </span>
        </div>
      </div>

      {/* Ahrefs Difficulty Badge */}
      <div className="mt-3 flex flex-col items-center gap-1.5">
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-tight shadow-2xs',
            tier === 'easy' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
            tier === 'medium' && 'bg-lime-500/15 text-lime-600 dark:text-lime-400 border border-lime-500/25',
            tier === 'hard' && 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25',
            tier === 'super-hard' && 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25',
            !tier && 'bg-muted text-muted-foreground border border-border',
          )}
        >
          {label}
        </span>

        {/* Backlink estimation explanation */}
        <p className="max-w-[210px] text-[11px] leading-relaxed text-muted-foreground text-center">
          {estimate}
        </p>
      </div>
    </div>
  );
}

/**
 * Compact KD Pill Badge used in tables and lists
 */
export function AhrefsKdBadge({
  value,
  className,
}: {
  value: number | null | undefined;
  className?: string;
}) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className="text-muted-foreground text-xs font-mono">-</span>;
  }

  const score = Math.max(0, Math.min(100, Math.round(value)));
  const color = getKdColor(score);

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[26px] h-[20px] px-1.5 rounded-md font-mono text-[11px] font-bold text-white shadow-2xs tabular-nums',
        className,
      )}
      style={{ backgroundColor: color }}
      title={`Keyword Difficulty: ${score}/100 (${getKdLabel(getKdTier(score))})`}
    >
      {score}
    </span>
  );
}
