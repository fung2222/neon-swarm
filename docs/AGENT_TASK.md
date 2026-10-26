# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：Active = **PHASE3-ENEMY-JAMMER-001**（目標 `?v=0.9.47`）

**ROY（2026-10-27 ~07:16 HKT）ROY_OVERRIDE／continue：** 「好繼續去」— still on. Do NOT start Phase 4／horn art lock／phone GPU；do NOT invent toast／streak／coach polish.

### Active

**PHASE3-ENEMY-JAMMER-001** — ordinary **干擾單位／Signal Jammer** that briefly slows player fire rate（priority kill；visual only — **no** new toast）.

Scope:
- `ENEMIES.jammer` + `JAMMER` config：distinct procedural silhouette（dish／mast／emitter pods — **≠** drone／medic／artillery／flanker recolor）；palette dark steel＋magenta／violet emitters（**no red hull**）
- AI：keep mid-range → **violet** jam telegraph ≥0.85s（ground ring／beam）→ apply short fireCd mul debuff on player（e.g. ×1.35 for ~2.5s；stack cap 1；refresh OK）→ recover／reposition
- Events `telegraph kind:jammer` + `jammerPulse`；kill mid-telegraph = no apply；debuff ends cleanly
- Visual feedback：existing hurt／overlay style OR small HUD tint／icon reuse — **no** new coach／toast／streak copy
- `waveMix`：no early lab；light mid-late＋reactor／blockade／rooftop；assembly rare
- Tests `tests/jammer.test.mjs` + screenshots `tests/screenshots/phase3-jammer/`
- Bump `?v=0.9.47`；stamp docs；commit＋push `main`

**Out of scope：** Phase 4；horn；phone GPU；soft-juice toast invent；weapon base DPS／XP／CARDS number edits；elite／boss silhouette；swarmPressure retune；permanent debuff.

### Soft-juice → **DONE** · Flanker 0.9.45 · Medic 0.9.46

### Recently completed

- `PHASE3-ENEMY-MEDIC-001` → **v0.9.46** (`132e236`)
- `PHASE3-ENEMY-FLANKER-001` → **v0.9.45** (`b409cf3`)

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
