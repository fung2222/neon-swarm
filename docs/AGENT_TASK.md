# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`。本文件只定義目前授權範圍。

## 固定工作規則

1. 每輪只執行下面 **Active task**，完成或受阻後按格式報告並停下。
2. 長期方向以 `docs/HANDOFF.md` 為準。
3. `implemented` / `tested` / `visually reviewed` / `device verified` / `not verified` 不可混用。

## Active task

**Task ID:** `WEBGL-CONTEXT-LOSS-001`  
**名稱：** 手機中途白畫面／WebGL context loss 恢復與減壓  
**性質：** 穩定性；不改平衡、bake、選機、敵人內容。  
**狀態：** implemented（headless tested；**not** device verified）— v0.9.5

### 實作摘要（2026-10-26）

- Context lost：`preventDefault` → freeze loop／HUD → `#screen-gfx` 可恢復 overlay（zh-HK + EN）→「重新載入」`location.reload()`。
- Context restored：一律 `location.reload()`（Three.js textures／RT 多半已失效；唔再只 reset bloom）。
- Boot `onFatal`：遊戲側可恢復文案（暫時無法繪圖／關閉瀏覽器再開），唔再只顯示 kit「唔支援 WebGL」。
- 手機／coarse：Particles 池 2200、`maxPixelRatio` ≤1.5（細屏 1）、burst 約 ×0.6。無 vendor 改動。

### 背景（Roy 2026-10-26 實機）

- 玩到一半跳白畫面；返 CYBER ARCADE 主頁再入顯示「你的瀏覽器唔支援 WebGL」。
- 完整關閉瀏覽器再開可恢復；光圈減噪在 200 敵下他確認清晰。

### 完成條件

- 相關改動已 commit／push。
- Headless smoke／既有 unit 仍過。
- 真機再發白畫面機率：**not verified**（等 Roy 再試）。

### Recommended next（do not start here）

請 Roy 實機驗證 v0.9.5：中途白畫面是否改為可恢復 overlay；若仍炸 GPU，再考慮更進取減壓或降 bloom／敵人光效（另開 task）。

### 回報格式

```text
Task ID:
Result:
HEAD:
What changed:
How to verify:
Tests:
Not verified:
Recommended next (do not start):
```
