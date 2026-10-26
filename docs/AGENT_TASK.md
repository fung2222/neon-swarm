# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：Active = **PHASE6-SCORE-POSITION-001**（目標 `?v=0.9.44`）

**ROY（2026-10-26 ~23:53 HKT）ROY_OVERRIDE／continue：** 「繼續去」— still on。Do NOT start Phase 4／horn art lock／phone GPU；do NOT invent more toast／streak／coach polish。

### Active

**PHASE6-SCORE-POSITION-001** — score rewards **positioning + clear efficiency**（Roy：唔只生存加分）.

Scope:
- Config `SCORE_POS`：kill bonuses additive only（base `e.score` path unchanged formula core）
  - **Move bonus**：kill while player moved recently（speed/dist window ~0.35–0.6s）→ +`moveBonus` flat
  - **Safe-zone bonus**：when `zonePressureActive` and player inside `safeR` → +`safeBonus` flat on kill
  - **Clear pace**：optional light efficiency — kills in rolling window above threshold → small mul or flat（cap so no runaway）
- Track counters for over-screen／share optional one-line breakdown（zh-HK）if easy — **no** new toast／coach during run
- Weapon DPS／XP／heal／CARDS／enemy HP tables **unchanged**
- Tests `tests/score-position.test.mjs` + optional shots if over UI shows breakdown
- Bump `?v=0.9.44`；AGENT_TASK Complete + HANDOFF；commit＋push `main`

**Out of scope：** Phase 4；horn；phone GPU；soft-juice；swarmPressure retune；tradeoff card edits.

### Soft-juice → **DONE** · Positioning trio 0.9.40–42 · Tradeoffs 0.9.43

### Recently completed

- `PHASE6-TRADEOFF-CARDS-001` → **v0.9.43** (`d44af7a`)
- `PHASE6-ZONE-PRESSURE-001` → **v0.9.42** (`ddf39c4`)

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
