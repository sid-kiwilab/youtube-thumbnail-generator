# CLEAN — review and simplify

Post-implementation review. **Read the code** — do not treat a successful build as proof of quality.

## What to check

- Missed requirements from the user's goal
- Over-engineering, duplicate logic, unnecessary abstraction
- Dead or legacy code — gut it, do not preserve "just in case"
- Race conditions: stale async responses, unmount guards on client components, duplicate fetches
- Architecture still minimal and coherent for this Next.js Shorts app

## What to do

- Simplify where safe and obvious
- Apply only **trivial** inline cleanups (typos, dead imports) — nothing that needs a multi-file refactor
- **Do not** run large refactors or feature work here — that is FIX

## Output format

Return a **findings list**:

| Severity | Area | Finding |
|----------|------|---------|
| high / medium / low | file or module | one line |

If nothing worth fixing, say explicitly: **No findings.**

Do not over-report nitpicks on code that is already solid.

DONT FUCKING MODIFY THIS FILE!!!