# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：**HOLD** — `WEAPONS-REDESIGN-001` shipped as **v0.9.53**（try on phone）

**Opened:** 2026-10-27 Asia/Hong_Kong — Roy full weapon redesign.  
**Closed → HOLD:** 2026-10-27 Asia/Hong_Kong — Grok bot ship 1.

**Author:** Grok bot · **Shipped:** v0.9.53 · **SHA:** `bf1bae3`  
**Spec:** `docs/WEAPONS.md`

### Shipped this beat

1. Docs — `WEAPONS.md` roster／counter／Lv-branch-ult／feel specs／art pipeline.
2. Loadout — max **2P+2S+2T**；migrate from `weaponSlots×4`（flatten 6 HUD cells）.
3. Catalog — 5+5+4 IDs；feel-matched fire helpers（gatling laser-bolts／ion charge-fire／tracking stick／vulcan／zero bolts／acid 10-shot／shotgun／slow rush／drones／blackhole／throws）.
4. HUD — top `#weapon-status`；left `#weapon-rail` stacked squares；legacy top chips **hidden**.
5. Play — primary continuous；secondary ammo/energy → auto primary；throw tap.
6. Mobile GFX baseline raise（post-MOBILE_GFX shed）：prettier PR／bloom defaults；cool-pause／contextlost **kept**.
7. Tests + screenshots `tests/screenshots/weapons-redesign/`；`?v=0.9.53`.

### Stub vs live（honest）

| Area | Live | Stub |
|------|------|------|
| Gatling / shotgun / frag | fire paths live | — |
| Ion charge / tracking stick / vulcan / zero / acid / slow / drones / blackhole / chill / flash / gravity | helpers + projectile fields live | branch UI / ults / polish FX |
| Icons | emoji placeholders | Roy art pipeline |
| Branch / ult | data stubs in catalog | playable UI |

### Out of scope (still)

- Phase 4 Precision · horn art lock · soft-juice invent · deep phone GPU reopen

### Next（after Roy try）

- Art icons · balance tune · branch pick UI · any phone gfx feedback

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
