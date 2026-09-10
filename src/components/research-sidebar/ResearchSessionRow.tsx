'use client';

import type { ResearchSessionSummary } from '@/lib/research/console-types';
import { cn } from '@/lib/utils';
import { Loader2, Pencil, Pin, PinOff, Search, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function ResearchSessionRow({
  session,
  isActive = false,
  isCollapsed = false,
  onClick,
  onDelete,
  onRename,
  onTogglePin,
}: {
  session: ResearchSessionSummary;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onRename?: (title: string) => void;
  onTogglePin?: () => void;
}) {
  const isRunning = session.status === 'running';
  const initial = session.title.trim().charAt(0).toUpperCase() || 'R';

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(session.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  function commitRename() {
    const next = draft.trim();
    setIsEditing(false);
    if (!next || next === session.title) {
      setDraft(session.title);
      return;
    }
    onRename?.(next);
  }

  if (isCollapsed) {
    return (
      <button
        aria-label={session.title}
        className={cn(
          'relative inline-flex size-10 items-center justify-center rounded-lg transition',
          isActive
            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
        onClick={onClick}
        title={session.title}
        type="button"
      >
        {isRunning ? (
          <Loader2 className="size-4 animate-spin" />
        ) : session.isPinned ? (
          <Pin className="size-3.5" />
        ) : (
          <Search className="size-3.5 opacity-70" />
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        'group/research flex h-8.5 w-full items-center rounded-md text-sm transition',
        isActive
          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium border-l-2 border-[#0062ff] pl-1.5'
          : 'bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
    >
      {isEditing ? (
        <input
          className="min-w-0 flex-1 rounded-md border border-blue-500/50 bg-background px-2 py-0.5 text-foreground text-sm outline-none"
          onBlur={commitRename}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitRename();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              setDraft(session.title);
              setIsEditing(false);
            }
          }}
          ref={inputRef}
          value={draft}
        />
      ) : (
        <button
          className="min-w-0 flex-1 px-2 text-left"
          onClick={onClick}
          onDoubleClick={() => {
            if (!onRename) return;
            setDraft(session.title);
            setIsEditing(true);
          }}
          title={session.title}
          type="button"
        >
          <span className="block truncate">{session.title}</span>
        </button>
      )}

      {isEditing ? null : (
        <div className="flex shrink-0 items-center gap-0.5 pr-1 opacity-0 transition-opacity group-focus-within/research:opacity-100 group-hover/research:opacity-100">
          {isRunning ? (
            <Loader2 className="mr-1 size-3.5 animate-spin text-[#C8C2B8]" />
          ) : null}
          {onRename ? (
            <button
              aria-label="Rename research chat"
              className="inline-flex size-6 items-center justify-center rounded-md text-[#9F9A92] transition hover:bg-white/10 hover:text-[#F4F1EA]"
              onClick={(event) => {
                event.stopPropagation();
                setDraft(session.title);
                setIsEditing(true);
              }}
              type="button"
            >
              <Pencil className="size-3.5" />
            </button>
          ) : null}
          {onTogglePin ? (
            <button
              aria-label={
                session.isPinned ? 'Unpin research chat' : 'Pin research chat'
              }
              className="inline-flex size-6 items-center justify-center rounded-md text-[#9F9A92] transition hover:bg-white/10 hover:text-[#F4F1EA]"
              onClick={(event) => {
                event.stopPropagation();
                onTogglePin();
              }}
              type="button"
            >
              {session.isPinned ? (
                <PinOff className="size-3.5" />
              ) : (
                <Pin className="size-3.5" />
              )}
            </button>
          ) : null}
          {onDelete ? (
            <button
              aria-label="Delete research chat"
              className="inline-flex size-6 items-center justify-center rounded-md text-[#9F9A92] transition hover:bg-red-500/12 hover:text-red-200"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              type="button"
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
