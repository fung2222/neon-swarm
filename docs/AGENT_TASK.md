# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`。本文件只定義目前授權範圍。

## 固定工作規則

1. 每輪只執行下面 **Active task**，完成或受阻後按格式報告並停下。
2. 長期方向以 `docs/HANDOFF.md` 為準。
3. `implemented` / `tested` / `visually reviewed` / `device verified` / `not verified` 不可混用。

## Active task

**Task ID:** `PHASE6-MAP-REACTOR-001`  
**名稱：** Phase 6 — 能源反應爐區 vertical slice（assembly → reactor）  
**性質：** 地圖／敘事分區小片；不改 horn、唔開 Precision／Morph、唔做手機 GPU、唔做五區一次做齊。

### 背景

- Assembly bay（v0.9.14）已落地；Roy 授權跟 HANDOFF 流程一直推，到 Phase 4／美術／§9 規則先停夾。
- 逃亡線：lab → assembly → **reactor** → blockade → rooftop。
- 現況：`mapZone` 只有 `lab` | `assembly`；`MAP_ZONE.assemblyAt = 195`。

### 授權（收窄）

允許：

1. **分區狀態：** 擴展 `mapZone` 至至少 `lab | assembly | reactor`。時間門檻建議 `reactorAt ≈ 285`（4:45，hunter@240 後、boss@360 前），寫清並可測。
2. **反應爐視覺（唔係只 recolor）：** 邊緣裝飾換成反應爐感（冷卻塔／電漿管／警示欄／能量柱／輻射條紋等程序化 props）；色溫偏冷紫／電青 trim（對比 assembly 暖琥珀、lab 冷 teal）；**可玩地面維持低對比暗底**；danger telegraph 色唔被裝飾搶走；**唔好紅機甲 hull**。
3. **輕量玩法理由：** reactor `waveMix` 微調（例如多 drone／mech／officer、少 staffer／guard）；唔好整新 boss／elite。
4. **UI：** 進入分區短 zh-HK 橫幅（例：「進入 · 能源反應爐」）；en 細字。
5. 測試（zone 觸發、decoration／mix 切換）；回歸；截圖 assembly vs reactor（desktop＋390）；cache-bust **0.9.15**；更新 HANDOFF（誠實標：同一 arena 換邊飾）。

不允許：blockade／rooftop（本輪）、endless elites、horn bake、Precision／Morph、手機 GPU、武器大改、aim/hit 重寫、五區一次做齊。

### 目標

- 一場 run 由組裝廠感過渡到反應爐感，肉眼分得到；核心 bullet-heaven 操作不變。

### 完成條件

- Push＋報告＋截圖；停下。Recommended next：blockade 區／endless beats（do not start in this task）。

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
