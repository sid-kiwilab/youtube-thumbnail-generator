# SYNC — update necessary docs

**After END says `Yes, solid.`** — do not run before the solid gate.

Update project documentation to match what shipped this session.

## 1. Active docs (this repo)

| Doc | Path | Use for |
|-----|------|---------|
| Site README | [`README.md`](../README.md) | Dev commands, env var table, project structure, deployment |
| Generator spec | [`docs/generate.md`](../docs/generate.md) | Prompt versions, CLI flags, locked image settings |
| Full pipeline archive | `c:\flutter_apps\youtube-archive` | Local-only LIVE/JOURNAL/upload/layout (not in this repo) |
| Harness workflow | `harness/*.md` | Session passes only — do not edit unless the user asks to change harness itself |

Optional: `docs/plans/` for saved START plans on large features (only when the user asks).

## 2. Update what changed

| If this changed… | Update… |
|------------------|---------|
| Routes, APIs, env vars, generation pipeline | [`README.md`](../README.md) and [`docs/generate.md`](../docs/generate.md) |
| Dev commands, new scripts, public routes, env var descriptions | [`README.md`](../README.md) |

Keep entries concise. Do not duplicate long history — link or summarize.

## 3. Report

List each file updated with a one-line summary of what changed.


DONT FUCKING MODIFY THIS FILE!!!