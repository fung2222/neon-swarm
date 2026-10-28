# 暴走機甲 RAMPAGE MECH — 開發交接文件

> 給下一位 AI agent／開發者：先讀完本文件，再改程式。目標是延續現有 bullet-heaven，不是另起爐灶。
>
> **溝通：** 對 Roy 用繁體中文（廣東話可以）；code、路徑、指令、commit message 用英文。UI copy 一律 **zh-HK 先行**，英文細字／small caps 放下行。
>
> **文件日期：** 2026-10-28（Asia/Hong_Kong；tip v0.9.160 HANDOFF-GLOW-SETTINGS-NOTE-001；prior GAMES-JSON-STAGE-005 v0.9.153）
> **建議承接基準：** v0.9.61 HUD merge (hub+water rail) + v0.9.60 overlap + v0.9.59 HUD/controls/floor + v0.9.58 legacy purge + v0.9.57 neon icon placeholders + v0.9.56 feel FX（prior: v0.9.55 deep branch kits；branch/ult UI = v0.9.54；weapons redesign = v0.9.53；UI layout = v0.9.52；phone WebGL guard = v0.9.51；elite lane = v0.9.50；slot pulse = v0.9.49；zone chip = v0.9.48；jammer = v0.9.47；medic = v0.9.46；flanker = v0.9.45；score positioning = v0.9.44；trade-off cards = v0.9.43；zone pressure = v0.9.42；danger pulse = v0.9.41；soft-juice queue **done**；bomber = v0.9.40；result-share = v0.9.39；kill-streak = v0.9.38；early feedback = v0.9.37；safe-area = v0.9.36；mute persist = v0.9.35；damage numbers = v0.9.34；run-loop UX = v0.9.33；banner timing = v0.9.32；level-up UX = v0.9.31；drop readability = v0.9.30；pickup polish = v0.9.29；4 slots = v0.9.28；8-dir gun = v0.9.27；commander = v0.9.26；artillery = v0.9.25；shield = v0.9.24；sniper = v0.9.23；Phase 2 readability = v0.9.22；horn silhouette interim OK-to-continue；PHONE-STABLE = v0.9.20；AIM-HIT = v0.9.19；endless = v0.9.18；rooftop = v0.9.17 五區齊；blockade = v0.9.16；reactor = v0.9.15；assembly = v0.9.14；elite#2 = v0.9.13；aim/hit = v0.9.12；pickup = v0.9.11；boss = v0.9.10；lab = v0.9.9；Phase 2 floor = v0.9.8 / `f6b5f63`）
> **Repo：** https://github.com/fung2222/neon-swarm  
> **Live：** https://fung2222.github.io/neon-swarm/  
> **CYBER ARCADE：** Gold，`games.json` 仍為 `wip`。
>
> **Whole-game audit：** `docs/AUDIT-v0.9.19.md`（Grok bot，2026-10-26 Asia/Hong_Kong）— 對齊 HANDOFF／AGENT_TASK 與 headless；SwiftShader ≠ 真機。

## 0. 先讀這一段：目前狀態與證據等級

本文件狀態段：Phase 0 = **v0.9.6 / `ec12087`**；本輪 Phase 1 horn bake = **v0.9.7**（見下）。產品方向與架構說明仍以本文件後段為準；舊版 `HANDOFF.md` 停留在 v0.6.2，不應再用作目前架構摘要。

### 角色分工與協作規則（2026-10-26 鎖定）

- **Roy：** 產品方向、試玩、最終驗收；可下 `ROY_OVERRIDE`（須記範圍／原因）。目標：Google Play 上架 **CYBER ARCADE**（多遊戲 app）賺取生活費；**暴走機甲**為其中星級旗艦——完善可玩體驗，唔係假裝大製作。
- **Kimi K3.1：** 流程設計、獨立檢查、bug 重現、重大改動審核；**亦可直接改程式／文件**。審批唔係每輪必須。
- **Grok bot：** 按 `HANDOFF`＋`AGENT_TASK` **Active＋queue 自動推進**；常規／規則性工作完成→測→記→接下項，**唔使逐項等 Kimi**。Grok 測試報告 ≠ Kimi 獨立驗證。

**文案直寫 GitHub：** 所有交接 MD（`HANDOFF`／`AGENT_TASK`／REVIEW 等）由作者直接 commit＋push；Roy／對方在 repo 打開即可，**唔再下載轉發**。

**自動推進（常規）：** bugfix、補測試、文件、按現有風格 rebake、小型 UI／效能修正。  
**停等審核（重大）：** 新機體、核心操作、渲染／烘焙管線、碰撞 update order、重大數值經濟、廣告／付費、save format、Google Play 上架。完成後由 Kimi 審（或 Roy 點名）。  
**美術：** art bible＋剪影規則執行；常規修正唔逐張審；方向改變先停。  
**同時開工：** 唔改同一批檔；小範圍分開 commit。  
**每次改完必記：** 作者、Task ID、版本、SHA、改了甚麼、測試、截圖、未驗證、下一步（見 §10）。

### 已核對（相對舊建議基準 `6ddc483` / v0.9.3）

