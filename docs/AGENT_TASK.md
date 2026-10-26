# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：Active = **PHASE6-TRADEOFF-CARDS-001**（目標 `?v=0.9.43`）

**ROY（2026-10-26 ~23:53 HKT）ROY_OVERRIDE／continue：** 「繼續去」— still on。Do NOT start Phase 4／horn art lock／phone GPU；do NOT invent more toast／streak／coach polish。

### Active

**PHASE6-TRADEOFF-CARDS-001** — upgrade cards with **real trade-offs**（Roy：火力↑防禦↓等；深度放 Build 選擇）.

Scope:
- Add **3** new cards to `CARDS`（kind util／weapon／armor mix）；each has clear upside **and** downside in zh-HK／EN desc
  - e.g. Overclock：fireCd↓／rate↑ but armor− or maxHp−1（clamp floors）
  - Glass Cannon：bulletDmg↑ but maxHp−1（hp clamp）
  - Heavy Frame：armor＋／contact resist but speed↓
- `max` 2–3 each；`apply` must keep hp≤maxHp、armor≥0、speed／fireCd floors sensible；never soft-lock
- Level-up／pickup card chrome reuse existing（trade-off hint in desc only — **no** new toast）
- Existing card numbers／weapon DPS base tables **unchanged**（additive pool only — not economy overhaul）
- Tests `tests/tradeoff-cards.test.mjs`（apply floors、exhaust max、pickCards can offer them）+ light shots `tests/screenshots/phase6-tradeoff-cards/` if level-card UI easy
- Bump `?v=0.9.43`；AGENT_TASK Complete + HANDOFF；commit＋push `main`

**Out of scope：** Phase 4；horn lock；phone GPU；soft-juice；rewrite all CARDS／swarmPressure；new elite／boss.

### Soft-juice → still **DONE** · Positioning trio（0.9.40–42）shipped

### Recently completed

- `PHASE6-ZONE-PRESSURE-001` → **v0.9.42** (`ddf39c4`)
- `PHASE6-PERIODIC-DANGER-001` → **v0.9.41** (`3040b5e`)
- `PHASE3-ENEMY-BOMBER-001` → **v0.9.40** (`2ab9dbb`)

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
