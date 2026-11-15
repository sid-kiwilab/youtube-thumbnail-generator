import { thumbnailPrompt } from "@/lib/prompts";
import { generateThumbnailImage } from "@/lib/openai-image";
import {
  readLocalLatest,
  saveLocalThumb,
  writeLocalLatest,
  type LocalThumb,
} from "@/lib/local-store";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    brief?: string;
    refs?: string[];
    slug?: string;
    title?: string;
  };
  const brief = String(body.brief || "").trim();
  const refs = Array.isArray(body.refs)
    ? body.refs.map(String).filter(Boolean).slice(0, 4)
    : [];
  if (!brief) {
    return Response.json({ error: "Missing brief" }, { status: 400 });
  }
  if (refs.length < 1) {
    return Response.json(
      { error: "Pick at least one reference thumb URL or still" },
      { status: 400 },
    );
  }

  const slug = String(body.slug || "draft").replace(/[^\w-]/g, "") || "draft";

  try {
    const prompt = thumbnailPrompt({ brief });
    const jpg = await generateThumbnailImage(prompt, refs);
    const { rel } = saveLocalThumb(slug, jpg);
    const latest = readLocalLatest();
    const thumbs: LocalThumb[] = Array.isArray(latest.thumbs) ? [...latest.thumbs] : [];
    const id = rel.split("/").pop()?.replace(/\.jpg$/i, "") || rel;
    thumbs.push({ id, src: rel, generatedAt: new Date().toISOString() });
    if (body.title) latest.title = String(body.title);
    latest.slug = slug;
    latest.thumb = rel;
    latest.thumbs = thumbs;
    writeLocalLatest(latest);
    return Response.json({ src: rel, latest });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Thumbnail generation failed";
    return Response.json({ error: message }, { status: 502 });
  }
}