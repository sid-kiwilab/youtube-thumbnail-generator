import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CACHE_DIR } from "./paths";

const DEFAULT_TTL_MS = 60 * 60 * 1000;

export type CacheEnvelope<T> = {
  fetchedAt: string;
  data: T;
};

function cachePath(key: string) {
  const safe = key.replace(/[^\w@.-]+/g, "_");
  return join(CACHE_DIR, `${safe}.json`);
}

export function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
}

export function readCache<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
  ensureCacheDir();
  const path = cachePath(key);
  if (!existsSync(path)) return null;
  try {
    const env = JSON.parse(readFileSync(path, "utf8")) as CacheEnvelope<T>;
    const age = Date.now() - new Date(env.fetchedAt).getTime();
    if (age > ttlMs) return null;
    return env.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T) {
  ensureCacheDir();
  const path = cachePath(key);
  const env: CacheEnvelope<T> = { fetchedAt: new Date().toISOString(), data };
  writeFileSync(path, JSON.stringify(env, null, 2) + "\n");
}