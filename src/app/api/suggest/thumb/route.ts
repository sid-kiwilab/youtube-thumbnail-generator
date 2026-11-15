import {
  formatRefAnalysisForPrompt,
  thumbnailPrompt,
} from "@/lib/prompts";
import { generateThumbnailImage } from "@/lib/openai-image";
import { hasOpenRouterKey } from "@/lib/openrouter";
import {
  readLocalLatest,
  saveLocalThumb,
  writeLocalLatest,
  type LocalThumb,
} from "@/lib/local-store";
import { isSafeRefSrc } from "@/lib/refs-store";
import { parseThumbRefs, pickLayoutRef } from "@/lib/thumb-refs";
import type { RefAnalysisItem } from "@/lib/ref-types";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    brief?: string;
    refs?: string[];
    refMeta?: {
      thumbUrl: string;
      source: "mine" | "competitor";
      videoTitle: string;
      channelHandle: string;
    }[];
    refAnalysis?: {
      items: RefAnalysisItem[];
      summary: string;
    };
    supportingSrcs?: string[];
    slug?: string;
    title?: string;
  };
  const brief = String(body.brief || "").trim();
  const refMeta = parseThumbRefs(body);
  const supporting = Array.isArray(body.supportingSrcs)
    ? body.supportingSrcs.filter((s) => isSafeRefSrc(String(s))).slice(0, 6)
    : [];

  if (!brief) {
    return Response.json({ error: "Missing brief" }, { status: 400 });
  }
  if (refMeta.length < 1) {
    return Response.json(
      { error: "Pick at least one reference thumb" },
      { status: 400 },
    );
  }

  const slug = String(body.slug || "draft").replace(/[^\w-]/g, "") || "draft";
  const analysis = body.refAnalysis;
  const analysisRan = Boolean(
    analysis?.items?.length && hasOpenRouterKey(),
  );

  const layoutRef = pickLayoutRef(refMeta, analysisRan);
  const identityRefs = [...supporting];

  let refNotes = "";
  if (analysis?.items?.length) {
    const titleByUrl = new Map(
      refMeta.map((r) => [r.thumbUrl, r.videoTitle] as const),
    );
    refNotes = formatRefAnalysisForPrompt(
      analysis.items.map((it) => ({
        ...it,
        videoTitle: titleByUrl.get(it.thumbUrl) || "",
      })),
      analysis.summary || "",
    );
  } else {
    refNotes =
      "No vision analysis — borrow one layout hook only; use supporting stills for creator identity.";
  }

  const supportingNames = supporting
    .map((s) => s.split("/").pop())
    .filter(Boolean)
    .join(", ");

  try {
    const prompt = thumbnailPrompt({
      brief,
      refNotes,
      supportingNames: supportingNames || undefined,
    });
    const jpg = await generateThumbnailImage(prompt, {
      identityRefs,
      layoutRef,
    });
    const { rel } = saveLocalThumb(slug, jpg);
    const latest = readLocalLatest();
    const thumbs: LocalThumb[] = Array.isArray(latest.thumbs)
      ? [...latest.thumbs]
      : [];
    const id = rel.split("/").pop()?.replace(/\.jpg$/i, "") || rel;
    thumbs.push({ id, src: rel, generatedAt: new Date().toISOString() });
    if (body.title) latest.title = String(body.title);
    latest.slug = slug;
    latest.thumb = rel;
    latest.thumbs = thumbs;
    writeLocalLatest(latest);
    return Response.json({ src: rel, latest, layoutRef, analysisRan });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Thumbnail generation failed";
    return Response.json({ error: message }, { status: 502 });
  }
}