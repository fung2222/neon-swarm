# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`。本文件只定義目前授權範圍。

## 固定工作規則

1. 每輪只執行下面 **Active task**，完成或受阻後按格式報告並停下。
2. 長期方向以 `docs/HANDOFF.md` 為準。
3. `implemented` / `tested` / `visually reviewed` / `device verified` / `not verified` 不可混用。

## Active task

**Task ID:** `HORN-BAKE-QUALITY-001`  
**Status note:** implemented 2026-10-26 — horn materials/layering + rebake v0.9.7; awaiting Roy visual accept (not final art).  
**名稱：** Phase 1 — horn 模型／材質／燈光改善＋重新 bake  
**性質：** 主角視覺品質；不改平衡、敵人、Precision／Morph、GPU 減壓。

### 背景

- Phase 0 baseline 已對齊 v0.9.6；下一步 HANDOFF Phase 1：horn 仍是臨時 blocky 美術。
- `buildPlayerMech` 是 selection＋bake 唯一來源；改模型後必須 `node tools/bake-mech-sprites.mjs --id horn --dirs 4 --frames 4 --size 256` 並檢查 anchors／muzzle。
- 手機 context loss **本輪不處理**（Roy 延後）。

### 授權

允許：

- 改善 `js/mech-builder.js` 中 **horn** 外觀：甲片層次、材質、邊緣光／自發光（人格核心青）、單角、不對稱肩、中型步槍剪影；保持身份線索。
- 必要時微調 bake 燈光／capture（`tools/bake-capture.html` 或 bake CLI）令 sheets 更清晰，唔洗白。
- 重新 bake `assets/mechs/horn/sheets/`；更新 atlas／anchors；跑 bake-player／muzzle／相關測試。
- 截圖：selection 3D + 遊戲內 idle／run／gun 對照（桌面）；cache-bust **0.9.7**。

不允許：開 Precision／Morph playable、改武器數值／刷怪、大改 GPU／bloom 政策、無關 AI 貼圖取代 buildPlayerMech、宣稱最終美術已驗收（需 Roy 肉眼）。

### 目標

- Selection 與 in-game baked sprites 同一身份，剪影／材質比現況明顯進步但仍誠實標 interim→improved pass。
- Foot baseline、muzzle anchors 正確；反向跑射回歸仍過。

### 完成條件

- Push 含模型＋sheets＋測試結果；報告前後對照；停下。

### 回報格式

```text
Task ID:
Result:
HEAD:
What changed:
Bake command:
Screenshots:
Tests:
Not verified:
Recommended next (do not start):
```
