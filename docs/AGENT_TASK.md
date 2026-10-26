# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`。本文件只定義目前授權範圍。

## 固定工作規則

1. 每輪只執行下面 **Active task**，完成或受阻後按格式報告並停下。
2. 長期方向以 `docs/HANDOFF.md` 為準。
3. `implemented` / `tested` / `visually reviewed` / `device verified` / `not verified` 不可混用。

## Active task

**Task ID:** `PHASE0-BASELINE-001`  
**名稱：** Phase 0 — 對齊目前 main／重跑 baseline  
**性質：** 確認可運行基準；不改玩法、美術、平衡。

### 背景

- Live／main 已至 v0.9.6（`ec12087`）：光圈減噪、WebGL 恢復 overlay、手機 GPU 減壓。
- Roy：手機中途仍會「繪圖暫時中斷」——**本輪不處理**，記入 Not verified／HANDOFF gap，稍後再開任務。
- HANDOFF 建議承接仍寫 v0.9.3／`6ddc483`；需對齊現況後再進 Phase 1 horn 畫質。

### 授權

允許：

- 更新 `docs/HANDOFF.md` 狀態段：目前 HEAD／版本、已做項目（glow、perf 初測、webgl recover）、未完成（手機 context loss、horn 臨時美術）。
- 重跑 headless 全套相關測試；若環境允許重跑 `tests/browser-hotfix-0.9.3.mjs`（或記明 skip 原因）。
- 截圖：桌面 1280×800、手機直向 390×844 選擇畫面（必要時 gameplay 一幀）；人工看有無出界／遮擋。
- 輕量 commit／push 文件＋截圖路徑說明。

不允許：改 `js/` 玩法／美術／減壓邏輯（除非測試明顯壞掉且屬回歸修復）、開始 horn bake 畫質、再開 GPU 減壓、Precision／Morph。

### 目標

- 有可重現的目前基準：SHA、測試結果、截圖、未驗證清單（含 deferred GPU）。
- HANDOFF 不再誤導下一位 agent 以為仍停在 v0.9.3-only。

### 完成條件

- 報告含測試表、截圖、HANDOFF 更新摘要。
- 報告後停下；Recommended next 建議 Phase 1 horn bake 畫質（do not start）。

### 回報格式

```text
Task ID:
Result:
HEAD:
What changed:
Tests:
Screenshots:
Not verified:
Recommended next (do not start):
```
