# Agent harness

Drag one file into chat at each phase. Run in order — do not skip ahead unless the user says so.

```
START → build → CLEAN → FIX → END → SYNC
```

| File | Drop when… |
|------|------------|
| [START.md](./START.md) | Starting a new feature or pass |
| *(normal chat)* | Plan approved — implement |
| [CLEAN.md](./CLEAN.md) | Implementation done |
| [FIX.md](./FIX.md) | After CLEAN or END blockers |
| [END.md](./END.md) | Solid gate |
| [SYNC.md](./SYNC.md) | END says solid — update docs |

Context for this repo: [README.md](../README.md), [docs/generate.md](../docs/generate.md), [AGENTS.md](../AGENTS.md). Full Shorts pipeline docs are in local `youtube-archive` only.

DONT FUCKING MODIFY THIS FILE!