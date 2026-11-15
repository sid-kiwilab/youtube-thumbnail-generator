import { visionEval } from "@/lib/openrouter";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { image?: string };
  const image = String(body.image || "").trim();
  if (!image) {
    return Response.json({ error: "Missing image URL" }, { status: 400 });
  }
  try {
    const result = await visionEval(image);
    return Response.json({
      ...result,
      disclaimer: "Model opinion only — not YouTube CTR or analytics.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Vision eval failed";
    return Response.json({ error: message }, { status: 502 });
  }
}