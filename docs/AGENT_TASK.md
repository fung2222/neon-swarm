# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：**ACTIVE** — safe pipeline after「開始流程」+「一次過做多幾項」(v0.9.66–0.9.70)

**Opened:** 2026-10-28 Asia/Hong_Kong — Roy：開始流程 · expand 4–5 slices.  
**Author:** Grok bot · **Shipping:** v0.9.68 `WEAPONS-RAIL-TAP-TARGET-001` · **Prior:** v0.9.67 `3b5c5f0`

### Shipped this beat
1. **v0.9.66 `STICK-RAIL-CLAMP-001`** (`81e03b5`) — stick clamp above rail; z rail>stick. `?v=0.9.66`
2. **v0.9.67 `WEAPONS-RAIL-FILL-EDGE-001`** (`3b5c5f0`) — drained/on-cd/bursting fill edges. `?v=0.9.67`
3. **v0.9.68 `WEAPONS-RAIL-TAP-TARGET-001`** — phone rail tiles ≥44×44; `--hud-rail-h:54px`. `?v=0.9.68` · shots `tests/screenshots/weapons-rail-tap-target/` · test `tests/weapons-rail-tap-target.test.mjs`

### Next (same beat, before HOLD)
- Branch/ult pick card UI polish (no ult invent)
- Home/settings tiny QOL already flagged

### Preserve
hide-until-touch stick · centered hub · color-only water rail · dbl/tpl tap · secondaryBurstMax=3 · near-black floor · loadout 2+2+2 · **WEAPONS-HUD-CONTROLS-FLOOR-001** · clamp · fill-edge.

### Out of scope
Phase 4 · horn art lock · soft-juice invent · full ult invent · BALANCE-PASS · deep phone GPU · Roy PNG.

### Verify
```bash
node tests/weapons-rail-tap-target.test.mjs
node tests/weapons-rail-tap-target-shots.mjs
node tests/weapons-rail-fill-edge.test.mjs
node tests/stick-rail-clamp.test.mjs
```

Live: https://fung2222.github.io/neon-swarm/?v=0.9.68