- 目前 `main`／live cache-bust：**`?v=0.9.160`**（HANDOFF-GLOW-SETTINGS-NOTE-001；HANDOFF note: pause has no glow btn; 畫質 only in settings；…）
- **Done since `6ddc483`：**
  - v0.9.143 — HUD-HUB-FLUSH-TOP-001：hub flush top — shipping
  - v0.9.144 — HUD-MUTE-TO-GEAR-001：in-run mute → gear; opens same settings; settingsTip aria
  - v0.9.145 — HUD-GEAR-PAUSE-CORNERS-001：gear L + pause R under hub corners; row space-between; tap≥44
  - v0.9.146 — SETTINGS-AUDIO-SPLIT-001：SFX + BGM sliders via kit extras type:slider; persist cyber.audio
  - v0.9.147 — SETTINGS-QUALITY-SHARE-HOWTO-001：quality=glow remap; share+howto actions; pause-on-open in-run
  - v0.9.148 — SETTINGS-SHEET-PHONE-READ-001：settings sheet phone contrast / action chrome
  - v0.9.149 — GEAR-PAUSE-TAP-NOTE-001：gear+pause tap≥44 docs/CSS affirm under hub
  - v0.9.150 — SETTINGS-FOCUS-TRAP-NOTE-001：docs: settings/pause focus — kit modal focuses OK; pause-on-open
  - v0.9.151 — SHARE-FALLBACK-SOFTPIN-001：share-fallback soft-pin ≥ tip; settings share reuses result-share
  - v0.9.152 — HANDOFF-AGENT-TIDY-001：HANDOFF/AGENT_TASK tidy for HUD/settings beat
  - v0.9.154 — PAUSE-GLOW-TO-SETTINGS-001：remove pause glowToggle; quality/畫質 only in settings
  - v0.9.155 — SETTINGS-QUALITY-AFFIRM-001：affirm settings 畫質 row + setGlow persist; no second quality system
  - v0.9.156 — PAUSE-CTA-ARIA-SYNC-001：pause Resume/Restart/Quit aria-label via data-i18n-attr; no glow chrome
  - v0.9.157 — README-STATUS-SYNC-001：README status line sync off stale GAMES-JSON-STAGE-004 → tip
  - v0.9.158 — WEAPONS-MD-TIP-SYNC-002：WEAPONS.md Live tip header sync off stale BALANCE v0.9.124 → tip
  - v0.9.159 — HIT-FEEL-PIPELINE-TIP-001：HIT-FEEL-DEVICE live tip note → current safe pipeline (docs only)
  - v0.9.160 — HANDOFF-GLOW-SETTINGS-NOTE-001：HANDOFF note: pause has no glow btn; 畫質 only in settings
  - v0.9.153 — GAMES-JSON-STAGE-005：games.json stub stage → tip; HUD/settings beat HOLD
  - v0.9.142 — GAMES-JSON-STAGE-004：games.json stub stage → v0.9.142; end of safe polish beat; HOLD
  - v0.9.141 — LEVEL-PANEL-READ-001：level panel/title phone chrome contrast (no card layout rewrite)
  - v0.9.140 — GFX-BODY-READ-001：gfx overlay body/en phone contrast readability
  - v0.9.139 — COACH-READ-001：run-coach zh/en phone contrast readability
  - v0.9.138 — COACH-FALLBACK-SYNC-001：run-coach HTML fallback mirrors coach.move (dbl/tpl/rail)
  - v0.9.137 — PAUSE-SUBTITLE-READ-001：pause title-en cyan chrome / nowrap (mirror over subtitle)
  - v0.9.136 — PAUSE-HINT-READ-001：pause-hint phone contrast/weight readability
  - v0.9.135 — PAUSE-HINT-FALLBACK-001：index pause-hint HTML fallback sync P／Esc + 繼續／唔會自動恢復 (mirror strings)
  - v0.9.134 — OVER-TITLE-SIZE-001：over「你已經被制止」更大 clamp(28px, 9vw, 48px)＋nowrap；截圖 `tests/screenshots/over-title-size/`。
  - v0.9.133 — SHARE-FALLBACK-SYNC-001：index share fallback 「分享戰績」／SHARE RUN（JS 仍可 COPY）；截圖 `tests/screenshots/share-fallback-sync/`。
  - v0.9.132 — OVER-RESULT-READ-001：over `.hi-line`／`.result` best phone contrast；截圖 `tests/screenshots/over-result-read/`。
  - v0.9.131 — OVER-NOTE-READ-001：`#over-note` amber contrast／weight（killedBy／overNote）；截圖 `tests/screenshots/over-note-read/`。
  - v0.9.130 — OVER-META-READ-001：`#screen-over .over-meta` 手機可讀（cyan border／label／loadout wrap）；截圖 `tests/screenshots/over-meta-read/`。
  - v0.9.129 — HOWTO-ULT-KITS-SYNC-001：`help.rules` 同步獨特大招／unique ult kits（唔 invent soft-juice）；截圖 `tests/screenshots/howto-ult-kits-sync/`。
  - v0.9.128 — OVER-SUBTITLE-CHROME-001：`#screen-over .title-en` pause-mirrored chrome／nowrap；截圖 `tests/screenshots/over-subtitle-chrome/`。
  - v0.9.127 — OVER-TITLE-ONELINE-001：over「你已經被制止」+ nowrap + tighter clamp；glitch 不 wrap；截圖 `tests/screenshots/over-title-oneline/`。
  - v0.9.126 — PHONE-GPU-DEEPEN-001：shed 0–3／earlier t1·t2／cool-pause snapshot／post skip；HOLD.
  - v0.9.125 — UI-POLISH-001：home/mech/hub/rail/pause chrome contrast（no layout rewrite）。
  - v0.9.124 — BALANCE-PASS-001：Lv1 hits/cds + stacked branch/ult dmgMul fair retune（post ult-kits）。
  - v0.9.123 — WEAPONS-ULT-KITS-001：unique U1/U2 kits live all 5 primaries。
  - v0.9.122 — WEAPONS-ULT-LABELS-001：unique zh/en U1/U2 card copy（30 forms）；no stub later copy.
  - v0.9.121 — WEAPONS-ULT-SPEC-001：unique U1/U2 names+effects per primary×branch；lift full-ult invent this Active；light amp fallback.
  - v0.9.120 — GAMES-JSON-STAGE-003：games.json stub stage → v0.9.120; end of 20-slice batch; HOLD.
  - v0.9.119 — SHARE-CONFIRM-ROLE-001：share-confirm role=status; share btn aria preserved; no SDK invent.
  - v0.9.118 — MENU-HOME-MAIN-001：screen-start role=main aria 主選單/MAIN MENU; CTA tap preserved.
  - v0.9.117 — LEVEL-CARDS-ARIA-001：level-cards role=list aria 升級卡/LEVEL CARDS; focus ring preserved.
  - v0.9.116 — WEAPONS-MD-BATCH-SYNC-001：WEAPONS.md tip + status rows for level/zone/goal/focus a11y batch.
  - v0.9.115 — README-TIP-SYNC-001：README Play tip sync off stale v0.9.60 → live tip; status line.
  - v0.9.114 — HUB-TIME-I18N-001：hub time block aria-label from hud.time 時間/TIME; no balance change.
  - v0.9.113 — FPS-ARIA-HIDDEN-001：fps counter aria-hidden=true (decorative debug); no GPU change.
  - v0.9.112 — MECH-PICK-ARIA-SYNC-001：mech-pick radiogroup aria zh-first 機體選取/FRAME PICK sync.
  - v0.9.111 — OVER-META-A11Y-001：over-meta role=group aria 結算摘要/RUN SUMMARY; loadout PST preserved.
  - v0.9.110 — STICK-ARIA-HIDDEN-001：stick aria-hidden=true (visual touch affordance); hide-until-touch preserved.
  - v0.9.109 — ICON-BTN-FOCUS-001：icon-btn + menu-icon-btn focus-visible ring ≥2px cyan; tap≥44 kept.
  - v0.9.108 — NEON-BTN-FOCUS-001：neon-btn focus-visible ring ≥2px cyan; UI a11y only.
  - v0.9.107 — EARLY-TOAST-ROLE-001：early-toast role=status; no soft-juice invent.
  - v0.9.106 — RUN-COACH-ROLE-001：run-coach role=status; dbl/tpl coach copy preserved.
  - v0.9.105 — BEAT-BANNER-ROLE-001：beat-banner role=status; queue/timing preserved.
  - v0.9.104 — HUD-GOAL-A11Y-001：hud-goal role=status aria 目標/GOAL; kill count preserved.
  - v0.9.103 — HUD-ZONE-A11Y-001：hud-zone role=status aria 區域/ZONE; color chip preserved.
  - v0.9.102 — XP-BAR-A11Y-001：xp-bar role=progressbar aria 經驗/XP + valuemin/max; hub preserved.
  - v0.9.101 — LEVEL-DIALOG-A11Y-001：level screen role=dialog aria-modal + labelledby; cards tap preserved.
  - v0.9.100 — GAMES-JSON-STAGE-002：games.json stub stage → v0.9.100; end of 10-slice batch; HOLD.
  - v0.9.99 — SLOT-RAIL-ARIA-SYNC-001：weapon-slots/rail static aria zh-first sync; color-only rail preserved.
  - v0.9.98 — WEAPONS-MD-TIP-SYNC-001：WEAPONS.md Live tip header sync off stale v0.9.75; status a11y rows.
  - v0.9.97 — LEVEL-CARD-FOCUS-001：level-card focus-visible ring ≥2px cyan; UI a11y only.
  - v0.9.96 — HUB-ARMOR-I18N-001：hub ARM label → data-i18n hud.arm 裝甲/ARM; no balance change.
  - v0.9.95 — BOSS-HP-A11Y-001：boss-hp role=region aria 首領血量/BOSS HP; strip chrome only.
  - v0.9.94 — SHARE-BTN-ARIA-001：btn-share aria-label from shareButtonLabels; no SDK invent.
  - v0.9.93 — OVER-DIALOG-A11Y-001：over screen role=dialog aria-modal + labelledby; share/retry preserved.
  - v0.9.92 — PAUSE-DIALOG-A11Y-001：pause screen role=dialog aria-modal + labelledby; CTA tap preserved.
  - v0.9.91 — HUD-HUB-A11Y-001：hud-hub role=region + aria 戰況/RUN STATUS; preserve hub layout.
  - v0.9.90 — RAIL-GROUP-A11Y-001：`wrail-group` `role=group`＋aria 主／副／投（**無** visible name labels；color-only 保留）。截圖 `tests/screenshots/rail-group-a11y/`；測試 `tests/rail-group-a11y.test.mjs`。**HOLD for Roy try**。
  - v0.9.89 — GAMES-JSON-STAGE-001：`docs/GAMES-JSON-STUB.md` stage 由 v0.3.3 升到 v0.9.89（2+2+2／hide-stick／rail）。截圖 `tests/screenshots/games-json-stage/`；測試 `tests/games-json-stage.test.mjs`。
  - v0.9.88 — WEAPONS-ULT-LIGHT-AMP-DOCS-001：WEAPONS 記錄 U1 dmg×1.2／U2 cd×0.85（**無** full ult invent）。截圖 `tests/screenshots/weapons-ult-light-amp-docs/`；測試 `tests/weapons-ult-light-amp-docs.test.mjs`。
  - v0.9.87 — PAUSE-HINT-SYNC-001：`pauseHint` 同步 P／Esc＋繼續（鏡像 howto；**唔** invent soft-juice）。截圖 `tests/screenshots/pause-hint-sync/`；測試 `tests/pause-hint-sync.test.mjs`。
  - v0.9.86 — WEAPONS-BRANCH-HINT-SYNC-001：`BRANCH_KIT_HINTS` 對齊 branchNames（slow_gun B／attack_drone B／flash B／gravity B／blackhole B）；**無** kit invent。截圖 `tests/screenshots/weapons-branch-hint-sync/`；測試 `tests/weapons-branch-hint-sync.test.mjs`。
  - v0.9.85 — WEAPONS-BRANCH-PRIMARY-EN-DOCS-001：WEAPONS primary 命名表補 EN（對齊 sec/throw）。截圖 `tests/screenshots/weapons-branch-primary-en-docs/`；測試 `tests/weapons-branch-primary-en-docs.test.mjs`。
  - v0.9.84 — OVER-LOADOUT-PST-001：`formatLoadoutFromGame` 以主／副／投分組（prefer `g.loadout`）。截圖 `tests/screenshots/over-loadout-pst/`；測試 `tests/over-loadout-pst.test.mjs`。
  - v0.9.83 — HOWTO-RULES-SYNC-001：`help.rules` 同步 2+2+2／磁鐵／搖桿隱藏（**唔** invent soft-juice）。截圖 `tests/screenshots/howto-rules-sync/`；測試 `tests/howto-rules-sync.test.mjs`。
  - v0.9.82 — WEAPONS-ULT-EN-LABELS-001：U1/U2 改用傷害強化／射速強化 · POWER AMP／CADENCE AMP（對齊 light amp ×1.2／×0.85）；FORM I/II stub 退役；**無** full ult invent。截圖 `tests/screenshots/weapons-ult-en-labels/`；測試 `tests/weapons-ult-en-labels.test.mjs`。
  - v0.9.81 — PAUSE-CTA-TAP-001：`#screen-pause .neon-btn` ≥44 phone／48 desktop。截圖 `tests/screenshots/pause-cta-tap/`；測試 `tests/pause-cta-tap.test.mjs`。
  - v0.9.80 — WEAPONS-BRANCH-EN-LABELS-001：全部武器 `branchNamesEn`；branch／ult 卡 EN 用真名（唔再淨 `PATH A`）；WEAPONS sec／throw 命名表補齊；**無** full ult invent。截圖 `tests/screenshots/weapons-branch-en-labels/`；測試 `tests/weapons-branch-en-labels.test.mjs`。**HOLD for Roy try**。
  - v0.9.79 — GFX-RELOAD-TAP-001：`#btn-gfx-reload` min-height ≥44 phone／48 desktop；截圖 `tests/screenshots/gfx-reload-tap/`；測試 `tests/gfx-reload-tap.test.mjs`。
  - v0.9.78 — COACH-CONTROLS-SYNC-001：`coach.move`／`coach.wasd` 同步雙擊副／三擊投／底欄（鏡像 howto；**唔** invent soft-juice toast）。截圖 `tests/screenshots/coach-controls-sync/`；測試 `tests/coach-controls-sync.test.mjs`。
  - v0.9.77 — HOME-CTA-TAP-001：home `#btn-play`／`#btn-endless` min-height ≥44 phone／48 desktop；截圖 `tests/screenshots/home-cta-tap/`；測試 `tests/home-cta-tap.test.mjs`。
  - v0.9.76 — OVER-CTA-TAP-001：over `#btn-retry`／`#btn-menu`／`#btn-share` min-height ≥44 phone／48 desktop；截圖 `tests/screenshots/over-cta-tap/`；測試 `tests/over-cta-tap.test.mjs`。
  - v0.9.75 — WEAPONS-CATALOG-FIRE-LIVE-001：14 件 catalog `exemplar:true`＋behavior 已接 logic fire；WEAPONS stub「Other catalog fire」→ **live**；**無** full ult invent／BALANCE-PASS。截圖 `tests/screenshots/weapons-catalog-fire-live/`；測試 `tests/weapons-catalog-fire-live.test.mjs`。**HOLD for Roy try**。
  - v0.9.74 — HOWTO-CONTROLS-SYNC-001：`help.controls` 同步已落地操作（stick 隱藏至觸控、雙擊副武≤3、三擊投擲、底欄色格）；howto 面板；**唔** invent soft-juice toast。截圖 `tests/screenshots/howto-controls-sync/`；測試 `tests/howto-controls-sync.test.mjs`。
  - v0.9.73 — WEAPONS-RAIL-PATH-BADGE-001：底欄 branched 武器顯示細 A/B/C·U 角標（色欄 only；無名字）；**無 ult invent**。截圖 `tests/screenshots/weapons-rail-path-badge/`；測試 `tests/weapons-rail-path-badge.test.mjs`。
  - v0.9.72 — HOME-MECH-CARD-TAP-001：home `.mech-card` phone min-height ≥44（padding bump）；唔 unlock heavy／proto。截圖 `tests/screenshots/home-mech-card-tap/`；測試 `tests/home-mech-card-tap.test.mjs`。
  - v0.9.71 — HUD-MUTE-PAUSE-TAP-001：in-run mute/pause `.icon-btn` ≥44×44（was 36 desktop／34 phone）；kit 44 restored。截圖 `tests/screenshots/hud-mute-pause-tap/`；測試 `tests/hud-mute-pause-tap.test.mjs`。
  - v0.9.70 — HOME-SETTINGS-TAP-001：phone gear/howto ≥44×44（override kit 40px shrink）；settings `.ck-set-row` / `.ck-toggle` / `.ck-seg button` ≥44 tall。截圖 `tests/screenshots/home-settings-tap/`；測試 `tests/home-settings-tap.test.mjs`。**HOLD for Roy try**。
  - v0.9.69 — WEAPONS-BRANCH-CARD-PATH-001：branch/ult 卡 path chip（A/B/C·U1/U2）；標題顯示武器名；phone min-height ~88；**無 ult invent**。截圖 `tests/screenshots/weapons-branch-card-path/`；測試 `tests/weapons-branch-card-path.test.mjs`。
  - v0.9.68 — WEAPONS-RAIL-TAP-TARGET-001：phone rail tiles ≥44×44；`--hud-rail-h:54px`；default 48／desktop 52。截圖 `tests/screenshots/weapons-rail-tap-target/`；測試 `tests/weapons-rail-tap-target.test.mjs`。
  - v0.9.67 — WEAPONS-RAIL-FILL-EDGE-001：水填邊（near-empty→0／near-full→1）；`.drained`／`.on-cd`／`.bursting`；`_railFillSnap` 含 secondaryBurstLeft。色欄 only；無 toast invent。截圖 `tests/screenshots/weapons-rail-fill-edge/`；測試 `tests/weapons-rail-fill-edge.test.mjs`。
  - v0.9.66 — STICK-RAIL-CLAMP-001（Roy「開始流程」safe pipeline）：`placeAt` clamp above `#weapon-rail`（10px gap）；rail z-index 9 > stick 8；idle hide／dbl-tpl／hub／floor／loadout 不變。截圖 `tests/screenshots/stick-rail-clamp/`；測試 `tests/stick-rail-clamp.test.mjs`。未做：Phase 4／horn／soft-juice invent／BALANCE-PASS／Roy PNG。
  - v0.9.65 — STICK-TOUCH-SHOW-001（Roy「隱藏遙控桿，手碰螢幕才顯示在手指位置」）：idle stick 全隱藏（無 corner `ready`／`hint-pulse` ghost）；touch 時在手指位置顯示（既有 drag-anywhere relocate）；鬆手即 hidden；WASD／dbl-tpl／rail／hub／floor／loadout 不變。截圖 `tests/screenshots/stick-touch-show/`；測試 `tests/stick-touch-show.test.mjs`。**HOLD for Roy phone try**。未做：Phase 4／horn／soft-juice invent／BALANCE-PASS／Roy PNG。
  - v0.9.64 — WEAPONS-BRANCH-CARD-LAYOUT-001：branch/ult pick 卡手機布局 polish（較矮、ellipsis、max-height scroll）；無 ult invent；SHA `71f6617`。截圖 `tests/screenshots/weapons-branch-card-layout/`。
  - v0.9.63 — WEAPONS-COLOR-TOKENS-001：`--weapon-*` 共用；cards `cat-*`；SHA `909c7a6`；截圖 `tests/screenshots/weapons-color-tokens/`。
  - v0.9.62 — WEAPONS-HUD-RAIL-CLEAR-001：stick +36px；mute/pause 直向；水杯 meniscus；SHA `25e674c`；截圖 `tests/screenshots/weapons-hud-rail-clear/`。
  - v0.9.61 — WEAPONS-HUD-MERGE-001（Roy 2026-10-28 最底武器欄＋頂 hub）：`#hud-hub` 合併置中（HP bar 左 · TIME 中 · LV/分數/XP%／目標／區域）；`#weapon-rail` 底置中無名字、色分 P/S/T、S/T 水杯 `--fill`；`#weapon-status` 隱藏；SHA `53f9d8b`；截圖 `tests/screenshots/weapons-hud-merge/`；測試 `weapons-hud-merge`。未做：Phase 4／horn／soft-juice invent／BALANCE-PASS／Roy PNG。
  - v0.9.60 — WEAPONS-HUD-OVERLAP-FIX-001（Roy phone screenshot 2026-10-28「介面重疊」）：single vertical rhythm tokens（row1 stats｜XP alone｜weapon-status thin under XP｜goal/zone left below｜stick raised above rail）；no absolute sharing same band；`--hud-chip-*` kept；dbl/tpl/burst/floor/loadout untouched。截圖 `tests/screenshots/weapons-hud-overlap-fix/`；測試 `weapons-hud-overlap-fix`。**HOLD for Roy try**。未做：Phase 4／horn／soft-juice invent／BALANCE-PASS／Roy PNG。
  - v0.9.59 — WEAPONS-HUD-CONTROLS-FLOOR-001（Roy phone 2026-10-28）：near-black arena floor（no multi-color plate；keep danger/zone-pressure edges）；double-tap→secondary ≤3-shot rescue burst→auto primary；triple-tap→throw；unified HUD chip chrome；weapon rail **smaller bottom horizontal row** + full catalog zh names；balance = first-pass only（optional next = named BALANCE-PASS）。截圖 `tests/screenshots/weapons-hud-controls-floor/`；測試 `weapons-hud-controls-floor`。**HOLD for Roy try**。未做：Phase 4／horn art lock／soft-juice invent／full ult kits／BALANCE-PASS／Roy PNG。
  - v0.9.4 — glow-ring dim：普通敵人地面光圈減噪（戰鬥可讀性初步）。
  - v0.9.5 — WebGL context-loss recover overlay（「繪圖暫時中斷」可恢復）。
  - v0.9.6 — 更強手機 GPU 減壓（pools／PR／bloom kick／ordinary-kill FX 等；不改平衡）。
  - v0.9.7 — horn bake quality pass：甲片層次／材質／bake 燈光＋rebake 32 sheets（仍非最終驗收）。
  - v0.9.8 — Phase 2 floor readability：playable floor／grid／dust／edge decor ambient 減亮（不改 horn bake／平衡）。
  - v0.9.9 — Phase 3 lab slice：staffer／guard／drone 程序化剪影區分；SENTINEL PRIME 精英 telegraph→charge→recover；zh-HK 橫幅；實驗室邊緣色溫；截圖 `tests/screenshots/phase3-lab/`。
  - v0.9.10 — Phase 3 boss beat：洪流核心 SWARM CORE @t=360；Orbit／Volley／Frenzy HP 三分相位；volley lanes ≥0.8s telegraph；頂部細血條＋雙語橫幅；擊殺＝3 卡選擇＋分數加成 `5000×(1+t/60)`；截圖 `tests/screenshots/phase3-boss/`。
  - v0.9.11 — Phase 6 weapon pickup：地面 `kind:'weapon'` crate 暫停並開 level-cards 風格選擇（未擁有＝獲得／保留；已擁有＝升級疊層／保留；滿級＝兌換修復／保留）；`weaponOffer` + `levelup from:'pickup'`；經同一 `taken`／`applyCard` 路徑；禁止靜靜覆蓋；截圖 `tests/screenshots/phase6-pickup/`。
  - v0.9.12 — aim/hit fast rushers：子彈掃掠碰撞（segment→circle）；MG／laser 等直射輕量 lead（clamp ~0.30s）；近距縮短 muzzle spawn；測試 `tests/aim-hit-fast.test.mjs`。未改 bulletDmg／HP 表。Box＝SwiftShader，非真機驗收。
  - v0.9.13 — Phase 3 elite #2：獵殺機甲 HUNTER RAID @t≈240；cyan/steel 四足／低剪影＋雙刃；walk→telegraph≥1.2s→charge→短 recover→第二段 telegraph≥1.2s→charge→recover；雙 warning lane；max one elite；擊殺同 elite#1（XP＋2 卡）；截圖 `tests/screenshots/phase3-elite2/`。Box＝SwiftShader，非真機驗收。
  - v0.9.14 — Phase 6 assembly bay map zone slice：`mapZone` lab→assembly @`MAP_ZONE.assemblyAt=195`（3:15，hunter@240 前）；組裝邊緣裝飾（半完成機甲骨架／龍門吊臂／零件托盤／警示條紋，非只 recolor）；暖琥珀 trim vs lab 冷 teal；可玩地板維持暗底；assembly `waveMix` 少 staffer、多 soldier／walker；`zoneEnter` 橫幅「進入 · 機甲組裝區」／ASSEMBLY BAY；測試 `tests/map-zone.test.mjs`；截圖 `tests/screenshots/phase6-assembly/`。誠實標：同一 arena 換邊飾／色溫／mix，唔係無縫大地圖。未做：reactor／blockade／rooftop。Box＝SwiftShader，非真機驗收。
  - v0.9.15 — Phase 6 reactor map zone slice：`mapZone` lab→assembly→reactor @`MAP_ZONE.reactorAt=285`（4:45，hunter@240 後、boss@360 前）；反應爐邊緣裝飾（冷卻塔／電漿管／能量柱／警示欄／輻射條紋，非只 recolor）；冷紫／電青 trim vs assembly 暖琥珀／lab 冷 teal；可玩地板維持暗底；reactor `waveMix` 多 drone／mech／officer、少 staffer／guard；`zoneEnter` 橫幅「進入 · 能源反應爐」／REACTOR；測試 `tests/map-zone.test.mjs`；截圖 `tests/screenshots/phase6-reactor/`。誠實標：同一 arena 換邊飾／色溫／mix。未做：blockade／rooftop／endless elites。Box＝SwiftShader，非真機驗收。
  - v0.9.16 — Phase 6 blockade map zone slice：`mapZone` lab→assembly→reactor→blockade @`MAP_ZONE.blockadeAt=420`（7:00，boss@360 後）；軍事封鎖邊緣裝飾（路障／沙袋／鐵絲／APC 殘骸／崗哨，非只 recolor）；鋼灰／軍綠 trim vs reactor 紫青／assembly 琥珀／lab teal；可玩地板維持暗底；blockade `waveMix` 多 soldier／officer／chief／mech、少 staffer／drone；`zoneEnter` 橫幅「進入 · 軍事封鎖區」／BLOCKADE；測試 `tests/map-zone.test.mjs`；截圖 `tests/screenshots/phase6-blockade/`。誠實標：同一 arena 換邊飾／色溫／mix。未做：rooftop／endless elites。Box＝SwiftShader，非真機驗收。
  - v0.9.17 — Phase 6 rooftop map zone slice（**五區齊**）：`mapZone` lab→assembly→reactor→blockade→rooftop @`MAP_ZONE.rooftopAt=510`（8:30，blockade@420 後）；天台邊緣裝飾（天線／通風／停機坪剪影／矮欄杆／遠城燈光點，非只 recolor）；夜藍／冷白 trim vs blockade 橄欖／reactor 紫青／assembly 琥珀／lab teal；可玩地板暗瀝青灰、低對比；rooftop `waveMix` 多 drone／mech／chief、少 staffer；`zoneEnter` 橫幅「進入 · 天台逃出區」／ROOFTOP；測試 `tests/map-zone.test.mjs` 五區時間序；截圖 `tests/screenshots/phase6-rooftop/`。誠實標：同一 arena 換邊飾／色溫／mix，唔係無縫大地圖。未做：endless ~90s elites。Box＝SwiftShader，非真機驗收。
  - v0.9.18 — Phase 6 endless elites after boss：`ENDLESS = { startAfter:360, eliteEvery:90, bossEvery:300, eliteRotate:['sentinel','hunter'], bossId:'swarm_core' }`＋`Game._endlessBeatCheck`（固定 `BEATS` 之後；**唔係**動態塞 BEATS 列）；交替重用現有 elite／boss；max one elite、存活時延後排程；`endless:false` 跳過 cadence；trial `TRIAL.surviveSec=480` 不變（main.checkTrialEnd）；測試 `tests/beats.test.mjs`。可選截圖 `tests/screenshots/phase6-endless/`。未做：新 elite／boss 剪影、Phase 4 Precision。Box＝SwiftShader，非真機驗收。
  - v0.9.19 — AIM-HIT-FAST-002：高速橫向命中。`interceptAimDir`（quadratic closed-form）＋`muzzleInterceptAimDir`（兩階段 muzzle）；`relativeSegmentHitsCircle`＋enemy `prevX/prevZ`；`_moveEnemies` 先於 `_stepProjectiles`（同 dt）；MG 邏輯彈取消 0.08rad jitter（`AIM_LEAD_MAX_T` 仍 0.30，唔係靠加大 lead cap）。測試 `tests/aim-hit-fast.test.mjs`（002 cases）＋`tests/aim-hit-002-shots.mjs`；證據 `tests/screenshots/aim-hit-002/`。未改 bulletDmg／HP／radius／elite speed。Box＝SwiftShader，**非** Roy 真機驗收。角色：Kimi＝設計／審核／除錯；Grok bot＝實作；Roy＝產品／最終。
  - v0.9.20 — PHONE-STABLE-FOLLOWUP（Roy continue past AIM-HIT HOLD；Kimi rate-limited）：`visibilitychange`／`pagehide` → `pauseRun()`（等同手動暫停；**唔** auto-resume）；`MOBILE_GFX` 再減壓 — pool 800、永久較低 bloom、kickFx bloomDamp≤0.18、跳過 muzzle 次要／非必要 rings、elite inbound bloom kick 減／跳；desktop 路徑不變。測試 `tests/bg-pause.test.mjs`＋既有 headless。未改平衡表。Box＝SwiftShader，**未**宣稱真機 mid-run WebGL 已修好。
  - PERF-REBASELINE（Roy 桌面 GTX 1070 Ti，live **v0.9.20**）：見 `docs/PERF-BASELINE.md` — 3×60s ≈ **58–60 FPS**；仍 **非** 手機驗收；唔當玩法完成。大 dumps 預設不提交。
  - v0.9.21 — HORN-SILHOUETTE-DIRECTION（Roy「我要機甲咁」）：`buildPlayerMech` horn-only mecha proportions（longer limbs、narrower torso、angular plates）；rebake 32 sheets＋atlas／anchors；muzzle sync；heavy／prototype stubs unchanged。截圖 `tests/screenshots/horn-silhouette-mecha/`。**interim** — **not** art lock／**not** §9 locked；blocky／cube-stack **rejected** as shared style。未改平衡／Phase 4／phone GPU。
  - v0.9.22 — PHASE2-COMBAT-READABILITY-002（Roy「繼續出去啦繼續流程」；horn visual HOLD cleared for pipeline；silhouette interim OK-to-continue）：ordinary enemy ground rings off；elite／boss／danger rings kept／stronger；floor／ambient darker；elite telegraph → danger orange；pickup halos punchier；ordinary kill FX declutter（no ring／wave）；sticky aim mild hold tweak；screenshots `tests/screenshots/phase2-readability/`。未改平衡表／horn mesh／Phase 4／phone GPU；mobile v0.9.20 cuts untouched。
  - v0.9.23 — PHASE3-ENEMY-SNIPER-001：`ENEMIES.sniper` 狙擊單位／Sniper Unit；olive＋crimson；long-rifle procedural mesh（≠ soldier／officer recolor）；`_tickSniper` keep-distance → red aim telegraph（`SNIPER.telegraphSec=1.0`）→ hitscan；events `telegraph kind:sniper`＋`sniperShot`；waveMix mid-late lab＋reactor／blockade／rooftop／assembly lightly；截圖 `tests/screenshots/phase3-sniper/`；測試 `tests/sniper.test.mjs`。Elite／boss／player weapon tables **unchanged**。未做：Phase 4／horn art lock／phone GPU。
  - v0.9.24 — PHASE3-ENEMY-SHIELD-001：`ENEMIES.shield` 盾衛／Shield Guard；steel＋cyan-blue；large front-plate procedural mesh（≠ soldier／walker recolor）；`_tickShield` slow chase＋face player；frontal mitigation only（`face · normalize(src−enemy) ≥ 0.5` → ×0.15 dmg；flank／rear full）；bash = short **red** contact telegraph；waveMix assembly／blockade ~0.12、lab after ~65s light、**no** early lab；截圖 `tests/screenshots/phase3-shield/`；測試 `tests/shield.test.mjs`。Elite／boss／player weapon tables **unchanged**。未做：Phase 4／horn art lock／phone GPU。
  - v0.9.57 — WEAPONS-ICON-PLACEHOLDERS-001（Roy「搞多啲步驟流程」；polish later）：neon SVG square tiles（cyan/magenta/amber）replace bare emoji on left rail + top status；`WEAPON_ICON_SRC` → `assets/weapons/{id}.png`；empty/muted；layout v0.9.52–53 kept；截圖 `tests/screenshots/weapons-icon-placeholders/`；測試 `weapons-icon-placeholders`。**HOLD for Roy try**。未做：Roy final art／full ult kits／Phase 4／horn art lock／soft-juice invent。
  - v0.9.56 — WEAPONS-FEEL-FX-001：per-weapon combat feel FX（muzzle/trail/charge/stick/frost/explode/puddle/slow/deploy/blackhole/flash）match locked feel specs；`js/weapons-feel-fx.js`；MOBILE_GFX／pool-respecting；截圖 `tests/screenshots/weapons-feel-fx/`。未做：beauty polish invent／Phase 4。
  - v0.9.55 — WEAPONS-BRANCH-KITS-001（Roy「開始」after branch-pick HOLD）：deep A/B/C branch kits — gatling overheat/pierce/cone；ion focus/chain/slit；tracking triple/mine/drone；vulcan spray/burn/fortress；zero chill/frostBurst/selfShield；sec/throw A/B deepen；ult still light amp only。截圖 `tests/screenshots/weapons-branch-kits/`；測試 `weapons-branch-kits`。**HOLD for Roy try**。未做：full ult kits／real icons／feel FX polish／Phase 4／horn art lock。
  - v0.9.54 — WEAPONS-BRANCH-PICK-001（Roy「開始」after redesign HOLD）：branch pick at Lv≥3 + primary ult at Lv≥5 via level-cards；`BRANCH_UNLOCK_LV`/`ULT_UNLOCK_LV`；`weaponBranches`/`weaponUlts`/`pendingPathOffer`；light `branchStatMods`（cd/dmg/pierce/spread）on gatling/vulcan/ion/mg；HUD `LvN·B`/`LvN·B·U1`；`.branch-offer` chrome。截圖 `tests/screenshots/weapons-branch/`；測試 `weapons-branch-pick`＋`weapons-branch-shots`。**HOLD for Roy try**。未做：full ult kits／real icons／feel FX polish／Phase 4／horn art lock。
  - v0.9.53 — WEAPONS-REDESIGN-001（Roy full weapon brief）：loadout **2 primary + 2 secondary + 2 throw**；catalog 5+5+4（見 `docs/WEAPONS.md`）；top `#weapon-status` + left `#weapon-rail`（legacy top chips hidden）；primary auto-fire／secondary ammo→auto primary／throw tap；legacy mg/laser/… normalize；**feel specs baked**（gatling=laser-bolts；ion=charge→fire→charge；tracking=track→stick→explode；vulcan=minigun；zero=discrete bolts；acid=10 dissolve；shotgun=heavy pellets；slow=rush→stop AoE；drones=deploy 2；blackhole=pull；throws match names）＋homing/stick/pullFields ticks；branch/ult **stubs**；art pipeline notes。**Mobile GFX baseline raise**（same beat）：`MOBILE_GFX` pool 1600／bloom 0.15／burstN 0.55／waves 16／bloomDamp 0.22；shed PR 0.92→0.80、bloomStrength 0.15→0.09→0.04 — cooler／prettier default，**keep** cool-pause＋contextlost safety（唔再碾死畫質）。截圖 `tests/screenshots/weapons-redesign/`；測試 `weapons-loadout`／`weapons-catalog`／`weapons-redesign-hud`／webgl-guard。**HOLD for Roy try**。未做：Phase 4／horn art lock／soft-juice／branch UI／real icons。
  - v0.9.52 — UI-LAYOUT-HOME-HUD-001（Roy phone：layout before weapon details）：home mute／volume／lang → gear `mountSettings` only（removed `#btn-mute-menu`；settings mute → `toggleMutePersist`）；mech cards shrink＋selected highlight；CTA `--menu-cta-bottom` lower；in-run `.xp-bar`＋`.weapon-slots` → TOP（sa-top）；goal／zone／boss-hp／banners clear；截圖 `tests/screenshots/ui-layout-home-hud/`；測試 `tests/ui-layout-home-hud.test.mjs`＋safe-area／mute-persist update。未改：weapon／Phase 4／horn／soft-juice／phone GPU。
  - v0.9.51 — PHONE-STABLE-CONTEXT-001（Roy「A」Phone GPU／mid-run WebGL）：`js/webgl-guard.js` — MOBILE_GFX mid-run shed（runT／frameMs → PR／bloom／particle half-tick；sustained hot → cool-pause，no auto-resume）；`webglcontextlost` → sessionStorage interrupt snapshot；gfx overlay＋menu interrupt note after reload（**not** seamless Three restore）。測試 `tests/webgl-guard.test.mjs`。Desktop／平衡／Phase 4／horn **unchanged**。Box＝SwiftShader，**未**裝置驗收。
  - v0.9.50 — PHASE6-ELITE-LANE-READ-001：精英衝鋒 warning lane 加粗／加亮（`js/elite-lane-read.js` `ELITE_LANE`）；唔係新精英／唔係 Morph；截圖 `tests/screenshots/phase6-elite-lane-read/`；測試 `tests/elite-lane-read.test.mjs`。**HIT-FEEL-DEVICE Complete**（Roy「Ok」2026-10-27）。未做：Phase 4／horn art lock／phone GPU。
  - v0.9.49 — PHASE6-SLOT-FIRE-PULSE-001：開火時對應 `#weapon-slots` 格短暫黃閃（~140ms）；`js/slot-fire-pulse.js`；截圖 `tests/screenshots/phase6-slot-fire-pulse/`；測試 `tests/slot-fire-pulse.test.mjs`。未做：Phase 4／horn art lock／phone GPU。
  - v0.9.48 — PHASE6-ZONE-HUD-CHIP-001：`#hud-zone` 持久區域晶片（zh-HK＋EN 細字；accent 跟區）；`zoneEnter`／HUD 更新；pointer-events none；截圖 `tests/screenshots/phase6-zone-hud-chip/`；測試 `tests/zone-hud-chip.test.mjs`。未做：Phase 4／horn art lock／phone GPU。
  - v0.9.47 — PHASE3-ENEMY-JAMMER-001：`ENEMIES.jammer` 干擾單位／Signal Jammer；dark steel＋magenta／violet dish／mast／emitter pods（≠ drone／medic／artillery／flanker recolor；**no red hull**）；mid-range → **violet** jam telegraph≥0.85s（`JAMMER.telegraphSec`）→ fireCd mul ×1.35 ~2.5s（stack cap 1；refresh OK）→ recover／reposition；events `telegraph kind:jammer`＋`jammerPulse`；kill mid-telegraph = no apply；visual reuse `#fx-flash` magenta — **no** new toast；waveMix no early lab＋light mid-late／reactor／blockade／rooftop、assembly rare；截圖 `tests/screenshots/phase3-jammer/`；測試 `tests/jammer.test.mjs`。未做：Phase 4／horn art lock／phone GPU。
  - v0.9.46 — PHASE3-ENEMY-MEDIC-001：`ENEMIES.medic` 醫療支援／Combat Medic；white／teal＋lime cross；support pack／antenna／cross plate procedural mesh（≠ staffer／chief／drone／flanker recolor）；mid-range near wounded ordinary → **lime** heal telegraph≥0.7s（`MEDIC.telegraphSec`）→ heal pulse（cap；no resurrect；ordinary-only；no player／elite／boss）→ recover；soft flee alone／low／player close；events `telegraph kind:medic`＋`medicHeal`；kill mid-telegraph = no heal；waveMix no early lab＋light mid-late／assembly／reactor／blockade、rooftop rare；截圖 `tests/screenshots/phase3-medic/`；測試 `tests/medic.test.mjs`。未做：Phase 4／horn art lock／phone GPU。
  - v0.9.45 — PHASE3-ENEMY-FLANKER-001：`ENEMIES.flanker` 側襲單位／Flanker；steel＋violet／cyan；lean runner＋asymmetric blades／vents procedural mesh（≠ soldier／bomber／hunter／drone recolor）；arc flank → **cyan** dash telegraph≥0.85s（`FLANKER.telegraphSec`）→ dash contact → recover → re-angle；events `telegraph kind:flanker`＋`flankerDash`；no dmg during telegraph；killed mid-telegraph = no dash；waveMix no early lab＋light mid-late／assembly／blockade／rooftop、reactor rare；截圖 `tests/screenshots/phase3-flanker/`；測試 `tests/flanker.test.mjs`。Elite／boss／player weapon tables **unchanged**。未做：Phase 4／horn art lock／phone GPU。
  - v0.9.44 — PHASE6-SCORE-POSITION-001：kill 加分走位／安全區／清場節奏（`SCORE_POS`）；base `e.score+floor(t)` unchanged；over「走位／安全區／清場 +N」；**no** mid-run toast；測試 `tests/score-position.test.mjs`。**HOLD for Roy try**。未做：Phase 4／horn／phone GPU。
  - v0.9.43 — PHASE6-TRADEOFF-CARDS-001：剛好 **3** 張取捨卡 `overclock`／`glass`／`heavy_frame`（射速↑裝甲↓／傷害↑HP↓／裝甲↑速度↓）；desc 雙語寫齊兩邊；floor 防 NaN／soft-lock；既有卡數值 **unchanged**；**no** new toast；截圖 `tests/screenshots/phase6-tradeoff-cards/`；測試 `tests/tradeoff-cards.test.mjs`。未做：Phase 4／horn art lock／phone GPU。
  - v0.9.42 — PHASE6-ZONE-PRESSURE-001：`ZONE_PRESSURE` 收縮／污染安全區；after ~110s `safeR` lerps ~30→~16 over ~200s；outside = tick DoT；cyan／acid edge ring；event `zonePressure start`；logic `safeR`／`zonePressureActive`；**no** new toast；ARENA／weapon／danger-pulse／bomber／artillery **unchanged**；截圖 `tests/screenshots/phase6-zone-pressure/`；測試 `tests/zone-pressure.test.mjs`。未做：Phase 4／horn art lock／phone GPU。
  - v0.9.41 — PHASE6-PERIODIC-DANGER-001：`DANGER_PULSE` 週期場地紅圈；after ~80s every ~20s spawn near player（offset；not under feet）；telegraph≥0.9s → AoE；events `telegraph kind:dangerPulse`＋`dangerPulse`；max concurrent 2；skip pause／levelup／over；view reuses bomber-style red ring；**no** new toast；bomber／artillery／weapon tables **unchanged**；截圖 `tests/screenshots/phase6-danger-pulse/`；測試 `tests/danger-pulse.test.mjs`。未做：Phase 4／horn art lock／phone GPU。
  - v0.9.40 — PHASE3-ENEMY-BOMBER-001：`ENEMIES.bomber` 自爆單位／Suicide Bomber；dark steel＋crimson／magenta；compact runner＋charge pack／antenna／blinker procedural mesh（≠ drone／soldier／artillery／walker recolor）；chase（above-soldier）→ fuse ~2.2–3.2 → **red** self ground-circle telegraph≥0.9s（`BOMBER.telegraphSec`）→ AoE detonate（self dies）；events `telegraph kind:bomber`＋`bomberDetonate`；no dmg during telegraph；killed mid-chase／telegraph = no explode；waveMix no early lab＋light mid-late／zones；截圖 `tests/screenshots/phase3-bomber/`；測試 `tests/bomber.test.mjs`。Elite／boss／player weapon tables **unchanged**。未做：Phase 4／horn art lock／phone GPU。
  - v0.9.25 — PHASE3-ENEMY-ARTILLERY-001：`ENEMIES.artillery` 重炮單位／Heavy Artillery；amber＋olive；procedural **big howitzer barrel** mesh（≠ walker／mech／sniper recolor）；`_tickArtillery` slow／stationary-ish → **orange** blast telegraph（`ARTILLERY.telegraphSec=1.0`）→ AoE impact at predicted／player-area；events `telegraph kind:artillery`＋`artilleryImpact`；waveMix blockade／rooftop light-mid、late lab light、assembly rare、**no** early lab；截圖 `tests/screenshots/phase3-artillery/`；測試 `tests/artillery.test.mjs`。Elite／boss／player weapon tables **unchanged**。未做：Phase 4／horn art lock／phone GPU。
  - v0.9.36 — PHASE6-SAFE-AREA-001：`:root` `--sa-*` 包 `env(safe-area-inset-*)`（可模擬 inset）；補 `.hud-left`／`.hud-buttons.top`／mobile goal／xp-bar L/R media／pause·over·level·gfx panel padding／slots·banner·coach 寬；cheap landscape；`viewport-fit=cover` 已有；截圖 `tests/screenshots/phase6-safe-area/`（simulated large insets）；測試 `tests/safe-area.test.mjs`。Mute／平衡／Phase 4／horn **unchanged**。
  - v0.9.35 — PHASE6-MUTE-PERSIST-001：mute 偏好跨 session（kit `cyber.neon-swarm.muted` 已有；本輪 harden early-paint／alias `neon-swarm-mute`／menu `#btn-mute-menu` `menu-icon-btn`／zh-HK 靜音·取消靜音 aria／reload round-trip）；截圖 `tests/screenshots/phase6-mute-persist/`；測試 `tests/mute-persist.test.mjs`。SFX／曲目／雙 slider／Phase 4／horn **unchanged**。
  - v0.9.34 — PHASE6-DAMAGE-NUMBERS-LITE-001：DOM 浮動傷害／治療／受傷數字（pool 16／10；throttle ~100ms；heavy／擋／heal 綠）；`hit.dmg`＋`hurt.amount`；截圖 `tests/screenshots/phase6-damage-numbers/`；測試 `tests/damage-numbers.test.mjs`。平衡／Phase 4／horn **unchanged**。
  - v0.9.33 — PHASE6-RUN-LOOP-UX-001：首局 coach tip（`neon-swarm-coach-v1`／session；pointer-events none；~3.2s；拖移／WASD）；hurt 紅邊 vignette；XP bar punch；完局到達區域＋裝備摘要；stick hint-pulse 僅喺無 coach 時；截圖 `tests/screenshots/phase6-run-loop-ux/`；測試 `tests/run-loop-ux.test.mjs`。平衡／Phase 4／horn **unchanged**。ROY continue：「未用得」cleared prior HOLD。
  - v0.9.32 — PHASE6-BANNER-TIMING-001：beat-banner **短優先佇列**（max 2 pending）＋min display 700ms（`js/banner-queue.js`）；priority boss>elite>zone>phase；timings zone 1400／elite 1600／boss 2600／phase 900；pause zh-HK＋`pauseHint`（無 auto-resume，v0.9.20 契約）；CSS 390+1280 可讀、避開 weapon-slots；截圖 `tests/screenshots/phase6-banner-timing/`；測試 `tests/banner-queue.test.mjs`＋`bg-pause.test.mjs`。平衡／Phase 4／horn **unchanged**。之後 **HOLD sync with Roy**（唔再自動開新系統）。
  - v0.9.31 — PHASE6-LEVELUP-CARD-UX-001：升級卡 UX — 層次（zh 標題＋EN 細字／kind pill／desc clamp）、對比、更大 emblem、stack `n/max`＋progress bar、390 tap min-height、新 slot 武器輕提示（裝入空欄／欄滿・需替換）；pickup-offer 共用 chrome；keep／swap／convertHeal 不回歸；截圖 `tests/screenshots/phase6-levelup-ux/`；測試 `tests/levelup-ux.test.mjs`。卡池／DPS／經濟 **unchanged**。未做：Phase 4／horn art lock／phone GPU。
  - v0.9.30 — PHASE6-DROP-READABILITY-001：地面掉落剪影可讀 — XP＝細綠 **shards**；heal＝白＋綠 **cross repair pack**；magnet＝罕見藍 **pulse disc** 地面掉落（`MAGNET_DROP_CHANCE=0.025`，套用既有 magnet util ×1.35／max 4，無新公式）；weapon 金框 board＋v0.9.29 halo 保留；size hierarchy XP < heal < weapon；per-kind floor halo／rim；截圖 `tests/screenshots/phase6-drop-readability/`；測試 `tests/drop-readability.test.mjs`。XP／heal 數值、magnet mul、weapon DPS、drop *rate tables*（heal chance 不變）**unchanged**。未做：Phase 4／horn art lock／phone GPU／temp buff 新經濟。
  - v0.9.29 — PHASE6-PICKUP-POLISH-001：slot-fire sync（只有 `weaponSlots` 內武器開火；orphan stacks prune）；take／upgrade／swap／keep／convertHeal 文案縮短；swap 高亮目標欄；武器箱 halo 加強；截圖 `tests/screenshots/phase6-pickup-polish/`。Player balance **unchanged**。未做：Phase 4／horn art lock／phone GPU。
  - v0.9.28 — PHASE6-MULTI-SLOT-INVENTORY-001：`weaponSlots`×4（start mg）；slot weapons mg／laser／shotgun／rocket／grenade／plasma；滿欄＋新型 → swap／keep；HUD `#weapon-slots`；`taken` stacks 仍驅動火力；截圖 `tests/screenshots/phase6-inventory/`；測試 `inventory.test.mjs`。Player balance **unchanged**。未做：Phase 4／horn art lock／phone GPU。
