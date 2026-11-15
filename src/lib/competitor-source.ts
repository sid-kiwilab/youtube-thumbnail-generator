import type { CompetitorEntry } from "@/lib/workspace-store";

export function competitorSourceAfterEdit(
  entries: CompetitorEntry[],
  prev: "manual" | "search" | undefined,
): "manual" | "search" | undefined {
  if (entries.length === 0) return prev;
  if (entries.every((e) => e.source === "search")) return "search";
  return "manual";
}