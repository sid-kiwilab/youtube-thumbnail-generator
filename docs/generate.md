# Generation methodology

## Title (OpenRouter)

Template: [`prompts/title.md`](../prompts/title.md)

Filled with:

- Your channel handle
- Top titles from your loaded videos (by views)
- A free-text **brief** for the new video

POST `/api/suggest/title` or use the UI **Suggest title** button.

## Thumbnail (OpenAI)

Template: [`prompts/thumbnail.md`](../prompts/thumbnail.md) + [`prompts/hook-style.md`](../prompts/hook-style.md)

| Setting | Default |
|---------|---------|
| Model | `gpt-image-2.5-sunburst` (`OPENAI_IMAGE_MODEL`) |
| Quality | `low` |
| Size | `1280x720` (fallback crop from `1536x1024` if API rejects) |
| Endpoint | Images **edits** with 1–4 reference images |

Refs: HTTPS YouTube thumb URLs from your loaded videos (**Use ref** on a card).

Output: `public/local/{slug}-vN.jpg` + update `public/local/latest.json`.

**Costs:** Billed to the deployer’s OpenAI account.

## Vision check (OpenRouter)

Template: [`prompts/vision-eval.md`](../prompts/vision-eval.md)

Returns JSON `score` (1–5) and `notes`. UI shows: *model opinion only — not YouTube CTR.*

## Prompts

Edit files under `prompts/` and restart the dev server. No database.

## YouTube cache

`data/cache/*.json` — 1 hour TTL per channel fetch to spare quota.