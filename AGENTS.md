<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

Read `node_modules/next/dist/docs/` before writing App Router code.
<!-- END:nextjs-agent-rules -->

# Repo map

**youtube-thumbnail-generator** — self-hosted Next.js app (`/`).

- **UI:** [`src/components/ThumbnailStudio.tsx`](src/components/ThumbnailStudio.tsx) — channel load, niche compare, suggest, local thumbs.
- **YouTube read:** [`src/lib/youtube-client.ts`](src/lib/youtube-client.ts) + `YOUTUBE_API_KEY`. Key setup: [docs/setup.md](docs/setup.md).
- **Titles / vision:** OpenRouter — [`src/lib/openrouter.ts`](src/lib/openrouter.ts).
- **Images:** OpenAI only — [`src/lib/openai-image.ts`](src/lib/openai-image.ts). Default `gpt-image-2.5-sunburst`.
- **Prompts:** [`prompts/`](prompts/) markdown files.
- **Local storage:** `data/workspace.json`, `data/cache/`, `public/local/` (gitignored).

**Never** run paid generate/title/vision calls unless Sid explicitly asks in that turn.

**No** Neon, Telegram, Zernio, or OAuth in this repo.