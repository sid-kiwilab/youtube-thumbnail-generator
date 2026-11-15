# API keys setup

Everything runs on **your machine** (or your deploy). Keys live only in `.env` — never committed.

**Minimum to try the app:** `YOUTUBE_API_KEY` (load your channel + auto niche search).

**To generate titles / thumbs (with ref analysis) / vision check:** also OpenRouter + OpenAI.

Estimated time: **~10 minutes** if you already have Google + OpenAI accounts.

---

## 1. YouTube Data API key

Used for: your channel uploads, view counts, thumbnails, and **channel search** (competitors).

This is **not** signing into YouTube. It is a **Google Cloud API key** your server uses to read **public** data.

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. **Create a project** (or pick an existing one) — e.g. `youtube-thumb-tool`.
3. **APIs & Services** → **Library** → search **YouTube Data API v3** → **Enable**.
4. **APIs & Services** → **Credentials** → **Create credentials** → **API key**.
5. Copy the key into `.env`:

   ```env
   YOUTUBE_API_KEY=AIza...
   ```

**Recommended (production / public deploy):** edit the key → **API restrictions** → restrict to **YouTube Data API v3** only. Optional **HTTP referrer** or IP restriction if you host it.

**Quota:** Default free quota is enough for personal use (load channel + a few searches). Heavy use may need quota increase in Cloud Console.

**Official docs:** [YouTube Data API overview](https://developers.google.com/youtube/v3/getting-started)

**What you do *not* get:** private Studio analytics, CTR, revenue — only public metadata the API exposes.

---

## 2. OpenRouter (titles + vision check)

Used for: **Suggest title**, **ref analysis** before **Generate thumbnail** (one vision call per generate when refs are selected), optional **Vision check** on saved thumbs, and **smart niche + competitor pick** on channel load (2 OpenRouter calls when auto-search runs). **Refresh niche** / **Refresh competitors** in the UI trigger the same niche stack on demand (one call each, when the key is set).

1. Sign up at [openrouter.ai](https://openrouter.ai/).
2. **Keys** → create key → paste into `.env`:

   ```env
   OPENROUTER_API_KEY=sk-or-...
   OPENROUTER_TEXT_MODEL=openai/gpt-4o-mini
   OPENROUTER_VISION_MODEL=openai/gpt-4o-mini
   OPENROUTER_NICHE_MODEL=anthropic/claude-sonnet-4.5
   ```

Models are swappable — pick any chat / vision model OpenRouter lists. **`OPENROUTER_NICHE_MODEL`** should be a strong chat model (Sonnet-class recommended) for niche detection. Without OpenRouter, load still works using a basic keyword guess. Image generation does **not** go through OpenRouter in this app.

The **Search:** line under Niche is the YouTube `type=channel` query — topic/format words only (e.g. `dating show reaction commentary`). Load uses **long-form videos only** (Shorts filtered out); OpenRouter may still over-read the word “viral” in titles, so the app strips filler like `channel`, `viral`, and `clips` before searching.

---

## 3. OpenAI (thumbnails only)

Used for: **Generate thumbnail** (`/v1/images/edits` with supporting stills from `/refs/...` plus **at most one** full YouTube thumb as layout). Competitor and your refs are selectable in the UI; OpenRouter ref analysis shapes the text prompt (see [generate.md](generate.md)).

1. [OpenAI API keys](https://platform.openai.com/api-keys) → create key.
2. Add to `.env`:

   ```env
   OPENAI_API_KEY=sk-...
   OPENAI_IMAGE_MODEL=gpt-image-2.5-sunburst
   ```

If your account rejects `gpt-image-2.5-sunburst`, try `gpt-image-2.5-flare` or `gpt-image-2` (see [image generation guide](https://developers.openai.com/api/docs/guides/image-generation)).

**Billing:** Image calls are charged to **your** OpenAI account. README = self-host — you control spend.

---

## 4. Verify

```bash
cp .env.example .env
# fill at least YOUTUBE_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → enter your `@handle` → **Load channel**.

If the header shows **YouTube API** in green (via `/api/config`), the key is loaded.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Missing YOUTUBE_API_KEY` | Key not in `.env` or dev server not restarted after edit |
| `YouTube API 403` | Enable YouTube Data API v3 on the same project as the key |
| `Channel not found` | Use `@handle`, `youtube.com/@handle`, or channel URL |
| `OpenAI images` model error | Change `OPENAI_IMAGE_MODEL` in `.env` |
| Search returns no competitors | **Add** a competitor in the setup card, or **Load channel** again (with `OPENROUTER_API_KEY` for smarter niche + picks; edits in `prompts/niche-competitors.md`) |