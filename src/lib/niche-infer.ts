import type { YouTubeVideo } from "./youtube-types";

const STOP = new Set(
  "the and for you how what when with this that from your are was have will about just video shorts viral clips clip highlights compilation tiktok".split(
    " ",
  ),
);

/** YouTube search already uses type=channel — strip meta words models love to append. */
const QUERY_META = new Set(
  "channel channels youtube youtuber youtubers creator creators".split(" "),
);

/** Aggregator / Shorts bait — unrelated to long-form reaction channels. */
const QUERY_FORMAT_NOISE = new Set(
  "viral clips clip highlights compilation tiktok reel reels shortform shorts".split(
    " ",
  ),
);

export function sanitizeNicheSearchQuery(query: string): string {
  let trimmed = query.trim();
  if (!trimmed) return "";
  trimmed = trimmed
    .replace(/\bviral\s+clips?\b/gi, " ")
    .replace(/\bclip\s+channel\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const filtered = words.filter((w) => {
    const lw = w.toLowerCase();
    return !QUERY_META.has(lw) && !QUERY_FORMAT_NOISE.has(lw);
  });
  const out = (filtered.length ? filtered : words).join(" ");
  return out.slice(0, 120);
}

export function inferNicheQuery(
  channelTitle: string,
  description: string,
  videos: YouTubeVideo[],
): string {
  const titles = videos
    .slice(0, 12)
    .map((v) => v.title)
    .join(" ");
  const text = `${channelTitle} ${description.slice(0, 400)} ${titles}`.toLowerCase();
  const freq = new Map<string, number>();
  for (const w of text.match(/\b[a-z0-9]{4,}\b/gi) || []) {
    const word = w.toLowerCase();
    if (STOP.has(word)) continue;
    freq.set(word, (freq.get(word) || 0) + 1);
  }
  const top = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
  if (top.length >= 2) return top.join(" ");
  return channelTitle.trim().slice(0, 80) || "youtube";
}