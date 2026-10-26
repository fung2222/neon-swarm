# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：PHASE6-ZONE-PRESSURE-001 → **Complete**（`?v=0.9.42`）

**ROY（2026-10-26 ~23:16 HKT）ROY_OVERRIDE／continue：** 「暫時都ok繼續去」— still on。Do NOT start Phase 4／horn art lock／phone GPU；do NOT invent more toast／streak／coach polish。

### Complete — PHASE6-ZONE-PRESSURE-001

**PHASE6-ZONE-PRESSURE-001** → live cache-bust **`?v=0.9.42`**（code `PENDING`）.

- `ZONE_PRESSURE` shrinking／pollution safe zone：after `startAfter`(~110s) `safeR` lerps `startR`(~30／ARENA.soft)→`endR`(~16) over `shrinkSec`(~200s)
- Outside safeR：pollution DoT on `tickSec`(~0.5)；respect invuln；skip pause／levelup／offer／over／menu
- View：cyan／acid safe-edge ring＋mild outer wash；**no** new toast／coach／banner
- One-shot event `zonePressure phase:start`；logic exposes `safeR`／`zonePressureActive`
- Distinct from DANGER_PULSE（periodic red）／bomber／artillery；ARENA.half／soft **unchanged** for early game
- Player weapon／DPS／XP／heal／economy／enemy tables **unchanged**
- Tests `tests/zone-pressure.test.mjs`＋shots `tests/screenshots/phase6-zone-pressure/`（1280+390 edge）

**Out of scope kept：** Phase 4；horn lock；phone GPU；soft-juice invent；balance overhaul；new elite／boss.

### Soft-juice → still **DONE**

### Recently completed

- `PHASE6-ZONE-PRESSURE-001` → **v0.9.42** (`PENDING`)
- `PHASE6-PERIODIC-DANGER-001` → **v0.9.41** (`3040b5e`)
- `PHASE3-ENEMY-BOMBER-001` → **v0.9.40** (`2ab9dbb`)

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
