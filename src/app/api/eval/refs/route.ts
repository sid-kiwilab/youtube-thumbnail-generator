import { analyzeRefs, hasOpenRouterKey } from "@/lib/openrouter";
import type { AnalyzeRefInput } from "@/lib/openrouter";

export async function POST(req: Request) {
  if (!hasOpenRouterKey()) {
    return Response.json(
      { error: "Missing OPENROUTER_API_KEY for ref analysis" },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    refs?: AnalyzeRefInput[];
    channelTitle?: string;
    channelHandle?: string;
    channelAvatar?: string;
  };

  const refs: AnalyzeRefInput[] = Array.isArray(body.refs)
    ? body.refs
        .filter((r) => r?.thumbUrl)
        .slice(0, 4)
        .map((r) => ({
          thumbUrl: String(r.thumbUrl),
          source: (r.source === "competitor"
            ? "competitor"
            : "mine") as AnalyzeRefInput["source"],
          videoTitle: String(r.videoTitle || ""),
          channelHandle: String(r.channelHandle || ""),
        }))
    : [];

  if (!refs.length) {
    return Response.json({ error: "Missing refs" }, { status: 400 });
  }

  try {
    const result = await analyzeRefs({
      channelTitle: String(body.channelTitle || "Creator channel"),
      channelHandle: String(body.channelHandle || "@channel"),
      channelAvatar: String(body.channelAvatar || ""),
      refs,
    });
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ref analysis failed";
    return Response.json({ error: message }, { status: 502 });
  }
}