# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：Active = **Complete** · **HOLD for Roy try**（目標 `?v=0.9.47` shipped）

**ROY（2026-10-27）ROY_OVERRIDE／continue：** 「好繼續去」— jammer slice done. Do NOT start Phase 4／horn art lock／phone GPU；do NOT invent toast／streak／coach polish.

### Active → **Complete**

**PHASE3-ENEMY-JAMMER-001** — ordinary **干擾單位／Signal Jammer** → **v0.9.47**（live `?v=0.9.47`）.

Shipped:
- `ENEMIES.jammer` + `JAMMER`：dish／mast／emitter pods；dark steel＋magenta／violet（**no red hull**）；≠ drone／medic／artillery／flanker recolor
- AI：mid-range → **violet** jam telegraph ≥0.85s → fireCd mul ×1.35 ~2.5s（stack cap 1；refresh OK）→ recover／reposition
- Events `telegraph kind:jammer` + `jammerPulse`；kill mid-telegraph = no apply；debuff ends cleanly
- Visual：reuse `#fx-flash` magenta／particles — **no** new toast／coach／streak
- `waveMix`：no early lab；light mid-late＋reactor／blockade／rooftop；assembly rare
- Tests `tests/jammer.test.mjs` + screenshots `tests/screenshots/phase3-jammer/`

### Soft-juice → **DONE** · Flanker 0.9.45 · Medic 0.9.46 · Jammer 0.9.47

### Recently completed

- `PHASE3-ENEMY-JAMMER-001` → **v0.9.47**
- `PHASE3-ENEMY-MEDIC-001` → **v0.9.46** (`132e236`)
- `PHASE3-ENEMY-FLANKER-001` → **v0.9.45** (`b409cf3`)

### Next = **HOLD for Roy try**

3-enemy priority beat（flanker→medic→jammer）complete. **HOLD for Roy try**（same as after 0.9.40–44 beat）. Do **not** invent a 4th enemy；do **not** auto-start Phase 4／horn／phone GPU／soft-juice.

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
