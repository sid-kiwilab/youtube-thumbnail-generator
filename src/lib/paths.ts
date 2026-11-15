import { join, resolve } from "node:path";

export const REPO_ROOT = process.cwd();
export const DATA_DIR = resolve(join(REPO_ROOT, "data"));
export const CACHE_DIR = join(DATA_DIR, "cache");
export const WORKSPACE_PATH = join(DATA_DIR, "workspace.json");
export const PROMPTS_DIR = join(REPO_ROOT, "prompts");
export const LOCAL_DIR = resolve(join(REPO_ROOT, "public", "local"));
export const LOCAL_LATEST_PATH = join(LOCAL_DIR, "latest.json");
export const DEMO_GENERATED_DIR = resolve(join(REPO_ROOT, "public", "generated"));