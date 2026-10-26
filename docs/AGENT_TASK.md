# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：Active = **PHASE6-ZONE-PRESSURE-001**（目標 `?v=0.9.42`）

**ROY（2026-10-26 ~23:16 HKT）ROY_OVERRIDE／continue：** 「暫時都ok繼續去」— still on。Do NOT start Phase 4／horn art lock／phone GPU；do NOT invent more toast／streak／coach polish。

### Active

**PHASE6-ZONE-PRESSURE-001** — shrinking／pollution **safe zone**（逼走位；Roy balance note）.

Scope:
- Config `ZONE_PRESSURE = { startAfter, shrinkSec, startR, endR, dmgPerSec, tickSec }` — after `startAfter`(~100–130s) safe radius shrinks from ~`ARENA.soft` toward `endR` over `shrinkSec`（keep endR playable，唔縮成點）
- Outside safe R：pollution DoT（tick）；**inside = safe**；respect invuln／pause／levelup／offer／over
- View：visible cyan／acid **safe-edge ring**（readable，唔洗畫面）；optional mild vignette only outside — no new toast／coach
- Events optional `zonePressure` start；logic exposes `safeR` for tests
- Distinct from DANGER_PULSE（periodic red circles）and bomber — this is **persistent shrinking boundary**
- Player weapon／DPS／XP／heal／economy／enemy tables **unchanged**
- Tests `tests/zone-pressure.test.mjs` + shots `tests/screenshots/phase6-zone-pressure/`（1280+390 edge visible）
- Bump `?v=0.9.42`；AGENT_TASK Complete + HANDOFF；commit＋push `main`

**Out of scope：** Phase 4；horn lock；phone GPU；soft-juice；full balance retune；new elite／boss silhouettes.

### Soft-juice → still **DONE**

### Recently completed

- `PHASE6-PERIODIC-DANGER-001` → **v0.9.41** (`3040b5e`)
- `PHASE3-ENEMY-BOMBER-001` → **v0.9.40** (`2ab9dbb`)

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
