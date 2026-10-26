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

## 狀態：PERF-REBASELINE → **completed**（desktop v0.9.20；唔當玩法完成）

**ROY continue（2026-10-26）：** phone GPU／WebGL mid-run **deferred**；**Skip** HORN（needs eyes）；**Skip** HIT-FEEL（needs play）。本輪只做桌面 rebaseline。

### Completed this turn

**Task ID：** `PERF-REBASELINE` — live **`?v=0.9.20`** on Roy desktop **GTX 1070 Ti** / Chrome 155 / 1280×800.

- 3×（10s warmup + 60s capture）：avg FPS **~58.2–60.0**；WebGL `ANGLE (NVIDIA GeForce GTX 1070 Ti … D3D11)`；page/console errors none。
- Docs：`docs/PERF-BASELINE.md` rewritten；harness tracked＋default URL `?v=0.9.20`；small `tests/performance-results/*.json` summary only（no multi-MB dumps）。
- Headless smoke：`logic`＋`aim-hit-fast`＋`bg-pause` **PASS**；**no** gameplay code edits。
- **誠實標：** 桌面 rebaseline only；**not** phone-verified；**not** playability／HIT-FEEL／horn lock。

### Queue（**do not start without Roy**）

1. **HIT-FEEL-DEVICE**（常規驗收）— Roy 真機高速橫向怪；SwiftShader ≠ device。**← recommended next (needs Roy play)**
2. **HORN-SILHOUETTE-DIRECTION**（重大／要 Roy 肉眼）— 塊狀造型唔入 lock。
3. **CONTENT** light only if safe — **no** Phase 4 Precision／Morph bulk。
4. Phone GPU／WebGL mid-run — **deferred by Roy**。
5. （背景）AIM-HIT-FAST-002 Kimi 獨立審。

**Do NOT start：** Phase 4／horn art lock／§9 落地／phone GPU 深入／claim PERF＝玩法完成。

### Recently completed（do not re-implement）

- `PERF-REBASELINE` → desktop v0.9.20 GTX 1070 Ti（本輪）。
- `PHONE-STABLE-FOLLOWUP` → **v0.9.20**。
- `AIM-HIT-FAST-002` → **v0.9.19**／`3e3d20e`。

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
