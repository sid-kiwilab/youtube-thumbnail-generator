#!/usr/bin/env node
/**
 * Generate a YouTube title + 16:9 thumb from Neon prompt versions.
 * Settings: docs/generate.md
 *
 *   node scripts/generate.mjs --seed-only
 *   node scripts/generate.mjs --sync-json
 *   node scripts/generate.mjs --confirm [--thumb-only] [--new-title] [--sid-ref …] [--fail-ref …]
 *   node scripts/generate.mjs --add-version --kind title --notes "why"
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { loadEnv, notifyQuota } from "./telegram-notify.mjs";
import {
  addPromptVersion,
  ensurePromptTable,
  fillBrief,
  latestPrompt,
  seedPrompts,
  sqlClient,
} from "./lib/neon-prompts.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const THUMB_SIZE = "1280x720";
const FALLBACK_SIZE = "1536x1024";
const QUALITY = "low";

function arg(name, fallback = "") {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  return process.argv[i + 1] || fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function openaiKey() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("Missing OPENAI_API_KEY in .env");
  return key;
}

function imageModel() {
  return process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2";
}

function titleModel() {
  return process.env.OPENAI_LONGFORM_MODEL?.trim() || "gpt-5.6-terra";
}

async function openaiJson(path, body, vendor = "openai") {
  const res = await fetch(`https://api.openai.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `OpenAI ${res.status}`);
    err.status = res.status;
    err.error = data?.error;
    await notifyQuota(err, vendor);
    throw err;
  }
  return data;
}

async function generateTitle(prompt) {
  const data = await openaiJson("chat/completions", {
    model: titleModel(),
    messages: [
      { role: "system", content: "Return only the YouTube title. No quotes." },
      { role: "user", content: prompt },
    ],
  });
  const title = String(data.choices?.[0]?.message?.content || "")
    .trim()
    .replace(/^["']|["']$/g, "");
  if (!title) throw new Error("Empty title from OpenAI");
  return title;
}

function extractJpeg(video, seconds, dest) {
  const r = spawnSync(
    "ffmpeg",
    ["-y", "-ss", String(seconds), "-i", video, "-frames:v", "1", "-update", "1", "-q:v", "3", dest],
    { stdio: "pipe" },
  );
  if (r.status !== 0) {
    throw new Error(`ffmpeg still failed (${dest}): ${r.stderr?.toString() || r.status}`);
  }
}

async function generateThumb(prompt, refs) {
  function buildForm(size) {
    const form = new FormData();
    form.append("model", imageModel());
    form.append("prompt", prompt);
    form.append("quality", QUALITY);
    form.append("size", size);
    form.append("output_format", "jpeg");
    for (const ref of refs) {
      const buf = readFileSync(ref);
      form.append("image[]", new Blob([buf], { type: "image/jpeg" }), ref.split(/[\\/]/).pop());
    }
    return form;
  }

  async function post(size) {
    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey()}` },
      body: buildForm(size),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  let { res, data } = await post(THUMB_SIZE);
  if (!res.ok && /size|resolution|invalid/i.test(String(data?.error?.message || ""))) {
    console.warn(`size ${THUMB_SIZE} rejected; falling back to ${FALLBACK_SIZE}`);
    ({ res, data } = await post(FALLBACK_SIZE));
  }
  if (!res.ok) {
    const err = new Error(data?.error?.message || `OpenAI images ${res.status}`);
    err.status = res.status;
    err.error = data?.error;
    await notifyQuota(err, "openai");
    throw err;
  }
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image bytes from OpenAI");
  return Buffer.from(b64, "base64");
}

function thumbIdFromSrc(src) {
  return src.split("/").pop()?.replace(/\.jpg$/i, "") || src;
}

function thumbSortKey(src) {
  const m = src.match(/-v(\d+)\.jpg$/i);
  if (m) return Number(m[1]);
  return 0;
}

function normalizeThumbList(thumbs) {
  const bySrc = new Map();
  for (const t of thumbs) {
    const src = String(t.src || "").trim();
    if (!src) continue;
    bySrc.set(src, { ...t, id: thumbIdFromSrc(src), src });
  }
  return [...bySrc.values()].sort((a, b) => thumbSortKey(a.src) - thumbSortKey(b.src));
}

function restoreThumbsFromDisk(outDir, slug, thumbs) {
  const list = normalizeThumbList(thumbs);
  const bySrc = new Set(list.map((t) => t.src));
  if (!existsSync(outDir)) return list;
  for (const name of readdirSync(outDir)) {
    const numbered = name.match(new RegExp(`^${slug}-v(\\d+)\\.jpg$`, "i"));
    const bare = name === `${slug}.jpg`;
    if (!numbered && !bare) continue;
    const rel = `/generated/${name}`;
    if (bySrc.has(rel)) continue;
    list.push({ id: thumbIdFromSrc(rel), src: rel });
    bySrc.add(rel);
  }
  return normalizeThumbList(list);
}

function nextUnusedThumb(outDir, slug) {
  const used = new Set();
  if (existsSync(outDir)) {
    for (const name of readdirSync(outDir)) {
      const m = name.match(new RegExp(`^${slug}-v(\\d+)\\.jpg$`, "i"));
      if (m) used.add(Number(m[1]));
    }
  }
  if (existsSync(join(outDir, `${slug}.jpg`))) used.add(1);
  let n = used.size ? Math.max(...used) + 1 : 1;
  while (used.has(n)) n += 1;
  const abs = join(outDir, `${slug}-v${n}.jpg`);
  if (existsSync(abs)) {
    throw new Error(`refusing to overwrite existing thumb ${abs}`);
  }
  return { n, abs, rel: `/generated/${slug}-v${n}.jpg` };
}

async function toYouTubeThumb(buf) {
  return sharp(buf)
    .resize(1280, 720, { fit: "cover", position: "attention" })
    .jpeg({ quality: 88 })
    .toBuffer();
}

async function buildLayoutComposite(sidPath, failPath, dest) {
  const W = 1280;
  const H = 720;
  const leftW = 704;
  const sid = await sharp(sidPath)
    .resize(leftW, H, { fit: "cover", position: "attention" })
    .toBuffer();
  const fail = await sharp(failPath)
    .resize(W - leftW, H, { fit: "cover", position: "attention" })
    .toBuffer();
  await sharp({
    create: { width: W, height: H, channels: 3, background: "#111111" },
  })
    .composite([
      { input: sid, left: 0, top: 0 },
      { input: fail, left: leftW, top: 0 },
    ])
    .jpeg({ quality: 88 })
    .toFile(dest);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8").trim();
}

async function main() {
  loadEnv();
  const sql = sqlClient();
  await ensurePromptTable(sql);
  await seedPrompts(sql);

  if (hasFlag("--seed-only")) {
    const title = await latestPrompt(sql, "title");
    const thumb = await latestPrompt(sql, "thumbnail");
    console.log(`seeded. title v${title.version} · thumbnail v${thumb.version}`);
    return;
  }

  if (hasFlag("--add-version")) {
    const kind = arg("--kind");
    if (kind !== "title" && kind !== "thumbnail") {
      throw new Error("--kind must be title or thumbnail");
    }
    const notes = arg("--notes", "");
    const body = await readStdin();
    if (!body) throw new Error("Pass the new prompt body on stdin");
    const version = await addPromptVersion(sql, kind, body, notes);
    console.log(`${kind} v${version} saved`);
    return;
  }

  const slug = arg("--slug", "rizz-fails");
  const outDir = join(ROOT, "public", "generated");
  mkdirSync(outDir, { recursive: true });
  const latestPath = join(outDir, "latest.json");
  const prev = existsSync(latestPath) ? JSON.parse(readFileSync(latestPath, "utf8")) : {};

  if (hasFlag("--sync-json")) {
    const thumbsOut = restoreThumbsFromDisk(
      outDir,
      slug,
      Array.isArray(prev.thumbs) ? [...prev.thumbs] : [],
    );
    const thumb =
      prev.thumb && thumbsOut.some((t) => t.src === prev.thumb)
        ? prev.thumb
        : thumbsOut.at(-1)?.src || prev.thumb || "";
    const latest = {
      ...prev,
      slug,
      thumb,
      thumbs: thumbsOut,
      duration: prev.duration || "4:31",
      channel: prev.channel || "@sidvenkman",
    };
    writeFileSync(latestPath, JSON.stringify(latest, null, 2) + "\n");
    console.log(`synced latest.json (${thumbsOut.length} thumbs, no OpenAI)`);
    return;
  }

  if (!hasFlag("--confirm")) {
    throw new Error("OpenAI generate requires --confirm (see docs/generate.md)");
  }

  const sidRef = arg("--sid-ref");
  const failRef = arg("--fail-ref");
  const react = arg("--react");
  const fails = arg("--fails");
  if (!sidRef && !react) {
    throw new Error("pass --sid-ref public/refs/faces/... or --react path/to/reaction.mp4");
  }
  if (!failRef && !fails) {
    throw new Error("pass --fail-ref public/refs/faces/... or --fails path/to/fails.mp4");
  }
  const brief = arg(
    "--brief",
    "Reaction-style YouTube video: cringe compilation, ~4–5 minutes.",
  );

  const titleRow = await latestPrompt(sql, "title");
  const thumbRow = await latestPrompt(sql, "thumbnail");
  const titlePrompt = fillBrief(titleRow.body, brief);

  let title = String(prev.title || "").trim();
  const thumbOnly = hasFlag("--thumb-only");
  if (!thumbOnly && (!title || hasFlag("--new-title"))) {
    console.log(`prompts: title v${titleRow.version} · thumbnail v${thumbRow.version}`);
    console.log(`title via ${titleModel()}`);
    title = await generateTitle(titlePrompt);
  } else if (thumbOnly) {
    console.log(`prompts: thumbnail v${thumbRow.version} · --thumb-only (keeping title)`);
  } else {
    console.log(`prompts: thumbnail v${thumbRow.version} · keeping title`);
  }
  console.log(`title: ${title}`);

  const frameDir = join(ROOT, ".cache", "generate-frames");
  mkdirSync(frameDir, { recursive: true });
  const sidPath = join(frameDir, "sid-identity.jpg");
  const failPath = join(frameDir, "fail-example.jpg");
  const layoutPath = join(frameDir, "layout-composite.jpg");
  if (sidRef) {
    await sharp(sidRef).jpeg({ quality: 90 }).toFile(sidPath);
  } else {
    extractJpeg(react, 25, sidPath);
  }
  if (failRef) {
    const failImg = sharp(failRef);
    const meta = await failImg.metadata();
    const w = meta.width || 1000;
    const h = meta.height || 1000;
    // Tall source stills (Omegle 9:16) keep the top crop. Tight face crops stay intact.
    if (h > w * 1.35) {
      const cropH = Math.round(h * 0.48);
      await failImg.extract({ left: 0, top: 0, width: w, height: cropH }).jpeg({ quality: 90 }).toFile(failPath);
    } else {
      await failImg.jpeg({ quality: 90 }).toFile(failPath);
    }
  } else {
    extractJpeg(fails, 360, failPath);
  }
  const refPaths = [sidPath, failPath];
  if (!sidRef || !failRef) {
    await buildLayoutComposite(sidPath, failPath, layoutPath);
    refPaths.push(layoutPath);
  }

  console.log(`thumb via ${imageModel()} quality=${QUALITY} size=${THUMB_SIZE}`);
  const raw = await generateThumb(thumbRow.body, refPaths);
  const jpg = await toYouTubeThumb(raw);

  let thumbs = normalizeThumbList(Array.isArray(prev.thumbs) ? [...prev.thumbs] : []);
  const slot = nextUnusedThumb(outDir, slug);
  writeFileSync(slot.abs, jpg);
  thumbs.push({
    id: thumbIdFromSrc(slot.rel),
    src: slot.rel,
    thumbnailVersion: thumbRow.version,
    generatedAt: new Date().toISOString(),
  });
  const thumbsOut = normalizeThumbList(thumbs);

  const latest = {
    slug,
    title,
    thumb: slot.rel,
    thumbs: thumbsOut,
    duration: prev.duration || "4:31",
    channel: "@sidvenkman",
    titleVersion: titleRow.version,
    thumbnailVersion: thumbRow.version,
    image: {
      model: imageModel(),
      quality: QUALITY,
      size: THUMB_SIZE,
    },
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(latestPath, JSON.stringify(latest, null, 2) + "\n");
  console.log(`wrote public${slot.rel}`);
  console.log(`latest.json now has ${thumbsOut.length} thumbs`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
