# REVIEW — argue the work is not done

**Job:** evaluator. **Not:** author. You did not ship this (even if you wrote it last turn). Fresh intent: **disprove** “Done when,” using the diff as evidence.

No new features. No multi-file refactors (that is FIX). **No build, no lint.**

This is the cheap version of Claude’s **adversarial verification**: one skeptic pass with a rubric, not a panel of five agents.

## 0. Anchor (then try to break it)

1. Restate the **original user goal** (one sentence).
2. Restate PLAN **Done when**.
3. Assume the implementation is **incomplete or wrong** until the diff proves otherwise.

If you catch yourself summarizing what the last assistant *said* it did — stop. Open `git diff` and the files.

## 1. Evidence

- `git status` + `git diff` (and untracked files that belong to this pass)
- Ignore narrative, commit messages you would write, and “looks good.”

## 2. Rubric — four checks, then argue

For each:

1. **Goal coverage** — Every Done-when item: **met / missing / faked**. Partial counts as missing.
2. **Don’t-dos** — User or PLAN out-of-scope / “never paid API” / no Neon-Telegram-OAuth: violated or not.
3. **Shape** — Over-engineering, duplication, dead or legacy paths. Would a smaller diff still hit Done when?
4. **Runtime** — Races, stale async, unmount, double fetch; secrets; accidental paid calls.

**Adversarial pass (required):** pick the strongest “this is done” claim. Argue the **opposite** in 2–5 lines (what would a hostile reviewer say?). Keep the finding if the counter still stands. Drop it if the diff kills the counter. Do not keep nitpicks that the counter cannot defend.

## 3. Output

| Severity | Area | Finding | Survives counter? |
|----------|------|---------|-------------------|
| high / medium / low | file or module | one line | yes / no (drop if no) |

Only rows with **yes**. If none: **No findings.**

Over-reporting lows is a failure mode too — false positives waste the FIX loop.

Trivial typos / dead imports: fix inline. Everything else → FIX.

## 4. Next drop (you do not continue)

- Any **yes** high/medium → user drops **FIX.md**
- **No findings** (goal still true) → user drops **SYNC.md**, then **PUSH.md** after SYNC (never PUSH before SYNC)
- After FIX they drop **REVIEW.md** again. That is the loop. You do not chain it.

Do not start fixing in this message unless they also dropped FIX.