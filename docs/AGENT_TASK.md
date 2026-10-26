# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：Active = **PHASE6-PERIODIC-DANGER-001**（目標 `?v=0.9.41`）

**ROY（2026-10-26 ~23:16 HKT）ROY_OVERRIDE／continue：** 「暫時都ok繼續去」— still on。Do NOT start Phase 4／horn art lock／phone GPU；do NOT invent more toast／streak／coach polish。

### Active

**PHASE6-PERIODIC-DANGER-001** — periodic must-dodge **red** danger circles（map hazard；**not** bomber／artillery reuse）.

Scope:
- Mid–late run cadence: after `DANGER_PULSE.startAfter` (~75–90s), every `everySec` (~18–24s) spawn 1 circle near player（offset clamp；not dead-center cheese）
- Telegraph ≥0.9s red ground ring → AoE pulse damage if player still inside；events `telegraph kind:dangerPulse` + `dangerPulse`
- Max concurrent 1–2；skip while paused／levelup／weaponOffer／over；no damage during telegraph
- Distinct from bomber（enemy fuse）and artillery（orange aim-zone）：this is **arena strike** hazard for positioning
- Player weapon／DPS／XP／heal／economy／waveMix enemy tables **unchanged**
- Tests `tests/danger-pulse.test.mjs` + shots `tests/screenshots/phase6-danger-pulse/`（1280+390 telegraph）
- Bump `?v=0.9.41`；update AGENT_TASK Complete + HANDOFF §0／§11／history；commit＋push `main`

**Out of scope：** Phase 4；horn art lock；phone GPU；soft-juice toasts；balance economy overhaul；new elite／boss silhouettes this slice.

### Soft-juice → still **DONE**

### Recently completed

- `PHASE3-ENEMY-BOMBER-001` → **v0.9.40** (`2ab9dbb`)
- `PHASE6-RESULT-SHARE-001` → **v0.9.39** (`87eb03a`)

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
