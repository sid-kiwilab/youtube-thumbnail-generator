import {
  readWorkspace,
  writeWorkspace,
  type CompetitorEntry,
  type Workspace,
} from "@/lib/workspace-store";

export async function GET() {
  return Response.json(readWorkspace());
}

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<Workspace>;
  const prev = readWorkspace();
  const next: Workspace = {
    ...prev,
    ...(body.myHandle !== undefined ? { myHandle: String(body.myHandle).trim() } : {}),
    ...(Array.isArray(body.competitors)
      ? {
          competitors: body.competitors
            .map((c) => String(c).trim())
            .filter(Boolean)
            .slice(0, 3),
        }
      : {}),
    ...(Array.isArray(body.manualCompetitors)
      ? {
          manualCompetitors: body.manualCompetitors
            .map((c) => String(c).trim())
            .filter(Boolean)
            .slice(0, 3),
        }
      : {}),
    ...(body.nicheQuery !== undefined
      ? { nicheQuery: String(body.nicheQuery).trim() }
      : {}),
    ...(body.nicheSummary !== undefined
      ? { nicheSummary: String(body.nicheSummary).trim() }
      : {}),
    ...(body.nicheInferredBy === "llm" || body.nicheInferredBy === "heuristic"
      ? { nicheInferredBy: body.nicheInferredBy }
      : {}),
    ...(body.competitorInferredBy === "llm" ||
    body.competitorInferredBy === "heuristic"
      ? { competitorInferredBy: body.competitorInferredBy }
      : {}),
    ...(body.channelId !== undefined
      ? { channelId: String(body.channelId).trim() }
      : {}),
    ...(body.competitorSource === "manual" || body.competitorSource === "search"
      ? { competitorSource: body.competitorSource }
      : {}),
    ...(body.channelTitle !== undefined
      ? { channelTitle: String(body.channelTitle).trim() }
      : {}),
    ...(typeof body.subscriberCount === "number"
      ? { subscriberCount: body.subscriberCount }
      : {}),
    ...(body.channelThumbnailUrl !== undefined
      ? { channelThumbnailUrl: String(body.channelThumbnailUrl).trim() }
      : {}),
    ...(Array.isArray(body.competitorEntries)
      ? {
          competitorEntries: body.competitorEntries
            .map((e: CompetitorEntry) => ({
              handle: String(e.handle).trim(),
              channelId: String(e.channelId).trim(),
              title: String(e.title).trim(),
              subscriberCount: Number(e.subscriberCount || 0),
              ...(e.thumbnailUrl
                ? { thumbnailUrl: String(e.thumbnailUrl).trim() }
                : {}),
              ...(e.source === "search" || e.source === "manual"
                ? { source: e.source }
                : {}),
            }))
            .filter((e) => e.handle && e.channelId)
            .slice(0, 3),
        }
      : {}),
  };
  writeWorkspace(next);
  return Response.json(next);
}