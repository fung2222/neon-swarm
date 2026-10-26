# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：PHASE6-PERIODIC-DANGER-001 → **Complete**（`?v=0.9.41`）

**ROY（2026-10-26 ~23:16 HKT）ROY_OVERRIDE／continue：** 「暫時都ok繼續去」— still on。Do NOT start Phase 4／horn art lock／phone GPU；do NOT invent more toast／streak／coach polish。

### Just shipped

**PHASE6-PERIODIC-DANGER-001** → live cache-bust **`?v=0.9.41`**.

- `DANGER_PULSE` arena hazard：after `startAfter`(~80s) every `everySec`(~20s) spawn 1 red circle near player（offset clamp；not under feet）
- Telegraph ≥0.9s → `{ type:'dangerPulse' }` AoE；no dmg during telegraph；respect invuln；max concurrent 2
- Events `telegraph kind:dangerPulse` + `dangerPulse`；view reuses bomber-style red ring helper（distinct event kinds）
- Skip while paused／level-up／weaponOffer／dead；**no** new toast／banner（soft-juice still DONE）
- Bomber／artillery／weapon DPS／XP／heal／economy／waveMix **unchanged**
- Tests `tests/danger-pulse.test.mjs` + shots `tests/screenshots/phase6-danger-pulse/`

### Soft-juice → still **DONE**

### Next

1. **HIT-FEEL-DEVICE** — when Roy can play on phone（SwiftShader ≠ device）
2. OR Roy-named Active only
3. Phone GPU／horn art lock — deferred／only after Roy OK

**Do NOT start：** Phase 4／horn art lock／§9／phone GPU／balance／more soft-juice invention.

### Recently completed（do not re-implement）

- `PHASE6-PERIODIC-DANGER-001` → **v0.9.41** (`3040b5e`)
- `PHASE3-ENEMY-BOMBER-001` → **v0.9.40** (`2ab9dbb`)
- `PHASE6-RESULT-SHARE-001` → **v0.9.39** (`87eb03a`)

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
