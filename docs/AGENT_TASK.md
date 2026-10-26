# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`。本文件只定義目前授權範圍。

## 固定工作規則

1. 每輪只執行下面 **Active task**，完成或受阻後按格式報告並停下。
2. 長期方向以 `docs/HANDOFF.md` 為準。
3. `implemented` / `tested` / `visually reviewed` / `device verified` / `not verified` 不可混用。

## Active task

**Task ID:** `GLOW-RING-READABILITY-001`  
**名稱：** 普通敵人光圈減噪（戰鬥可讀性）  
**性質：** 視覺可讀性；不改平衡、武器傷害、bake、選機。

### 授權

允許：調整敵人（及必要時 NPC）地面光圈大小／透明度／是否顯示；保留精英／重型更明顯光圈；更新 cache-bust；截圖前後對照；輕量回歸測試。

不允許：改武器數值、刷怪曲線、玩家 bake、Precision／Morph 內容、借機大改粒子／bloom 全局、把 200 敵 perf 當本輪必做重測。

### 目標

- 大量普通敵人時，光圈不再「滿地霓虹」搶過剪影與子彈。
- 精英／walker／mech／chief／officer 仍可用光圈協助辨識。
- 玩家自身光圈可略保留（可讀定位），但不要加強 bloom。
- 正式 `js/sprites.js`（實際 billboard 路徑）為主；procedural `unitRing` 若仍有死碼路徑可一併對齊但不擴大範圍。

### 完成條件

- 前後截圖（同密度或壓力場景）顯示普通敵人光圈明顯變淡／變小／隱藏。
- 相關 smoke／既有 unit 測試仍過。
- 報告後停下；不開始 bake 畫質或下一輪優化。

### 回報格式

```text
Task ID:
Result:
HEAD:
What changed:
Screenshots:
Tests:
Not verified:
Recommended next (do not start):
```
