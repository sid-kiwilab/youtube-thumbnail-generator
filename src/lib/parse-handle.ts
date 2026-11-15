export function normalizeYouTubeInput(input: string): {
  handle?: string;
  channelId?: string;
} {
  const raw = input.trim();
  if (!raw) return {};

  if (/^UC[\w-]{20,}$/i.test(raw)) {
    return { channelId: raw };
  }

  const channelMatch = raw.match(
    /youtube\.com\/channel\/(UC[\w-]+)/i,
  );
  if (channelMatch) return { channelId: channelMatch[1] };

  const handleMatch = raw.match(/youtube\.com\/@([\w.-]+)/i);
  if (handleMatch) return { handle: handleMatch[1] };

  const at = raw.startsWith("@") ? raw.slice(1) : raw;
  if (/^[\w.-]{2,}$/.test(at) && !at.includes("/")) {
    return { handle: at };
  }

  return { handle: at.replace(/^@/, "") };
}