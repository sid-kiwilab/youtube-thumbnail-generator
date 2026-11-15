import { sanitizeNicheSearchQuery } from "@/lib/niche-infer";
import {
  heuristicNicheSummary,
  inferNicheFromChannel,
  pickCompetitorIds,
} from "@/lib/niche-llm";
import { hasOpenRouterKey } from "@/lib/openrouter";
import type { ChannelBundle } from "@/lib/youtube-types";
import {
  fetchChannelVideos,
  searchChannelCandidates,
  searchChannelIds,
} from "@/lib/youtube-client";

export type AutoNicheResult = {
  nicheQuery: string;
  nicheSummary: string;
  nicheInferredBy: "llm" | "heuristic";
};

export type AutoCompetitorResult = {
  competitors: ChannelBundle[];
  competitorInferredBy?: "llm" | "heuristic";
};

export async function discoverNiche(
  mine: ChannelBundle,
  opts?: { avoidSearchQuery?: string },
): Promise<AutoNicheResult> {
  const openRouterOn = hasOpenRouterKey();
  const discovered = await inferNicheFromChannel(mine, opts);
  const nicheQuery = sanitizeNicheSearchQuery(discovered.searchQuery);
  let nicheSummary = "";
  let nicheInferredBy = discovered.inferredBy;

  if (discovered.inferredBy === "llm" && discovered.nicheSummary) {
    nicheSummary = discovered.nicheSummary;
  } else {
    nicheInferredBy = "heuristic";
    nicheSummary = heuristicNicheSummary(
      nicheQuery,
      openRouterOn,
      openRouterOn && discovered.inferredBy === "heuristic",
    );
  }

  if (!nicheSummary && nicheQuery) {
    nicheSummary = heuristicNicheSummary(nicheQuery, openRouterOn);
    nicheInferredBy = "heuristic";
  }

  return { nicheQuery, nicheSummary, nicheInferredBy };
}

export async function discoverAutoCompetitors(
  mine: ChannelBundle,
  niche: Pick<AutoNicheResult, "nicheQuery" | "nicheSummary" | "nicheInferredBy">,
  limit: number,
  excludeChannelIds: string[],
): Promise<AutoCompetitorResult> {
  const cap = Math.max(0, Math.min(limit, 3));
  if (cap === 0) {
    return { competitors: [] };
  }

  const exclude = new Set([mine.channelId, ...excludeChannelIds]);
  const competitors: ChannelBundle[] = [];
  let competitorInferredBy: "llm" | "heuristic" | undefined;

  const searchQ = sanitizeNicheSearchQuery(niche.nicheQuery);
  const candidates = (
    await searchChannelCandidates(searchQ, mine.channelId, 10)
  ).filter((c) => !exclude.has(c.channelId));

  if (
    niche.nicheInferredBy === "llm" &&
    niche.nicheSummary &&
    candidates.length > 0
  ) {
    const ids = await pickCompetitorIds(
      mine,
      niche.nicheSummary,
      candidates,
      cap,
    );
    const backfill =
      ids.length > 0
        ? ids
        : candidates.slice(0, cap).map((c) => c.channelId);
    for (const id of backfill.slice(0, cap)) {
      if (exclude.has(id)) continue;
      competitors.push(await fetchChannelVideos(id, 50));
      exclude.add(id);
      if (competitors.length >= cap) break;
    }
    if (competitors.length > 0) {
      competitorInferredBy = "llm";
    }
  }

  if (competitors.length < cap) {
    const ids = (await searchChannelIds(searchQ, mine.channelId, 10))
      .filter((id) => !exclude.has(id))
      .slice(0, cap - competitors.length);
    for (const id of ids) {
      competitors.push(await fetchChannelVideos(id, 50));
      exclude.add(id);
      if (competitors.length >= cap) break;
    }
    if (competitors.length > 0 && !competitorInferredBy) {
      competitorInferredBy = "heuristic";
    }
  }

  return { competitors, competitorInferredBy };
}