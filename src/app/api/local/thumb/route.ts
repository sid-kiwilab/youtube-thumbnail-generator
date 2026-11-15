import { deleteLocalThumb } from "@/lib/local-store";

export async function DELETE(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { src?: string };
  const src = String(body.src || "").trim();
  if (!src) {
    return Response.json({ error: "Missing src" }, { status: 400 });
  }
  const ok = deleteLocalThumb(src);
  if (!ok) {
    return Response.json({ error: "Could not delete thumb" }, { status: 400 });
  }
  return Response.json({ ok: true });
}