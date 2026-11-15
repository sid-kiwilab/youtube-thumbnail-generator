"use client";

import { useState } from "react";
import { formatSubscribers } from "@/lib/format-subs";
import type { ChannelBundle } from "@/lib/youtube-types";
import { VideoRankCard } from "./VideoRankCard";
import type { RankedVideo } from "./VideoRankCard";

export function CollapsibleCompareSection({
  channel,
  videos,
  defaultOpen = false,
  selectable,
  selectedRefs,
  onToggleSelect,
}: {
  channel: ChannelBundle;
  videos: RankedVideo[];
  defaultOpen?: boolean;
  selectable?: boolean;
  selectedRefs?: Set<string>;
  onToggleSelect?: (thumbUrl: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const grid =
    "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4";

  return (
    <section className="rounded-xl border border-white/10 bg-[#121212]/80">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {channel.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={channel.thumbnailUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {channel.title}
          </p>
          <p className="text-xs text-neutral-500">
            {formatSubscribers(channel.subscriberCount)} · {videos.length} ranked
          </p>
        </div>
        <span className="shrink-0 text-xs text-neutral-500">
          {open ? "Hide" : "Show"} thumbs
        </span>
      </button>
      {open ? (
        <div className={`border-t border-white/10 px-4 pb-4 pt-3 ${grid}`}>
          {videos.map((v) => (
            <VideoRankCard
              key={v.id}
              video={{
                ...v,
                selected: selectedRefs?.has(v.thumbUrl),
              }}
              channelLabel={channel.handle}
              selectable={selectable}
              onToggleSelect={
                onToggleSelect ? () => onToggleSelect(v.thumbUrl) : undefined
              }
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}