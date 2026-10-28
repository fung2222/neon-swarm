# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：**ACTIVE** — pipeline after `WEAPONS-HUD-MERGE-001`（rail-clear → color-tokens → HOLD）

**Opened:** 2026-10-28 Asia/Hong_Kong — Roy ([pt228u])：最底武器欄置中、無名字、水杯冷卻；頂 hub 合併；改完再繼續流程做多幾個項目。  
**Author:** Grok bot · **Shipped:** v0.9.61 `53f9d8b` · shipping v0.9.62 · **Prior:** v0.9.60 `b85203f`  
**Spec:** `docs/WEAPONS.md`

### Shipped this beat

1. **v0.9.61 `WEAPONS-HUD-MERGE-001`** `53f9d8b`
   - Bottom `#weapon-rail` centered color-only water fill; top `#hud-hub` merged; `#weapon-status` hidden.
   - Tests: `tests/weapons-hud-merge.*` · `?v=0.9.61`
2. **v0.9.62 `WEAPONS-HUD-RAIL-CLEAR-001`** (this ship)
   - `--hud-stick-clear` +36px above rail; hub max-w clears mute/pause; stronger water meniscus + S/T active glow; shared `--weapon-*` aliases.
   - Tests: `tests/weapons-hud-rail-clear.*` · `?v=0.9.62`

### Out of scope (unchanged)

Phase 4 / horn art lock / soft-juice invent / full ult invent / BALANCE-PASS / deep phone GPU.

### Next (this beat — then HOLD)

- Weapon color token consistency across rail + branch cards (UI only)
- Then **HOLD** for Roy phone try of hub+bar

### Verify

```bash
node tests/weapons-hud-merge.test.mjs
node tests/weapons-hud-rail-clear.test.mjs
node tests/weapons-hud-rail-clear-shots.mjs
```

Live: https://fung2222.github.io/neon-swarm/?v=0.9.62
