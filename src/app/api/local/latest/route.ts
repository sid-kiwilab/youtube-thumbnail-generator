import { readLocalLatest, writeLocalLatest } from "@/lib/local-store";

export async function GET() {
  return Response.json(readLocalLatest());
}

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const title = String(body.title || "").trim();
  if (!title) {
    return Response.json({ error: "Missing title" }, { status: 400 });
  }
  const latest = readLocalLatest();
  latest.title = title;
  writeLocalLatest(latest);
  return Response.json(latest);
}