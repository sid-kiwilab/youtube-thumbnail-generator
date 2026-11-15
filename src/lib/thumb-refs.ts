import type { RefSource } from "./ref-types";

export type ThumbRefMeta = {
  thumbUrl: string;
  source: RefSource;
  videoTitle: string;
  channelHandle: string;
};

export function pickLayoutRef(
  refs: ThumbRefMeta[],
  analysisRan: boolean,
): string | null {
  if (!refs.length) return null;
  const competitor = refs.find((r) => r.source === "competitor");
  const mine = refs.find((r) => r.source === "mine");
  if (analysisRan) {
    return competitor?.thumbUrl ?? mine?.thumbUrl ?? refs[0].thumbUrl;
  }
  return competitor?.thumbUrl ?? refs[0].thumbUrl;
}

export function parseThumbRefs(body: {
  refs?: string[];
  refMeta?: ThumbRefMeta[];
}): ThumbRefMeta[] {
  if (Array.isArray(body.refMeta) && body.refMeta.length) {
    return body.refMeta
      .filter((r) => r?.thumbUrl)
      .slice(0, 4)
      .map((r) => ({
        thumbUrl: String(r.thumbUrl),
        source: r.source === "competitor" ? "competitor" : "mine",
        videoTitle: String(r.videoTitle || ""),
        channelHandle: String(r.channelHandle || ""),
      }));
  }
  const urls = Array.isArray(body.refs)
    ? body.refs.map(String).filter(Boolean).slice(0, 4)
    : [];
  return urls.map((thumbUrl) => ({
    thumbUrl,
    source: "mine" as const,
    videoTitle: "",
    channelHandle: "",
  }));
}