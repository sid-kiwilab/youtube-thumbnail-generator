import { bundleToEntry } from "@/lib/competitor-entries";
import { sanitizeNicheSearchQuery } from "@/lib/niche-infer";
import { fetchChannelVideos } from "@/lib/youtube-client";
import type { ChannelBundle } from "@/lib/youtube-types";
import type { CompetitorEntry } from "@/lib/workspace-store";
import {
  competitorHandlesFromEntries,
  normalizeHandle,
  readWorkspace,
  writeWorkspace,
} from "@/lib/workspace-store";

function entrySourceFallback(
  wsSource: "manual" | "search" | undefined,
): "search" | "manual" {
  return wsSource === "search" ? "search" : "manual";
}

export async function GET() {
  const ws = readWorkspace();
  const myKey = ws.myHandle?.trim();
  if (!myKey) {
    return Response.json({ workspace: ws, mine: null, competitors: [] });
  }

  try {
    const mine = await fetchChannelVideos(myKey, 50);
    const fromEntries = competitorHandlesFromEntries(ws.competitorEntries);
    const handles =
      fromEntries.length > 0
        ? fromEntries
        : (ws.competitors || []).map((h) =>
            h.startsWith("@") ? h : `@${h}`,
          );

    const competitors: ChannelBundle[] = [];
    const competitorEntries: CompetitorEntry[] = [];
    const bootstrapFailed: string[] = [];
    const sourceFallback = entrySourceFallback(ws.competitorSource);

    for (const h of handles.slice(0, 3)) {
      const norm = normalizeHandle(h);
      try {
        const bundle = await fetchChannelVideos(h, 50);
        competitors.push(bundle);
        const prev = ws.competitorEntries?.find(
          (e) =>
            e.channelId === bundle.channelId ||
            normalizeHandle(e.handle) === norm,
        );
        competitorEntries.push(
          bundleToEntry(bundle, prev?.source ?? sourceFallback),
        );
      } catch {
        const prev = ws.competitorEntries?.find(
          (e) => normalizeHandle(e.handle) === norm,
        );
        if (prev) {
          competitorEntries.push(prev);
        } else {
          bootstrapFailed.push(norm);
        }
      }
    }

    writeWorkspace({
      ...ws,
      myHandle: mine.handle,
      channelId: mine.channelId,
      channelTitle: mine.title,
      subscriberCount: mine.subscriberCount,
      channelThumbnailUrl: mine.thumbnailUrl,
      competitors: competitorEntries.map((e) => e.handle),
      competitorEntries,
    });

    return Response.json({
      workspace: readWorkspace(),
      mine,
      competitors,
      competitorEntries,
      nicheQuery: sanitizeNicheSearchQuery(ws.nicheQuery || ""),
      nicheSummary: ws.nicheSummary || "",
      nicheInferredBy: ws.nicheInferredBy || null,
      competitorInferredBy: ws.competitorInferredBy || null,
      competitorSource: ws.competitorSource || null,
      bootstrapFailed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bootstrap failed";
    return Response.json({ error: message, workspace: ws }, { status: 502 });
  }
}