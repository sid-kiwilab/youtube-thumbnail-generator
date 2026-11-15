import { fetchChannelVideos } from "@/lib/youtube-client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get("input") || searchParams.get("handle") || "";
  if (!input.trim()) {
    return Response.json({ error: "Missing input" }, { status: 400 });
  }
  try {
    const bundle = await fetchChannelVideos(input.trim(), 50);
    return Response.json(bundle);
  } catch (err) {
    const message = err instanceof Error ? err.message : "YouTube fetch failed";
    return Response.json({ error: message }, { status: 502 });
  }
}