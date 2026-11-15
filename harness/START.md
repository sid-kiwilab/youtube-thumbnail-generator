# START — plan the feature

You are in **planning mode**. Do not implement unless the user explicitly asks you to build in the same message.

## 1. Discover context

Read these first for the YouTube Shorts app:

- [`README.md`](../README.md) — stack, scripts, project structure
- [`docs/LIVE.md`](../docs/LIVE.md) — current routes, env vars, key files, deploy checklist
- [`docs/JOURNAL.md`](../docs/JOURNAL.md) — recent session notes (newest first)
- [`AGENTS.md`](../AGENTS.md) — Next.js 16 breaking changes (read before writing App Router code)
- Recent edits in `src/app/` and `public/` for the area being changed

Do not re-litigate work already documented in LIVE/JOURNAL or shipped in recent commits.

## 2. Output a concise plan

Include:

- **Scope** — what we are building and why
- **Likely touch points** — `src/app/*`, `public/refs/`, API routes under `src/app/api/*` if needed (best guess from discovery)
- **Risks** — Zernio/API keys, client-side vs server-side generation, asset size, build time
- **Out of scope** — what we are explicitly not doing this pass
- **Open questions** — only if blocked; keep to 1–2 critical items

Keep it short. No code yet.

## 3. Build constraints (apply to the plan)

- Lean and minimal architecture — no legacy shims, no backwards compatibility with the old HyperFrames pipeline
- Simple beats clever; remove dead code paths instead of preserving them
- Robust by design — no race conditions, efficient async guards where needed
- Shorts-facing copy stays plain — hook-first titles, cold opens, no unexplained jargon

DONT FUCKING MODIFY THIS FILE!!!