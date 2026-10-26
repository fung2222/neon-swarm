# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：Complete = **PHASE3-ENEMY-MEDIC-001**（`?v=0.9.46`）

**ROY（2026-10-27 ~07:16 HKT）ROY_OVERRIDE／continue：** 「好繼續去」— still on. Do NOT start Phase 4／horn art lock／phone GPU；do NOT invent toast／streak／coach polish.

### Active — **Complete**

**PHASE3-ENEMY-MEDIC-001** → **v0.9.46** — ordinary **醫療支援／Combat Medic**（heal allies → kill priority）.

Shipped:
- `ENEMIES.medic` + `MEDIC`：support pack／antenna／lime cross plate；white／teal＋lime（no red hull）
- AI：mid-range near wounded ordinary → lime heal telegraph≥0.7s → heal pulse（cap；no resurrect；ordinary-only）→ recover；soft flee alone／low／player close
- Events `telegraph kind:medic` + `medicHeal`；kill mid-telegraph = no heal
- `waveMix`：no early lab；light mid-late＋assembly／reactor／blockade；rooftop rare
- View lime aura＋mesh；zh-HK／EN names
- Tests `tests/medic.test.mjs`；screenshots `tests/screenshots/phase3-medic/`
- `?v=0.9.46`；AGENT_TASK＋HANDOFF stamped；pushed `main`

**Out of scope kept：** Phase 4；horn；phone GPU；soft-juice；weapon DPS／XP／CARDS；elite／boss silhouette；swarmPressure retune；heal player.

### Soft-juice → **DONE** · Flanker v0.9.45 · Medic v0.9.46

### Recently completed

- `PHASE3-ENEMY-MEDIC-001` → **v0.9.46**
- `PHASE3-ENEMY-FLANKER-001` → **v0.9.45** (`b409cf3`)
- `PHASE6-SCORE-POSITION-001` → **v0.9.44** (`f52e205`)

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
