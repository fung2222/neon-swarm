# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：Active = **PHASE3-ENEMY-BOMBER-001**（目標 `?v=0.9.40`）

**ROY（2026-10-26 ~23:16 HKT）ROY_OVERRIDE／continue：** 「暫時都ok繼續去」— soft-juice DONE 後仍繼續 safe content。Do NOT start Phase 4／horn art lock／phone GPU；do NOT invent more toast／streak／coach polish。

### Active

**PHASE3-ENEMY-BOMBER-001** — suicide bomber ordinary enemy with **must-dodge red-circle** telegraph AoE.

Scope:
- New `ENEMIES.bomber`（zh「自爆單位」／en「Suicide Bomber」）；procedural silhouette ≠ drone／soldier／artillery recolor（compact runner + visible charge pack／antenna）
- Behavior: chase player → **red** ground blast telegraph under self ≥0.9s（`BOMBER.telegraphSec`）→ AoE detonate（self dies）；contact/proximity fuse optional but telegraph **must** fire before damage
- Events: `telegraph kind:bomber` + `bomberDetonate`；view red circle／ring（danger red — distinct from artillery orange）
- waveMix: mid-late lab light；assembly／blockade／rooftop light；**no** early lab（t&lt;40s）
- Player weapon／DPS／XP／heal／economy tables **unchanged**
- Tests: `tests/bomber.test.mjs` + screenshot script `tests/phase3-bomber-shots.mjs` → `tests/screenshots/phase3-bomber/`
- Bump live cache-bust `?v=0.9.40`；update `docs/HANDOFF.md` §0／§11／version history + this file Complete stamp
- Commit＋push `main`

**Out of scope：** Phase 4 Precision／Morph；horn art lock／further silhouette polish；phone GPU deep cuts；balance economy overhaul；more soft-juice toasts.

### Soft-juice usability queue → still **DONE**（do not reopen）

### Recently completed（do not re-implement）

- `PHASE6-RESULT-SHARE-001` → **v0.9.39** (`87eb03a`)
- `PHASE6-KILL-STREAK-LITE-001` → **v0.9.38** (`fc61ddc`)
- `PHASE6-EARLY-FEEDBACK-001` → **v0.9.37** (`ea04be7`)
- … through commander／8-dir／inventory／maps／endless

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
