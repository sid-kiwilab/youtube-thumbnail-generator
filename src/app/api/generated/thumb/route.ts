import { existsSync, unlinkSync } from "node:fs";
import {
  absPathForSrc,
  isSafeGeneratedSrc,
  readLatest,
  writeLatest,
} from "@/lib/generated-store";

export async function DELETE(request: Request) {
  let src = "";
  try {
    const body = await request.json();
    src = String(body?.src ?? "").trim();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isSafeGeneratedSrc(src)) {
    return Response.json({ error: "Invalid thumb path" }, { status: 400 });
  }

  const abs = absPathForSrc(src);
  if (!abs) {
    return Response.json({ error: "Invalid path" }, { status: 400 });
  }

  let latest;
  try {
    latest = readLatest();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "latest.json error";
    return Response.json({ error: msg }, { status: 404 });
  }

  const inList = Array.isArray(latest.thumbs) && latest.thumbs.some((t) => t.src === src);
  const fileExists = existsSync(abs);

  if (!inList && !fileExists) {
    return Response.json({ error: "Thumb not found" }, { status: 404 });
  }

  if (fileExists) {
    unlinkSync(abs);
  }

  if (!inList) {
    return Response.json({ ok: true, orphan: true, src });
  }

  const thumbs = latest.thumbs!.filter((t) => t.src !== src);
  const nextThumb =
    latest.thumb === src ? thumbs.at(-1)?.src ?? "" : latest.thumb ?? thumbs.at(-1)?.src ?? "";

  writeLatest({
    ...latest,
    thumb: nextThumb,
    thumbs,
    generatedAt: new Date().toISOString(),
  });

  return Response.json({ ok: true, thumb: nextThumb, thumbs });
}
