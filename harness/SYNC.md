# SYNC — write it down

**Job:** docs + goal truth. **Not:** ship gate, not toolchain, not a consolation prize for a smaller feature.

Run only after **REVIEW** reported **No findings** (or lows you explicitly accepted). Fresh intent: the **original** user goal, not “we can push later.”

**No** `npm run build` / `npm run lint`. That is **PUSH**.

## 0. Argue the goal first

Is the original one-sentence goal **fully** true in the tree right now?

If you would have to **redefine** success to say yes — **stop**. Do not update docs. Tell the user to drop **FIX.md** (or click Build again) with what’s missing.

## 1. Docs (behavior change only)

| If this changed | Update |
|-----------------|--------|
| Routes, APIs, env, generation pipeline | [README.md](../README.md), [docs/generate.md](../docs/generate.md), [docs/setup.md](../docs/setup.md) |
| Commands, scripts, env how-to | [README.md](../README.md), [docs/setup.md](../docs/setup.md) |

Do **not** edit `harness/*` unless the user asked to change the harness. No invented LIVE/JOURNAL files.

If nothing user-facing changed, say so — skipping doc edits is fine.

## 2. Report

- Goal check: **pass** or the missing piece
- Each doc you actually touched: one line (or **none**)

**Stop.** Tell Sid to drop **PUSH.md** when he is ready to publish (build + lint + commit + push). Do not run toolchain in this pass. Do not commit or push here.