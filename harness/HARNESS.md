# Harness — master file

This is the **single source of truth** for what the harness is, how to run it, why it looks like this, and what we refused. Phase *how-to* lives in the sibling markdown files; **do not** invent a second playbook.

**Key: separate jobs, fresh intent.** Drag **one** phase file into chat per turn. Never “run the whole harness.” One job in chat = a clean mode, no leftover “I already built it” bias.

---

## What it does

A **static, human-gated** agent kit for feature work in Cursor. You are the scheduler. The model is not allowed to plan, build, review, patch, and ship in one breath.

```
PLAN → Cursor Build → REVIEW ⇄ FIX → SYNC → PUSH
```

1. **PLAN** — Plan mode + this file. One-sentence goal + testable **Done when**. No code.
2. **Cursor Build** — the IDE **Build** button. That *is* the generator. There is no `IMPLEMENT.md`.
3. **REVIEW** — evaluator. Argue the **diff** is *not* done. Findings that survive a counter go to FIX.
4. **FIX** — patch those rows only. Cannot declare “No findings.”
5. Repeat **3 ⇄ 4** until REVIEW is clean **and** the original goal is still fully true.
6. **SYNC** — goal check + docs if behavior changed. **No** build/lint.
7. **PUSH** — `npm run build` + `npm run lint`, then commit, land on **`main`**, and **production** deploy (`vercel --prod` when applicable). **Requires SYNC first.** Dropping `PUSH.md` authorizes git + prod that turn.

Optional: `/goal <one-sentence>` after PLAN so Cursor keeps the objective across turns. **Do not** `/loop` this kit. Drag the next file.

---

## How to run it (Sid)

| Step | What you do | Agent job | You do **not** want |
|------|-------------|-----------|---------------------|
| 1 | Plan mode, drop [PLAN.md](./PLAN.md) | Scope + Done when | Code, `npm run build` |
| 2 | Click **Build** in the IDE | Make Done when true | Self-REVIEW, SYNC, PUSH |
| 3 | Drop [REVIEW.md](./REVIEW.md) | Adversarial diff vs goal | Patches; toolchain |
| 4 | Drop [FIX.md](./FIX.md) if findings | Patch surviving rows | New features; “it’s solid” |
| 5 | Drop [SYNC.md](./SYNC.md) when REVIEW is clean | Goal + docs only | Build/lint; commit |
| 6 | Drop [PUSH.md](./PUSH.md) after SYNC | Build + lint + commit + `main` + prod | Skipping SYNC; preview-only push |

**REVIEW ⇄ FIX** is the quality loop. **SYNC** then **PUSH** is the publish path. If REVIEW never said **No findings**, do not drop SYNC. **Never drop PUSH before SYNC.**

**This repo safety:** never paid generate / title / vision unless Sid asks **this turn**.

**Discover (PLAN):** [AGENTS.md](../AGENTS.md), then touched code. README / [docs/generate.md](../docs/generate.md) / [docs/setup.md](../docs/setup.md) only if routes, env, or generation may change.

No slash commands, no project skills. Dragging a file **is** the invoke. Cursor’s `/review` stays Bugbot/Security — unrelated.

---

## PLAN vs Build (do not confuse these)

| | **PLAN** | **Build** |
|--|----------|-----------|
| Cursor | **Plan** mode | The **Build** button after you accept |
| Drop | `PLAN.md` | Nothing. The plan artifact is the spec. |
| Output | Done when + constraints | The diff |
| Next | You click Build | You drop `REVIEW.md` |

`IMPLEMENT.md` was a third seat that does not exist in this IDE. After Build, the next drop is REVIEW.

Build only sees the plan you accepted — so PLAN must write a **Build constraints** block into that plan (no paid APIs, no self-REVIEW, no PUSH toolchain).

---

## File map

| Path | Role |
|------|------|
| [`HARNESS.md`](./HARNESS.md) | **This file** — process, decisions, thinking. For humans. Do not drop it as “do all phases.” |
| [`PLAN.md`](./PLAN.md) | PLAN job (Plan mode) |
| [`REVIEW.md`](./REVIEW.md) | REVIEW job (adversarial rubric) |
| [`FIX.md`](./FIX.md) | FIX job |
| [`SYNC.md`](./SYNC.md) | SYNC job (goal + docs; no npm) |
| [`PUSH.md`](./PUSH.md) | PUSH job (build/lint + git publish) |

If a job changes, edit that phase file. Update this master file only if the **flow or a decision** changed.

---

## Why it exists (failure modes)

Long single-thread agent chats fail in boring ways. We encode counters as **phases**, not as extra models.

