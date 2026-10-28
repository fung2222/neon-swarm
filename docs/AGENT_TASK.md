# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：**ACTIVE** — pipeline after `WEAPONS-HUD-MERGE-001` **v0.9.61**（2–3 safe slices then HOLD）

**Opened:** 2026-10-28 Asia/Hong_Kong — Roy ([pt228u])：最底武器欄置中、無名字、水杯冷卻；頂 hub 合併；改完再繼續流程做多幾個項目。  
**Author:** Grok bot · **Shipped:** v0.9.61 `53f9d8b` · **Prior:** v0.9.60 `b85203f`  
**Spec:** `docs/WEAPONS.md`

### Shipped this beat

1. **v0.9.61 `WEAPONS-HUD-MERGE-001`**
   - **Bottom `#weapon-rail`:** horizontally centered at very bottom (safe-area); **no name labels**; slots **space-evenly**; color families `--wrail-primary/secondary/throw`; S/T **water-cup** `.wrail-fill` / `--fill`; primary full + ready pulse when active.
   - **Top `#hud-hub`:** one large centered panel — HP **bar** left + LV · **TIME** center · SCORE (+ ARM if >0); XP bar with **%**; goal + zone in hub; mute/pause top-right icons.
   - `#weapon-status` hidden (active = rail highlight).
   - Tokens `--hud-hub-top` / `--hud-hub-max-w` / `--hud-stick-clear`; kept dbl/tpl tap, secondaryBurstMax=3, near-black floor, loadout 2+2+2.
   - Tests: `tests/weapons-hud-merge.test.mjs` · shots `tests/screenshots/weapons-hud-merge/` · `?v=0.9.61`

### Out of scope (unchanged)

Phase 4 / horn art lock / soft-juice invent / full ult invent / BALANCE-PASS / deep phone GPU.

### Next (this beat — then HOLD)

- Stick/rail clearance polish after new bar
- Water-fill + active-state readability
- Weapon color token consistency across rail + branch cards (UI only)
- Then **HOLD** for Roy phone try of hub+bar

### Verify

```bash
node tests/weapons-hud-merge.test.mjs
node tests/weapons-hud-merge-shots.mjs
```

Live: https://fung2222.github.io/neon-swarm/?v=0.9.61
