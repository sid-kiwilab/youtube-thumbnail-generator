import { inferNicheQuery, sanitizeNicheSearchQuery } from "@/lib/niche-infer";
import { nicheInferPrompt, nichePickPrompt } from "@/lib/prompts";
import {
  hasOpenRouterKey,
  nicheModel,
  openRouterChat,
} from "@/lib/openrouter";
import type { ChannelBundle } from "@/lib/youtube-types";
import type { ChannelSearchCandidate } from "@/lib/youtube-client";

export type NicheDiscovery = {
  nicheSummary: string;
  searchQuery: string;
  inferredBy: "llm" | "heuristic";
};

function parseJsonObject(raw: string): Record<string, unknown> | null {
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function formatVideoTitles(mine: ChannelBundle): string {
  return mine.videos
    .slice(0, 20)
    .map((v) => {
      const views =
        v.viewCount >= 1_000_000
          ? `${(v.viewCount / 1_000_000).toFixed(1)}M views`
          : v.viewCount >= 1_000
            ? `${Math.round(v.viewCount / 1_000)}K views`
            : `${v.viewCount} views`;
      return `- ${v.title} (${views})`;
    })
    .join("\n");
}

export async function inferNicheFromChannel(
  mine: ChannelBundle,
  opts?: { avoidSearchQuery?: string },
): Promise<NicheDiscovery> {
  const fallbackQuery = inferNicheQuery(
    mine.title,
    mine.description || "",
    mine.videos,
  );

  if (!hasOpenRouterKey()) {
    return {
      nicheSummary: "",
      searchQuery: sanitizeNicheSearchQuery(fallbackQuery),
      inferredBy: "heuristic",
    };
  }

  try {
    let prompt = nicheInferPrompt({
      channelTitle: mine.title,
      description: (mine.description || "").slice(0, 800),
      videoTitles: formatVideoTitles(mine),
    });
    const avoid = opts?.avoidSearchQuery?.trim();
    if (avoid) {
      prompt += `\n\nThe user wants a fresh angle. Do NOT reuse this previous search query: "${avoid}".`;
    }
    const raw = await openRouterChat({
      model: nicheModel(),
      messages: [{ role: "user", content: prompt }],
      maxTokens: 320,
    });
    const obj = parseJsonObject(raw);
    const summary = String(obj?.nicheSummary || "").trim();
    const query = String(obj?.searchQuery || "").trim();
    if (summary && query) {
      return {
        nicheSummary: summary.slice(0, 200),
        searchQuery: sanitizeNicheSearchQuery(query),
        inferredBy: "llm",
      };
    }
  } catch {
    /* fallback below */
  }

  return {
    nicheSummary: "",
    searchQuery: sanitizeNicheSearchQuery(fallbackQuery),
    inferredBy: "heuristic",
  };
}

export async function pickCompetitorIds(
  mine: ChannelBundle,
  nicheSummary: string,
  candidates: ChannelSearchCandidate[],
  maxPick = 3,
): Promise<string[]> {
  if (!candidates.length) return [];
  const cap = Math.max(1, Math.min(maxPick, 3));
  if (!hasOpenRouterKey()) {
    return candidates.slice(0, cap).map((c) => c.channelId);
  }

  const list = candidates
    .map(
      (c, i) =>
        `${i + 1}. id=${c.channelId} title="${c.title.replace(/"/g, "'")}" desc="${(c.description || "").slice(0, 120).replace(/"/g, "'")}"`,
    )
    .join("\n");

  try {
    const prompt = nichePickPrompt({
      channelTitle: mine.title,
      nicheSummary: nicheSummary || mine.title,
      candidates: list,
    });
    const raw = await openRouterChat({
      model: nicheModel(),
      messages: [{ role: "user", content: prompt }],
      maxTokens: 200,
    });
    const obj = parseJsonObject(raw);
    const ids = Array.isArray(obj?.channelIds)
      ? (obj.channelIds as unknown[]).map((x) => String(x).trim()).filter(Boolean)
      : [];
    const allowed = new Set(candidates.map((c) => c.channelId));
    const picked = ids.filter((id) => allowed.has(id)).slice(0, cap);
    if (picked.length > 0) return picked;
  } catch {
    /* fall through */
  }

  return candidates.slice(0, cap).map((c) => c.channelId);
}

export function heuristicNicheSummary(
  searchQuery: string,
  openRouterConfigured: boolean,
  llmFailed?: boolean,
): string {
  if (llmFailed && openRouterConfigured) {
    return "Smart niche failed — using basic keyword guess for search.";
  }
  if (!openRouterConfigured) {
    return "OpenRouter not set — basic keyword guess for niche (add OPENROUTER_API_KEY for smarter results).";
  }
  return searchQuery ? `Basic guess: ${searchQuery}` : "Basic niche guess.";
}