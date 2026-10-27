# AUDIT v0.9.19 — whole-game check vs HANDOFF / AGENT_TASK

**Author:** Grok bot  
**Date:** 2026-10-26（Asia/Hong_Kong）  
**Repo:** https://github.com/fung2222/neon-swarm  
**Audit baseline HEAD (pre-this-commit):** `fa7eee8`  
**Live cache-bust checked:** `?v=0.9.19`（GitHub Pages `index.html` matches）  
**Product version string:** v0.9.19（`index.html`, `js/main.js` header）  
**Evidence labels used:** `implemented` / `tested` / `visually reviewed` / `device verified` / `not verified`

> Scope: conventional docs／health-check only. **Did not** start AIM-HIT rework, Phase 4, horn art lock, or GPU cuts. Box＝SwiftShader ≠ Roy device.

---

## 1. Meta alignment

| Check | Result |
| --- | --- |
| `git rev-parse HEAD` | `fa7eee8`（≥ requested fa7eee8；on `main`） |
| Live `?v=` | **0.9.19** |
| `index.html` css／js `?v=` | **0.9.19** |
| `js/main.js` banner | v0.9.19 AIM-HIT-FAST-002 |
| `package.json` version field | none（`{"type":"module","private":true}` only — not a mismatch） |
| `AGENT_TASK` status | **HOLD** awaiting Kimi review of AIM-HIT-FAST-002 @ `3e3d20e` — correct（feature commit；later docs commit `fa7eee8`） |
| `HANDOFF` §11 | points at v0.9.19＋HOLD＋queue — matches reality |

---

## 2. MD claim → reality table

| Claim (HANDOFF / AGENT_TASK) | Status | Evidence |
| --- | --- | --- |
| Aim: `interceptAimDir` quadratic | **implemented** + **tested** | `js/logic.js` export；`tests/aim-hit-fast.test.mjs` 002 cases PASS |
| Aim: `muzzleInterceptAimDir` two-stage | **implemented** + **tested** | used by MG／laser／shotgun／rocket／plasma；muzzle origin consistency OK |
| Aim: `relativeSegmentHitsCircle` + enemy `prevX/prevZ` | **implemented** + **tested** | `_moveEnemies` records prev；`_stepProjectiles` uses relative sweep |
| Update order: `_moveEnemies` before `_stepProjectiles` | **implemented** + **tested** | `Game.step` ~1693–1695；swept／perp cases PASS |
| MG logic: no 0.08rad angle jitter | **implemented** + **tested** | `_fireMg` comment＋no random angle；`live MG jitter path OK` |
| `AIM_LEAD_MAX_T` still 0.30 | **implemented** | `export const AIM_LEAD_MAX_T = 0.30` |
| BEATS: sentinel@120, hunter@240, swarm_core@360 | **implemented** + **tested** | `config.BEATS`；`beats.test.mjs` PASS |
| ENDLESS after 360: eliteEvery 90, bossEvery 300 | **implemented** + **tested** | `ENDLESS`＋`_endlessBeatCheck`；beats PASS |
| MAP_ZONE lab→assembly@195→reactor@285→blockade@420→rooftop@510 | **implemented** + **tested** | `MAP_ZONE`＋zoneEnter events；`map-zone.test.mjs` PASS |
| Weapon pickup choice UI（no silent overwrite） | **implemented** + **tested** | `kind:'weapon'`＋`weaponOffer`／`levelup from:'pickup'`；`weapon-pickup.test.mjs` PASS；shots folder present |
| Grenade forward fan ~120°（`GRENADE_FAN_DOT=0.5`） | **implemented** + **tested** | `grenade-aim.test.mjs` PASS（rear→forward） |
| WebGL recover overlay「繪圖暫時中斷」 | **implemented** | `strings.js` `gfx.title`；`main.js` contextlost→pause＋overlay＋reload |
| horn bake 32 PNGs | **implemented** | `assets/mechs/horn/sheets/` **32** PNGs＋atlas／anchors；`bake-player` OK |
| `heavy`／`prototype` locked stubs | **implemented** | `playable:false`；selection `coming`／locked Start |
| Pause／resume UI（manual） | **implemented** | `btn-pause`／`btn-resume`／Esc toggle；**no** `visibilitychange` auto-pause |
| Screenshot evidence folders claimed in HANDOFF | **present** | see §4；files exist（this audit did **not** re-eyeball every PNG） |
| AIM-HIT-FAST-002 Roy device hit feel | **not verified** | Box／SwiftShader＋headless only |
| Phone mid-run WebGL root-cause fixed | **not verified**／open gap | overlay＋v0.9.6 cuts exist；Roy still reports mid-run loss |
| horn silhouette final art lock | **not verified**／open gap | v0.9.7 bake interim；queue item |
| Google Play packaging | **not started** | HANDOFF §9／stub；correct |
| Phase 4 Precision／Morph playable | **correctly locked** | stubs only |

Honest note on REVIEW-v0.9.18.md: still an accurate **snapshot of the v0.9.18 review**（P0 aim gaps then open）. Those P0 items are **addressed in code＋tests by v0.9.19**；device confirmation still pending. Do not treat REVIEW-v0.9.18 as current aim status.

---

## 3. Tests actually run（this audit）

All from repo root on box，2026-10-26 Asia/Hong_Kong. **No invented results.**

