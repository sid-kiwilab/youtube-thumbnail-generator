# Thumbnail + title generator

Versioned prompts in Neon. One script **appends** a thumb and updates title for the compare board.

**Agents:** do not run `npm run generate` unless Sid explicitly asks in that turn.

```bash
# Neon / prompts only (no OpenAI spend)
node scripts/generate.mjs --seed-only
node scripts/generate.mjs --sync-json

# New thumb + optional title (requires --confirm)
node scripts/generate.mjs --confirm \
  --sid-ref public/refs/faces/sid-headback.png \
  --fail-ref public/refs/faces/omegle-rizz.png
node scripts/generate.mjs --confirm --thumb-only
node scripts/generate.mjs --confirm --new-title
```

Optional video stills instead of PNGs (needs ffmpeg): `--react path/to/reaction.mp4` and `--fails path/to/clip.mp4`. No default paths.

`npm run generate` is an alias for `node scripts/generate.mjs --confirm` — you still must pass refs or video paths.

## Locked image settings

| Field | Value |
|-------|--------|
| Model | `gpt-image-2` (`OPENAI_IMAGE_MODEL`) |
| Quality | `low` |
| Size | `1280x720` (16:9) |
| Fallback | `1536x1024` then crop to `1280x720` |
| Output | JPEG → `public/generated/{slug}-vN.jpg` — **never overwrite** |

## On-image typography

`HOOK_TEXT_STYLE` in `scripts/lib/neon-prompts.mjs`: Impact / Anton, ALL CAPS, white fill, thick black outline. Placement depends on layout (stacked hook vs quoted speech on speaker).

## Prompt versions (Neon)

Table `generator_prompts`: `kind` (`title` \| `thumbnail`), `version`, `body`, `notes`, `created_at`.

Needs `NEON_CONNECTION_STRING`. First run creates the table and seeds v1. Always uses the **highest version** per kind.

```bash
node scripts/generate.mjs --add-version --kind title --notes "shorter hooks"
# paste body on stdin (Ctrl+Z then Enter on Windows)
```

Title bodies use `{{brief}}` filled from `--brief` at run time.

## Output files

| File | Role |
|------|------|
| `public/generated/{slug}-vN.jpg` | Each 1280×720 cut |
| `public/generated/latest.json` | Title + `thumbs[]` for `/` |

Transient frame prep: `.cache/generate-frames/` (gitignored).

## Env

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Title + image |
| `OPENAI_IMAGE_MODEL` | default `gpt-image-2` |
| `OPENAI_LONGFORM_MODEL` | title model |
| `NEON_CONNECTION_STRING` | prompt versions |