# Generation methodology

## Title (OpenRouter)

Template: [`prompts/title.md`](../prompts/title.md)

Filled with:

- Your channel handle
- Top titles from your loaded videos (by views)
- A free-text **brief** for the new video

POST `/api/suggest/title` or use the UI **Suggest title** button.

## Ref selection (UI)

- **Use ref** on your ranked videos or **niche compare** competitors (shared set, max 4).
- **Supporting images** from `public/refs/faces`, `compare`, or **uploads** — picked in the UI or uploaded via `POST /api/refs/upload`.
- Selected refs show in a chip strip; **×** removes one; **Clear all** resets.

## Ref analysis (OpenRouter, pre-generate)

Template: [`prompts/ref-analyze.md`](../prompts/ref-analyze.md)

On **Generate thumbnail** (when `OPENROUTER_API_KEY` is set), `POST /api/eval/refs` runs before OpenAI.

Returns JSON per ref: creator face notes, layout to borrow, text on image, do-not-copy — plus a short summary. Merged into the thumbnail prompt (not pasted as extra full-frame refs).

Requires `OPENROUTER_API_KEY`. Without it, generation uses one layout ref + supporting stills only.

## Thumbnail (OpenAI)

Templates: [`prompts/thumbnail.md`](../prompts/thumbnail.md) + [`prompts/hook-style.md`](../prompts/hook-style.md)

| Setting | Default |
|---------|---------|
| Model | `gpt-image-2.5-sunburst` (`OPENAI_IMAGE_MODEL`) |
| Quality | `low` |
| Size | `1280x720` (fallback crop from `1536x1024` if API rejects) |
| Endpoint | Images **edits** |

**Image slots:** supporting stills (`/refs/...`) as identity; **at most one** full YouTube thumb as layout/hook (competitor preferred when analysis ran).

POST `/api/suggest/thumb` body: `brief`, `refMeta`, optional `refAnalysis`, `supportingSrcs`.

Output: `public/local/{slug}-vN.jpg` + update `public/local/latest.json`.

Delete: `DELETE /api/local/thumb` with `{ "src": "/local/..." }`.

**Costs:** OpenAI (image) + OpenRouter (ref analysis when enabled).

## Vision check (OpenRouter, post-generate)

Template: [`prompts/vision-eval.md`](../prompts/vision-eval.md)

Returns JSON `score` (1–5) and `notes`. UI shows: *model opinion only — not YouTube CTR.*

## Prompts

Edit files under `prompts/` and restart the dev server. No database.

## YouTube cache

`data/cache/*.json` — 1 hour TTL per channel fetch to spare quota.