- v0.9.27 — GUN-8DIR-001：horn gun layer **8-dir**（N/NE/E/SE/S/SW/W/NW）sector snap via `yawToCardinal`／`yawToOctant`；bake `?dirs=8` → 64 cells；`HORN_MUZZLE_BY_DIR`／atlas／anchors 同步；legs≠aim／hurt／muzzle 保持；honest：**非** continuous 360° turret。截圖 `tests/screenshots/gun-8dir/`；測試 bake-player／muzzle／milestone-a／aim-hit-fast＋`gun-8dir-shots.mjs`。Player balance **unchanged**。未做：Phase 4／horn art lock／phone GPU／true 360° turret。
- v0.9.26 — PHASE3-ELITE-COMMANDER-001：`ENEMIES.commander` 軍指揮官／ARMY COMMANDER；amber-gold **tall officer-mech**（crest／epaulettes／baton／signal mast；≠ sentinel／hunter／chief recolor）；mode shifts — summon soldiers／drones（orange/red marks ≥1.0s）↔ personal attack telegraph≥1.1s→charge；fixed beat @300＋`ENDLESS.eliteRotate=['sentinel','hunter','commander']`；max one elite；zh-HK banner；截圖 `tests/screenshots/phase3-commander/`；測試 `tests/commander.test.mjs`＋`beats.test.mjs`。Player balance **unchanged**。未做：Phase 4／horn art lock／phone GPU。
- 2026-10-26 Phase 0 重跑 headless regression：`logic`、`levelup`、`health`、`balance`、`grenade-aim`、`bake-player`、`muzzle`、`milestone-a`、`smoke_files` — **全部 PASS**。
- `horn` 烘焙素材確實有 **32 張 PNG**：4 方向 ×（idle 1＋run 4＋gun 1＋hurt 1＋death 1），另有 atlas／anchors JSON。

