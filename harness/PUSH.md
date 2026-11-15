# PUSH — prove and publish

**Job:** ship to git. **Not:** new features, not doc rewrites, not redefining the goal.

Run only after **SYNC** completed this pass. Dropping this file is Sid’s **authorization to commit and push this turn**.

## 0. Prerequisites (hard stop)

- **REVIEW** said **No findings** (or lows Sid accepted).
- **SYNC** finished: goal check + docs as needed.
- Original one-sentence goal is still **fully** true. If not — stop; drop **FIX.md** or Build again. Do not push a shrunk goal.

## 1. Toolchain

```bash
npm run build
npm run lint
```

Fail → drop **FIX.md** (or Build), fix, re-run **SYNC** if docs needed, then **PUSH** again. Do not commit a broken tree.

## 2. Git safety

- Never commit `.env`, credentials, or API keys (check staged and unstaged).
- No `git push --force` to `main` / `master`.
- Do not update git config.

## 3. Scope and commit

1. `git status` (+ diff stat). Stage only files for **this pass** unless Sid clearly wants the whole working tree.
2. If the tree is wider than one feature (e.g. harness-only pass vs full app rewrite) — **ask Sid** what belongs in this commit before `git add`.
3. Draft a 1–2 sentence commit message (why, not a file list). Commit with a HEREDOC-style message on Windows/PowerShell as usual for this repo.

4. `git commit` → `git push` (use `gh` only if that’s already how this repo ships; default `git push`).

## 4. Report

- Goal check: **pass**
- Build + lint: **pass** or the error
- Commit: hash + one-line summary
- Push: remote branch + result

That is the end of the pass.

**Not:** harness edits unless this pass was harness work; drive-by staging of unrelated WIP without Sid’s OK.