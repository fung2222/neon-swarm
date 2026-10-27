# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：**HOLD** — `WEAPONS-BRANCH-KITS-001` shipped as **v0.9.55**（try on phone）

**Opened:** 2026-10-28 Asia/Hong_Kong — Roy「開始」after WEAPONS-BRANCH-PICK-001 HOLD.  
**Closed → HOLD:** 2026-10-28 Asia/Hong_Kong — Grok bot ship.

**Author:** Grok bot · **Shipped:** v0.9.55 · **SHA:** `(pending push)`  
**Spec:** `docs/WEAPONS.md` · prior branch pick = v0.9.54 · redesign = v0.9.53

### Shipped this beat

1. **Deep branch kits** — A/B/C (primary) meaningfully change fire/behavior beyond light number bumps.
2. `branchStatMods` expanded with per-weapon kit flags (overheat, pierce, multi-bolt, charge/chain/slit, warheads/stick/seek, spray/burn/fortress, chill/frostBurst/selfShield).
3. Game fire ticks apply kits: gatling / ion_beam / tracking_bomb / vulcan / zero_laser; secondary/throw A/B deepened where fire path exists.
4. Ult U1/U2 remain **light amplifiers only** (dmg/cd) — no full unique ult kits.
5. Branch offer copy hints kit feel; HUD pick path from v0.9.54 unchanged.
6. Tests `tests/weapons-branch-kits.test.mjs` + prior pick tests green; screenshots `tests/screenshots/weapons-branch-kits/`; `?v=0.9.55`.

### Stub vs live（honest）

| Area | Live | Stub |
|------|------|------|
| Branch pick UI (Lv3) | playable level-cards + apply | — |
| Branch combat kits A/B/C | **deep fire/behavior deltas** | balance tune after Roy try |
| Ult pick UI (Lv5 primary) | playable + light stat amp | **full unique ult fire paths** |
| Feel fire (v0.9.53) | helpers live | polish FX still open |
| Icons | emoji placeholders | Roy art pipeline |
| Phase 4 / horn lock | — | **do not start** |

### Out of scope (still)

- Phase 4 Precision · horn art lock · soft-juice invent · deep phone GPU reopen · inventing brand-new systems · full ult kits

### Next（after Roy try）

- Balance tune from phone try · feel FX polish · real-icon placeholders · full ult kits **only if Roy names** · any phone gfx feedback

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