### Browser／截圖（本輪 Phase 0，2026-10-26 重跑）

- `tests/browser-hotfix-0.9.3.mjs`：**36/36 PASS**（Chrome + SwiftShader；非真機 FPS）。
- 手機 390×844 Box3 投影約 `minX=106 / maxX=284 / midX=195`（置中）；桌面 1280×800 右欄 `wrap.x=1.15`，`midX≈897`。
- Selection 截圖（人工看過）：`tests/screenshots/phase0-baseline/menu-desktop-1280x800.png`、`menu-mobile-390x844.png`（另有 landscape）。桌面／直向選擇畫面無明顯 cards 遮擋 mech／出界。

### Open gaps／仍未完成

- `horn` 已做 **v0.9.7 bake quality**＋**v0.9.21 mecha silhouette**（Roy direction＝機甲；塊狀 rejected）。**interim silhouette accepted for pipeline**（Roy 2026-10-26 continue）；仍 **非** final art lock／device-final（唔標 §9 locked）；**唔**再自動 polish horn。
- **手機 mid-run WebGL context loss 仍可能發生**（Roy 實機曾回報「繪圖暫時中斷」）；v0.9.5 overlay、v0.9.6＋**v0.9.20** 減壓＋bg pause、**v0.9.51** mid-run shed＋interrupt snapshot 已落地，但 **真機 mid-run 穩定性仍未驗收**（Box＝SwiftShader ≠ device）。v0.9.53 提高手機預設畫質基準（唔取消 shed／cool-pause）；請 Roy 喺 `?v=0.9.60` 再試 near-black floor＋雙擊副／三擊投＋副≤3連射回主＋底欄完整武器名＋幀率。
- 槍層 **v0.9.27 起為 8-dir sector snap**（N/NE/E/SE/S/SW/W/NW）；**仍非**平滑 360° continuous turret。
- PERF-REBASELINE 已更新桌面 GTX 1070 Ti／v0.9.20（≈58–60 FPS）；**手機真機 200 敵效能仍未驗收**（Roy deferred phone GPU）。
- `heavy`（Precision）及 `prototype`（Morph）仍是不可開局的 showcase stubs。
- Phase 2 戰鬥可讀性：**v0.9.22 follow-up completed**（grunt rings off；elite／danger／pickups／floor／FX）；**HIT-FEEL-DEVICE Complete**／`device verified`（Roy「Ok」2026-10-27 phone · v0.9.50）。
- Phase 3 lab slice（v0.9.9）＋ SWARM CORE boss（v0.9.10）＋ Phase 6 pickup（v0.9.11）＋ aim/hit（v0.9.12）＋ elite #2 HUNTER（v0.9.13）＋ assembly bay zone（v0.9.14）＋ reactor zone（v0.9.15）＋ blockade zone（v0.9.16）＋ rooftop zone（v0.9.17，五區敘事齊）＋ endless elites／boss cadence（v0.9.18）＋ AIM-HIT-FAST-002（v0.9.19）＋ **PHONE-STABLE-FOLLOWUP（v0.9.20）**＋ horn silhouette interim（v0.9.21）＋ **PHASE2-COMBAT-READABILITY-002（v0.9.22）**＋ **PHASE3-ENEMY-SNIPER-001（v0.9.23）**＋ **PHASE3-ENEMY-SHIELD-001（v0.9.24）**＋ **PHASE3-ENEMY-ARTILLERY-001（v0.9.25）**＋ **PHASE3-ELITE-COMMANDER-001（v0.9.26）**＋ **GUN-8DIR-001（v0.9.27）** 已落地。Boss／elite landmark 仍喺同一 arena。武器模型＝`taken` stacks＋**v0.9.28 `weaponSlots`×4 HUD**＋**v0.9.29 slot-fire sync（HUD≡shots）**＋**v0.9.30 drop silhouettes（XP／heal／magnet／weapon）**。下一步：`AGENT_TASK` → pause／zone banner timing QOL，之後 sync before Phase 4（Roy continuous；skip HIT-FEEL wait）。Horn silhouette interim OK-to-continue；**唔**再自動 polish horn／art lock。PERF desktop rebaseline 已做。Phase 4 Precision — **do not start** until pillars。文案直寫 GitHub。
- 文件、測試或 TODO 存在，不代表對應玩法已可玩。

