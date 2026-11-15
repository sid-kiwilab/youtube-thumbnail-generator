"use client";

export type RankedVideo = {
  id: string;
  title: string;
  viewCount: number;
  duration: string;
  thumbUrl: string;
  selected?: boolean;
};

export function VideoRankCard({
  video,
  channelLabel,
  onToggleSelect,
  selectable,
}: {
  video: RankedVideo;
  channelLabel: string;
  selectable?: boolean;
  onToggleSelect?: () => void;
}) {
  const views =
    video.viewCount >= 1_000_000
      ? `${(video.viewCount / 1_000_000).toFixed(1)}M views`
      : video.viewCount >= 1_000
        ? `${Math.round(video.viewCount / 1_000)}K views`
        : `${video.viewCount} views`;

  return (
    <article className="flex w-full min-w-0 flex-col">
      <div className="group/frame relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-900">
        {selectable ? (
          <button
            type="button"
            onClick={onToggleSelect}
            className={`absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              video.selected
                ? "bg-emerald-600 text-white"
                : "bg-black/70 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            {video.selected ? "Ref ✓" : "Use ref"}
          </button>
        ) : null}
        <a
          href={video.thumbUrl}
          download={`${video.id}-thumb.jpg`}
          target="_blank"
          rel="noreferrer"
          className="absolute right-2 top-2 z-10 rounded bg-black/75 px-2 py-0.5 text-[10px] text-white opacity-0 transition group-hover/frame:opacity-100"
        >
          Download
        </a>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={video.thumbUrl} alt="" className="h-full w-full object-cover" />
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1 py-0.5 text-xs font-medium text-white">
          {video.duration}
        </span>
      </div>
      <div className="mt-3 min-w-0">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[#f1f1f1]">
          {video.title}
        </h3>
        <p className="mt-1 text-xs text-neutral-400">
          {channelLabel} · {views}
        </p>
      </div>
    </article>
  );
}