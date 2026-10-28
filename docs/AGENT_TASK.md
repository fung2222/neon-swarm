# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：**HOLD** — Roy phone try stick touch-show（v0.9.65）

**Opened:** 2026-10-28 Asia/Hong_Kong — Roy ([pt229u])：隱藏遙控桿，手碰螢幕才顯示在手指位置。  
**Author:** Grok bot · **Shipped:** v0.9.65 `STICK-TOUCH-SHOW-001` · **Prior:** v0.9.64 `71f6617` · v0.9.63 `909c7a6` · v0.9.62 `25e674c` · v0.9.61 `53f9d8b`  
**Spec:** `docs/WEAPONS.md`（controls / stick UX）

### Shipped this beat

1. **v0.9.65 `STICK-TOUCH-SHOW-001`** — idle virtual stick fully invisible（no corner `ready` / `hint-pulse` ghost）；playfield touch shows stick centered under finger（existing drag-anywhere relocate）；release re-hides immediately；desktop WASD unchanged；dbl/tpl-tap / weapon rail / `#hud-hub` / near-black floor / loadout kept. `?v=0.9.65` · shots `tests/screenshots/stick-touch-show/` · test `tests/stick-touch-show.test.mjs`

### Prior (still live baseline)

- v0.9.61–0.9.64 hub+bar / color tokens / branch-card layout pipeline.
- v0.9.60 WEAPONS-HUD-OVERLAP-FIX-001 · v0.9.59 WEAPONS-HUD-CONTROLS-FLOOR-001 (near-black floor · dbl/tpl-tap · bottom rail).

### Out of scope / still stubbed

Phase 4 Precision/Morph · horn final art lock · soft-juice invent · full ult / deep ult kits invent · BALANCE-PASS · deep phone GPU · Roy final weapon PNG icons.

### Verify

```bash
node tests/stick-touch-show.test.mjs
node tests/stick-touch-show-shots.mjs
node tests/weapons-hud-controls-floor.test.mjs
node tests/run-loop-ux.test.mjs
```

Live: https://fung2222.github.io/neon-swarm/?v=0.9.65

**HOLD** — please try on phone: idle = no stick ghost; finger down = stick under finger; release = gone. Reply ok / issues.