**開始前仍然要確認 `main` 目前 HEAD 與 live 部署版本；不要把本文件的日期當成即時倉庫狀態。**

## 1. 產品方向：不能改錯類型

這是流暢的 **bullet-heaven／survivor＋2D run-and-gun 觀感**：

- 玩家大致維持在畫面中央，敵人由四方八面逼近。
- 移動與瞄準獨立；機甲必須能一邊跑、一邊向另一方向開火。
- 自動攻擊、自動手榴彈，升級時選武器／裝甲／效用卡。
- 受傷只做 tint／overlay 等回饋，不能打斷跑步或鎖死輸入。
- **不要**加入傳統手動 reload、roll、stamina 來增加所謂「深度」。
- **不要**改寫成 Canvas2D、回合制、純 3D 雙搖桿或其他類型。
- 現有技術是 Three.js 場景＋2D billboard sprites；這個組合是有意選擇，不是待刪除的臨時架構。

### 1b. CYBER ARCADE 產品支柱（上架取向）

- **快速：** 開 app 盡快玩到；開頭幾秒已有敵人、火力、成長反饋。
- **容易：** 單手、自動攻擊、規則一看就明；深度放 Build 選擇，唔放操作負擔。
- **坐車搭車：** 短局、可暫停、打斷可恢復、直向螢幕、字大、危險提示清楚。
- **吸引力：** 主角有型、跑射流暢、**命中可靠**、升級有感、精英／Boss 有節奏（唔純堆怪）。
- **穩定慳電：** 手機唔易 WebGL crash、唔長時間發熱降頻——優先於再加地圖。
- **品質＞數量：** 每隻小遊戲要有完整開始→玩→結束→再玩；暴走機甲先做旗艦示範。
- **收入取捨：** 核心盡量可離線；廣告放自然停頓，唔喺戰鬥／升級中途強插；唔課金先可正常玩。Play 包裝／lifecycle／返回鍵／安全區／存檔／私隱：核心體驗穩後再完整一輪。

**暴走機甲優先序：** **命中可靠 → 手機穩定 → 主角好看 → 再擴內容。** 版本號多少次之。

### 故事與世界觀

地下軍工企業進行機甲人格同步實驗。主角在實驗中覺醒、逃離收容設施，企業先派研究員、保安、無人機與獵殺機甲追捕，之後升級至軍隊單位。美術與內容應服務這條「實驗體逃亡→企業追捕→軍事封鎖」線，而不是無關的怪獸大雜燴。

**逃亡線分區（逐步）：** 收容實驗室 → 機甲組裝 → 能源反應爐 → 軍事封鎖 → 天台逃出。  
目前實作：**五區齊** — lab（v0.9.9）＋ assembly bay（v0.9.14，@195s）＋ reactor（v0.9.15，@285s）＋ blockade（v0.9.16，@420s）＋ **rooftop（v0.9.17，@510s）**。誠實標：同一 arena 換邊飾／色溫／waveMix，唔係無縫大地圖。

### 三部機體的長期定位

| 穩定 ID | 名稱 | 定位 | 目前狀態 |
|---|---|---|---|
| `horn` | 覺醒突擊型 / Awaken Assault | 深石墨、青、紫；均衡主角 | 唯一可玩；垂直切片 |
| `heavy` | 高速精密型 / Precision Frame | 白、粉；女性化、快速、精密 | showcase stub，不可開局 |
| `prototype` | 可變結構原型 / Morph Prototype | assault／cruise／suppression 三形態 | showcase stub，不可開局 |

注意：`heavy` 現有 `speed: 0.92` 等數值只是暫定，與最終高速定位有衝突，**不是正式平衡，不可照抄為完成品**。

### 開發策略已鎖定

1. `horn` 證明玩法、操作與素材管線。
2. Precision 證明同一管線可重用，而且有真正不同剪影與戰鬥手感。
3. Morph 證明架構可擴展至形態系統。
4. 之後才大規模擴充敵人、地圖、武器與內容。

**不要一次做齊三部機；不要複製整個遊戲給每部機；不要只把 horn 染成白色便稱為 Precision。**

## 2. 目前架構與名詞

### 單一 3D 視覺來源

`js/mech-builder.js` 的 `buildPlayerMech(cfg)` 是目前主角模型來源：

```text
buildPlayerMech(cfg)
  ├─ selection：live 3D、底座、拖曳旋轉、auto-spin
  └─ offline bake：同模型輸出 directional PNGs → gameplay billboards
```

選擇畫面與遊戲素材必須保持同一身份。日後如改用 GLB，應接在同一 selection／bake 路徑後面，不可另加一張無關的 AI menu PNG，也不可在遊戲內使用另一套不相符的圖。

### 動畫分層

| 名詞 | 意思 | 主要位置 |
|---|---|---|
| locomotion／body layer | 腿部與身體跑步；移動時跟移動方向 | `js/sprites.js` |
| gun layer | 獨立槍械圖層；跟主要武器視覺瞄準 | `js/sprites.js` |
| `bodyDir` | 目前身體方向（bake dirs；horn 8-dir） | baked sprite `userData` |
| `gunDir` | 目前槍層 8-dir（N/NE/E/SE/S/SW/W/NW） | baked sprite `userData` |
| hurt layer | 受傷 tint／overlay，不切走跑步動畫 | `syncBakedPlayerSprite()` |
| death | 顯示死亡格並隱藏槍層 | `syncBakedPlayerSprite()` |

`buildBakedPlayerSprite(cfg)` 建立 body＋gun planes；`syncBakedPlayerSprite()` 每幀同步移動、瞄準、受傷與死亡。舊 whole-body PNG fallback 仍留給沒有烘焙素材的機體，不代表新機體可以跳過正式管線。

### 瞄準有兩個層次，不要混淆

- **Primary visual aim：** `game.visualAimX / visualAimZ`，目前只由 MG／laser 更新，用來決定玩家槍層朝向。
- **Per-fire-event aim：** 每次武器發射自己帶的方向，用於該子彈／火箭／手榴彈等事件。

`PRIMARY_VISUAL_WEAPONS` 目前是 `mg`、`laser`。火箭、手榴彈等 secondary 發射時，不能順手改寫 `visualAimX/Z`，否則機甲會因背景武器亂轉。目標選擇有 sticky 行為，避免每幀在最近目標之間閃跳。

### 手榴彈前方扇形

`js/logic.js`：

- `GRENADE_FAN_DOT = 0.5`：目標方向與 forward 的 dot product 必須 `>= 0.5`，即 forward 左右約 60°、合共約 **120°**。
- 扇形內無合適目標時，用 `GRENADE_FORWARD_DIST = 6.5` 做固定向前投擲。
- **不能因後方有敵人而向後扔。** 修改後必跑 `grenade-aim.test.mjs` 與 browser combat regression。

### 槍口只有一個計算來源

`js/muzzle.js` 的 `muzzleWorld(px, pz, aimX, aimZ, opts)` 同時供子彈生成與 muzzle VFX 使用。不要在 `main.js` 或特效層另寫近似 offset；否則子彈與火光會再次分家。

### 選擇畫面 responsive framing

`View.updateMenuLayout(viewportWidth, viewportHeight)`：

- 寬桌面保留右欄構圖，`wrap.x ≈ 1.15`。
- 窄屏或矮屏使用手機構圖，模型置中，並調整 scale／Y／camera。
- 必須在模型建立、resize、orientation change 後呼叫。
- 驗證要用 `THREE.Box3().setFromObject(model)`＋`camera.project()`，不能只靠 DOM 矩形或固定「模型應該在這裡」的 band。

## 3. Source map：改東西先看這裡

| 檔案 | 責任 |
|---|---|
| `js/main.js` | selection cards、開局鎖、輸入、game loop、HUD、fire／hit／kill effects、resize |
| `js/logic.js` | 移動、目標、瞄準、武器、傷害、手榴彈、fire events |
| `js/view.js` | live 3D selection、gameplay view、responsive menu、sprite sync |
| `js/sprites.js` | legacy PNG fallback、baked body／gun layers、方向與動畫狀態 |
| `js/mech-builder.js` | 程序化機甲模型；selection 與 bake 的共同視覺來源 |
| `js/muzzle.js` | 方向轉換、各方向槍口、world muzzle、UV anchors |
| `js/config.js` | `MECHS`、`MECH_BY_ID`、`resolveMechCombat()`、敵人、武器、平衡資料 |
| `js/strings.js` | zh-HK／en UI 文案 |
| `tools/bake-mech-sprites.mjs` | offline sprite bake CLI |
| `tools/bake-capture.html` | headless WebGL bake capture page |
| `assets/mechs/{id}/sheets/` | 每部機的烘焙 cells、atlas、anchors |
| `tests/` | headless regression 與 real-browser integration |

### 真實戰鬥數值只有一個來源

Selection UI 與 `Game` 必須共用 `resolveMechCombat()`／相同 runtime fields。不可在卡片上另寫假數值表。`MECHS` 的 `stats` 是優先資料；`bonus` 是 legacy adapter，修改時要理解兩者關係，不要靜靜製造分歧。

## 4. 烘焙素材與命名

目前 `horn` 標準重建指令：

```bash
node tools/bake-mech-sprites.mjs --id horn --dirs 4 --frames 4 --size 256
```

輸出位置：

```text
assets/mechs/horn/sheets/
  horn_{n,e,s,w}_idle_00.png
  horn_{n,e,s,w}_run_00.png ... run_03.png
  horn_{n,e,s,w}_gun_00_gun.png
  horn_{n,e,s,w}_hurt_00.png
  horn_{n,e,s,w}_death_00.png
  horn_atlas.json
  horn_anchors.json
```

規則：

- folder／file 用 lowercase ASCII、underscore，不用空格。
- 方向：horn 已擴展 **8-dir**（v0.9.27）；其他機體仍可先 4-dir，有需要再擴。
- frame index 用兩位數：`00`、`01`……。
- foot baseline、pivot、muzzle 要一致，並寫入 anchors；不可只目測 PNG 對位。
- 修改模型、材質、比例、武器掛點或 muzzle 後，要重新 bake 並檢查 atlas／anchors。
- 不可手改 PNG 假裝模型已更新，也不可只更新 live model 而漏掉 gameplay sheets。
- 目前 32 張圖的品質是 pipeline 證明，不是最終美術驗收。

相關文件：`docs/asset-naming.md`、`docs/render-pipeline.md`、`docs/milestone-b-asset-contract.md`、`docs/art-bible.md`。其中部分「Phase 1／contract only／in-game still interim」段落是舊狀態；藝術原則仍有效，但目前進度以本 HANDOFF、source 與實際 assets 為準。日後大改管線時應同步更新那些文件。

## 5. 標準工作流程：每一輪都照做

### A. 開始前

1. 確認目前 HEAD、工作樹是否乾淨、live 是哪個版本；保留可運行 baseline。
2. 閱讀本文件及將會觸碰的模組，不要只看 TODO 就改。
3. 把需求寫成一個小範圍任務：例如「減少普通敵人光圈干擾」，不要同一輪同時做新機、地圖、武器與 UI 重寫。
4. 先寫接受條件：操作、畫面、 regressions、需要哪些截圖／裝置。
5. 若用戶要求的方向與本文件的已鎖定原則衝突，先指出，不要靜靜改類型。

### B. 實作

1. 小步修改，優先重用 shared pipeline。
2. 不把 `horn` 的邏輯複製成 `heavyLogic`、`prototypeLogic`；差異應落在 config、model parts、anchors、passive／form strategy。
3. 新字串同時加入 zh-HK／en；zh-HK 在上。
4. 修改 vendor 前先確認是否真有必要；遊戲側可修正的問題不要污染 `vendor/cyber-kit`。
5. 資源要 dispose；pool 中的 mesh 不可同時仍留 scene。避免每幀建立材質、紋理、DOM 或大量排序。

### C. 驗證次序

1. **Headless regression：** 跑下方全部相關測試。
2. **Real browser interaction：** 不只 import module；要真的點卡、Start、tap、drag、release、反向跑射、resize。
3. **Screenshots：** 至少桌面 1280×800、手機直向 390×844；改 responsive 時加手機橫向 844×390 與 resize 返回。
4. **Visual review：** 打開截圖看模型是否被遮、出界、過暗、閃爍、槍口分家、敵我特效混色。自動 PASS 不能代替眼睛。
5. **Performance：** 涉及敵人數量、粒子、排序、HUD、材質時，做 stress test；真機結論必須來自真 GPU。
6. **交付記錄：** 寫明 commit、測試結果、截圖、未驗證事項與下一個建議小任務。

### D. 完成定義（Definition of Done）

只有同時滿足適用項目，才可說「完成」：

- 功能在實際遊戲中可操作，不只是函數或文件存在。
- 相關 regression 通過，沒有把失敗測試刪走來遷就程式。
- 桌面及手機實際互動無 page error，輸入不會卡死。
- 截圖已人工查看；selection 與 gameplay 沒有明顯遮擋／出界。
- 素材變更已重新 bake，anchors 與 muzzle 同步。
- 效能量測有裝置、GPU、解像度、DPR、bloom、敵人數與 SHA 等背景資料。
- 沒有把 SwiftShader、模擬數據或開發者回報冒充真機／親自驗收。
- 文件與版本標記更新，剩下的 gap 寫清楚。

## 6. 測試指令

在 repo root 執行：

```bash
node tests/logic.test.mjs
node tests/levelup.test.mjs
node tests/health.test.mjs
node tests/balance.test.mjs
node tests/grenade-aim.test.mjs
node tests/bake-player.test.mjs
node tests/muzzle.test.mjs
node tests/milestone-a.test.mjs
python3 tests/smoke_files.py
```

v0.9.3 browser integration（已包含 v0.9.2 重點 regression）：

```bash
node tests/browser-hotfix-0.9.3.mjs
```

Browser suite 需要 Chromium／Chrome 與 `puppeteer-core`；可用 `CHROME_PATH` 指定瀏覽器。輸出截圖在 `tests/screenshots/`。目前 repo 沒有一般 npm dependencies 表；若只是本機驗證而安裝工具，不要未經同意把臨時依賴當成產品改動提交。

