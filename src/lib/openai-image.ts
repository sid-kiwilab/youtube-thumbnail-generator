import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { REPO_ROOT } from "./paths";

const THUMB_SIZE = "1280x720";
const FALLBACK_SIZE = "1536x1024";
const QUALITY = "low";

export function openAiKey() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("Missing OPENAI_API_KEY in .env");
  return key;
}

export function imageModel() {
  return (
    process.env.OPENAI_IMAGE_MODEL?.trim() ||
    "gpt-image-2.5-sunburst"
  );
}

async function loadRefBuffer(ref: string): Promise<Buffer> {
  if (ref.startsWith("http://") || ref.startsWith("https://")) {
    const res = await fetch(ref);
    if (!res.ok) throw new Error(`Could not fetch ref image (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
  if (ref.startsWith("/")) {
    const abs = join(REPO_ROOT, "public", ref.replace(/^\//, "").replace(/\//g, "\\"));
    const posix = join(REPO_ROOT, "public", ...ref.split("/").filter(Boolean));
    const path = existsSync(posix) ? posix : abs;
    if (!existsSync(path)) throw new Error(`Ref not found: ${ref}`);
    return readFileSync(path);
  }
  if (existsSync(ref)) return readFileSync(ref);
  throw new Error(`Ref not found: ${ref}`);
}

export async function generateThumbnailImage(
  prompt: string,
  refUrls: string[],
): Promise<Buffer> {
  const refs = await Promise.all(refUrls.map(loadRefBuffer));

  function buildForm(size: string) {
    const form = new FormData();
    form.append("model", imageModel());
    form.append("prompt", prompt);
    form.append("quality", QUALITY);
    form.append("size", size);
    form.append("output_format", "jpeg");
    for (const buf of refs) {
      form.append(
        "image[]",
        new Blob([new Uint8Array(buf)], { type: "image/jpeg" }),
        "ref.jpg",
      );
    }
    return form;
  }

  async function post(size: string) {
    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${openAiKey()}` },
      body: buildForm(size),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  let { res, data } = await post(THUMB_SIZE);
  if (!res.ok && /size|resolution|invalid|model/i.test(String(data?.error?.message || ""))) {
    ({ res, data } = await post(FALLBACK_SIZE));
  }
  if (!res.ok) {
    const msg = data?.error?.message || `OpenAI images ${res.status}`;
    if (
      String(msg).includes("model") ||
      String(msg).includes("does not exist")
    ) {
      throw new Error(
        `${msg}. Try OPENAI_IMAGE_MODEL=gpt-image-2.5-flare or gpt-image-2 in .env`,
      );
    }
    throw new Error(msg);
  }

  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image bytes from OpenAI");

  const raw = Buffer.from(b64, "base64");
  return sharp(raw)
    .resize(1280, 720, { fit: "cover", position: "attention" })
    .jpeg({ quality: 88 })
    .toBuffer();
}

export function durationFromPath(): string {
  return "0:00";
}