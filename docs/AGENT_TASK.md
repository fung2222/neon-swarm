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

## 狀態：HOLD — awaiting Kimi independent review of AIM-HIT-FAST-002

**Completed（do not re-implement）：** `AIM-HIT-FAST-002` → **v0.9.19** / `3e3d20e`

- Precise quadratic intercept + muzzle two-stage；relative continuous collision；MG logic jitter removed。
- Evidence：`tests/aim-hit-fast.test.mjs`、`tests/aim-hit-002-shots.mjs`、`tests/screenshots/aim-hit-002/`。
- 屬**重大改動**（碰撞 update order／瞄準管線）→ 等 Kimi 審完先自動接 queue。

**Do NOT start until review clears：** Phase 4 Precision／Morph、horn 最終 art lock、§9 系列規則落地、PERF rebaseline 當「已驗收」。

### Queue（審核通過後 Grok 自動按序；常規項可連做）

1. **PHONE-STABLE-FOLLOWUP**（常規／可重大視範圍）— 跟進 mid-run WebGL「繪圖暫時中斷」；以更穩為先，唔為省電假砍可玩性。未開新 task 前只準備證據／方案，審完再寫 Active。
2. **HORN-SILHOUETTE-DIRECTION**（重大／要 Roy 肉眼）— 塊狀造型唔入 lock；等 Roy 剪影方向＋視覺 OK 先 polish。
3. **HIT-FEEL-DEVICE**（常規驗收）— Roy 真機高速橫向怪；SwiftShader ≠ device。
4. **PERF-REBASELINE**（常規量測）— 桌面／（有機則）手機 rebaseline；唔當玩法完成。
5. **CONTENT-AFTER-PILLARS** — 先命中＋穩定＋主角好看，再 Phase 4／新地圖／新武器 bulk。

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
