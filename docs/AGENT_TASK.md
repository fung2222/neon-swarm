# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：PHASE3-ENEMY-BOMBER-001 → **Complete**（`?v=0.9.40`）

**ROY（2026-10-26 ~23:16 HKT）ROY_OVERRIDE／continue：** 「暫時都ok繼續去」— soft-juice DONE 後仍繼續 safe content。Do NOT start Phase 4／horn art lock／phone GPU；do NOT invent more toast／streak／coach polish。

### Just shipped

**PHASE3-ENEMY-BOMBER-001** → live cache-bust **`?v=0.9.40`**.

- `ENEMIES.bomber` 自爆單位／Suicide Bomber；compact runner + charge pack／antenna／blinker；dark steel + danger crimson／magenta
- Chase（above-soldier speed）→ fuse band → **red** ground-circle telegraph under self ≥0.9s（`BOMBER.telegraphSec`）→ AoE detonate；no dmg during telegraph；killed mid-chase／telegraph = no explode
- Events: `telegraph kind:bomber` + `bomberDetonate`；view red ring（≠ artillery orange aim-zone）
- waveMix: no early lab（t&lt;40）；light mid-late lab＋assembly／blockade／rooftop／reactor；sum≈1；prior shield／artillery／sniper floors kept
- Tests: `tests/bomber.test.mjs` + shots `tests/screenshots/phase3-bomber/`
- Player weapon／DPS／XP／heal／economy **unchanged**

### Soft-juice usability queue → still **DONE**（do not reopen）

### Next

1. **HIT-FEEL-DEVICE** — when Roy can play on phone（SwiftShader ≠ device）
2. OR Roy-named Active only
3. Phone GPU／horn art lock — deferred／only after Roy OK

**Do NOT start：** Phase 4／horn art lock／§9／phone GPU／balance／more soft-juice invention.

### Recently completed（do not re-implement）

- `PHASE3-ENEMY-BOMBER-001` → **v0.9.40** (`2ab9dbb`)
- `PHASE6-RESULT-SHARE-001` → **v0.9.39** (`87eb03a`)
- `PHASE6-KILL-STREAK-LITE-001` → **v0.9.38** (`fc61ddc`)
- `PHASE6-EARLY-FEEDBACK-001` → **v0.9.37** (`ea04be7`)
- … through commander／8-dir／inventory／maps／endless

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
