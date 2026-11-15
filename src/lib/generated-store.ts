import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

export const GENERATED_DIR = resolve(join(process.cwd(), "public", "generated"));
export const LATEST_PATH = join(GENERATED_DIR, "latest.json");

export type LatestPayload = {
  slug?: string;
  title?: string;
  thumb?: string;
  thumbs?: { src: string; id?: string; [key: string]: unknown }[];
  duration?: string;
  channel?: string;
  [key: string]: unknown;
};

export function isSafeGeneratedSrc(src: string) {
  if (!src.startsWith("/generated/")) return false;
  const name = src.slice("/generated/".length);
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) return false;
  if (name === "latest.json") return false;
  return /^[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(name);
}

export function absPathForSrc(src: string) {
  const fileName = src.slice("/generated/".length);
  const abs = resolve(join(GENERATED_DIR, fileName));
  const rel = relative(GENERATED_DIR, abs);
  if (rel.startsWith("..") || rel.includes("..")) return null;
  return abs;
}

export function readLatest(): LatestPayload {
  if (!existsSync(LATEST_PATH)) {
    throw new Error("latest.json missing");
  }
  try {
    return JSON.parse(readFileSync(LATEST_PATH, "utf8")) as LatestPayload;
  } catch {
    throw new Error("latest.json is invalid JSON");
  }
}

export function writeLatest(data: LatestPayload) {
  writeFileSync(LATEST_PATH, JSON.stringify(data, null, 2) + "\n");
}
