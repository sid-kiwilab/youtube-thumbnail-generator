import { neon } from "@neondatabase/serverless";

const TITLE_V1 = `You write YouTube titles for Sid Venkman (@sidvenkman).
Voice: lowercase, casual, first person, a specific claim or verdict.
No channel name. No quotes. No hashtags. Max 70 characters.
This video:
{{brief}}
Return ONLY the title.`;

const TITLE_V2 = `You write YouTube titles for Sid Venkman (@sidvenkman).
Niche: cringe reactions. The title MUST contain the word "cringe" — that is the channel's lane.
Voice: lowercase, casual, first person, a specific claim or verdict.
No channel name. No quotes. No hashtags. Max 70 characters.
This video:
{{brief}}
Return ONLY the title.`;

const THUMB_V1 = `YouTube thumbnail. 16:9.

Keep THIS man exactly from the reference photos: South Asian, early 20s, short black hair, black hoodie, white AirPods, plain beige wall. Same face. Do not invent a different person.

Expression: secondhand embarrassment — a real wince, like he just watched something painful. Eyes on camera or slightly squinted. Not a big smile. Not cartoon.

Composition: one person only. Tight head-and-shoulders, lots of face, empty beige wall. No split screen. No other people. No phones. No logos. No watermarks. No TikTok UI.

On-image text: two words only, huge, white with a thick black outline, lower right: RIZZ FAILS

Photoreal. High contrast. Simple and strong, like a viral reaction thumbnail.`;

/** Sid signed off this on-image look on the v1 rizz-fails thumb. Do not restyle. */
export const HOOK_TEXT_STYLE = `LOCKED on-image typography (Sid signed off):
- Font: Impact / Anton / ultra-condensed gothic sans, ALL CAPS
- Fill: pure white (#FFFFFF)
- Stroke: thick heavy black outline (meme Impact, not a soft drop shadow)
- No extra words, badges, glow, or gradient
- Placement A (face-only thumbs): two stacked words, lower-right — e.g. RIZZ / FAILS
- Placement B (quote from rizz guy): speech caption on the speaker with visible "quotes" — never bottom-right (YouTube duration badge)`;

export const THUMB_V2 = `YouTube thumbnail. 16:9.

You are given REAL photographs. This is a composite job, not a new portrait.

LEFT (~55%): the reactor from the first reference. Copy his face EXACTLY — same skin texture, pores, stubble, lighting, ears, white AirPods, black hoodie, beige wall. Do NOT beautify, smooth, symmetrize, or redraw him into an AI face. If the face looks generated, the image is wrong.

RIGHT (~45%): the rizz-fail still from the second reference. Keep that exact scene recognizable (same people, same clothes, same setting). Do not invent a different clip. Crop in if needed so it reads at small size.

Layout: hard split or tight side-by-side. One reactor, one fail clip. No logos. No TikTok UI. No watermarks.

${HOOK_TEXT_STYLE}

Photoreal. High contrast. Simple and strong.`;

export const THUMB_V3 = `YouTube thumbnail. 16:9.

You are given REAL photographs. This is a composite job, not a new portrait.

LEFT (~55%): the reactor from the first reference. Copy his face EXACTLY — same skin texture, pores, stubble, lighting, ears, white AirPods, black hoodie, beige wall, same expression (eyes closed / cringe). Do NOT beautify, smooth, or redraw him into an AI face.

RIGHT (~45%): the man from the Omegle rizz still (grey shirt, wide eyes, mustache). Tight crop on HIS face only. Do not include the woman, watermarks, credits, or "megle.com". Keep him recognizable — this is the guy doing the rizz.

Layout: hard split. No logos. No TikTok UI. No watermarks.

LOCKED on-image text (same Impact look Sid signed off — only the words change):
- Stacked, lower-right, ALL CAPS: OMG / U R SO / BUTIFUL
- Font: Impact / Anton / ultra-condensed gothic sans
- Fill: pure white
- Stroke: thick heavy black outline
- No extra words, badges, glow, or gradient

Photoreal. High contrast. Simple and strong.`;

export const THUMB_V4 = `YouTube thumbnail. 16:9.

You are given REAL photographs. This is a composite job, not a new portrait.

LEFT (~55%): the reactor from the first reference — HEAD TILTED BACK, chin up, same black hoodie, white AirPods, beige wall, same face identity. Keep his real skin, pores, lighting. Do NOT beautify or turn him into an AI portrait.

ONLY change the eyes: make them more CRINGE. Tight wince / squint of secondhand embarrassment, like he physically cannot watch. Not calm closed-eye, not a smile, not looking at camera. Head stays back. Mouth can stay slightly open.

RIGHT (~45%): the man from the Omegle rizz still (grey shirt, wide eyes, mustache). Tight crop on HIS face only. No woman, no watermarks, no credits.

Layout: hard split. No logos. No TikTok UI.

LOCKED on-image text (same Impact look — only the words):
- Stacked, lower-right, ALL CAPS: OMG / U R SO / BUTIFUL
- Font: Impact / Anton / ultra-condensed gothic sans
- Fill: pure white
- Stroke: thick heavy black outline
- No extra words, badges, glow, or gradient

Photoreal. High contrast. Simple and strong.`;