常用 debug flags：`?demo=1`、`?autostart=1`、`?fps=1`、`?lang=zh`、`?lang=en`。試玩仍需覆蓋真正觸控拖曳；桌面 WASD 不能證明手機 joystick 正常。

### SwiftShader 的正確用途

v0.9.3 browser suite 固定使用 SwiftShader WebGL，適合自動化功能與投影驗證，**不適合拿來報真實 FPS**。軟件渲染慢，不等於手機慢；軟件渲染通過，也不等於真機流暢。

效能報告至少要記：

- build SHA、瀏覽器版本、裝置與 GPU；
- viewport、devicePixelRatio、bloom／glow 設定；
- 敵人數、武器與粒子場景、測試時長；
- 平均與高百分位 frame time、明顯卡頓與輸入延遲。

不要只給一個沒有測試背景的「60 FPS」。

## 7. 未來工作次序與驗收閘門

以下是建議順序，不是要求一次全部做完。每一階段完成並驗收後才進下一大項。

### Phase 0 — 重新確認可運行 baseline

- 對齊目前 `main` 與 live；重跑 headless＋v0.9.3 browser suite。
- 看 desktop／mobile 截圖，確認 selection 沒有出界或被 cards 遮住。
- 若 `main` 已超過 `6ddc483`，先記錄差異，不要強行回退新工作。

**出閘：** 有可重現的開發基準、測試結果與未驗證清單。

### Phase 1 — 完成 horn 的視覺／烘焙品質與真機效能

優先處理主角，因為所有後續機體都重用這條路：

- 改善臨時 blocky 模型、甲片層次、材質與燈光；保留單角、青色人格核心、不對稱肩甲、中型步槍等身份線索。
- 重新 bake 後檢查 4-dir idle/run/gun/hurt/death、foot baseline、槍口與跑步反向射擊。
- 維持邊跑邊射、受傷不打斷、secondary 不搶 body aim。
- 8-dir gun（v0.9.27）已落地；若仍明顯跳向再評估 continuous gun pivot；**不得**宣稱 360° 平滑直至真做 continuous。
- 在真 GPU 桌面與目標手機做 200-enemy stress；先量測再優化。

**出閘：** Roy 實機玩過，跑步／射擊／受傷／死亡與槍口都順；主角素材品質獲接受；效能量測有真機數據。

### Phase 2 — 戰鬥可讀性與敵人光圈減噪

> **完成（v0.9.22 follow-up）：** v0.9.4 grunt dim → **v0.9.22 ordinary rings off**；**v0.9.8 floor**＋v0.9.22 darker ambient；elite／boss／danger telegraphs＋pickups punchier；ordinary kill FX declutter；nearest／sticky confirmed（mild hold tweak）。截圖 `tests/screenshots/phase2-readability/`＋既有 `phase2-floor/`。**HIT-FEEL-DEVICE Complete**／`device verified`（Roy「Ok」2026-10-27）。

- 普通敵人不應每個都有大光圈；保留給精英、危險攻擊或必要身份提示。 ✅
- 地板與 ambient 要比敵人、子彈、拾取物暗；warning red／orange／acid 不被裝飾搶用。 ✅（elite telegraph = danger orange；boss = acid）
- 減少無意義全場 slow-motion、過量 bloom、粒子與 HUD 寫入。 ✅（ordinary kill no ring／wave；mobile cuts preserved）
- target query 不要每把武器、每幀做完整敵人排序；沿用或改善 nearest／sticky 策略。 ✅

**出閘：** 高密度戰鬥仍能看清主角、敵人輪廓、危險區、子彈與拾取物；效能沒有明顯回歸。

### Phase 3 — 小型敵人＋地圖 vertical slice

> **部分完成（v0.9.9）：** 收容實驗室小片 — staffer（白袍退後）／guard（武裝追擊）／drone（小型飛行）程序化剪影；SENTINEL PRIME 簡化精英（telegraph ≥1.2s → charge → recover）；zh-HK 橫幅；cooler lab 邊緣色溫；暗地板保留自 v0.9.8。截圖 `tests/screenshots/phase3-lab/`。未做：全套 boss SWARM CORE、五區地圖、精英打磨／第二精英。

先做一個完整小片，不要立即鋪五張地圖：

- 建議由收容實驗室開始：研究員、保安、drone，加一個有明確 silhouette／telegraph 的精英或獵殺機甲。
- 敵人必須以攻擊角色與剪影區分，不是只換顏色。
- 地圖維持低對比可玩地面，裝飾集中邊緣；做出「實驗室逃出」的環境敘事。
- 需要 boss／elite 時參考 `docs/BEATS-PLAN.md`，但先做一個可驗收節拍。

**出閘：** 一個小區域有開始、升壓、精英事件與清晰危險提示，並且不妨礙 bullet-heaven 核心操作。

### Phase 4 — Precision：證明管線可重用

- 真正做白／粉、女性化、快速精密的不同比例與裝甲／武器剪影。
- 沿用 selection、bake、body／gun sync、muzzle、stats resolver 與測試架構。
- 為新模型建立自己的 sheets／anchors；測試反向跑射、手機 selection、真實 stats。
- 重新訂高速精密數值與被動；不要把現有 `0.92` stub 當最終答案。
- `playable` 只能在完整可玩與驗收後打開。

**出閘：** 新增 Precision 不需要 fork 整個遊戲；外觀、速度與操作手感確實不同，horn 無回歸。

### Phase 5 — Morph：證明架構可擴展

- 設計 assault／cruise／suppression 的共用狀態介面、切換條件、模型／素材與數值邊界。
- 先完成一種可玩切換閉環，再三形態全部擴充；避免一開始做龐大 FSM。
- 每形態都要處理 selection、gameplay sprite、muzzle、stats、升級與死亡／受傷狀態。
- 不因形態切換而破壞移動、主要瞄準或輸入。

**出閘：** 形態是資料／策略擴展，不是另一套遊戲；三形態差異可玩、可測、可解釋。

### Phase 6 — 武器、拾取、地圖分區與內容擴展

> **部分完成（v0.9.11＋v0.9.14–v0.9.18）：** 武器地面拾取選擇器（v0.9.11）— 撿到 weapon crate 時暫停並用 level-cards UI 提供獲得／升級疊層／保留／滿級兌換修復；事件 `weaponOffer`／`levelup from:'pickup'`；單元測試 `tests/weapon-pickup.test.mjs`；截圖 `tests/screenshots/phase6-pickup/`。**地圖分區小片（v0.9.14–v0.9.17，五區齊）** — `mapZone` lab→assembly @195s→reactor @285s→blockade @420s→rooftop @510s；組裝／反應爐／封鎖／天台邊緣 props＋琥珀／紫青／鋼綠／夜藍 trim；waveMix 微調；`zoneEnter` 橫幅；`tests/map-zone.test.mjs`；截圖 `phase6-assembly/`、`phase6-reactor/`、`phase6-blockade/`、`phase6-rooftop/`。**Endless cadence（v0.9.18）** — `ENDLESS`＋`_endlessBeatCheck`：boss@360 後 elite 每 ~90s（sentinel／hunter 交替）、boss 每 ~300s（swarm_core）；max one elite、延後排程；`tests/beats.test.mjs`。未做：多槽庫存、新武器數值大改、新 elite／boss 剪影。elite #2 已於 v0.9.13。

- 武器拾取遇到已有裝備時，要提供替換／保留／槽位選擇；**不可靜靜覆蓋裝備**。（v0.9.11：以疊層升級／保留實作；現有架構無多槽。）
- 新武器必須遵守 primary visual aim 與 per-fire-event aim 分工。
- 新地圖可逐步加入 assembly、reactor、blockade、rooftop 等分區，但每區先有玩法或敵人組合理由。
- 最後才大規模增加敵人包、掉落、boss beats、hub 素材與商業化接線。

## 8. 不可回歸的舊修正

### 輸入與 UI

- `.hud-buttons.top` 必須避免同時有 `top` 與 `bottom` 撐成透明全高攔截層；裝飾 HUD `pointer-events: none`。
- 手機 `ViewInput` handlers 必須完整；v0.9.2 的 `tap: () => {}` 是刻意修正，否則 light tap 會出現 `this.h.tap is not a function`。
- `oneFingerOrbit: false`：第一根手指是移動，不是旋轉鏡頭。
- `showMenu()` 與 `startRun()` 要正確切換 menu mech／gameplay player，避免兩個模型重疊。
- 英文 Start 兩行不能重複；目前是 `BREAK OUT`／`ENGAGE`。

### 動畫、武器與渲染

- 不可恢復「whole-body fire state 蓋過 run state」的互斥優先級。
- 不可讓移動方向強制覆蓋射擊方向，也不可讓 rocket／grenade 改寫 primary visual aim。
- 子彈與 muzzle VFX 必須共用 `muzzleWorld()`。
- `disposeTree()` 要連 materials 一併 dispose；切換模型不能漏 GPU memory。
- Drop pool：一個 mesh 不可同時在 scene 與 pool；舊錯誤會令一個掉落物留下整串重複方塊。
- 不用大型透明 glow sphere 包住子彈或單位，會把剪影吃掉。

### 升級與音頻

- `SwarmAudio` 方法不可與 `SynthAudio` 的 `this.*` 屬性撞名；`levelChime()` 是為避開 `this.level` 數值而命名。
- Level-up 抽卡要處理 capped pool 用完的情況，不可打開空面板或令之後再沒有升級選項。
- 改 `swarmPressure()`、`waveMix()`、敵人 cap 或卡片後，要跑 balance／levelup，不可只憑感覺。

## 9. 美術與系列規則

- 原創 IP：可以保留日式機甲與軍工科幻語言，不加入他作名稱、logo、精確複製或商標。
- 主角在約 64–96 px 屏幕高度仍要靠 head／shoulders／weapon／backpack 讀出，不靠微細鉚釘。
- 敵人以 silhouette＋color＋motion 區分，不以大小或色相單獨區分。
- Bloom 只做克制輪廓，不洗白甲片與青色彈道。
- 廣告只在自然停頓；不可在 swarm 中途或升級卡上強插。
- 未公開 lab hub path 不要提交進 repo；hub 名稱、縮圖與 `games.json` 可另外同步。
- Android／Capacitor、trial→openStore 等不是目前主角管線的優先工作，除非 Roy 明確改變方向。

## 10. 每輪交接格式

完成一輪後，用以下格式更新本文件頂部與交付訊息，讓下一位不用猜：

```text
Version / commit:
Scope changed:
Why:
Files changed:
Assets rebaked:
Headless tests (actually run):
Browser tests (actually run):
Viewports / devices:
Screenshots reviewed:
Performance evidence (device + GPU + scene):
Known gaps / not verified:
Recommended next small task:
Rollback baseline:
```

**誠實標籤：** `implemented`、`tested`、`visually reviewed`、`device verified`、`user reported`、`not verified` 是不同狀態，不可混用。

**Active = HUD-HUB-FLUSH-TOP-001** — tip `?v=0.9.143`. HUD/settings beat shipping. **no** Phase 4／soft-juice／horn／more ult／BALANCE re-pass.

## 11. 下一位 agent 的第一個建議動作

**Shipping** tip `?v=0.9.160` (HANDOFF-GLOW-SETTINGS-NOTE-001). Soft-juice / Phase 4 / horn / BALANCE re-pass still banned.

HARD BANS: Phase 4 · horn art lock · soft-juice invent · BALANCE-PASS · deep phone GPU · Roy PNG.
（full ult invent ban returns unless Roy re-opens.)

Preserve: hide stick · hub · water rail · tap≥44 · catalog fire live · dbl/tpl · burst≤3 · black floor · 2+2+2 · howto/coach sync · branch deep kits · **unique ult kits** · rail group a11y · hub/pause/over/level a11y.



## 版本歷史（增量）

