# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：**HOLD**（Active = none）— UI-LAYOUT-HOME-HUD-001 **shipped**／await Roy try

**Opened:** 2026-10-27 — Roy phone: Active UI layout **before** weapon details（home gear settings／mech cards／bottom CTA／top XP+slots）。

**Shipped:** 2026-10-27 Asia/Hong_Kong — **v0.9.52** `UI-LAYOUT-HOME-HUD-001`

**Live:** https://fung2222.github.io/neon-swarm/?v=0.9.52  

**Author:** Grok bot · **SHA:** (see `git log -1` on `main` after push)

### What shipped

1. **Home settings → gear only** — removed loose `#btn-mute-menu`; mute／volume／lang／glow stay in `ui.mountSettings` sheet；settings mute wrapped through `toggleMutePersist`（alias＋HUD sync）。Top-right = howto book＋gear only。
2. **Mech cards** — tighter padding／stats／gaps；selected `.mech-card.on` scale＋glow；unselected dimmed。
3. **CTA down** — lowered `--menu-cta-bottom` floors so Start／endless hug bottom meta；brand stays high；mid band for 3D mech。
4. **In-run HUD** — `.xp-bar`＋`.weapon-slots` moved to **TOP**（`var(--sa-top)`）；goal／zone／boss-hp／banners nudged clear；stick stays bottom for thumbs。
5. Tests：`tests/ui-layout-home-hud.test.mjs`；updated `safe-area`／`mute-persist`；shots `tests/screenshots/ui-layout-home-hud/`。
6. **Not touched:** weapon system／Phase 4／horn art lock／soft-juice／phone GPU shed（v0.9.51）。

### Honest gaps

- Box＝SwiftShader screenshots ≠ Roy phone／desktop try。
- Selected mech card still leftmost when only horn unlocked（highlight＋mid 3D stage；not reorder invent）。
- In-run mute／pause remain top-right chrome（Roy asked home settings into gear；in-run keep reachable）。

### Process next（do NOT auto-start）

**HOLD for Roy try** on live `?v=0.9.52`（menu layout＋in-run top XP／slots on phone＋desktop）。  
**Ban** auto Phase 4／Morph／horn art lock／soft-juice invent／weapon-details invent／reopen phone GPU deep without Roy。

**Options after Roy reply：** tweak layout／weapon details if named／phone GPU verify still open／HOLD。

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
