"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChannelSetupCard } from "@/components/ChannelSetupCard";
import { CollapsibleCompareSection } from "@/components/CollapsibleCompareSection";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SelectedRefsBar } from "@/components/SelectedRefsBar";
import { SupportingRefsPanel } from "@/components/SupportingRefsPanel";
import type { RefAnalysisResult, SelectedRefMeta } from "@/lib/ref-types";
import type { ChannelBundle, YouTubeVideo } from "@/lib/youtube-types";
import type { CompetitorEntry } from "@/lib/workspace-store";

type Workspace = {
  myHandle?: string;
  nicheQuery?: string;
  nicheSummary?: string;
  nicheInferredBy?: "llm" | "heuristic";
  competitorInferredBy?: "llm" | "heuristic";
  competitorSource?: "manual" | "search";
  competitorEntries?: CompetitorEntry[];
};

function SectionTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold text-white">{children}</h2>
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    </div>
  );
}

function normHandle(h: string) {
  return h.replace(/^@/, "").trim().toLowerCase();
}

function videoToRanked(v: YouTubeVideo) {
  return {
    id: v.id,
    title: v.title,
    viewCount: v.viewCount,
    duration: v.duration,
    thumbUrl: v.thumbUrl,
  };
}

export function ThumbnailStudio() {
  const [myHandleInput, setMyHandleInput] = useState("");
  const [nicheQuery, setNicheQuery] = useState<string | null>(null);
  const [nicheSummary, setNicheSummary] = useState<string | null>(null);
  const [nicheInferredBy, setNicheInferredBy] = useState<
    "llm" | "heuristic" | null
  >(null);
  const [competitorInferredBy, setCompetitorInferredBy] = useState<
    "llm" | "heuristic" | null
  >(null);
  const [competitorSource, setCompetitorSource] = useState<
    "manual" | "search" | null
  >(null);
  const [competitorEntries, setCompetitorEntries] = useState<CompetitorEntry[]>(
    [],
  );
  const [myChannel, setMyChannel] = useState<ChannelBundle | null>(null);
  const [nicheChannels, setNicheChannels] = useState<ChannelBundle[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState("");
  const [suggestedTitle, setSuggestedTitle] = useState("");
  const [localThumbs, setLocalThumbs] = useState<{ src: string }[]>([]);
  const [evalNote, setEvalNote] = useState<string | null>(null);
  const [refByUrl, setRefByUrl] = useState<Record<string, SelectedRefMeta>>({});
  const [supportingSrcs, setSupportingSrcs] = useState<string[]>([]);
  const [refAnalysis, setRefAnalysis] = useState<RefAnalysisResult | null>(
    null,
  );
  const [refAnalysisOpen, setRefAnalysisOpen] = useState(false);
  const [hasOpenRouter, setHasOpenRouter] = useState(false);
  const [pendingDeleteSrc, setPendingDeleteSrc] = useState<string | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [busyGen, setBusyGen] = useState<string | null>(null);
  const [workspaceHandle, setWorkspaceHandle] = useState("");
  const [competitorAdd, setCompetitorAdd] = useState("");
  const [competitorAddError, setCompetitorAddError] = useState<string | null>(
    null,
  );
  const [competitorBusy, setCompetitorBusy] = useState(false);
  const [refetchBusy, setRefetchBusy] = useState<
    "niche" | "competitors" | null
  >(null);
  const refetchGenRef = useRef(0);
  const thumbGenRef = useRef(0);

  const selectedRefs = useMemo(
    () => new Set(Object.keys(refByUrl)),
    [refByUrl],
  );
  const selectedRefList = useMemo(
    () => Object.values(refByUrl),
    [refByUrl],
  );

  const refLookup = useMemo(() => {
    const m = new Map<string, SelectedRefMeta>();
    if (myChannel) {
      for (const v of myChannel.videos) {
        m.set(v.thumbUrl, {
          thumbUrl: v.thumbUrl,
          source: "mine",
          channelHandle: myChannel.handle,
          videoTitle: v.title,
        });
      }
    }
    for (const ch of nicheChannels) {
      for (const v of ch.videos) {
        m.set(v.thumbUrl, {
          thumbUrl: v.thumbUrl,
          source: "competitor",
          channelHandle: ch.handle,
          videoTitle: v.title,
        });
      }
    }
    return m;
  }, [myChannel, nicheChannels]);

  const applyStudioPayload = useCallback(
    (data: {
      mine?: ChannelBundle;
      competitors?: ChannelBundle[];
      competitorEntries?: CompetitorEntry[];
      nicheQuery?: string | null;
      nicheSummary?: string | null;
      nicheInferredBy?: "llm" | "heuristic" | null;
      competitorInferredBy?: "llm" | "heuristic" | null;
      competitorSource?: "manual" | "search" | null;
    }) => {
      if (data.mine) {
        setMyChannel(data.mine);
        setWorkspaceHandle(data.mine.handle);
      }
      if (Array.isArray(data.competitors)) {
        setNicheChannels(data.competitors);
      }
      if (Array.isArray(data.competitorEntries)) {
        setCompetitorEntries(data.competitorEntries);
      }
      setNicheQuery(data.nicheQuery?.trim() ? data.nicheQuery : null);
      setNicheSummary(data.nicheSummary?.trim() ? data.nicheSummary : null);
      setNicheInferredBy(
        data.nicheInferredBy === "llm" || data.nicheInferredBy === "heuristic"
          ? data.nicheInferredBy
          : null,
      );
      setCompetitorInferredBy(
        data.competitorInferredBy === "llm" ||
          data.competitorInferredBy === "heuristic"
          ? data.competitorInferredBy
          : null,
      );
      setCompetitorSource(data.competitorSource ?? null);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const wsRes = await fetch("/api/workspace");
        const ws = (await wsRes.json()) as Workspace;
        if (cancelled) return;
        setMyHandleInput(ws.myHandle || "");
        setWorkspaceHandle(ws.myHandle || "");
        if (ws.nicheQuery) setNicheQuery(ws.nicheQuery);
        if (ws.nicheSummary) setNicheSummary(ws.nicheSummary);
        if (ws.nicheInferredBy) setNicheInferredBy(ws.nicheInferredBy);
        if (ws.competitorInferredBy) {
          setCompetitorInferredBy(ws.competitorInferredBy);
        }
        if (ws.competitorSource) setCompetitorSource(ws.competitorSource);
        if (ws.competitorEntries?.length) {
          setCompetitorEntries(ws.competitorEntries);
        }

        if (ws.myHandle?.trim()) {
          setLoading("bootstrap");
          try {
            const boot = await fetch("/api/youtube/bootstrap");
            const data = await boot.json().catch(() => ({}));
            if (cancelled) return;
            if (boot.ok && data.mine) {
              applyStudioPayload(data);
              if (
                Array.isArray(data.bootstrapFailed) &&
                data.bootstrapFailed.length
              ) {
                setError(
                  `Could not refresh: ${data.bootstrapFailed.join(", ")} (showing last saved info)`,
                );
              }
            } else if (data.error) {
              setError(data.error);
            }
          } finally {
            if (!cancelled) setLoading(null);
          }
        }
      } catch {
        /* workspace optional */
      }
    })();

    void fetch("/api/local/latest")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.title) setSuggestedTitle(data.title);
        if (Array.isArray(data.thumbs)) {
          setLocalThumbs(data.thumbs.map((t: { src: string }) => ({ src: t.src })));
        }
      })
      .catch(() => {});

    void fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setHasOpenRouter(Boolean(data.hasOpenRouter));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [applyStudioPayload]);

  const loadChannel = useCallback(async () => {
    const input = myHandleInput.trim();
    if (!input) {
      setError("Enter your channel @handle or URL");
      return;
    }
    setLoading("channel");
    setError(null);
    try {
      const inputNorm = normHandle(input);
      const savedNorm = normHandle(
        workspaceHandle || myChannel?.handle || "",
      );
      const sameChannel = Boolean(savedNorm && inputNorm === savedNorm);
      const manual =
        sameChannel &&
        competitorSource === "manual" &&
        competitorEntries.length > 0
          ? competitorEntries.map((e) => e.handle)
          : undefined;
      const res = await fetch("/api/youtube/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          manualCompetitors: manual,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Load failed (${res.status})`);
      applyStudioPayload(data);
      setMyHandleInput((data.mine as ChannelBundle)?.handle || input);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(null);
    }
  }, [
    applyStudioPayload,
    competitorEntries,
    competitorSource,
    myChannel,
    myHandleInput,
    workspaceHandle,
  ]);

  const addCompetitor = useCallback(async () => {
    const handle = competitorAdd.trim();
    if (!handle) return;
    setCompetitorBusy(true);
    setCompetitorAddError(null);
    try {
      const res = await fetch("/api/youtube/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", handle }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCompetitorAddError(data.error || "Could not add channel");
        return;
      }
      if (Array.isArray(data.competitorEntries)) {
        setCompetitorEntries(data.competitorEntries);
        setCompetitorSource("manual");
      }
      if (data.bundle) {
        setNicheChannels((prev) => {
          const bundle = data.bundle as ChannelBundle;
          if (prev.some((c) => c.channelId === bundle.channelId)) return prev;
          return [...prev, bundle];
        });
      }
      setCompetitorAdd("");
    } catch (e) {
      setCompetitorAddError(e instanceof Error ? e.message : "Add failed");
    } finally {
      setCompetitorBusy(false);
    }
  }, [competitorAdd]);

  const removeCompetitor = useCallback(async (handle: string) => {
    setCompetitorBusy(true);
    setCompetitorAddError(null);
    try {
      const res = await fetch("/api/youtube/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", handle }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCompetitorAddError(data.error || "Remove failed");
        return;
      }
      if (Array.isArray(data.competitorEntries)) {
        setCompetitorEntries(data.competitorEntries);
      }
      if (data.competitorSource === "manual" || data.competitorSource === "search") {
        setCompetitorSource(data.competitorSource);
      }
      const norm = handle.replace(/^@/, "").toLowerCase();
      setNicheChannels((prev) =>
        prev.filter(
          (c) => c.handle.replace(/^@/, "").toLowerCase() !== norm,
        ),
      );
    } catch (e) {
      setCompetitorAddError(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setCompetitorBusy(false);
    }
  }, []);

  const refetchNiche = useCallback(async () => {
    if (!myChannel) return;
    const gen = ++refetchGenRef.current;
    setRefetchBusy("niche");
    setCompetitorAddError(null);
    try {
      const res = await fetch("/api/youtube/refetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "niche" }),
      });
      const data = await res.json().catch(() => ({}));
      if (gen !== refetchGenRef.current) return;
      if (!res.ok) {
        setCompetitorAddError(data.error || "Refresh niche failed");
        return;
      }
      if (data.mine) setMyChannel(data.mine as ChannelBundle);
      setNicheQuery(data.nicheQuery?.trim() ? data.nicheQuery : null);
      setNicheSummary(data.nicheSummary?.trim() ? data.nicheSummary : null);
      setNicheInferredBy(
        data.nicheInferredBy === "llm" || data.nicheInferredBy === "heuristic"
          ? data.nicheInferredBy
          : null,
      );
    } catch (e) {
      if (gen === refetchGenRef.current) {
        setCompetitorAddError(
          e instanceof Error ? e.message : "Refresh niche failed",
        );
      }
    } finally {
      if (gen === refetchGenRef.current) setRefetchBusy(null);
    }
  }, [myChannel]);

  const refetchCompetitors = useCallback(async () => {
    if (!myChannel) return;
    const gen = ++refetchGenRef.current;
    setRefetchBusy("competitors");
    setCompetitorAddError(null);
    try {
      const res = await fetch("/api/youtube/refetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "competitors" }),
      });
      const data = await res.json().catch(() => ({}));
      if (gen !== refetchGenRef.current) return;
      if (!res.ok) {
        setCompetitorAddError(data.error || "Refresh competitors failed");
        return;
      }
      if (Array.isArray(data.competitorEntries)) {
        setCompetitorEntries(data.competitorEntries);
      }
      if (data.competitorSource === "manual" || data.competitorSource === "search") {
        setCompetitorSource(data.competitorSource);
      }
      if (
        data.competitorInferredBy === "llm" ||
        data.competitorInferredBy === "heuristic"
      ) {
        setCompetitorInferredBy(data.competitorInferredBy);
      }
      if (Array.isArray(data.addedBundles)) {
        setNicheChannels((prev) => {
          let next = [...prev];
          for (const bundle of data.addedBundles as ChannelBundle[]) {
            if (!next.some((c) => c.channelId === bundle.channelId)) {
              next = [...next, bundle];
            }
          }
          return next;
        });
      }
    } catch (e) {
      if (gen === refetchGenRef.current) {
        setCompetitorAddError(
          e instanceof Error ? e.message : "Refresh competitors failed",
        );
      }
    } finally {
      if (gen === refetchGenRef.current) setRefetchBusy(null);
    }
  }, [myChannel]);

  const titleExamples = useMemo(
    () =>
      (myChannel?.videos || []).slice(0, 8).map((v) => ({
        title: v.title,
        viewCount: v.viewCount,
      })),
    [myChannel],
  );

  const toggleRef = (thumbUrl: string) => {
    const meta = refLookup.get(thumbUrl);
    if (!meta) return;
    setRefByUrl((prev) => {
      if (prev[thumbUrl]) {
        const next = { ...prev };
        delete next[thumbUrl];
        return next;
      }
      if (Object.keys(prev).length >= 4) return prev;
      return { ...prev, [thumbUrl]: meta };
    });
    setRefAnalysis(null);
  };

  const removeRef = (thumbUrl: string) => {
    setRefByUrl((prev) => {
      if (!prev[thumbUrl]) return prev;
      const next = { ...prev };
      delete next[thumbUrl];
      return next;
    });
    setRefAnalysis(null);
  };

  const clearAllRefs = () => {
    setRefByUrl({});
    setRefAnalysis(null);
  };

  const runTitle = async () => {
    if (!brief.trim()) {
      setError("Write a brief for the new video");
      return;
    }
    setBusyGen("title");
    setError(null);
    try {
      const res = await fetch("/api/suggest/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief,
          channel: myChannel?.handle || workspaceHandle || "@yourchannel",
          examples: titleExamples,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Title failed");
      setSuggestedTitle(data.title);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Title failed");
    } finally {
      setBusyGen(null);
    }
  };

  const runThumb = async () => {
    if (!brief.trim()) {
      setError("Write a brief");
      return;
    }
    if (!selectedRefList.length) {
      setError(
        "Select at least one reference thumb (Use ref on your or competitor videos)",
      );
      return;
    }
    const gen = ++thumbGenRef.current;
    setError(null);
    setRefAnalysis(null);

    let analysis: RefAnalysisResult | null = null;
    if (hasOpenRouter) {
      setBusyGen("analyze");
      try {
        const res = await fetch("/api/eval/refs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            refs: selectedRefList,
            channelTitle: myChannel?.title || "Your channel",
            channelHandle: myChannel?.handle || workspaceHandle,
            channelAvatar: myChannel?.thumbnailUrl || "",
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (gen !== thumbGenRef.current) return;
        if (!res.ok) throw new Error(data.error || "Ref analysis failed");
        analysis = {
          items: data.items ?? [],
          summary: data.summary ?? "",
        };
        setRefAnalysis(analysis);
      } catch (e) {
        if (gen === thumbGenRef.current) {
          setError(e instanceof Error ? e.message : "Ref analysis failed");
          setBusyGen(null);
        }
        return;
      }
    }

    if (gen !== thumbGenRef.current) return;
    setBusyGen("thumb");
    try {
      const res = await fetch("/api/suggest/thumb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief,
          refMeta: selectedRefList,
          refAnalysis: analysis,
          supportingSrcs: supportingSrcs,
          title: suggestedTitle,
          slug: "draft",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (gen !== thumbGenRef.current) return;
      if (!res.ok) throw new Error(data.error || "Thumbnail failed");
      setLocalThumbs((old) => [...old, { src: data.src }]);
    } catch (e) {
      if (gen === thumbGenRef.current) {
        setError(e instanceof Error ? e.message : "Thumbnail failed");
      }
    } finally {
      if (gen === thumbGenRef.current) setBusyGen(null);
    }
  };

  const confirmDeleteLocal = async () => {
    if (!pendingDeleteSrc || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/local/thumb", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ src: pendingDeleteSrc }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setLocalThumbs((old) => old.filter((t) => t.src !== pendingDeleteSrc));
      setPendingDeleteSrc(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const runEval = async (src: string) => {
    const absolute = src.startsWith("http")
      ? src
      : `${window.location.origin}${src}`;
    setBusyGen("eval");
    setEvalNote(null);
    setError(null);
    try {
      const res = await fetch("/api/eval/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: absolute }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Eval failed");
      setEvalNote(
        `Score ${data.score}/5 — ${data.notes} (${data.disclaimer || "model opinion only"})`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eval failed");
    } finally {
      setBusyGen(null);
    }
  };

  const channelLoading =
    loading === "channel" || loading === "bootstrap";

  return (
    <div className="min-h-full bg-[#0f0f0f] text-[#f1f1f1]">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0f0f0f]/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff0000] text-sm font-bold">
            YT
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Thumbnail generator</p>
            <p className="truncate text-[10px] text-neutral-500">
              Self-hosted · saved in data/workspace.json
            </p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="border-b border-[#cc0000]/40 bg-[#cc0000]/10 px-4 py-2 text-center text-sm text-[#ffb4b4]">
          {error}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="mx-auto max-w-xl space-y-6 px-4 py-6">
        <ChannelSetupCard
          myChannel={myChannel}
          myHandleInput={myHandleInput}
          onHandleChange={setMyHandleInput}
          onLoad={() => void loadChannel()}
          loading={channelLoading}
          nicheQuery={nicheQuery}
          nicheSummary={nicheSummary}
          nicheInferredBy={nicheInferredBy}
          competitorInferredBy={competitorInferredBy}
          competitorSource={competitorSource}
          competitorEntries={competitorEntries}
          competitorBusy={competitorBusy}
          addValue={competitorAdd}
          addError={competitorAddError}
          onAddValueChange={(v) => {
            setCompetitorAdd(v);
            setCompetitorAddError(null);
          }}
          onAddCompetitor={() => void addCompetitor()}
          onRemoveCompetitor={(h) => void removeCompetitor(h)}
          onRefetchNiche={() => void refetchNiche()}
          onRefetchCompetitors={() => void refetchCompetitors()}
          refetchBusy={refetchBusy}
        />

        {loading === "bootstrap" && !myChannel ? (
          <p className="text-center text-sm text-neutral-500">
            Restoring saved channel…
          </p>
        ) : null}

        {myChannel ? (
          <div className="space-y-3">
            <SectionTitle hint="Sorted by views · tap Use ref (yours or competitors, max 4)">
              Your thumbnails
            </SectionTitle>
            {myChannel.videos.length === 0 ? (
              <p className="rounded-lg border border-amber-600/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-100">
                No long-form uploads after Shorts filter.
              </p>
            ) : (
              <CollapsibleCompareSection
                channel={myChannel}
                videos={myChannel.videos.map(videoToRanked)}
                defaultOpen
                selectable
                selectedRefs={selectedRefs}
                onToggleSelect={toggleRef}
              />
            )}
          </div>
        ) : null}

        {myChannel && nicheChannels.length === 0 && !channelLoading ? (
          <p className="rounded-lg border border-neutral-800 bg-[#121212] px-3 py-2 text-xs text-neutral-500">
            No compare channels loaded — add competitors above or reload to
            auto-search.
          </p>
        ) : null}

        {nicheChannels.length > 0 ? (
          <div className="space-y-3">
            <SectionTitle hint="Collapsed by default — expand and tap Use ref on competitor hooks">
              Niche compare
            </SectionTitle>
            <div className="space-y-2">
              {nicheChannels.map((ch) => (
                <CollapsibleCompareSection
                  key={ch.channelId}
                  channel={ch}
                  videos={ch.videos.map(videoToRanked)}
                  selectable
                  selectedRefs={selectedRefs}
                  onToggleSelect={toggleRef}
                />
              ))}
            </div>
          </div>
        ) : null}

        {selectedRefList.length ? (
          <SelectedRefsBar
            refs={selectedRefList}
            onRemove={removeRef}
            onClearAll={clearAllRefs}
          />
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-[#121212] p-4 sm:p-5">
          <SectionTitle
            hint={
              hasOpenRouter
                ? "OpenRouter ref analysis · OpenAI thumb · saved locally"
                : "Add OPENROUTER_API_KEY for ref analysis before generate"
            }
          >
            Suggest for a new video
          </SectionTitle>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            placeholder="What's the new video about?"
            className="w-full rounded-lg border border-neutral-700 bg-[#0f0f0f] px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
          <SupportingRefsPanel
            selected={supportingSrcs}
            onChangeSelected={setSupportingSrcs}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busyGen === "title"}
              onClick={() => void runTitle()}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20 disabled:opacity-50"
            >
              {busyGen === "title" ? "Writing title…" : "Suggest title"}
            </button>
            <button
              type="button"
              disabled={busyGen === "thumb" || busyGen === "analyze"}
              onClick={() => void runThumb()}
              className="rounded-lg bg-[#ff0000] px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
            >
              {busyGen === "analyze"
                ? "Analyzing refs…"
                : busyGen === "thumb"
                  ? "Generating…"
                  : "Generate thumbnail"}
            </button>
          </div>
          {refAnalysis ? (
            <div className="mt-4 rounded-lg border border-neutral-700 bg-black/30 p-3 text-xs text-neutral-300">
              <button
                type="button"
                className="mb-1 font-semibold text-neutral-400 underline"
                onClick={() => setRefAnalysisOpen((v) => !v)}
              >
                {refAnalysisOpen ? "Hide" : "Show"} ref analysis
              </button>
              <p className="text-neutral-200">{refAnalysis.summary}</p>
              {refAnalysisOpen ? (
                <ul className="mt-2 list-inside list-disc space-y-1 text-neutral-400">
                  {refAnalysis.items.map((it) => (
                    <li key={it.thumbUrl}>
                      [{it.source}] {it.layoutToBorrow}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {suggestedTitle ? (
            <p className="mt-4 text-sm">
              <span className="text-neutral-500">Title: </span>
              {suggestedTitle}
            </p>
          ) : null}
          {localThumbs.length ? (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Local generations
              </p>
              <div className="flex flex-wrap gap-3">
                {localThumbs.map((t) => (
                  <div key={t.src} className="relative w-36">
                    <button
                      type="button"
                      aria-label="Delete local thumbnail"
                      onClick={() => setPendingDeleteSrc(t.src)}
                      className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-sm text-white hover:bg-red-600"
                    >
                      ×
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.src}
                      alt=""
                      className="aspect-video w-full rounded-lg object-cover"
                    />
                    <div className="mt-1 flex gap-2">
                      <a
                        href={t.src}
                        download
                        className="text-[10px] text-red-400 underline"
                      >
                        Download
                      </a>
                      <button
                        type="button"
                        className="text-[10px] text-neutral-400 underline"
                        disabled={busyGen === "eval"}
                        onClick={() => void runEval(t.src)}
                      >
                        Vision
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {evalNote ? (
            <p className="mt-4 rounded-lg border border-neutral-700 bg-black/40 p-3 text-xs text-neutral-300">
              {evalNote}
            </p>
          ) : null}
        </section>
      </div>

      <ConfirmDialog
        open={pendingDeleteSrc !== null}
        title="Delete local thumbnail?"
        description="Removes this file from public/local and from latest.json. This cannot be undone."
        confirmLabel="Delete"
        busy={deleting}
        onCancel={() => setPendingDeleteSrc(null)}
        onConfirm={() => void confirmDeleteLocal()}
      />
    </div>
  );
}