- **v0.9.160 HANDOFF-GLOW-SETTINGS-NOTE-001:** pause menu = title/hint/Resume/Restart/Quit only — **no** `#btn-glow` / GLOW LOW/HIGH chrome. Quality/畫質 (kit glow low/high via `stage.setGlow` persist) lives **only** in settings sheet. Do not re-add pause glowToggle.
- **v0.9.143** (`HUD-HUB-FLUSH-TOP-001`) — hub flush top — shipping
- **v0.9.144** (`HUD-MUTE-TO-GEAR-001`) — in-run mute → gear; opens same settings; settingsTip aria
- **v0.9.145** (`HUD-GEAR-PAUSE-CORNERS-001`) — gear L + pause R under hub corners; row space-between; tap≥44
- **v0.9.146** (`SETTINGS-AUDIO-SPLIT-001`) — SFX + BGM sliders via kit extras type:slider; persist cyber.audio
- **v0.9.147** (`SETTINGS-QUALITY-SHARE-HOWTO-001`) — quality=glow remap; share+howto actions; pause-on-open in-run
- **v0.9.148** (`SETTINGS-SHEET-PHONE-READ-001`) — settings sheet phone contrast / action chrome
- **v0.9.149** (`GEAR-PAUSE-TAP-NOTE-001`) — gear+pause tap≥44 docs/CSS affirm under hub
- **v0.9.150** (`SETTINGS-FOCUS-TRAP-NOTE-001`) — docs: settings/pause focus — kit modal focuses OK; pause-on-open
- **v0.9.151** (`SHARE-FALLBACK-SOFTPIN-001`) — share-fallback soft-pin ≥ tip; settings share reuses result-share
- **v0.9.152** (`HANDOFF-AGENT-TIDY-001`) — HANDOFF/AGENT_TASK tidy for HUD/settings beat
- **v0.9.154** (`PAUSE-GLOW-TO-SETTINGS-001`) — remove pause glowToggle; quality/畫質 only in settings
- **v0.9.155** (`SETTINGS-QUALITY-AFFIRM-001`) — affirm settings 畫質 row + setGlow persist; no second quality system
- **v0.9.156** (`PAUSE-CTA-ARIA-SYNC-001`) — pause Resume/Restart/Quit aria-label via data-i18n-attr; no glow chrome
- **v0.9.157** (`README-STATUS-SYNC-001`) — README status line sync off stale GAMES-JSON-STAGE-004 → tip
- **v0.9.158** (`WEAPONS-MD-TIP-SYNC-002`) — WEAPONS.md Live tip header sync off stale BALANCE v0.9.124 → tip
- **v0.9.159** (`HIT-FEEL-PIPELINE-TIP-001`) — HIT-FEEL-DEVICE live tip note → current safe pipeline (docs only)
- **v0.9.160** (`HANDOFF-GLOW-SETTINGS-NOTE-001`) — HANDOFF note: pause has no glow btn; 畫質 only in settings
- **v0.9.153** (`GAMES-JSON-STAGE-005`) — games.json stub stage → tip; HUD/settings beat HOLD
- **v0.9.142** (`GAMES-JSON-STAGE-004`) — games.json stub stage → v0.9.142; end of safe polish beat; HOLD
- **v0.9.141** (`LEVEL-PANEL-READ-001`) — level panel/title phone chrome contrast (no card layout rewrite)
- **v0.9.140** (`GFX-BODY-READ-001`) — gfx overlay body/en phone contrast readability
- **v0.9.139** (`COACH-READ-001`) — run-coach zh/en phone contrast readability
- **v0.9.138** (`COACH-FALLBACK-SYNC-001`) — run-coach HTML fallback mirrors coach.move (dbl/tpl/rail)
- **v0.9.137** (`PAUSE-SUBTITLE-READ-001`) — pause title-en cyan chrome / nowrap (mirror over subtitle)
- **v0.9.136** (`PAUSE-HINT-READ-001`) — pause-hint phone contrast/weight readability
- **v0.9.135** (`PAUSE-HINT-FALLBACK-001`) — index pause-hint HTML fallback sync P／Esc + 繼續／唔會自動恢復 (mirror strings)
- **v0.9.134** (`OVER-TITLE-SIZE-001`) — bigger one-line over title clamp(28px, 9vw, 48px); keep nowrap/glitch; phone 360 fit.
- **v0.9.126** (`PHONE-GPU-DEEPEN-001`) — shed 0–3 earlier thresholds; PR/bloom/particle/post skips; cool-pause snapshot; kickFx shed clamp; HOLD.
- **v0.9.125** (`UI-POLISH-001`) — home/mech/hub/rail/pause chrome contrast polish; layout/product preserved.
- **v0.9.124** (`BALANCE-PASS-001`) — Lv1 + stacked branch/ult DPS fair retune vs enemy HP; WEAPONS.md tables synced.
- **v0.9.123** (`WEAPONS-ULT-KITS-001`) — unique U1/U2 behavior kits for all 5 primaries (30 forms); ion dual-slit + gatling heatGainMul.
- **v0.9.122** (`WEAPONS-ULT-LABELS-001`) — unique zh/en U1/U2 titles+descs per primary×branch; no「完整招式後續」.
- **v0.9.121** (`WEAPONS-ULT-SPEC-001`) — unique U1/U2 names+effects per primary×branch in WEAPONS.md; full-ult invent ban lifted this Active; light amp fallback until kit code.
- **v0.9.120** (`GAMES-JSON-STAGE-003`) — games.json stub stage → v0.9.120; end of 20-slice batch; HOLD.
- **v0.9.119** (`SHARE-CONFIRM-ROLE-001`) — share-confirm role=status; share btn aria preserved; no SDK invent.
- **v0.9.118** (`MENU-HOME-MAIN-001`) — screen-start role=main aria 主選單/MAIN MENU; CTA tap preserved.
- **v0.9.117** (`LEVEL-CARDS-ARIA-001`) — level-cards role=list aria 升級卡/LEVEL CARDS; focus ring preserved.
- **v0.9.116** (`WEAPONS-MD-BATCH-SYNC-001`) — WEAPONS.md tip + status rows for level/zone/goal/focus a11y batch.
- **v0.9.115** (`README-TIP-SYNC-001`) — README Play tip sync off stale v0.9.60 → live tip; status line.
- **v0.9.114** (`HUB-TIME-I18N-001`) — hub time block aria-label from hud.time 時間/TIME; no balance change.
- **v0.9.113** (`FPS-ARIA-HIDDEN-001`) — fps counter aria-hidden=true (decorative debug); no GPU change.
- **v0.9.112** (`MECH-PICK-ARIA-SYNC-001`) — mech-pick radiogroup aria zh-first 機體選取/FRAME PICK sync.
- **v0.9.111** (`OVER-META-A11Y-001`) — over-meta role=group aria 結算摘要/RUN SUMMARY; loadout PST preserved.
- **v0.9.110** (`STICK-ARIA-HIDDEN-001`) — stick aria-hidden=true (visual touch affordance); hide-until-touch preserved.
- **v0.9.109** (`ICON-BTN-FOCUS-001`) — icon-btn + menu-icon-btn focus-visible ring ≥2px cyan; tap≥44 kept.
- **v0.9.108** (`NEON-BTN-FOCUS-001`) — neon-btn focus-visible ring ≥2px cyan; UI a11y only.
- **v0.9.107** (`EARLY-TOAST-ROLE-001`) — early-toast role=status; no soft-juice invent.
- **v0.9.106** (`RUN-COACH-ROLE-001`) — run-coach role=status; dbl/tpl coach copy preserved.
- **v0.9.105** (`BEAT-BANNER-ROLE-001`) — beat-banner role=status; queue/timing preserved.
- **v0.9.104** (`HUD-GOAL-A11Y-001`) — hud-goal role=status aria 目標/GOAL; kill count preserved.
- **v0.9.103** (`HUD-ZONE-A11Y-001`) — hud-zone role=status aria 區域/ZONE; color chip preserved.
- **v0.9.102** (`XP-BAR-A11Y-001`) — xp-bar role=progressbar aria 經驗/XP + valuemin/max; hub preserved.
- **v0.9.101** (`LEVEL-DIALOG-A11Y-001`) — level screen role=dialog aria-modal + labelledby; cards tap preserved.
- **v0.9.100** (`GAMES-JSON-STAGE-002`) — games.json stub stage → v0.9.100; end of 10-slice batch; HOLD.
- **v0.9.99** (`SLOT-RAIL-ARIA-SYNC-001`) — weapon-slots/rail static aria zh-first sync; color-only rail preserved.
- **v0.9.98** (`WEAPONS-MD-TIP-SYNC-001`) — WEAPONS.md Live tip header sync off stale v0.9.75; status a11y rows.
- **v0.9.97** (`LEVEL-CARD-FOCUS-001`) — level-card focus-visible ring ≥2px cyan; UI a11y only.
- **v0.9.96** (`HUB-ARMOR-I18N-001`) — hub ARM label → data-i18n hud.arm 裝甲/ARM; no balance change.
- **v0.9.95** (`BOSS-HP-A11Y-001`) — boss-hp role=region aria 首領血量/BOSS HP; strip chrome only.
- **v0.9.94** (`SHARE-BTN-ARIA-001`) — btn-share aria-label from shareButtonLabels; no SDK invent.
- **v0.9.93** (`OVER-DIALOG-A11Y-001`) — over screen role=dialog aria-modal + labelledby; share/retry preserved.
- **v0.9.92** (`PAUSE-DIALOG-A11Y-001`) — pause screen role=dialog aria-modal + labelledby; CTA tap preserved.
- **v0.9.91** (`HUD-HUB-A11Y-001`) — hud-hub role=region + aria 戰況/RUN STATUS; preserve hub layout.
- **v0.9.90** (`RAIL-GROUP-A11Y-001`) — `wrail-group` role=group + aria 主/副/投; color-only rail preserved. End of 10-slice batch. Screenshots `tests/screenshots/rail-group-a11y/`. Tests `rail-group-a11y`. **HOLD for Roy try**.
- **v0.9.89** (`GAMES-JSON-STAGE-001`) — Bump `docs/GAMES-JSON-STUB.md` stage v0.3.3 → v0.9.89 (2+2+2 / hide-stick / rail). Screenshots `tests/screenshots/games-json-stage/`. Tests `games-json-stage`.
- **v0.9.88** (`WEAPONS-ULT-LIGHT-AMP-DOCS-001`) — Document U1 dmg×1.2 / U2 cd×0.85 in WEAPONS; full kits still stub. Screenshots `tests/screenshots/weapons-ult-light-amp-docs/`. Tests `weapons-ult-light-amp-docs`.
- **v0.9.87** (`PAUSE-HINT-SYNC-001`) — pauseHint sync P/Esc + resume; no soft-juice invent. Screenshots `tests/screenshots/pause-hint-sync/`. Tests `pause-hint-sync`.
- **v0.9.86** (`WEAPONS-BRANCH-HINT-SYNC-001`) — BRANCH_KIT_HINTS match branchNames (slow_gun/attack_drone/flash/gravity/blackhole B). Screenshots `tests/screenshots/weapons-branch-hint-sync/`. Tests `weapons-branch-hint-sync`.
- **v0.9.85** (`WEAPONS-BRANCH-PRIMARY-EN-DOCS-001`) — Primary branch naming table EN columns in WEAPONS (parity sec/throw). Screenshots `tests/screenshots/weapons-branch-primary-en-docs/`. Tests `weapons-branch-primary-en-docs`.
- **v0.9.84** (`OVER-LOADOUT-PST-001`) — formatLoadoutFromGame groups P/S/T from loadout. Screenshots `tests/screenshots/over-loadout-pst/`. Tests `over-loadout-pst`.
- **v0.9.83** (`HOWTO-RULES-SYNC-001`) — help.rules sync 2+2+2 / magnet / stick hide. Screenshots `tests/screenshots/howto-rules-sync/`. Tests `howto-rules-sync`.
- **v0.9.82** (`WEAPONS-ULT-EN-LABELS-001`) — U1/U2 POWER AMP / CADENCE AMP; FORM I/II retired; full kits stub. Screenshots `tests/screenshots/weapons-ult-en-labels/`. Tests `weapons-ult-en-labels`.
- **v0.9.81** (`PAUSE-CTA-TAP-001`) — pause resume/restart/quit ≥44 phone / 48 desktop. Screenshots `tests/screenshots/pause-cta-tap/`. Tests `pause-cta-tap`.
- **v0.9.80** (`WEAPONS-BRANCH-EN-LABELS-001`) — Real EN branch titles via `branchNamesEn` (all 14); branch/ult cards no longer stub `PATH A`. Sec/throw naming table in WEAPONS.md. No full ult invent / BALANCE-PASS. Screenshots `tests/screenshots/weapons-branch-en-labels/`. Tests `weapons-branch-en-labels`. **HOLD for Roy try**.
- **v0.9.79** (`GFX-RELOAD-TAP-001`) — Gfx recover reload CTA ≥44 phone / 48 desktop. Screenshots `tests/screenshots/gfx-reload-tap/`. Tests `gfx-reload-tap`. Phase4/horn/soft-juice/BALANCE-PASS / deep GPU **unchanged**.
- **v0.9.78** (`COACH-CONTROLS-SYNC-001`) — Sync run-coach strings to dbl/tpl/rail (mirrors howto; no soft-juice invent). Screenshots `tests/screenshots/coach-controls-sync/`. Tests `coach-controls-sync`. Phase4/horn/BALANCE-PASS **unchanged**.
- **v0.9.77** (`HOME-CTA-TAP-001`) — Home play/endless neon-btn ≥44 phone / 48 desktop. Screenshots `tests/screenshots/home-cta-tap/`. Tests `home-cta-tap`. Phase4/horn/soft-juice/BALANCE-PASS **unchanged**.
- **v0.9.76** (`OVER-CTA-TAP-001`) — Over-screen retry/menu/share neon-btn ≥44 phone / 48 desktop. Screenshots `tests/screenshots/over-cta-tap/`. Tests `over-cta-tap`. Phase4/horn/soft-juice/BALANCE-PASS **unchanged**.
- **v0.9.75** (`WEAPONS-CATALOG-FIRE-LIVE-001`) — Mark all 14 catalog fire paths live (docs stub→live); every id `exemplar:true` + behavior wired in `logic.js`. No full ult invent / BALANCE-PASS. Screenshots `tests/screenshots/weapons-catalog-fire-live/`. Tests `weapons-catalog-fire-live` + strengthened `weapons-catalog`. **HOLD for Roy try**.
- **v0.9.74** (`HOWTO-CONTROLS-SYNC-001`) — Sync `help.controls` / howto to shipped stick hide + dbl/tpl + bottom rail. No soft-juice toast invent. Screenshots `tests/screenshots/howto-controls-sync/`. Tests `howto-controls-sync`. Phase4/horn/BALANCE-PASS **unchanged**.
- **v0.9.73** (`WEAPONS-RAIL-PATH-BADGE-001`) — Rail tiny A/B/C·U corner when branched (extends card path chips); no name labels; no ult invent. Screenshots `tests/screenshots/weapons-rail-path-badge/`. Tests `weapons-rail-path-badge`. Phase4/horn/soft-juice/BALANCE-PASS **unchanged**.
- **v0.9.72** (`HOME-MECH-CARD-TAP-001`) — Home mech cards phone ≥44 tall. Screenshots `tests/screenshots/home-mech-card-tap/`. Tests `home-mech-card-tap`. No unlock invent. Phase4/horn/soft-juice/BALANCE-PASS **unchanged**.
- **v0.9.71** (`HUD-MUTE-PAUSE-TAP-001`) — In-run mute/pause ≥44×44 (was 36/34). Screenshots `tests/screenshots/hud-mute-pause-tap/`. Tests `hud-mute-pause-tap`. Phase4/horn/soft-juice/BALANCE-PASS **unchanged**.
- **v0.9.70** (`HOME-SETTINGS-TAP-001`) — Phone home gear/howto restored to ≥44×44 (overrides cyber-kit `@media max-760` 40px shrink); settings sheet rows, toggles, and seg buttons ≥44 tall. Screenshots `tests/screenshots/home-settings-tap/`. Tests `home-settings-tap`. Phase4/horn/soft-juice/BALANCE-PASS **unchanged**. **HOLD for Roy try**.

- **v0.9.69** (`WEAPONS-BRANCH-CARD-PATH-001`) — Branch/ult pick path chip (A/B/C · U1/U2); title shows weapon name; larger phone card tap (~88px). UI only — no ult invent. Screenshots `tests/screenshots/weapons-branch-card-path/`. Tests `weapons-branch-card-path`. Phase4/horn/soft-juice/BALANCE-PASS **unchanged**.

- **v0.9.68** (`WEAPONS-RAIL-TAP-TARGET-001`) — Phone weapon-rail tiles ≥44×44 tap targets; `--hud-rail-h` 54px; default 48 / desktop 52. Screenshots `tests/screenshots/weapons-rail-tap-target/`. Tests `weapons-rail-tap-target`. Phase4/horn/soft-juice/ult invent/BALANCE-PASS **unchanged**.

- **v0.9.67** (`WEAPONS-RAIL-FILL-EDGE-001`) — Water-fill edge cases: quantize near-empty/near-full; `.drained` / `.on-cd` / `.bursting` on `#weapon-rail` tiles; burst left in fill snap. Screenshots `tests/screenshots/weapons-rail-fill-edge/`. Tests `weapons-rail-fill-edge`. Phase4/horn/soft-juice/ult invent/BALANCE-PASS **unchanged**.

- **v0.9.66** (`STICK-RAIL-CLAMP-001`) — Stick placeAt clamps above bottom weapon rail (10px air gap); rail z-index 9 > stick 8 so color tiles stay readable; idle hide-until-touch preserved. Screenshots `tests/screenshots/stick-rail-clamp/`. Tests `stick-rail-clamp`. Phase4/horn/soft-juice/ult invent/BALANCE-PASS **unchanged**.