export const THUMB_V5 = `YouTube thumbnail. 16:9.

Same two people as the references. Composite, not a new portrait.

LEFT (~50%): head-back reactor, cringe-wince eyes, black hoodie, white AirPods, beige wall. Real skin. Do not beautify.

RIGHT (~50%): Omegle rizz guy (grey shirt, wide eyes, mustache). Tight on his face. No woman, no watermarks.

ON-IMAGE TEXT — this is a QUOTE he is saying, not a logo in the corner:
- Words exactly, with visible quote marks: "OMG U R SO BUTIFUL"
- The " and " characters must be drawn on the image, left and right of the line. No quotes = wrong.
- Same Impact / Anton look: ALL CAPS, pure white, thick black outline
- Sit the quote tight against HIS face / mouth — like a speech caption coming out of him (mid-chest or beside his cheek)
- NEVER put text in the bottom-right corner. That zone is covered by YouTube's duration badge. Leave the bottom-right ~18% empty.
- No extra words, badges, glow

Photoreal. High contrast. Simple and strong.`;

export const THUMB_V7 = `YouTube thumbnail. 16:9.

You are given REAL photographs of a winning split thumbnail. This is a small expression + text tweak, not a new portrait.

LEFT (~55%): SAME man as the first reference — black hoodie, white AirPods, beige wall, head tilted back. Copy his identity EXACTLY (pores, stubble, lighting, ears). Do NOT beautify or redraw him into an AI face.

ONLY change the expression vs the reference: MORE secondhand-embarrassment cringe. Almost crying — glossy wet eyes, tighter squeezed wince, teeth showing, like he physically cannot handle watching this. Not a smile. Not looking at camera. Head stays back.

RIGHT (~45%): the Omegle rizz guy from the second reference. Copy HIS FACE EXACTLY — same eyes, mustache, closeness to camera, lighting, grey shirt. Do NOT change his expression. Do NOT beautify. Do NOT redraw him. This face is locked.

Layout: hard vertical split. No logos. No TikTok UI. No watermarks. No woman.

ON-IMAGE TEXT — a QUOTE he is saying, glued to his mouth:
- Words exactly, with visible quote marks: "OMG U R SO BUTIFUL"
- The " characters must be drawn on the image, left and right of the line. No quotes = wrong.
- Same Impact / Anton look: ALL CAPS, pure white, thick black outline
- Sit the quote tight against HIS mouth / cheek on HIS half (speech caption)
- NEVER put text in the bottom-right corner. That zone is covered by YouTube's duration badge. Leave the bottom-right ~18% empty.
- No extra words, badges, glow, iMessage bubble

Photoreal. High contrast. Simple and strong.`;

export const SEED = [
  {
    kind: "title",
    version: 1,
    notes: "lowercase Sid verdict, max 70",
    body: TITLE_V1,
  },
  {
    kind: "title",
    version: 2,
    notes: "must include the word cringe — channel niche",
    body: TITLE_V2,
  },
  {
    kind: "thumbnail",
    version: 1,
    notes: "one Sid face + RIZZ FAILS, slap-simple",
    body: THUMB_V1,
  },
  {
    kind: "thumbnail",
    version: 2,
    notes: "real Sid + fail still, keep locked Impact text, no AI face",
    body: THUMB_V2,
  },
  {
    kind: "thumbnail",
    version: 3,
    notes: "Sid cringe + Omegle rizz guy, OMG U R SO BUTIFUL",
    body: THUMB_V3,
  },
  {
    kind: "thumbnail",
    version: 4,
    notes: "head-back Sid, cringe-wince eyes, Omegle guy, BUTIFUL",
    body: THUMB_V4,
  },
  {
    kind: "thumbnail",
    version: 5,
    notes: "quoted line glued to the rizz guy, clear of duration badge",
    body: THUMB_V5,
  },
  {
    kind: "thumbnail",
    version: 7,
    notes: "quoted BUTIFUL at mouth; Sid almost-crying was too much — ship lock is rizz-fails-v14 composite",
    body: THUMB_V7,
  },
];

export function sqlClient() {
  const url = process.env.NEON_CONNECTION_STRING?.trim();
  if (!url) throw new Error("Missing NEON_CONNECTION_STRING in .env");
  return neon(url);
}

export async function ensurePromptTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS generator_prompts (
      kind TEXT NOT NULL,
      version INTEGER NOT NULL,
      body TEXT NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (kind, version)
    )
  `;
}

export async function seedPrompts(sql) {
  for (const row of SEED) {
    await sql`
      INSERT INTO generator_prompts (kind, version, body, notes)
      VALUES (${row.kind}, ${row.version}, ${row.body}, ${row.notes})
      ON CONFLICT (kind, version) DO NOTHING
    `;
  }
}

export async function latestPrompt(sql, kind) {
  const rows = await sql`
    SELECT kind, version, body, notes, created_at
    FROM generator_prompts
    WHERE kind = ${kind}
    ORDER BY version DESC
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) throw new Error(`No generator_prompts row for kind=${kind}`);
  return row;
}

export async function addPromptVersion(sql, kind, body, notes) {
  const latest = await sql`
    SELECT COALESCE(MAX(version), 0) AS version
    FROM generator_prompts
    WHERE kind = ${kind}
  `;
  const version = Number(latest[0]?.version ?? 0) + 1;
  await sql`
    INSERT INTO generator_prompts (kind, version, body, notes)
    VALUES (${kind}, ${version}, ${body}, ${notes || ""})
  `;
  return version;
}

export function fillBrief(body, brief) {
  return String(body).replaceAll("{{brief}}", brief.trim());
}
