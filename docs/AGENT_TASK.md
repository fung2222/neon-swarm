# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：**ACTIVE** — safe pipeline after「開始流程」(v0.9.66+)

**Opened:** 2026-10-28 Asia/Hong_Kong — Roy ([pt230u])：開始流程 · clear HOLD · 2–3 safe slices.  
**Author:** Grok bot · **Shipping:** v0.9.66 `STICK-RAIL-CLAMP-001` · **Prior:** v0.9.65 `4bfd464`  
**Spec:** `docs/WEAPONS.md`（controls / stick UX / water rail）

### Shipped this beat

1. **v0.9.66 `STICK-RAIL-CLAMP-001`** — stick `placeAt` clamps above `#weapon-rail` (10px air gap) so finger-near-bottom no longer covers color tiles; rail `z-index:9` > stick `8`; idle hide-until-touch / dbl-tpl / loadout / floor preserved. `?v=0.9.66` · shots `tests/screenshots/stick-rail-clamp/` · test `tests/stick-rail-clamp.test.mjs`

### Next (same beat, before HOLD)
- Active rail cell / water-fill edge cases (`drained` / `on-cd` / burst snap)
- Rail tap-target / muted-icon polish (phone ≥44px)

### Preserve (do not regress)
hide-until-touch stick · centered hub · color-only water rail · dbl/tpl tap · secondaryBurstMax=3 · near-black floor · loadout 2+2+2 · **WEAPONS-HUD-CONTROLS-FLOOR-001** (v0.9.59–0.9.60 lineage).

### Out of scope / still stubbed
Phase 4 Precision/Morph · horn final art lock · soft-juice invent · full ult / deep ult kits invent · BALANCE-PASS · deep phone GPU · Roy final weapon PNG icons.

### Verify
```bash
node tests/stick-rail-clamp.test.mjs
node tests/stick-rail-clamp-shots.mjs
node tests/stick-touch-show.test.mjs
node tests/weapons-hud-controls-floor.test.mjs
```

Live: https://fung2222.github.io/neon-swarm/?v=0.9.66
