import { readLatest, writeLatest } from "@/lib/generated-store";

export async function PATCH(request: Request) {
  let title = "";
  try {
    const body = await request.json();
    title = String(body?.title ?? "").trim();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!title || title.length > 100) {
    return Response.json({ error: "Title required (max 100 chars)" }, { status: 400 });
  }

  let latest;
  try {
    latest = readLatest();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "latest.json error";
    return Response.json({ error: msg }, { status: 404 });
  }

  writeLatest({
    ...latest,
    title,
    generatedAt: new Date().toISOString(),
  });

  return Response.json({ ok: true, title });
}
