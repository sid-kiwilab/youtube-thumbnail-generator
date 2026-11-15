"use client";

import { formatSubscribers } from "@/lib/format-subs";
import type { ChannelBundle } from "@/lib/youtube-types";
import type { CompetitorEntry } from "@/lib/workspace-store";
import { CompetitorList } from "./CompetitorList";

export function ChannelSetupCard({
  myChannel,
  myHandleInput,
  onHandleChange,
  onLoad,
  loading,
  nicheQuery,
  nicheSummary,
  nicheInferredBy,
  competitorInferredBy,
  competitorSource,
  competitorEntries,
  competitorBusy,
  addValue,
  addError,
  onAddValueChange,
  onAddCompetitor,
  onRemoveCompetitor,
  onRefetchNiche,
  onRefetchCompetitors,
  refetchBusy,
}: {
  myChannel: ChannelBundle | null;
  myHandleInput: string;
  onHandleChange: (v: string) => void;
  onLoad: () => void;
  loading: boolean;
  nicheQuery: string | null;
  nicheSummary: string | null;
  nicheInferredBy: "llm" | "heuristic" | null;
  competitorInferredBy: "llm" | "heuristic" | null;
  competitorSource: "manual" | "search" | null;
  competitorEntries: CompetitorEntry[];
  competitorBusy: boolean;
  addValue: string;
  addError: string | null;
  onAddValueChange: (v: string) => void;
  onAddCompetitor: () => void;
  onRemoveCompetitor: (handle: string) => void;
  onRefetchNiche: () => void;
  onRefetchCompetitors: () => void;
  refetchBusy: "niche" | "competitors" | null;
}) {
  const nicheLabel =
    nicheSummary ||
    (nicheQuery ? nicheQuery : null) ||
    (myChannel?.title ? `Based on ${myChannel.title}` : null) ||
    "Load channel to detect niche";

  return (
    <section className="rounded-2xl border border-white/10 bg-[#121212] p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm">
          <span className="text-neutral-400">Your channel</span>
          <input
            value={myHandleInput}
            onChange={(e) => onHandleChange(e.target.value)}
            placeholder="@handle or youtube.com/@…"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-[#0f0f0f] px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={onLoad}
          className="w-full shrink-0 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-black hover:bg-white disabled:opacity-50 sm:w-auto"
        >
          {loading ? "Loading…" : "Load channel"}
        </button>
      </div>

      {myChannel ? (
        <div className="mt-5 border-t border-white/10 pt-5">
          <div className="flex gap-3">
            {myChannel.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={myChannel.thumbnailUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white/10"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-sm text-neutral-500">
                YT
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-white">
                {myChannel.title}
              </h2>
              <p className="text-sm text-neutral-400">
                {myChannel.handle.startsWith("@")
                  ? myChannel.handle
                  : `@${myChannel.handle}`}
                <span className="text-neutral-600"> · </span>
                {formatSubscribers(myChannel.subscriberCount)}
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                Niche
                {nicheInferredBy === "llm" ? " (OpenRouter)" : null}
                :{" "}
                <span className="text-neutral-300">{nicheLabel}</span>
              </p>
              {nicheInferredBy === "heuristic" &&
              competitorSource === "search" &&
              nicheSummary?.includes("OpenRouter not set") ? (
                <p className="mt-1 text-[11px] text-amber-200/90">
                  Add OPENROUTER_API_KEY for smarter niche and competitor picks.
                </p>
              ) : null}
              {nicheInferredBy === "heuristic" &&
              competitorSource === "search" &&
              nicheSummary?.includes("Smart niche failed") ? (
                <p className="mt-1 text-[11px] text-amber-200/90">
                  OpenRouter niche failed — using keywords. Check OPENROUTER_NICHE_MODEL.
                </p>
              ) : null}
              {competitorSource === "search" &&
              nicheInferredBy === "llm" &&
              competitorInferredBy === "heuristic" &&
              competitorEntries.length > 0 ? (
                <p className="mt-1 text-[11px] text-neutral-500">
                  Competitors from basic YouTube search order (niche via OpenRouter).
                </p>
              ) : null}
              {nicheQuery && nicheSummary && nicheInferredBy === "llm" ? (
                <p className="mt-1 text-[11px] text-neutral-600">
                  Search: {nicheQuery}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={loading || refetchBusy !== null}
                  onClick={onRefetchNiche}
                  className="rounded-lg border border-neutral-600 px-2.5 py-1 text-[11px] text-neutral-300 hover:bg-white/5 disabled:opacity-50"
                >
                  {refetchBusy === "niche"
                    ? "Refreshing niche…"
                    : "Refresh niche"}
                </button>
                <button
                  type="button"
                  disabled={
                    loading ||
                    refetchBusy !== null ||
                    competitorEntries.length >= 3
                  }
                  onClick={onRefetchCompetitors}
                  className="rounded-lg border border-neutral-600 px-2.5 py-1 text-[11px] text-neutral-300 hover:bg-white/5 disabled:opacity-50"
                >
                  {refetchBusy === "competitors"
                    ? "Finding competitors…"
                    : "Refresh competitors"}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-5">
            <CompetitorList
              entries={competitorEntries}
              busy={competitorBusy}
              addValue={addValue}
              addError={addError}
              onAddValueChange={onAddValueChange}
              onAdd={onAddCompetitor}
              onRemove={onRemoveCompetitor}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}