- **v0.9.59** (`WEAPONS-HUD-CONTROLS-FLOOR-001`) — Roy phone 2026-10-28：near-black play floor；double-tap secondary（≤3 burst→primary）；triple-tap throw；unified status chips；bottom smaller weapon rail + full zh titles；no big balance retune（note BALANCE-PASS later）。Screenshots `tests/screenshots/weapons-hud-controls-floor/`. Tests `weapons-hud-controls-floor`. Phase4/horn/soft-juice/ult invent **unchanged**. **HOLD for Roy try**.
- **v0.9.58** (`WEAPONS-LEGACY-PURGE-001`) — Player-facing purge: remove duplicate unlock cards `laser`/`rocket`/`grenade`/`plasma` from `CARDS`; level-up/crates offer catalog ids with WEAPONS.md zh/en only; keep thin `WEAPON_ID_ALIASES` (mg→gatling, laser→ion_beam, rocket→tracking_bomb, grenade→frag, plasma→acid_gun); reword MG-only buff copy → 主武器/Primary; `starterWeapon:'gatling'; HUD/loadout/result catalog names. Screenshots `tests/screenshots/weapons-legacy-purge/`. Tests `weapons-legacy-purge` + pickup/inventory/levelup retarget. Fire engines/`behavior:'mg'` left intact. Phase4/horn/soft-juice/ult invent **unchanged**. **HOLD for Roy try**.

- **v0.9.57** (`WEAPONS-ICON-PLACEHOLDERS-001`) — Neon SVG square tiles (cyan/magenta/amber by category) replace bare emoji on left rail + top status; `WEAPON_ICON_SRC` → `assets/weapons/{id}.png`; empty/muted states; layout v0.9.52–53 kept. Not Roy final art. Screenshots `tests/screenshots/weapons-icon-placeholders/`. Tests `weapons-icon-placeholders`. Full ult kits / Phase4 / horn / soft-juice invent **unchanged**. **HOLD for Roy try** (do not invent more beauty slices).

- **v0.9.56** (`WEAPONS-FEEL-FX-001`) — Per-weapon combat feel FX recipes (`js/weapons-feel-fx.js`): gatling bolts, ion charge→punch, tracking stick→pop, vulcan sparks, zero chill+frost, acid mist, shotgun flash, slow ring, drone puff, blackhole swirl, distinct throw bursts. MOBILE_GFX/pool-respecting. Screenshots `tests/screenshots/weapons-feel-fx/`. **HOLD mid-pipeline → continued to icons**.

- **v0.9.55** (`WEAPONS-BRANCH-KITS-001`) — Deep A/B/C branch kits: gatling overheat/pierce/cone; ion focus/chain/slit; tracking triple/mine/drone-seek; vulcan spray/burn/fortress; zero chill/frostBurst/selfShield; secondary/throw A/B deepen. Ult still light amp only. Screenshots `tests/screenshots/weapons-branch-kits/`. Tests `weapons-branch-kits` (+ prior pick green). Full ult kits / real icons / feel FX / Phase4 / horn **unchanged**. **HOLD for Roy try**.

- **v0.9.54** (`WEAPONS-BRANCH-PICK-001`) — Branch/ult UI stubs → playable: Lv≥3 branch level-cards (A/B/C primary; A/B sec/throw); Lv≥5 primary ult U1/U2; `weaponBranches`/`weaponUlts`/`pendingPathOffer`; light `branchStatMods`; HUD path suffix; `.branch-offer`. Screenshots `tests/screenshots/weapons-branch/`. Tests `weapons-branch-pick` + `weapons-branch-shots`. Full ult kits / real icons / feel FX polish / Phase4 / horn **unchanged**. **HOLD for Roy try**.

- **v0.9.53** (`WEAPONS-REDESIGN-001`) — Loadout 2P+2S+2T; catalog 5+5+4; feel fire paths; left rail + top status HUD; mobile GFX baseline raise. Screenshots `tests/screenshots/weapons-redesign/`. Branch/ult were data stubs (now playable in v0.9.54).

- **v0.9.52** (`UI-LAYOUT-HOME-HUD-001`) — Home: mute/volume/lang into gear settings only (removed `#btn-mute-menu`; settings mute → `toggleMutePersist`); shrink mech cards + selected highlight; lower `--menu-cta-bottom` so Start hugs bottom; in-run XP bar + weapon-slots moved to TOP (`--sa-top`); goal/zone/boss-hp/banners cleared. Screenshots `tests/screenshots/ui-layout-home-hud/`. Tests `tests/ui-layout-home-hud.test.mjs` + safe-area/mute-persist updates. Weapon/Phase4/horn/soft-juice/phone GPU **unchanged**. **HOLD for Roy try**.

- **v0.9.51** (`PHONE-STABLE-CONTEXT-001`) — Mid-run WebGL guard on MOBILE_GFX: shed levels from runT/frameMs (PR/bloom/particle half-tick); sustained hot → cool-pause (no auto-resume); contextlost → sessionStorage interrupt snapshot + gfx/menu note after reload (not seamless Three restore). Module `js/webgl-guard.js`. Tests `tests/webgl-guard.test.mjs`. Desktop/balance/Phase4/horn unchanged. **HOLD for Roy phone verify** (box≠device).

- **v0.9.50** (`PHASE6-ELITE-LANE-READ-001`) — Elite charge warning lanes thicker／brighter for phone read (`ELITE_LANE` dual≈1.28／single≈1.62；opacity floor 0.58；brighter orange；y=0.09). Not a new elite／not Morph. Screenshots `tests/screenshots/phase6-elite-lane-read/`. Tests `tests/elite-lane-read.test.mjs`. **HIT-FEEL-DEVICE Complete**／Roy phone OK 2026-10-27 (still ban Phase 4／4th enemy／soft-juice invent；Active=HOLD).

- **v0.9.49** (`PHASE6-SLOT-FIRE-PULSE-001`) — Weapon-slot brief yellow `.fire-pulse` (~140ms) when that weapon fires; maps `ev.weapon` → HUD index via `slotIndexForWeapon`; no toast／balance change. Screenshots `tests/screenshots/phase6-slot-fire-pulse/`. Tests `tests/slot-fire-pulse.test.mjs`. Next: ELITE-LANE-READ (still ban Phase 4／4th enemy／soft-juice invent).

- **v0.9.48** (`PHASE6-ZONE-HUD-CHIP-001`) — Persistent in-run `#hud-zone` chip (zh-HK + EN small) with zone accent (lab teal／assembly amber／reactor violet／blockade olive／rooftop blue); updates on HUD + `zoneEnter`; pointer-events none; safe-area aware. Screenshots `tests/screenshots/phase6-zone-hud-chip/`. Tests `tests/zone-hud-chip.test.mjs`. Next: SLOT-FIRE-PULSE (still ban Phase 4／4th enemy／soft-juice invent).

- **v0.9.47** (`PHASE3-ENEMY-JAMMER-001`) — Signal Jammer ordinary enemy: mid-range → violet jam telegraph≥0.85s → fireCd mul ×1.35 ~2.5s (stack cap 1) → recover; events `telegraph kind:jammer` + `jammerPulse`; kill mid-telegraph = no apply; visual reuse fx-flash magenta — **no** new toast; waveMix light mid-late/reactor/blockade/rooftop, assembly rare, no early lab. Screenshots `tests/screenshots/phase3-jammer/`. Tests `tests/jammer.test.mjs`. **HOLD for Roy try** (3-enemy beat complete; still ban Phase 4).
- **v0.9.46** (`PHASE3-ENEMY-MEDIC-001`) — Combat Medic ordinary enemy: mid-range near wounded ordinary → lime heal telegraph≥0.7s → heal pulse (cap; ordinary-only; no player/elite/boss) → recover; soft flee alone/low/player close; events `telegraph kind:medic` + `medicHeal`; kill mid-telegraph = no heal; waveMix light mid-late/assembly/reactor/blockade, rooftop rare, no early lab. Screenshots `tests/screenshots/phase3-medic/`. Tests `tests/medic.test.mjs`. Next: another safe Phase 3 ordinary enemy OR HIT-FEEL when Roy phones (still ban Phase 4).
- **v0.9.45** (`PHASE3-ENEMY-FLANKER-001`) — Flanker ordinary enemy: arc flank → cyan dash telegraph≥0.85s → dash contact → recover → re-angle; events `telegraph kind:flanker` + `flankerDash`; no mid-telegraph kill damage; waveMix light mid-late/zones, reactor rare, no early lab. Screenshots `tests/screenshots/phase3-flanker/`. Tests `tests/flanker.test.mjs`. Next: another safe Phase 3 ordinary enemy OR HIT-FEEL when Roy phones (still ban Phase 4).
- **v0.9.44** / `f52e205` (`PHASE6-SCORE-POSITION-001`) — SCORE_POS: moveBonus(+2)/safeBonus(+3)/paceBonus(+1 cap) additive on kill; base e.score+floor(t) unchanged; over-screen 走位／安全區／清場; no mid-run toast. Tests `tests/score-position.test.mjs`. **HOLD for Roy try** (still ban Phase 4).
- **v0.9.43** / `d44af7a` (`PHASE6-TRADEOFF-CARDS-001`) — Exactly 3 trade-off cards: overclock (fireCd×0.85, armor−1), glass (+0.45 dmg, maxHp−1 floor 3), heavy_frame (armor+1, speed×0.88). Existing card numbers unchanged; floors; no new toast. Screenshots `tests/screenshots/phase6-tradeoff-cards/`. Next: HIT-FEEL-DEVICE when Roy phones (still ban Phase 4).
- **v0.9.42** / `ddf39c4` (`PHASE6-ZONE-PRESSURE-001`) — Shrinking/pollution safe zone after ~110s; safeR lerps ~30→~16 over ~200s; outside tick DoT; cyan/acid edge ring; event `zonePressure start`; exposes safeR/zonePressureActive; no new toast; ARENA/weapons/danger-pulse/bomber/artillery unchanged. Screenshots `tests/screenshots/phase6-zone-pressure/`. Next: HIT-FEEL-DEVICE when Roy phones (still ban Phase 4).
- **v0.9.41** / `3040b5e` (`PHASE6-PERIODIC-DANGER-001`) — Periodic arena red danger circles after ~80s every ~20s; telegraph≥0.9s then AoE; events `telegraph kind:dangerPulse` + `dangerPulse`; max 2 concurrent; skip pause/levelup; no new toast. Screenshots `tests/screenshots/phase6-danger-pulse/`. Next: HIT-FEEL-DEVICE when Roy phones (still ban Phase 4).
- **v0.9.40** / `2ab9dbb` (`PHASE3-ENEMY-BOMBER-001`) — Suicide bomber ordinary enemy: chase → red self ground-circle telegraph≥0.9s → AoE detonate; events `telegraph kind:bomber` + `bomberDetonate`; no mid-kill explode; waveMix light mid-late/zones, no early lab. Screenshots `tests/screenshots/phase3-bomber/`. Next: HIT-FEEL-DEVICE when Roy phones (still ban Phase 4).
- **v0.9.39** / `87eb03a` (`PHASE6-RESULT-SHARE-001`) — Over-screen 複製戰績／SHARE RUN (clipboard or navigator.share); zh-HK run line + live URL; confirm toast; no SDK. Soft-juice queue **done**. Screenshots `tests/screenshots/phase6-result-share/`. Next: HIT-FEEL-DEVICE when Roy phones (still ban Phase 4).
- **v0.9.38** / `fc61ddc` (`PHASE6-KILL-STREAK-LITE-001`) — Soft kill-streak toast「連殺 ×N」at 5/10/15 (2.2s window; reset on hurt/timeout); **feedback only — no DPS/XP economy**; skips while early toast busy; kickFx at 10+. Screenshots `tests/screenshots/phase6-kill-streak/`. Next: RESULT-SHARE then pause invention / HIT-FEEL on phone (still ban Phase 4).
- **v0.9.37** / `ea04be7` (`PHASE6-EARLY-FEEDBACK-001`) — Once-per-run first-kill toast「首殺」／FIRST BLOOD + first level-up chime/XP pulse/glow + soft first-heal micro-toast; coach-defer; `#early-toast` non-blocking. Screenshots `tests/screenshots/phase6-early-feedback/`. Next: KILL-STREAK-LITE or RESULT-SHARE; HIT-FEEL when Roy phones (still ban Phase 4).
- **v0.9.36** / `eee063e` (`PHASE6-SAFE-AREA-001`) — Notch/home-bar safe-area: `--sa-*` tokens, HUD L/R, mute/pause, stick, weapon-slots, xp L/R, beat/coach width, pause/over/level/gfx panel padding, cheap landscape. Screenshots `tests/screenshots/phase6-safe-area/` (simulated insets). Next: PHASE6-EARLY-FEEDBACK-001 or HIT-FEEL-DEVICE (still ban Phase 4).
- **v0.9.35** / `a026e1e` (`PHASE6-MUTE-PERSIST-001`) — Mute preference survives reload/next visit; early-paint + menu mute chrome + zh-HK aria; kit store already had persist — harden only. Screenshots `tests/screenshots/phase6-mute-persist/`.
- **v0.9.34** (`PHASE6-DAMAGE-NUMBERS-LITE-001`) — Floating hit/heal/hurt digits (DOM pool, throttle, mobile-light). Screenshots `tests/screenshots/phase6-damage-numbers/`.
- **v0.9.33** (`PHASE6-RUN-LOOP-UX-001`) — First-run coach tip, hurt vignette, XP bar punch, over zone+loadout. Screenshots `tests/screenshots/phase6-run-loop-ux/`.
- **v0.9.32** (`PHASE6-BANNER-TIMING-001`) — Banner short priority queue + min display; timings zone1400/elite1600/boss2600/phase900; pause zh-HK + no-auto-resume hint. Screenshots `tests/screenshots/phase6-banner-timing/`.
- **v0.9.31** (`PHASE6-LEVELUP-CARD-UX-001`) — Level-up card UX: hierarchy, contrast, larger emblems, stack n/max+bar, mobile tap targets, slot fill/swap hint. Pickup chrome shared. Screenshots `tests/screenshots/phase6-levelup-ux/`. Next was banner timing (shipped v0.9.32).
- **v0.9.30** (`PHASE6-DROP-READABILITY-001`) — Distinct ground-drop silhouettes: XP green shards, heal white+green cross pack, rare magnet blue pulse disc (applies existing util ×1.35/max 4), weapon gold board+halo. Screenshots `tests/screenshots/phase6-drop-readability/`. Next: level-up card UX polish.
- **v0.9.29** (`PHASE6-PICKUP-POLISH-001`) — Slot-fire sync (HUD≡shots) + pickup UX polish (swap highlight, convertHeal +2, keep=resume). Screenshots `tests/screenshots/phase6-pickup-polish/`. Next: XP/heal/magnet pickup readability.
- **v0.9.28** (`PHASE6-MULTI-SLOT-INVENTORY-001`) — 4-slot inventory HUD + swap-when-full. Screenshots `tests/screenshots/phase6-inventory/`. Next: pickup polish.
- **v0.9.27** (`GUN-8DIR-001`) — 8-dir gun layer (sector snap, not continuous 360°). Horn 64-cell rebake; muzzle/atlas/anchors; legs≠aim. Screenshots `tests/screenshots/gun-8dir/`. Next: multi-slot inventory OR pickup polish.
