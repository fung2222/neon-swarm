# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：**HOLD** — `WEAPONS-BRANCH-PICK-001` shipped as **v0.9.54**（try on phone）

**Opened:** 2026-10-27 Asia/Hong_Kong — Roy「開始」after WEAPONS-REDESIGN-001 HOLD.  
**Closed → HOLD:** 2026-10-27 Asia/Hong_Kong — Grok bot ship.

**Author:** Grok bot · **Shipped:** v0.9.54 · **SHA:** _(fill after push)_  
**Spec:** `docs/WEAPONS.md` · prior redesign = v0.9.53

### Shipped this beat

1. Branch / ult **playable path** — catalog stubs → level-card offers.
2. Unlock gates — `BRANCH_UNLOCK_LV=3` · `ULT_UNLOCK_LV=5`（primary only for ult）.
3. Helpers — `branchOptions`／`ultOptions`／`branchStatMods`／`buildBranchOfferCards`／`buildUltOfferCards`／`needsBranchPick`／`needsUltPick`／`weaponLevel` in `js/weapons.js`（re-export `js/config.js`）.
4. Logic — `weaponBranches`／`weaponUlts`／`pendingPathOffer`；`_queueWeaponPathOffers` after stack gains；`_flushPathOffer` behind levelup；`applyCard` branch／ult；light mods on gatling／vulcan／ion／mg pierce／cd／dmg.
5. UI — level-cards titles `A·…`／`大招·U1`；`.branch-offer` chrome；HUD `LvN·B`／`LvN·B·U1` via `syncWeaponHud`.
6. Tests + screenshots `tests/screenshots/weapons-branch/`；`?v=0.9.54`.

### Stub vs live（honest）

| Area | Live | Stub |
|------|------|------|
| Branch pick UI (Lv3) | playable level-cards + apply | — |
| Ult pick UI (Lv5 primary) | playable level-cards + light stat mods | full ult kits / unique fire paths |
| Branch stat mods | light cd／dmg／pierce／spread | deep kit rewrite per letter |
| Feel fire (v0.9.53) | helpers live | polish FX still open |
| Icons | emoji placeholders | Roy art pipeline |
| Phase 4 / horn lock | — | **do not start** |

### Out of scope (still)

- Phase 4 Precision · horn art lock · soft-juice invent · deep phone GPU reopen

### Next（after Roy try）

- Real-icon placeholders / art pipeline · feel FX polish · balance tune · full ult kits if named · any phone gfx feedback

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
