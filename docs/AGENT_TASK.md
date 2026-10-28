# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：**ACTIVE** — shipping `WEAPONS-COLOR-TOKENS-001` v0.9.63 then HOLD

**Opened:** 2026-10-28 Asia/Hong_Kong — Roy ([pt228u])：最底武器欄置中、無名字、水杯冷卻；頂 hub 合併；改完再繼續流程做多幾個項目。  
**Author:** Grok bot · **Shipped:** v0.9.61 `53f9d8b` · v0.9.62 `25e674c` · shipping v0.9.63 · **Prior:** v0.9.60 `b85203f`  
**Spec:** `docs/WEAPONS.md`

### Shipped this beat

1. **v0.9.61 `WEAPONS-HUD-MERGE-001`** `53f9d8b` — merged hub + bottom color water rail.
2. **v0.9.62 `WEAPONS-HUD-RAIL-CLEAR-001`** `25e674c` — stick/hub clear + stronger water fill.
3. **v0.9.63 `WEAPONS-COLOR-TOKENS-001`** (this ship) — shared `--weapon-*` on rail + `cat-*` level/branch cards.

### Out of scope (unchanged)

Phase 4 / horn art lock / soft-juice invent / full ult invent / BALANCE-PASS / deep phone GPU.

### Next

**HOLD** for Roy phone try of hub+bar (+ color tokens). Optional later: branch card layout polish UI-only.

### Verify

```bash
node tests/weapons-color-tokens.test.mjs
node tests/weapons-color-tokens-shots.mjs
```

Live: https://fung2222.github.io/neon-swarm/?v=0.9.63
