import { bundleToEntry } from "@/lib/competitor-entries";
import { fetchChannelVideos } from "@/lib/youtube-client";
import { competitorSourceAfterEdit } from "@/lib/competitor-source";
import {
  competitorHandlesFromEntries,
  normalizeHandle,
  readWorkspace,
  writeWorkspace,
} from "@/lib/workspace-store";

const MAX = 3;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    handle?: string;
  };
  const action = String(body.action || "").trim();
  const ws = readWorkspace();

  if (action === "remove") {
    const target = normalizeHandle(String(body.handle || ""));
    if (!target) {
      return Response.json({ error: "Missing handle" }, { status: 400 });
    }
    const entries = (ws.competitorEntries || []).filter(
      (e) => normalizeHandle(e.handle) !== target,
    );
    const handles = entries.map((e) => normalizeHandle(e.handle));
    const nextSource = competitorSourceAfterEdit(entries, ws.competitorSource);
    writeWorkspace({
      ...ws,
      competitorEntries: entries,
      competitors: handles,
      manualCompetitors: nextSource === "manual" && handles.length ? handles : undefined,
      competitorSource: nextSource,
    });
    return Response.json({
      competitorEntries: entries,
      removed: target,
      competitorSource: nextSource,
    });
  }

  if (action === "add") {
    const raw = String(body.handle || "").trim();
    if (!raw) {
      return Response.json({ error: "Enter a channel @handle" }, { status: 400 });
    }
    const entries = [...(ws.competitorEntries || [])];
    const nextHandle = normalizeHandle(raw);
    if (entries.some((e) => normalizeHandle(e.handle) === nextHandle)) {
      return Response.json(
        { error: "That channel is already in your list" },
        { status: 400 },
      );
    }
    if (entries.length >= MAX) {
      return Response.json(
        { error: `Maximum ${MAX} competitors — remove one first` },
        { status: 400 },
      );
    }
    if (ws.myHandle && normalizeHandle(ws.myHandle) === nextHandle) {
      return Response.json(
        { error: "That’s your channel — pick a competitor" },
        { status: 400 },
      );
    }

    try {
      const bundle = await fetchChannelVideos(raw, 50);
      if (
        ws.channelId &&
        bundle.channelId === ws.channelId
      ) {
        return Response.json(
          { error: "That’s your channel — pick a competitor" },
          { status: 400 },
        );
      }
      if (entries.some((e) => e.channelId === bundle.channelId)) {
        return Response.json(
          { error: "That channel is already in your list" },
          { status: 400 },
        );
      }

      const entry = bundleToEntry(bundle, "manual");
      entries.push(entry);
      const manual = competitorHandlesFromEntries(entries);
      writeWorkspace({
        ...ws,
        competitorEntries: entries,
        competitors: manual,
        manualCompetitors: manual,
        competitorSource: "manual",
      });
      return Response.json({
        competitorEntries: entries,
        bundle,
        entry,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not resolve channel";
      return Response.json(
        { error: message, handle: nextHandle },
        { status: 404 },
      );
    }
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}