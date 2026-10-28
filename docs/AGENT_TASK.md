# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：**HOLD** — Roy phone try hub+bar（v0.9.61–0.9.64 pipeline）

**Opened:** 2026-10-28 Asia/Hong_Kong — Roy ([pt228u])：最底武器欄置中、無名字、水杯冷卻；頂 hub 合併；改完再繼續流程做多幾個項目。  
**Author:** Grok bot · **Shipped:** v0.9.61 `53f9d8b` · v0.9.62 `25e674c` · v0.9.63 `909c7a6` · v0.9.64 `71f6617` · **Prior:** v0.9.60 `b85203f`  
**Spec:** `docs/WEAPONS.md`

### Shipped this beat

1. **v0.9.61 `WEAPONS-HUD-MERGE-001`** `53f9d8b` — `#hud-hub` 合併置中（HP bar 左 · TIME 中 · LV/分數/XP%／目標／區域）；`#weapon-rail` 底置中無名字、色分 P/S/T、S/T 水杯 `--fill`；`#weapon-status` 隱藏。`?v=0.9.61` · shots `tests/screenshots/weapons-hud-merge/`
2. **v0.9.62 `WEAPONS-HUD-RAIL-CLEAR-001`** `25e674c` — stick clear +36px；mute/pause 直向堆疊清 hub；更強水杯 meniscus + active glow。`?v=0.9.62` · shots `tests/screenshots/weapons-hud-rail-clear/`
3. **v0.9.63 `WEAPONS-COLOR-TOKENS-001`** `909c7a6` — shared `--weapon-*`；cards `cat-primary/secondary/throw`。`?v=0.9.63` · shots `tests/screenshots/weapons-color-tokens/`
4. **v0.9.64 `WEAPONS-BRANCH-CARD-LAYOUT-001`** `71f6617` — branch/ult pick card 手機布局 polish（較矮卡、ellipsis、scroll max-height）；**無** full ult invent。`?v=0.9.64`

### Out of scope / still stubbed

Phase 4 Precision/Morph · horn final art lock · soft-juice invent · full ult / deep ult kits invent · BALANCE-PASS · deep phone GPU · Roy final weapon PNG icons.

### Verify

```bash
node tests/weapons-hud-merge.test.mjs
node tests/weapons-hud-rail-clear.test.mjs
node tests/weapons-color-tokens.test.mjs
node tests/weapons-branch-card-layout.test.mjs
node tests/weapons-branch-card-layout-shots.mjs
```

Live: https://fung2222.github.io/neon-swarm/?v=0.9.64

**HOLD** — please try hub + color water rail on phone; reply ok / issues.
