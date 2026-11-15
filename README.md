# youtube-thumbnail-generator

Self-hosted **Next.js** app for YouTube creators — run it on your computer with **your** API keys. Nothing is stored on our servers.

1. **Load your channel** — **long-form only** (≤60s, `#shorts`, and YouTube Shorts up to 3 min via `/shorts/` URL check), sorted by view count.
2. **Niche compare** — OpenRouter infers niche + picks competitors (or basic fallback); **Refresh niche** / **Refresh competitors** to retry; add/remove up to 3 in the UI.
3. **Suggest** title (OpenRouter) + **generate** thumb (OpenAI): pick **your** or **competitor** refs (max 4), optional **ref analysis** (OpenRouter), supporting stills from `/refs` or upload, then one layout frame + stills to the image model.
4. **Download** or **delete** local thumbs from the UI. No YouTube upload, no OAuth, no hosted DB.

**Showcase model:** clone this repo → [get API keys](docs/setup.md) (~10 min) → `npm run dev`.

![Stack](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## Quick start

```bash
git clone https://github.com/sid-kiwilab/youtube-thumbnail-generator.git
cd youtube-thumbnail-generator
npm install
cp .env.example .env
```

**[→ API keys setup (YouTube, OpenRouter, OpenAI)](docs/setup.md)** — start with YouTube only.

```bash
npm run dev
# Windows: start.bat
```

Open [http://localhost:3000](http://localhost:3000) · paste `@handle` · **Load channel** (long-form only; Shorts skipped).

Main APIs: `POST /api/youtube/load`, `GET /api/youtube/bootstrap`, `POST /api/youtube/refetch` (refresh niche or append competitors), `POST /api/youtube/competitors` (add/remove). Generation: `POST /api/eval/refs`, `POST /api/suggest/thumb`, `DELETE /api/local/thumb`, `GET /api/refs/library`, `POST /api/refs/upload`. Legacy: `GET /api/youtube/channel`.

## API keys at a glance

| Key | Required for | Where to get |
|-----|----------------|--------------|
| `YOUTUBE_API_KEY` | Load channel, competitors, thumbs from API | [Google Cloud](docs/setup.md#1-youtube-data-api-key) · YouTube Data API v3 |
| `OPENROUTER_API_KEY` | Niche + competitors on load, suggest title, **ref analysis** before thumb gen, post-gen vision check | [OpenRouter](docs/setup.md#2-openrouter-titles--vision-check) |
| `OPENAI_API_KEY` | Generate thumbnail | [OpenAI](docs/setup.md#3-openai-thumbnails-only) |

Full step-by-step: **[docs/setup.md](docs/setup.md)**

## Stack

Next.js 16 · React 19 · Tailwind CSS 4 · YouTube Data API v3 · OpenRouter · OpenAI Images

## What gets stored locally

| Path | Git | Contents |
|------|-----|----------|
| `data/workspace.json` | ignored | Channel + competitor snapshots (niche summary, search query, handles, subs); restored on refresh |
| `data/cache/` | ignored | YouTube responses (~1h cache) |
| `public/local/` | ignored | Generated thumbs (deletable from UI) |
| `public/refs/uploads/` | ignored | User-uploaded supporting stills |
| `public/refs/faces`, `compare/` | tracked (sample stills) | Optional identity/layout stills for the image model |
| `prompts/*.md` | tracked | Editable prompts |

## How it thinks about “good” thumbnails

- **Rank by views** on public videos — not CTR.
- **Vision score** = model opinion (1–5), clearly labeled.
- **Ref analysis** (OpenRouter) before generate when the key is set; without it, one YouTube layout ref + supporting stills only.
- Local thumbs are **versioned** under `public/local/`; remove from UI with **×**.

Image pipeline: [docs/generate.md](docs/generate.md)

## Self-host deploy

Same as local: set env vars on the host. Prefer a **VPS / Railway / Fly** with a persistent disk so `data/` and `public/local/` survive restarts. Serverless (e.g. Vercel) wipes local files between invocations unless you add object storage (out of scope).

## Agent harness

AI-assisted work — **master file:** [`harness/HARNESS.md`](harness/HARNESS.md). Plan mode + `PLAN.md` → **Build** → `REVIEW` ⇄ `FIX` → `SYNC` → `PUSH`.

## License

MIT — [LICENSE](LICENSE)