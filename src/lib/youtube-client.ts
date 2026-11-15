import { normalizeYouTubeInput } from "./parse-handle";
import { readCache, writeCache } from "./cache";
import {
  isLongFormVideo,
  parseDurationSeconds,
  SHORTS_MAX_SECONDS,
} from "./shorts-filter";
import type { ChannelBundle, YouTubeVideo } from "./youtube-types";

function apiKey() {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) throw new Error("Missing YOUTUBE_API_KEY in .env");
  return key;
}

async function ytGet(path: string, params: Record<string, string>) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", apiKey());
  const res = await fetch(url.toString());
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data?.error?.message || `YouTube API ${res.status}`,
    );
  }
  return data;
}

function parseDurationParts(iso: string) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const h = Number(m?.[1] || 0);
  const min = Number(m?.[2] || 0);
  const s = Number(m?.[3] || 0);
  return { h, min, s, totalSec: h * 3600 + min * 60 + s };
}

function parseDuration(iso: string): string {
  const { h, min, s } = parseDurationParts(iso);
  if (h > 0) return `${h}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${min}:${String(s).padStart(2, "0")}`;
}

function pickThumb(thumbnails: Record<string, { url?: string }>) {
  return (
    thumbnails?.maxres?.url ||
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    ""
  );
}

async function resolveChannel(handleOrId: string) {
  const parsed = normalizeYouTubeInput(handleOrId);
  const params: Record<string, string> = {
    part: "contentDetails,snippet,statistics",
    maxResults: "1",
  };
  if (parsed.channelId) params.id = parsed.channelId;
  else if (parsed.handle) params.forHandle = parsed.handle.replace(/^@/, "");
  else throw new Error("Invalid channel input");

  const data = await ytGet("channels", params);
  const ch = data.items?.[0];
  if (!ch) throw new Error("Channel not found");
  const uploads =
    ch.contentDetails?.relatedPlaylists?.uploads as string | undefined;
  if (!uploads) throw new Error("No uploads playlist on channel");
  const handle =
    ch.snippet?.customUrl?.replace(/^@/, "") ||
    parsed.handle?.replace(/^@/, "") ||
    handleOrId.replace(/^@/, "");
  const thumbs = ch.snippet?.thumbnails || {};
  return {
    channelId: ch.id as string,
    uploadsPlaylistId: uploads,
    title: (ch.snippet?.title as string) || handle,
    description: (ch.snippet?.description as string) || "",
    handle,
    subscriberCount: Number(ch.statistics?.subscriberCount || 0),
    thumbnailUrl: pickThumb(thumbs),
  };
}

export type ChannelSearchCandidate = {
  channelId: string;
  title: string;
  description: string;
};

export async function searchChannelCandidates(
  query: string,
  excludeChannelId: string,
  maxResults = 10,
): Promise<ChannelSearchCandidate[]> {
  const data = await ytGet("search", {
    part: "snippet",
    type: "channel",
    q: query,
    maxResults: String(Math.min(maxResults, 50)),
  });
  const out: ChannelSearchCandidate[] = [];
  for (const item of data.items || []) {
    const id =
      (item.id?.channelId as string | undefined) ||
      (item.snippet?.channelId as string | undefined);
    if (!id || id === excludeChannelId) continue;
    if (out.some((c) => c.channelId === id)) continue;
    out.push({
      channelId: id,
      title: (item.snippet?.title as string) || id,
      description: (item.snippet?.description as string) || "",
    });
    if (out.length >= maxResults) break;
  }
  return out;
}

export async function searchChannelIds(
  query: string,
  excludeChannelId: string,
  limit = 3,
): Promise<string[]> {
  const candidates = await searchChannelCandidates(
    query,
    excludeChannelId,
    Math.max(limit, 10),
  );
  return candidates.slice(0, limit).map((c) => c.channelId);
}

export async function fetchChannelVideos(
  handleOrId: string,
  maxResults = 50,
): Promise<ChannelBundle> {
  const cacheKey = `yt-longform-v3-${handleOrId.replace(/[^\w@.-]+/g, "_")}-${maxResults}`;
  const cached = readCache<ChannelBundle>(cacheKey);
  if (cached) return cached;

  const channel = await resolveChannel(handleOrId);
  const videos: YouTubeVideo[] = [];
  let pageToken = "";

  for (let page = 0; page < 8 && videos.length < maxResults; page += 1) {
    const params: Record<string, string> = {
      part: "snippet,contentDetails",
      playlistId: channel.uploadsPlaylistId,
      maxResults: "50",
    };
    if (pageToken) params.pageToken = pageToken;
    const pl = await ytGet("playlistItems", params);
    const ids: string[] = [];
    for (const item of pl.items || []) {
      const id = item.contentDetails?.videoId as string | undefined;
      if (id) ids.push(id);
    }
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50);
      const vdata = await ytGet("videos", {
        part: "snippet,statistics,contentDetails",
        id: batch.join(","),
      });
      for (const v of vdata.items || []) {
        const durationIso = (v.contentDetails?.duration as string) || "PT0S";
        const title = (v.snippet?.title as string) || "";
        const tags = Array.isArray(v.snippet?.tags)
          ? (v.snippet.tags as string[])
          : [];
        const sec = parseDurationSeconds(durationIso);
        if (sec > SHORTS_MAX_SECONDS) {
          /* keep */
        } else if (!(await isLongFormVideo(v.id, title, durationIso, tags))) {
          continue;
        }
        const thumbs = v.snippet?.thumbnails || {};
        videos.push({
          id: v.id,
          title,
          viewCount: Number(v.statistics?.viewCount || 0),
          publishedAt: (v.snippet?.publishedAt as string) || "",
          duration: parseDuration(durationIso),
          thumbUrl: pickThumb(thumbs),
        });
        if (videos.length >= maxResults) break;
      }
      if (videos.length >= maxResults) break;
    }
    pageToken = pl.nextPageToken || "";
    if (!pageToken) break;
  }

  videos.sort((a, b) => b.viewCount - a.viewCount);

  const bundle: ChannelBundle = {
    handle: channel.handle.startsWith("@") ? channel.handle : `@${channel.handle}`,
    channelId: channel.channelId,
    title: channel.title,
    description: channel.description,
    subscriberCount: channel.subscriberCount,
    thumbnailUrl: channel.thumbnailUrl,
    videos,
  };

  writeCache(cacheKey, bundle);
  return bundle;
}