# FIX — execute lean fixes

Act on CLEAN findings (or obvious bugs you find while fixing). This is the **do work** pass.

## Rules

- Lean diffs only — fix what is worth fixing, skip noise
- Gut dead code and legacy paths — no backwards-compat shims to the old HyperFrames pipeline
- Keep architecture minimal and robust
- Re-check race-prone areas after changes: async generation flows, client state after unmount

## Verify

No separate migration runner. After changes:

```bash
npm run build
npm run lint
```

Hit affected routes locally with `npm run dev` when UI or API routes changed.

## Report back

- **Fixed** — bullet list of what changed
- **Skipped** — anything intentionally left alone and why (one line each)

DONT FUCKING MODIFY THIS FILE!!!