import { titlePrompt } from "@/lib/prompts";
import { generateTitle } from "@/lib/openrouter";
import { readLocalLatest, writeLocalLatest } from "@/lib/local-store";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    brief?: string;
    channel?: string;
    examples?: { title: string; viewCount: number }[];
  };
  const brief = String(body.brief || "").trim();
  if (!brief) {
    return Response.json({ error: "Missing brief" }, { status: 400 });
  }
  const channel = String(body.channel || "@yourchannel").trim();
  const examples = (body.examples || [])
    .slice(0, 8)
    .map((e) => `- ${e.title} (${e.viewCount.toLocaleString()} views)`)
    .join("\n");

  try {
    const prompt = titlePrompt({
      channel,
      examples: examples || "- (no examples yet)",
      brief,
    });
    const title = await generateTitle(prompt);
    const latest = readLocalLatest();
    latest.title = title;
    latest.channel = channel;
    writeLocalLatest(latest);
    return Response.json({ title });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Title generation failed";
    return Response.json({ error: message }, { status: 502 });
  }
}