| Suite | Result |
| --- | --- |
| `tests/logic.test.mjs` | PASS |
| `tests/levelup.test.mjs` | PASS |
| `tests/health.test.mjs` | PASS |
| `tests/balance.test.mjs` | PASS（survives／frames／multiseed printed；script exit 0） |
| `tests/grenade-aim.test.mjs` | PASS |
| `tests/bake-player.test.mjs` | PASS（atlas + cells OK 32） |
| `tests/muzzle.test.mjs` | PASS |
| `tests/milestone-a.test.mjs` | PASS |
| `tests/aim-hit-fast.test.mjs` | PASS（legacy + 002 NEW CASES；perp evidence all `ok:true`） |
| `tests/weapon-pickup.test.mjs` | PASS |
| `tests/beats.test.mjs` | PASS |
| `tests/map-zone.test.mjs` | PASS |
| `python3 tests/smoke_files.py` | PASS |
| `tests/aim-hit-002-shots.mjs` | PASS（browser SwiftShader：5/5 hits，`ver:0.9.19`） |

**Not run this pass：** full `browser-hotfix-0.9.3.mjs`（36 cases；HANDOFF historically green；skipped as optional／long）；PERF-200 rebaseline（explicitly out of scope）.

---

## 4. Screenshot folders（exist vs missing）

| Folder under `tests/screenshots/` | Files（count） |
| --- | --- |
| `phase0-baseline/` | 3 |
| `phase2-floor/` | 4 |
| `phase3-lab/` | 3 |
| `phase3-boss/` | 3 |
| `phase3-elite2/` | 4 |
| `phase6-pickup/` | 3 |
| `phase6-assembly/` | 4 |
| `phase6-reactor/` | 4 |
| `phase6-blockade/` | 4 |
| `phase6-rooftop/` | 4 |
| `phase6-endless/` | 1（thin vs others；optional per HANDOFF） |
| `aim-hit-002/` | 5 |
| `horn-bake-quality/` | 7 |

Untracked local extras（**not** committed）：`menu-*.png` at screenshots root，`tests/performance-200-enemies.mjs`，`tests/performance-results/`.

---

## 5. Bugs / doc drift found

| Item | Severity | Action |
| --- | --- | --- |
| Missing `docs/AUDIT-v0.9.19.md` | process | **this file** |
| `README.md` still advertises v0.9.0 play URL／status | doc drift | reported；not rewritten this pass（out of HANDOFF／AGENT_TASK light touch） |
| `docs/GAMES-JSON-STUB.md` stage still「網頁版 v0.3.3」 | doc drift | reported；stub is paste-template，not runtime |
| `js/sprites.js` sheet URLs still `?v=0.9.2` | minor／benign | assets unchanged often；live gameplay cache-bust is index `?v=0.9.19` |
| `AGENT_TASK` feature SHA `3e3d20e` vs HEAD `fa7eee8` | none | correct：feature vs later docs commit |
| HANDOFF §0 opening still frames「Phase 0 = v0.9.6」then lists Done through 0.9.19 | slightly confusing | intentional history；§11／Done list are current |
| No `visibilitychange`／`pagehide` auto-pause | product gap | commute pillar；manual pause exists |
| Mid-run WebGL loss | open／mitigated | v0.9.51 shed＋snapshot；overlay reload；not seamless；device verify pending |

**Gameplay code:** no clear 5-line regression found； **no code changes** this commit.

---

## 6. Product pillars status

| Pillar | Status |
| --- | --- |
| **命中可靠 hit** | Code＋headless／SwiftShader **tested** for AIM-HIT-FAST-002；**device verified = yes**（Roy HIT-FEEL-DEVICE「Ok」2026-10-27 · live v0.9.50） |
| **手機穩定 stable** | Recover overlay **implemented**；v0.9.20 cuts＋v0.9.51 mid-run shed／interrupt snapshot **implemented／tested**；mid-run loss **device verify open**（HOLD Roy phone on v0.9.51） |
| **主角好看 look** | horn 32 sheets **implemented**；silhouette／art lock **not** done；blocky interim remains |
| **內容 content** | Beats＋five zones＋endless＋pickup **implemented／tested**；heavy／prototype locked；Play packaging **not started**；Phase 4 **do not start** |

---

## 7. Open gaps / not verified（device）

- Roy phone：高速橫向命中手感（HIT-FEEL-DEVICE）— **Complete**／pass 2026-10-27
- Roy phone：mid-run「繪圖暫時中斷」frequency after v0.9.6
- Roy phone：200-enemy PERF（desktop GTX baseline only）
- horn 最終剪影方向（needs Roy eyes）
- Commute：background／tab-hide auto-pause／resume（manual only today）
- Android／Capacitor／Play lifecycle／safe-area／save／privacy
- Full browser-hotfix 36/36 **not re-run** this audit
- Visual review of every screenshot PNG **not** re-done this pass（folders present only）

---

## 8. Recommended next（do **not** start here）

Aligns with `AGENT_TASK` queue after Kimi clears AIM-HIT-FAST-002 HOLD:

1. **PHONE-STABLE-FOLLOWUP** — evidence／options for mid-run WebGL；stability over fake power cuts  
2. **HORN-SILHOUETTE-DIRECTION** — Roy art direction before polish  
3. **HIT-FEEL-DEVICE** — Roy device confirmation of v0.9.19 aim — **Complete**／`device verified`（Roy「Ok」2026-10-27）  
4. **PERF-REBASELINE** — desktop＋phone if available  
5. **CONTENT-AFTER-PILLARS** — only after hit／stable／look  

**Do not start：** AIM-HIT rework，Phase 4 Precision／Morph，horn final lock，§9 series bulk，GPU cut drive-bys.

---

## 9. Light doc fixes bundled with this audit commit

- Point `HANDOFF` §0／§11 and `AGENT_TASK` at this AUDIT path.  
- Clarify audit HEAD／live `?v=0.9.19` and that HOLD remains until Kimi review.
