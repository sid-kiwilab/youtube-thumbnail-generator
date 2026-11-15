<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repo map

**youtube-thumbnail-generator** — public example repo.

- **Next.js** (`src/`): **`/`** thumb compare (benchmarks + `public/generated` + session uploads). Face ref strip from `public/refs/faces/`.
- **Generator**: [docs/generate.md](docs/generate.md) — `gpt-image-2`, quality `low`, 1280×720; Neon `generator_prompts`. **Never run `npm run generate` or `generate.mjs --confirm` unless Sid explicitly asks in that turn.** Never overwrite or delete thumb files yourself; Sid may delete from **`/`** (confirm dialog).
- **Quota alerts**: `.cursor/rules/api-quota-telegram.mdc` + `scripts/telegram-notify.mjs`.
- **Harness**: [harness/HARNESS.md](harness/HARNESS.md) — session phases (START → END). Shorts/upload/layout docs live in local `youtube-archive` only.

## Locked image summary

On-image text: Impact white + thick black outline (`HOOK_TEXT_STYLE` in `scripts/lib/neon-prompts.mjs`). Demo locked cut on disk: **`rizz-fails-v14`**.