| Failure | What it looks like | Counter |
|---------|-------------------|--------|
| **Agentic laziness** | Stops at ~70%, calls it done | PLAN **Done when**; REVIEW tries to **disprove** done; SYNC + PUSH goal checks |
| **Self-preferential bias** | “Looks good” on code it just wrote | REVIEW is evaluator; Build/FIX are generators; FIX cannot ship |
| **Goal drift** | Quietly ships a smaller cousin after compaction | Every phase re-anchors the **one-sentence** user goal |
| **Harness bloat / slow loops** | `npm run build` on every FIX or SYNC | Toolchain **only** on **PUSH** |
| **Mega-prompt collapse** | One message: plan+build+review+sync+push | **You** drop the next file |

Claude Code [dynamic workflows](https://claude.dev/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code/) fight the same failures with `agent()` / `parallel()` / `pipeline()`. [Harness design patterns](https://claude.com/resources/articles/harnessing-claudes-intelligence) say: lean on the model, strip scaffolding, set boundaries only where they earn their keep. [Long-running harnesses](https://www.anthropic.com/research/harness-design-long-running-apps) split planner / generator / evaluator.

**We took:** phase isolation, loop-until-done, generator ≠ evaluator, adversarial REVIEW, “quick adversarial review of an assumption.”

**We refused:** JS workflow runtime, fan-out subagents, tournaments, a panel of five reviewers, slash-command wrappers, `/loop` as a substitute for re-dropping REVIEW, a fake **IMPLEMENT** drop, and `npm run push` wrappers that hide the PUSH drop ritual.

---

## Decisions (keep these)

1. **Human is the orchestrator.** Plan mode, then Build, then drag REVIEW / FIX / SYNC / PUSH. Never a script that runs all of them.

2. **Drag, don’t slash.** `/h-plan` etc. were tried. They did not reduce turns. Dropping `REVIEW.md` is the quality gate.

3. **No project skills for phases.** Always-on or “matching” skills will chain Build→REVIEW→FIX for “helpfulness.”

4. **No IMPLEMENT.md.** Cursor Plan mode + **Build** is the generator.

5. **REVIEW argues.** Assume incomplete. Diff is evidence, not the last assistant’s story.

6. **FIX does not get the last word.** After patches, drop REVIEW again.

7. **SYNC is docs + goal truth.** No build/lint. If the goal is not fully true, stop — FIX or Build, not docs.

8. **PUSH is the only toolchain + git phase.** Build/lint before commit. Green build does not excuse a smaller goal. **PUSH requires SYNC first.**

9. **PUSH authorizes git.** Dropping `PUSH.md` means Sid asked to commit and push this turn.

10. **No second playbook file.** Master file is this one; jobs are the phase files.

11. **Share by copying `harness/`.** Customize PLAN discover links, PUSH toolchain commands, SYNC docs table, paid-API line.

12. **This repo’s product** is the thumbnail generator. No Neon, Telegram, Zernio, OAuth.

---

## What “good” looks like in each job (summary)

- **PLAN** — Done when + Build constraints in the plan artifact.
- **Build** — only Done when; cheap verify; stop for REVIEW.
- **REVIEW** — rubric + counter-argument; **No findings** → SYNC.
- **FIX** — patch survivors; stop for REVIEW.
- **SYNC** — goal pass + touch docs that need it; stop → tell Sid **PUSH.md**.
- **PUSH** — build, lint, safe commit, push; report hash and remote.

---

## Anti-patterns

- Dropping **PUSH** before **SYNC**.
- Build/lint inside REVIEW, FIX, or SYNC.
- One mega `HARNESS.md` drop that runs every phase.
- Force-push `main` from the PUSH job.
- Pre-push hooks / `npm run push` scripts that replace the **PUSH** drop (out of scope).

---

## History (so we don’t relitigate)

Older kit: `START → build → CLEAN → FIX → END → SYNC`. Build lived in FIX and END; CLEAN rubber-stamped.

We collapsed to PLAN / REVIEW / FIX / SYNC, **no npm until SYNC**, then Plan → **Build** (no IMPLEMENT). Toolchain on SYNC was slow before publish; **SYNC split**: docs/goal stay on SYNC, build/lint/commit/push move to **PUSH** (always after SYNC).

Slash commands + skills were tried and reverted. Drag the phase file.

---

## Copy to another repo

Copy the `harness/` folder. Then:

1. PLAN discover links → that repo’s `AGENTS.md` / `CLAUDE.md`
2. PUSH toolchain → their `pnpm build`, `pytest`, etc.
3. SYNC docs table → their README / setup docs
4. Safety line (paid APIs, prod, deploy)