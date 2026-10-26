# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：Active = **PHASE3-ENEMY-MEDIC-001**（目標 `?v=0.9.46`）

**ROY（2026-10-27 ~07:16 HKT）ROY_OVERRIDE／continue：** 「好繼續去」— still on. Do NOT start Phase 4／horn art lock／phone GPU；do NOT invent toast／streak／coach polish.

### Active

**PHASE3-ENEMY-MEDIC-001** — ordinary **醫療支援／Combat Medic** that heals nearby allies（forces kill priority）.

Scope:
- `ENEMIES.medic` + `MEDIC` config：distinct procedural silhouette（support pack／antenna／cross plate — **≠** staffer／chief／drone／flanker recolor）；palette white／teal＋lime cross（**no red hull**）
- AI：keep mid-range near wounded allies → pulse heal aura／beam（lime telegraph ≥0.7s before heal tick）→ heal nearby non-elite ordinary HP（cap；no resurrect）；flee if alone／low
- Events `telegraph kind:medic` + `medicHeal`；killing medic stops heal; medic does light contact only if any
- `waveMix`：no early lab；light mid-late＋assembly／reactor／blockade；rare rooftop
- View heal telegraph＋mesh；zh-HK／EN names
- Tests `tests/medic.test.mjs` + screenshots `tests/screenshots/phase3-medic/`
- Bump `?v=0.9.46`；stamp docs；commit＋push `main`

**Out of scope：** Phase 4；horn；phone GPU；soft-juice；weapon DPS／XP／CARDS number edits；elite／boss new silhouette；swarmPressure retune；heal player.

### Soft-juice → **DONE** · Flanker v0.9.45 shipped

### Recently completed

- `PHASE3-ENEMY-FLANKER-001` → **v0.9.45** (`b409cf3`)
- `PHASE6-SCORE-POSITION-001` → **v0.9.44** (`f52e205`)

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
