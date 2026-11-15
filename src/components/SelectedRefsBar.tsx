"use client";

import type { SelectedRefMeta } from "@/lib/ref-types";

export function SelectedRefsBar({
  refs,
  onRemove,
  onClearAll,
}: {
  refs: SelectedRefMeta[];
  onRemove: (thumbUrl: string) => void;
  onClearAll: () => void;
}) {
  if (!refs.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Selected refs ({refs.length}/4)
        </p>
        <button
          type="button"
          onClick={onClearAll}
          className="text-[10px] text-neutral-400 underline hover:text-white"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {refs.map((r) => (
          <div
            key={r.thumbUrl}
            className="flex max-w-[11rem] items-center gap-2 rounded-lg border border-neutral-700 bg-black/40 pr-1"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r.thumbUrl}
              alt=""
              className="h-10 w-[4.5rem] shrink-0 rounded-l-lg object-cover"
            />
            <div className="min-w-0 flex-1 py-1">
              <p className="truncate text-[10px] font-medium text-white">
                {r.source === "competitor" ? "Competitor" : "Yours"}
              </p>
              <p className="line-clamp-2 text-[9px] leading-tight text-neutral-500">
                {r.videoTitle}
              </p>
            </div>
            <button
              type="button"
              aria-label="Remove reference"
              onClick={() => onRemove(r.thumbUrl)}
              className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-white/10 hover:text-white"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}