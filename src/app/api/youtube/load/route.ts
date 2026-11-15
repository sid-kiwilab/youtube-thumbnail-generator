import { entriesFromBundles } from "@/lib/competitor-entries";
import {
  discoverAutoCompetitors,
  discoverNiche,
} from "@/lib/auto-discover";
import type { ChannelBundle } from "@/lib/youtube-types";
import { fetchChannelVideos } from "@/lib/youtube-client";
import { writeWorkspace } from "@/lib/workspace-store";

function parseManual(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => String(c).trim()).filter(Boolean).slice(0, 3);
}

function parseManualField(raw: unknown): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    input?: string;
    manualCompetitors?: string[] | string;
  };

  const input = String(body.input || "").trim();
  if (!input) {
    return Response.json({ error: "Missing channel input" }, { status: 400 });
  }

  const manual = Array.isArray(body.manualCompetitors)
    ? parseManual(body.manualCompetitors)
    : parseManualField(body.manualCompetitors);

  try {
    const mine = await fetchChannelVideos(input, 50);
    const competitors: ChannelBundle[] = [];
    let nicheQuery = "";
    let nicheSummary = "";
    let nicheInferredBy: "llm" | "heuristic" | undefined;
    let competitorInferredBy: "llm" | "heuristic" | undefined;
    let source: "manual" | "search" = "manual";

    if (manual.length > 0) {
      for (const m of manual) {
        competitors.push(await fetchChannelVideos(m, 50));
      }
    } else {
      source = "search";
      const niche = await discoverNiche(mine);
      nicheQuery = niche.nicheQuery;
      nicheSummary = niche.nicheSummary;
      nicheInferredBy = niche.nicheInferredBy;

      const picked = await discoverAutoCompetitors(mine, niche, 3, []);
      competitors.push(...picked.competitors);
      competitorInferredBy = picked.competitorInferredBy;
    }

    const competitorEntries = entriesFromBundles(competitors, source);

    writeWorkspace({
      myHandle: mine.handle,
      channelId: mine.channelId,
      channelTitle: mine.title,
      subscriberCount: mine.subscriberCount,
      channelThumbnailUrl: mine.thumbnailUrl,
      nicheQuery: source === "search" ? nicheQuery : "",
      nicheSummary: source === "search" ? nicheSummary : undefined,
      nicheInferredBy: source === "search" ? nicheInferredBy : undefined,
      competitorInferredBy:
        source === "search" ? competitorInferredBy : undefined,
      manualCompetitors: manual.length ? manual : undefined,
      competitors: competitors.map((c) => c.handle),
      competitorEntries,
      competitorSource: source,
    });

    return Response.json({
      mine,
      competitors,
      competitorEntries,
      nicheQuery,
      nicheSummary,
      nicheInferredBy,
      competitorInferredBy,
      competitorSource: source,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Channel load failed";
    return Response.json({ error: message }, { status: 502 });
  }
}