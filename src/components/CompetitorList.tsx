"use client";

import { formatSubscribers } from "@/lib/format-subs";
import type { CompetitorEntry } from "@/lib/workspace-store";

export function CompetitorList({
  entries,
  busy,
  addValue,
  addError,
  onAddValueChange,
  onAdd,
  onRemove,
}: {
  entries: CompetitorEntry[];
  busy: boolean;
  addValue: string;
  addError: string | null;
  onAddValueChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (handle: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Competitors
      </p>
      {entries.length === 0 ? (
        <p className="text-sm text-neutral-500">
          None yet — add handles or load to auto-search your niche.
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li
              key={e.channelId}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2"
            >
              {e.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={e.thumbnailUrl}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-500">
                  YT
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {e.title}
                </p>
                <p className="truncate text-xs text-neutral-400">
                  {e.handle.startsWith("@") ? e.handle : `@${e.handle}`}
                  <span className="text-neutral-600"> · </span>
                  {formatSubscribers(e.subscriberCount)}
                </p>
              </div>
              {e.source ? (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    e.source === "search"
                      ? "bg-sky-950 text-sky-300"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {e.source === "search" ? "Auto" : "Manual"}
                </span>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={() => onRemove(e.handle)}
                className="shrink-0 text-xs text-neutral-500 hover:text-red-400 disabled:opacity-50"
                aria-label={`Remove ${e.title}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {entries.length < 3 ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <input
            value={addValue}
            onChange={(ev) => onAddValueChange(ev.target.value)}
            placeholder="@competitor"
            className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-[#121212] px-3 py-2 text-sm outline-none focus:border-neutral-500"
            onKeyDown={(ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                onAdd();
              }
            }}
          />
          <button
            type="button"
            disabled={busy || !addValue.trim()}
            onClick={onAdd}
            className="shrink-0 rounded-lg border border-neutral-600 px-3 py-2 text-sm text-neutral-200 hover:bg-white/5 disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add"}
          </button>
        </div>
      ) : (
        <p className="text-xs text-neutral-500">Max 3 competitors.</p>
      )}
      {addError ? (
        <p className="text-xs text-red-400">{addError}</p>
      ) : null}
    </div>
  );
}