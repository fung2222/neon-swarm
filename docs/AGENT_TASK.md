# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：Active = **PHASE3-ENEMY-FLANKER-001**（目標 `?v=0.9.45`）

**ROY（2026-10-27 ~07:16 HKT）ROY_OVERRIDE／continue：** 「好繼續去」— HIT-FEEL notes skip；resume safe content. Do NOT start Phase 4／horn art lock／phone GPU；do NOT invent toast／streak／coach polish.

### Active

**PHASE3-ENEMY-FLANKER-001** — ordinary **側襲單位／Flanker** that forces run-and-gun＋close-range aim（fits Roy phone themes 近身／跑射）.

Scope:
- `ENEMIES.flanker` + `FLANKER` config：distinct procedural silhouette（lean runner／asymmetric blades／side vents — **≠** soldier／bomber／hunter／drone recolor）；palette steel＋violet／cyan trim（**no red hull**）
- AI：arc approach → short **cyan／danger** dash telegraph ≥0.85s（ground lane or dash wedge）→ dash contact damage → recover → re-angle flank
- Events `telegraph kind:flanker` + `flankerDash`；killed mid-telegraph = no dash dmg
- `waveMix`：no early lab；light mid-late lab＋assembly／blockade／rooftop；reactor rare
- View telegraph draw；zh-HK name in strings if needed
- Tests `tests/flanker.test.mjs` + screenshots `tests/screenshots/phase3-flanker/`
- Bump `?v=0.9.45`；stamp AGENT_TASK＋HANDOFF；commit＋push `main`

**Out of scope：** Phase 4；horn；phone GPU；soft-juice；weapon DPS／XP／CARDS number edits；elite／boss new silhouette；swarmPressure retune.

### Soft-juice → **DONE** · Product beat 0.9.40–44 shipped · HIT-FEEL deferred（Roy continue）

### Recently completed

- `PHASE6-SCORE-POSITION-001` → **v0.9.44** (`f52e205`)
- `PHASE6-TRADEOFF-CARDS-001` → **v0.9.43** (`d44af7a`)

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
