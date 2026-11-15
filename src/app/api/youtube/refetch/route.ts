import { bundleToEntry } from "@/lib/competitor-entries";
import { discoverAutoCompetitors, discoverNiche } from "@/lib/auto-discover";
import { competitorSourceAfterEdit } from "@/lib/competitor-source";
import { fetchChannelVideos } from "@/lib/youtube-client";
import {
  competitorHandlesFromEntries,
  readWorkspace,
  writeWorkspace,
} from "@/lib/workspace-store";

const MAX = 3;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { scope?: string };
  const scope = String(body.scope || "").trim();

  const ws = readWorkspace();
  const myKey = ws.myHandle?.trim();
  if (!myKey) {
    return Response.json(
      { error: "Load your channel first" },
      { status: 400 },
    );
  }

  try {
    const mine = await fetchChannelVideos(myKey, 50);

    if (scope === "niche") {
      const niche = await discoverNiche(mine, {
        avoidSearchQuery: ws.nicheQuery,
      });
      writeWorkspace({
        ...ws,
        myHandle: mine.handle,
        channelId: mine.channelId,
        channelTitle: mine.title,
        subscriberCount: mine.subscriberCount,
        channelThumbnailUrl: mine.thumbnailUrl,
        nicheQuery: niche.nicheQuery,
        nicheSummary: niche.nicheSummary,
        nicheInferredBy: niche.nicheInferredBy,
        competitorSource: ws.competitorSource || "search",
      });
      return Response.json({
        mine,
        nicheQuery: niche.nicheQuery,
        nicheSummary: niche.nicheSummary,
        nicheInferredBy: niche.nicheInferredBy,
      });
    }

    if (scope === "competitors") {
      const existing = ws.competitorEntries || [];
      if (existing.length >= MAX) {
        return Response.json(
          { error: "Maximum 3 competitors — remove one to add more" },
          { status: 400 },
        );
      }
      const nicheQuery = ws.nicheQuery?.trim();
      if (!nicheQuery) {
        return Response.json(
          { error: "Refresh niche first — no search query saved" },
          { status: 400 },
        );
      }
      const slots = MAX - existing.length;
      const exclude = existing.map((e) => e.channelId);
      const niche = {
        nicheQuery,
        nicheSummary: ws.nicheSummary || nicheQuery,
        nicheInferredBy: ws.nicheInferredBy || ("heuristic" as const),
      };
      const picked = await discoverAutoCompetitors(
        mine,
        niche,
        slots,
        exclude,
      );
      if (picked.competitors.length === 0) {
        return Response.json(
          {
            error:
              "No new channels found — try Refresh niche or add a handle manually",
          },
          { status: 404 },
        );
      }
      const addedEntries = picked.competitors.map((b) =>
        bundleToEntry(b, "search"),
      );
      const merged = [...existing, ...addedEntries].slice(0, MAX);
      const handles = competitorHandlesFromEntries(merged);
      const nextSource = competitorSourceAfterEdit(merged, ws.competitorSource);
      writeWorkspace({
        ...ws,
        competitorEntries: merged,
        competitors: handles,
        manualCompetitors:
          nextSource === "manual" && handles.length ? handles : ws.manualCompetitors,
        competitorSource: nextSource || "search",
        competitorInferredBy:
          picked.competitorInferredBy || ws.competitorInferredBy,
      });
      return Response.json({
        added: addedEntries,
        addedBundles: picked.competitors,
        competitorEntries: merged,
        competitorInferredBy: picked.competitorInferredBy,
        competitorSource: nextSource,
      });
    }

    return Response.json({ error: "scope must be niche or competitors" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refetch failed";
    return Response.json({ error: message }, { status: 502 });
  }
}