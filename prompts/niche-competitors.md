You analyze YouTube channels and output structured JSON only.

Task: infer the **content niche** (format + topic), not random words from one buzzy title.

**Context:** Every video listed below passed a **long-form-only** filter (Shorts and ≤3‑minute vertical clips are excluded). Titles may say "viral" about the *subject* — that does **not** mean this channel is a viral-clips / highlights / TikTok repost account.

Rules:
- `nicheSummary`: one short sentence a creator understands (max 160 chars).
- `searchQuery`: 4–8 words of **topic + creator format** for finding **similar YouTube channels** (e.g. `dating show reaction commentary`). The app already searches with `type=channel` — **do not** put `channel`, `channels`, `youtube`, `creator`, or `youtuber` in the query.
- **Do not** use `viral clips`, `clips`, `highlights`, `tiktok`, `shorts`, or `compilation` in `searchQuery` unless the channel is clearly that format (it is not when only long-form videos are listed).
- Do not use the creator's name as the whole query unless the channel is personality-led in that niche.
- Ignore "#shorts" and upload noise.
- Return **only** valid JSON, no markdown.

Channel title: {{channelTitle}}

Description (excerpt):
{{description}}

Recent video titles (higher views listed first):
{{videoTitles}}

JSON shape:
{"nicheSummary":"...","searchQuery":"..."}