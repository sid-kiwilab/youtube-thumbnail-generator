import type { ChannelBundle } from "./youtube-types";
import type { CompetitorEntry } from "./workspace-store";

export function bundleToEntry(
  bundle: ChannelBundle,
  source: "search" | "manual",
): CompetitorEntry {
  return {
    handle: bundle.handle,
    channelId: bundle.channelId,
    title: bundle.title,
    subscriberCount: bundle.subscriberCount ?? 0,
    thumbnailUrl: bundle.thumbnailUrl,
    source,
  };
}

export function entriesFromBundles(
  bundles: ChannelBundle[],
  source: "search" | "manual",
): CompetitorEntry[] {
  return bundles.map((b) => bundleToEntry(b, source));
}