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

## 狀態：PHASE6-DAMAGE-NUMBERS-LITE-001 → **complete**（v0.9.34）

**ROY（2026-10-26 ~22:22 HKT）ROY_OVERRIDE／continue：** 「好你繼續做落去佢未用得」— still on；safe usability only. Do NOT start Phase 4／horn art lock／phone GPU.

### Active this turn

**none** — last shipped: `PHASE6-DAMAGE-NUMBERS-LITE-001` → **`?v=0.9.34`**.

**Shipped behavior：**
- Hit／heal／hurt floating digits via DOM pool（`#dmg-floats`）；desktop max 16／mobile 10
- `hit` events carry `dmg`（post-mitigation）；`hurt` carries `amount`；heal `+N` green
- Per-enemy throttle ~100ms；heavy larger／yellow；frontBlock grey／「擋」；rise+fade ~0.58s
- Under HUD z-index；no DPS／xpToLevel／balance change
- Screenshots `tests/screenshots/phase6-damage-numbers/`

### Queue（recommended next — safe usability, no Phase 4）

1. **PHASE6-MUTE-PERSIST-001** OR **PHASE6-SAFE-AREA-001** — preferred next usability
2. HIT-FEEL-DEVICE（Roy 真機）— keep queued
3. Phone GPU／horn art lock — deferred／only after Roy OK

**Do NOT start：** Phase 4 Precision／Morph／horn art lock／§9／phone GPU／balance rewrite.

### Recently completed（do not re-implement）

- `PHASE6-DAMAGE-NUMBERS-LITE-001` → **v0.9.34**.
- `PHASE6-RUN-LOOP-UX-001` → **v0.9.33** (`7db11c0`).
- `PHASE6-BANNER-TIMING-001` → **v0.9.32** (`e578bae`).
- `PHASE6-LEVELUP-CARD-UX-001` → **v0.9.31**.

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
