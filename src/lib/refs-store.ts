import {
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "./paths";

export const REFS_ROOT = join(REPO_ROOT, "public", "refs");
export const REFS_UPLOADS = join(REFS_ROOT, "uploads");

export type RefLibraryFolder = "faces" | "compare" | "uploads";

export type RefLibraryItem = {
  name: string;
  src: string;
  folder: RefLibraryFolder;
};

const FOLDERS: RefLibraryFolder[] = ["faces", "compare", "uploads"];

export function ensureRefsUploadsDir() {
  if (!existsSync(REFS_UPLOADS)) mkdirSync(REFS_UPLOADS, { recursive: true });
}

export function safeRefFileName(name: string): string | null {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "");
  if (!base || base.includes("..")) return null;
  if (!/^[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(base)) return null;
  return base;
}

export function isSafeRefSrc(src: string): boolean {
  if (!src.startsWith("/refs/")) return false;
  const rest = src.slice("/refs/".length);
  if (rest.includes("..")) return false;
  const parts = rest.split("/").filter(Boolean);
  if (parts.length !== 2) return false;
  const [folder, name] = parts;
  if (!FOLDERS.includes(folder as RefLibraryFolder)) return false;
  return safeRefFileName(name) === name;
}

export function absPathForRefSrc(src: string): string | null {
  if (!isSafeRefSrc(src)) return null;
  const rest = src.slice("/refs/".length);
  return join(REFS_ROOT, ...rest.split("/"));
}

export function listRefLibrary(): RefLibraryItem[] {
  const out: RefLibraryItem[] = [];
  for (const folder of FOLDERS) {
    const dir = join(REFS_ROOT, folder);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!safeRefFileName(name)) continue;
      out.push({ name, src: `/refs/${folder}/${name}`, folder });
    }
  }
  out.sort((a, b) => a.src.localeCompare(b.src));
  return out;
}

export function saveRefUpload(fileName: string, bytes: Buffer): { src: string } {
  ensureRefsUploadsDir();
  const safe = safeRefFileName(fileName);
  if (!safe) throw new Error("Invalid file name");
  const abs = join(REFS_UPLOADS, safe);
  writeFileSync(abs, bytes);
  return { src: `/refs/uploads/${safe}` };
}

export function deleteRefUpload(src: string): boolean {
  if (!src.startsWith("/refs/uploads/")) return false;
  const abs = absPathForRefSrc(src);
  if (!abs || !existsSync(abs)) return false;
  unlinkSync(abs);
  return true;
}