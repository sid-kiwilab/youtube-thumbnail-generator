import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { DATA_DIR, WORKSPACE_PATH } from "./paths";

export type CompetitorEntry = {
  handle: string;
  channelId: string;
  title: string;
  subscriberCount: number;
  thumbnailUrl?: string;
  source?: "search" | "manual";
};

export type Workspace = {
  myHandle?: string;
  channelId?: string;
  channelTitle?: string;
  subscriberCount?: number;
  channelThumbnailUrl?: string;
  nicheQuery?: string;
  nicheSummary?: string;
  nicheInferredBy?: "llm" | "heuristic";
  /** How auto competitors were chosen (niche can still be llm) */
  competitorInferredBy?: "llm" | "heuristic";
  /** Last auto-discovered competitor handles */
  competitors?: string[];
  competitorEntries?: CompetitorEntry[];
  /** If set, load uses these instead of YouTube search */
  manualCompetitors?: string[];
  competitorSource?: "manual" | "search";
};

const MAX_COMPETITORS = 3;

export function normalizeHandle(h: string): string {
  const t = h.trim();
  if (!t) return "";
  return t.startsWith("@") ? t : `@${t}`;
}

export function competitorHandlesFromEntries(
  entries: CompetitorEntry[] | undefined,
): string[] {
  return (entries || []).map((e) => normalizeHandle(e.handle)).slice(0, MAX_COMPETITORS);
}

export function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function readWorkspace(): Workspace {
  ensureDataDir();
  if (!existsSync(WORKSPACE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(WORKSPACE_PATH, "utf8")) as Workspace;
  } catch {
    return {};
  }
}

export function writeWorkspace(data: Workspace) {
  ensureDataDir();
  writeFileSync(WORKSPACE_PATH, JSON.stringify(data, null, 2) + "\n");
}