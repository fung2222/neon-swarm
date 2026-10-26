# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`。本文件只定義目前授權範圍。

## 固定工作規則

1. 每輪只執行下面 **Active task**，完成或受阻後按格式報告並停下。
2. 長期方向以 `docs/HANDOFF.md` 為準。
3. `implemented` / `tested` / `visually reviewed` / `device verified` / `not verified` 不可混用。
4. **已完成任務不可重做。** 若本文件標 **HOLD**，只准讀文件／等新任務，不准改產品程式。

## Active task

**Task ID:** `HOLD-AWAIT-ROY-REVIEW-001`  
**名稱：** 等待 Roy 進度審核（v0.9.18 交接閘）  
**性質：** 文件閘門／停工；**不是**實作任務。

### 狀態

- **HOLD。** 最新產品基準：**v0.9.18**（endless elites／boss after fixed beats）。
- 上一完成任務：`PHASE6-ENDLESS-ELITES-001`（已 push；**不要重做**）。
- 地圖五區＋endless cadence 已齊；Roy 暫停於 Phase 4／美術鎖定／HANDOFF §9 之前做進度審核。

### 授權（收窄）

允許：

1. 讀 `docs/HANDOFF.md`、`docs/PERF-BASELINE.md`、`docs/BEATS-PLAN.md` 與現有測試／截圖作審核參考。
2. 若發現文件與 `main` HEAD／live `?v=` 不一致，可只修交接文件並報告（例如舊 §11 基準號），**不要**開新功能。

不允許：

- 重做 v0.9.4–v0.9.18 任一已完成切片（含 endless elites、五區地圖、pickup、aim/hit、boss、elite、horn bake、GPU cuts）。
- 自行開始 Phase 4 Precision、Morph、horn 最終美術鎖定、§9 規則落地、手機 GPU、新武器／平衡大改。
- 在未換新 `AGENT_TASK.md` 前改正式遊戲 JS／CSS／assets。

### 完成條件

- 本 HOLD **不由實作 agent「完成」**。等 Roy（及流程／驗收方）審核後，以**新一份** `AGENT_TASK.md` 取代本檔，再開始下一刀。

### 回報格式（若只做文件對齊）

```text
Task ID: HOLD-AWAIT-ROY-REVIEW-001
Result: hold / docs-only fix
HEAD:
What changed:
Not verified:
Recommended next (do not start):
```

Recommended next（do not start）：Phase 4 Precision／美術鎖定／HANDOFF §9 — 等新 Active task。
