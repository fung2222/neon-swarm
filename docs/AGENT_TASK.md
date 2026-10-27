# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：**HOLD** — `WEAPONS-HUD-OVERLAP-FIX-001` shipped as **v0.9.60**（try on phone）

**Opened:** 2026-10-28 Asia/Hong_Kong — Roy phone screenshot「遊玩時，所有介面及狀態列出重㬪，要重排」([pt227u]) — floating `#weapon-status` over XP + 時間/分數.  
**Closed → HOLD:** 2026-10-28 Asia/Hong_Kong — Grok bot ship HUD vertical rhythm then HOLD.

**Author:** Grok bot · **Shipped:** v0.9.60 · **SHA:** `b85203f`  
**Prior:** v0.9.59 HUD/controls/floor · Spec: `docs/WEAPONS.md`

### Shipped this beat

1. **v0.9.60 `WEAPONS-HUD-OVERLAP-FIX-001`**
   - **Rhythm tokens:** `--hud-row1-top` / `--hud-xp-top` / `--hud-wstat-top` / `--hud-side-top` / `--hud-stick-clear` (+ heights/gaps); safe-area aware.
   - **Row 1:** 護盾+等級 (left) | 時間+分數 (right cluster) | mute+pause — same chip chrome, one band.
   - **Row 2:** full-width XP bar alone (no chip over it).
   - **Row 3:** `#weapon-status` thin bar **under** XP only (not centered over time/score); rail still shows active full names.
   - **Goal / zone:** left stack below status; never share row1–2.
   - **Bottom:** weapon rail kept; stick **raised** above rail band (`--hud-stick-clear`) so no vertical crowd.
   - Kept: dbl/tpl tap, secondary ≤3 burst, near-black floor, loadout rules, `--hud-chip-*` chrome.
2. Tests + screenshots: `tests/weapons-hud-overlap-fix.*` · `tests/screenshots/weapons-hud-overlap-fix/`.
3. `?v=0.9.60` cache-bust.

### Out of scope (unchanged)

Phase 4 / horn art lock / soft-juice invent / balance retune / full ult / Roy PNG / deeper GPU.

### Stub vs live（honest）

| Area | Live | Stub |
|------|------|------|
| HUD no-overlap vertical rhythm | **v0.9.60** | — |
| Near-black floor + bottom weapon row | **v0.9.59** | — |
| Multi-tap + secondary ≤3 burst | **v0.9.59** | — |
| Unified chip chrome | **v0.9.59+** | — |

### Next (after Roy try)

- Confirm phone portrait: top strip / XP / status / goal / rail+stick readable, no overlap.
- Optional later: named `BALANCE-PASS` — do not start without Roy.

### Verify

```bash
node tests/weapons-hud-overlap-fix.test.mjs
node tests/weapons-hud-overlap-fix-shots.mjs
node tests/weapons-hud-controls-floor.test.mjs
```

Live: https://fung2222.github.io/neon-swarm/?v=0.9.60
