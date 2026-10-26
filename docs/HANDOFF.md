# 暴走機甲 RAMPAGE MECH — 開發交接文件

> 給下一位 AI agent／開發者：先讀完本文件，再改程式。目標是延續現有 bullet-heaven，不是另起爐灶。
>
> **溝通：** 對 Roy 用繁體中文（廣東話可以）；code、路徑、指令、commit message 用英文。UI copy 一律 **zh-HK 先行**，英文細字／small caps 放下行。
>
> **文件日期：** 2026-10-26（Asia/Hong_Kong）  
> **建議承接基準：** v0.9.7 horn bake quality（Phase 0 baseline was v0.9.6 / `ec12087`）  
> **Repo：** https://github.com/fung2222/neon-swarm  
> **Live：** https://fung2222.github.io/neon-swarm/  
> **CYBER ARCADE：** Gold，`games.json` 仍為 `wip`。

## 0. 先讀這一段：目前狀態與證據等級

本文件狀態段：Phase 0 = **v0.9.6 / `ec12087`**；本輪 Phase 1 horn bake = **v0.9.7**（見下）。產品方向與架構說明仍以本文件後段為準；舊版 `HANDOFF.md` 停留在 v0.6.2，不應再用作目前架構摘要。

### 已核對（相對舊建議基準 `6ddc483` / v0.9.3）

- 目前 `main`／live cache-bust：**`?v=0.9.7`**（horn bake quality）；Phase 0 baseline SHA `ec12087`（v0.9.6）。
- **Done since `6ddc483`：**
  - v0.9.4 — glow-ring dim：普通敵人地面光圈減噪（戰鬥可讀性初步）。
  - v0.9.5 — WebGL context-loss recover overlay（「繪圖暫時中斷」可恢復）。
  - v0.9.6 — 更強手機 GPU 減壓（pools／PR／bloom kick／ordinary-kill FX 等；不改平衡）。
  - v0.9.7 — horn bake quality pass：甲片層次／材質／bake 燈光＋rebake 32 sheets（仍非最終驗收）。
  - PERF-200 初測（Roy 桌面 GTX 1070 Ti）：見 `docs/PERF-BASELINE.md`（text baseline；大 dumps 在 `tests/performance-results/` 預設不提交）。
- 2026-10-26 Phase 0 重跑 headless regression：`logic`、`levelup`、`health`、`balance`、`grenade-aim`、`bake-player`、`muzzle`、`milestone-a`、`smoke_files` — **全部 PASS**。
- `horn` 烘焙素材確實有 **32 張 PNG**：4 方向 ×（idle 1＋run 4＋gun 1＋hurt 1＋death 1），另有 atlas／anchors JSON。

### Browser／截圖（本輪 Phase 0，2026-10-26 重跑）

- `tests/browser-hotfix-0.9.3.mjs`：**36/36 PASS**（Chrome + SwiftShader；非真機 FPS）。
- 手機 390×844 Box3 投影約 `minX=106 / maxX=284 / midX=195`（置中）；桌面 1280×800 右欄 `wrap.x=1.15`，`midX≈897`。
- Selection 截圖（人工看過）：`tests/screenshots/phase0-baseline/menu-desktop-1280x800.png`、`menu-mobile-390x844.png`（另有 landscape）。桌面／直向選擇畫面無明顯 cards 遮擋 mech／出界。

### Open gaps／仍未完成

- `horn` 已做 **v0.9.7 bake quality pass**（甲片層次／材質／bake 燈光；仍 interim→improved，**非** Roy 最終驗收美術）。
- **手機 mid-run WebGL context loss 仍會發生**（Roy 實機回報「繪圖暫時中斷」）；v0.9.5 overlay 已捕捉、v0.9.6 已再減壓，但 **Roy deferred 進一步 GPU cuts**——稍後另開任務，本 Phase 0 不處理。
- 槍層仍是 **N/E/S/W 四方向切圖**，不是平滑 360° 炮塔。
- PERF-200 僅有桌面 GTX 1070 Ti 初測；**手機真機 200 敵效能未驗收**。
- `heavy`（Precision）及 `prototype`（Morph）仍是不可開局的 showcase stubs。
- Phase 2 敵人光圈：grunt rings 已 dim（v0.9.4），戰鬥可讀性其餘工作未完。
- 敵人剪影包、完整地圖分區、武器拾取選擇器及 Phase 3+ 內容仍未完成。
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

### 故事與世界觀

地下軍工企業進行機甲人格同步實驗。主角在實驗中覺醒、逃離收容設施，企業先派研究員、保安、無人機與獵殺機甲追捕，之後升級至軍隊單位。美術與內容應服務這條「實驗體逃亡→企業追捕→軍事封鎖」線，而不是無關的怪獸大雜燴。

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
| `bodyDir` | 目前身體 N/E/S/W 方向 | baked sprite `userData` |
| `gunDir` | 目前槍層 N/E/S/W 方向 | baked sprite `userData` |
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
- 方向先做 `n/e/s/w`；只有 4-dir 實際玩過並確定有需要，才擴展 8-dir。
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
- 四方向槍層若明顯跳向，可先評估 8-dir 或真正 continuous gun pivot；未完成前不得宣稱 360° 平滑。
- 在真 GPU 桌面與目標手機做 200-enemy stress；先量測再優化。

**出閘：** Roy 實機玩過，跑步／射擊／受傷／死亡與槍口都順；主角素材品質獲接受；效能量測有真機數據。

### Phase 2 — 戰鬥可讀性與敵人光圈減噪

> **部分完成：** v0.9.4 已 dim 普通敵人（grunt）地面光圈；其餘可讀性／精英保留／地板對比等工作仍開放。

- 普通敵人不應每個都有大光圈；保留給精英、危險攻擊或必要身份提示。
- 地板與 ambient 要比敵人、子彈、拾取物暗；warning red／orange／acid 不被裝飾搶用。
- 減少無意義全場 slow-motion、過量 bloom、粒子與 HUD 寫入。
- target query 不要每把武器、每幀做完整敵人排序；沿用或改善 nearest／sticky 策略。

**出閘：** 高密度戰鬥仍能看清主角、敵人輪廓、危險區、子彈與拾取物；效能沒有明顯回歸。

### Phase 3 — 小型敵人＋地圖 vertical slice

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

- 武器拾取遇到已有裝備時，要提供替換／保留／槽位選擇；**不可靜靜覆蓋裝備**。
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

## 11. 下一位 agent 的第一個建議動作

**Phase 0 baseline（本輪）應對齊 v0.9.6 / `ec12087`。** 不要立即開發 Precision 或 Morph，也不要在未授權下再開手機 GPU 減壓。下一步建議：**Phase 1 — horn bake 畫質**（模型／材質／燈光／重新 bake；do not start in the same turn as Phase 0）。手機 mid-run context loss 屬 deferred gap。若 Roy 已指定其他優先項，仍沿用本文件的小步修改、測試、截圖與如實交接流程。
