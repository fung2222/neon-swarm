# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`。本文件是唯一本輪授權範圍。
> **所有文案／任務 MD 直接 commit＋push 到 GitHub**；Roy／Kimi 在 repo 打開即可，唔使下載轉發。

## 角色與責任

- **Roy：** 產品方向、試玩、最終驗收；可下 `ROY_OVERRIDE` 繞過規則（須記錄範圍／原因）。
- **Kimi K3.1：** 流程設計、獨立檢查、bug 重現、重大改動審核；**亦可直接改程式／文件**（改完同樣寫交接）。
- **Grok bot：** 按 `HANDOFF`＋本文件 queue **自動推進**實作／測試／文件；常規工作**唔使逐項等 Kimi**。

Grok 回報的測試 ≠ Kimi 獨立驗證。兩邊都改完要記：**作者、Task ID、版本、SHA、改了甚麼、測試、截圖、未驗證、下一步**。

## 自動推進 vs 停等審核

| 類型 | 處理 |
| --- | --- |
| 常規 bugfix、補測試、文件、按現有風格 rebake、小型 UI／效能修正 | Grok 完成→測→記→接 queue 下一項；**唔等 Kimi** |
| 新機體、核心操作、渲染／烘焙管線、碰撞 update order、重大數值經濟、廣告／付費、save format、Google Play 上架 | **重大改動**：完成後停等 Kimi 審核（或 Roy 點名審） |
| 美術一致性 | 跟 art bible／剪影規則執行；方向改變先停 |
| `ROY_OVERRIDE` | 照做、記範圍；唔擅自永久改規則 |
| 兩邊同時開工 | 唔改同一批檔；分開小範圍 commit |

## 產品優先（CYBER ARCADE／暴走機甲旗艦）

Google Play 多遊戲 app；暴走機甲＝星級旗艦。體驗：**快速入局、容易單手、坐車短局、吸引力、手機穩定慳電**。  
**優先：命中可靠 → 手機穩定 → 主角好看 → 再擴內容。** 詳見 `HANDOFF.md` §1b。

---

## 狀態：PHONE-STABLE-FOLLOWUP → **completed**（v0.9.20）

**ROY continue（2026-10-26）：** Kimi rate-limited → advance past AIM-HIT HOLD；**只做**本項，**唔**開 horn。

### Completed this turn

**Task ID：** `PHONE-STABLE-FOLLOWUP` → **v0.9.20**（cache-bust `?v=0.9.20`）

- **A）** `visibilitychange` / `pagehide` → 活躍 `play` 時走同一 `pauseRun()`（等同 Esc／btn-pause）；**唔** auto-resume on visible。助手：`js/bg-pause.js`＋`tests/bg-pause.test.mjs`。
- **B）** 更強 `MOBILE_GFX` 減壓（desktop 不變）：`PARTICLE_POOL` 1200→800；永久較低 bloom；kickFx bloomDamp cap 0.25→0.18；跳過 muzzle 次要 burst、heal／wave／puddle／nova／explode rings（mobile）、elite inbound bloom kick；eliteCharge／bossVolley 無 bloomDamp。`webglcontextlost` 路徑保留「繪圖暫時中斷」＋ reload。
- **未改：** bulletDmg／HP／平衡表；AIM-HIT-FAST-002；Phase 4；horn lock；PERF「已驗收」。
- **誠實標：** Box＝SwiftShader ≠ 真機；**未**宣稱 mid-run WebGL 已在裝置修好。

**先前完成（do not re-implement）：** `AIM-HIT-FAST-002` → **v0.9.19**／`3e3d20e`（仍待 Kimi 獨立審，但不阻擋本常規穩定項）。

**Do NOT start：** Phase 4 Precision／Morph、horn 最終 art lock、§9 系列規則落地、PERF rebaseline 當「已驗收」。

### Queue（下一項 — **stop after PHONE-STABLE；唔自動開做**）

1. **HORN-SILHOUETTE-DIRECTION**（重大／要 Roy 肉眼）— 塊狀造型唔入 lock；等 Roy 剪影方向＋視覺 OK 先 polish。**← recommended next；needs Roy eyes — do not start**
2. **HIT-FEEL-DEVICE**（常規驗收）— Roy 真機高速橫向怪；SwiftShader ≠ device。
3. **PERF-REBASELINE**（常規量測）— 桌面／（有機則）手機 rebaseline；唔當玩法完成。
4. **CONTENT-AFTER-PILLARS** — 先命中＋穩定＋主角好看，再 Phase 4／新地圖／新武器 bulk。
5. （背景）AIM-HIT-FAST-002 Kimi 獨立審 — 有空再補；唔阻擋常規 queue。

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
