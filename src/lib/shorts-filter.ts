/** YouTube Shorts max length (3 minutes). */
export const SHORTS_MAX_SECONDS = 180;

export function parseDurationSeconds(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const h = Number(m?.[1] || 0);
  const min = Number(m?.[2] || 0);
  const s = Number(m?.[3] || 0);
  return h * 3600 + min * 60 + s;
}

function titleOrTagsSayShort(title: string, tags: string[]): boolean {
  if (/#shorts?\b/i.test(title)) return true;
  return tags.some((t) => /^(#?shorts?)$/i.test(t.trim()));
}

/** Definite short — no network. */
export function isDefiniteShort(
  title: string,
  durationIso: string,
  tags: string[] = [],
): boolean {
  if (titleOrTagsSayShort(title, tags)) return true;
  const sec = parseDurationSeconds(durationIso);
  if (sec > 0 && sec <= 60) return true;
  return false;
}

/** Ambiguous 61s–3m: needs YouTube Shorts URL check. */
export function needsShortsUrlCheck(durationIso: string, title: string, tags: string[]): boolean {
  if (titleOrTagsSayShort(title, tags)) return false;
  const sec = parseDurationSeconds(durationIso);
  return sec > 60 && sec <= SHORTS_MAX_SECONDS;
}

/** True when youtube.com/shorts/{id} stays on the Shorts surface (not redirected to /watch). */
export async function resolvesAsShortsWatch(videoId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; youtube-thumbnail-generator/1.0)",
      },
      signal: AbortSignal.timeout(12_000),
    });
    const url = res.url || "";
    return url.includes("/shorts/") && url.includes(videoId);
  } catch {
    return false;
  }
}

export async function isLongFormVideo(
  videoId: string,
  title: string,
  durationIso: string,
  tags: string[] = [],
): Promise<boolean> {
  const sec = parseDurationSeconds(durationIso);
  if (sec > SHORTS_MAX_SECONDS) return true;
  if (isDefiniteShort(title, durationIso, tags)) return false;
  if (needsShortsUrlCheck(durationIso, title, tags)) {
    return !(await resolvesAsShortsWatch(videoId));
  }
  return false;
}