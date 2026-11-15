import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";
import { LOCAL_DIR, LOCAL_LATEST_PATH } from "./paths";

export type LocalThumb = {
  id: string;
  src: string;
  generatedAt?: string;
};

export type LocalLatest = {
  slug?: string;
  title?: string;
  thumb?: string;
  thumbs?: LocalThumb[];
  channel?: string;
};

export function ensureLocalDir() {
  if (!existsSync(LOCAL_DIR)) mkdirSync(LOCAL_DIR, { recursive: true });
}

export function isSafeLocalSrc(src: string) {
  if (!src.startsWith("/local/")) return false;
  const name = src.slice("/local/".length);
  if (!name || name.includes("..") || name.includes("/")) return false;
  if (name === "latest.json") return false;
  return /^[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(name);
}

export function readLocalLatest(): LocalLatest {
  ensureLocalDir();
  if (!existsSync(LOCAL_LATEST_PATH)) {
    return { slug: "draft", title: "", thumbs: [] };
  }
  return JSON.parse(readFileSync(LOCAL_LATEST_PATH, "utf8")) as LocalLatest;
}

export function writeLocalLatest(data: LocalLatest) {
  ensureLocalDir();
  writeFileSync(LOCAL_LATEST_PATH, JSON.stringify(data, null, 2) + "\n");
}

function nextVersion(slug: string): number {
  const used = new Set<number>();
  if (existsSync(LOCAL_DIR)) {
    for (const name of readdirSync(LOCAL_DIR)) {
      const m = name.match(new RegExp(`^${slug}-v(\\d+)\\.jpg$`, "i"));
      if (m) used.add(Number(m[1]));
    }
  }
  let n = used.size ? Math.max(...used) + 1 : 1;
  while (used.has(n)) n += 1;
  return n;
}

export function saveLocalThumb(
  slug: string,
  jpg: Buffer,
): { rel: string; abs: string } {
  ensureLocalDir();
  const n = nextVersion(slug);
  const file = `${slug}-v${n}.jpg`;
  const abs = join(LOCAL_DIR, file);
  if (existsSync(abs)) throw new Error(`refusing to overwrite ${file}`);
  writeFileSync(abs, jpg);
  return { rel: `/local/${file}`, abs };
}

export function absPathForLocalSrc(src: string) {
  const fileName = src.slice("/local/".length);
  const abs = resolve(join(LOCAL_DIR, fileName));
  const rel = relative(LOCAL_DIR, abs);
  if (rel.startsWith("..") || rel.includes("..")) return null;
  return abs;
}

export function deleteLocalThumb(src: string): boolean {
  if (!isSafeLocalSrc(src)) return false;
  const abs = absPathForLocalSrc(src);
  if (!abs) return false;
  if (existsSync(abs)) {
    unlinkSync(abs);
  }
  const latest = readLocalLatest();
  const thumbs = Array.isArray(latest.thumbs)
    ? latest.thumbs.filter((t) => t.src !== src)
    : [];
  latest.thumbs = thumbs;
  if (latest.thumb === src) {
    latest.thumb = thumbs.at(-1)?.src;
  }
  writeLocalLatest(latest);
  return true;
}