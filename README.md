# youtube-thumbnail-generator

Next.js app to **compare YouTube thumbnails** against benchmark layouts and **append versioned AI cuts** with prompts stored in Neon.

Built as a small, inspectable example: a compare board in the browser, a JSON history of generations, and a CLI that never overwrites existing JPEGs.

## Stack

Next.js 16 · React 19 · Tailwind CSS 4 · TypeScript · OpenAI Images · Neon Postgres

## What you get

| Piece | Role |
|-------|------|
| **`/` compare board** | Benchmark thumbs + your generated cuts side by side; edit title; delete with confirm |
| **`public/generated/latest.json`** | Title + `thumbs[]` history |
| **`scripts/generate.mjs`** | Title + 1280×720 thumb from latest Neon prompt versions |
| **`docs/generate.md`** | Locked image settings + how prompt versions work |

Demo data in `public/refs/` and `public/generated/` shows one full iteration arc (composite refs → many versions → locked pick).

## Getting started

```bash
npm install
cp .env.example .env   # OPENAI_API_KEY + NEON_CONNECTION_STRING
npm run dev
# Windows: start.bat
```

Open [http://localhost:3000](http://localhost:3000).

### Generate a new cut (costs OpenAI credits)

Requires **ffmpeg** on PATH only if you extract stills from video with `--react` / `--fails` instead of PNG refs.

```bash
node scripts/generate.mjs --sync-json   # refresh latest.json from jpgs on disk (free)

node scripts/generate.mjs --confirm \
  --sid-ref public/refs/faces/sid-headback.png \
  --fail-ref public/refs/faces/omegle-rizz.png
```

See [docs/generate.md](docs/generate.md) for prompt versioning, quality lock (`gpt-image-2`, `low`, 1280×720), and `--seed-only` / `--add-version`.

## Environment

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Title + image generation |
| `OPENAI_IMAGE_MODEL` | default `gpt-image-2` |
| `OPENAI_LONGFORM_MODEL` | title model |
| `NEON_CONNECTION_STRING` | `generator_prompts` table |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | optional quota alerts |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run generate` | `generate.mjs --confirm` (needs refs or video paths) |
| `node scripts/crop-compare-thumbs.mjs` | Regen `public/refs/compare/thumb-*.png` from sources |

## Project layout

```
src/app/page.tsx                 # compare board
src/app/api/generated/             # PATCH title, DELETE thumb
src/app/api/refs/faces/          # list face ref PNGs
public/generated/                # rizz-fails-vN.jpg + latest.json
public/refs/compare/             # benchmark PNGs
public/refs/faces/               # reactor + fail stills for composites
scripts/generate.mjs             # Neon prompts + OpenAI
scripts/lib/neon-prompts.mjs     # prompt bodies + HOOK_TEXT_STYLE lock
docs/generate.md                 # methodology
```

## Methodology (short)

1. **Prompts are versioned in Neon** — bump with `--add-version`; runtime always uses the highest `kind` version.
2. **Thumbnails are append-only** — each run writes `{slug}-vN.jpg`; the script refuses to overwrite.
3. **Composite refs** — pass two stills (`--sid-ref`, `--fail-ref`) so the image model keeps real faces, not a redrawn portrait.
4. **Compare before you ship** — the UI mimics a YT grid so you judge click appeal against strong baselines.

## Archive

The old monorepo (upload, layout ffmpeg, captions, titles queue, overlays) lives locally at `c:\flutter_apps\youtube-archive` — not part of this public tree.

## License

MIT (or your choice when you publish). Demo assets include likeness stills for illustration; replace refs for your own channel.