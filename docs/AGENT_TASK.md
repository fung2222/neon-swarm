# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`。本文件只定義目前授權範圍。

## 固定工作規則

1. 每輪只執行下面 **Active task**，完成或受阻後按格式報告並停下。
2. 長期方向以 `docs/HANDOFF.md` 為準。
3. `implemented` / `tested` / `visually reviewed` / `device verified` / `not verified` 不可混用。

## Active task

**Task ID:** `PHASE2-FLOOR-READABILITY-001`  
**名稱：** Phase 2 — 地板／ambient 減亮（戰鬥可讀性）  
**性質：** 視覺可讀性；不改平衡、bake 形狀、選機、GPU 減壓專案。

### 背景

- Roy：horn 形狀未定案、唔優先改機體；繼續 HANDOFF 流程。
- Phase 2 光圈減噪已做；下一步：地板與 ambient 要比敵人、子彈、拾取物暗，warning 色唔被裝飾搶。
- 手機 context loss、horn 剪影重做 **本輪不處理**。

### 授權

允許：

- 調暗可玩地板、grid、塵、邊緣裝飾亮度／對比（`view.js`／`NeonCity` 參數／相關材質）；唔改玩法碰撞。
- 確認子彈、XP／heal 等拾取、危險 telegraph（紅／橙／酸綠）仍然更搶眼。
- 前後截圖（壓力或普通戰鬥）；cache-bust **0.9.8**；輕量測試。

不允許：改 horn mesh／重 bake、武器數值、刷怪、Precision／Morph、大改 bloom 全鏈（除非地板洗白必要極小調）、再開 WebGL 減壓大改。

### 目標

- 高密度時主角／敵剪影／子彈／拾取比地板清楚。
- 報告後停下。

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

---

## Completion (this round)

**PHASE2-FLOOR-READABILITY-001 — DONE** in v0.9.8 (floor/grid/dust/edge ambient dim). Next Active task TBD by parent.
