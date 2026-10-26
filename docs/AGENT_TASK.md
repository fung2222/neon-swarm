# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`。本文件只定義目前授權範圍。

## 固定工作規則

1. 每輪只執行下面 **Active task**，完成或受阻後按格式報告並停下。
2. 長期方向以 `docs/HANDOFF.md` 為準。
3. `implemented` / `tested` / `visually reviewed` / `device verified` / `not verified` 不可混用。

## Active task

**Task ID:** `PHASE6-MAP-BLOCKADE-001`  
**名稱：** Phase 6 — 軍事封鎖區 vertical slice（reactor → blockade）  
**性質：** 地圖／敘事分區小片；不改 horn、唔開 Precision／Morph、唔做手機 GPU、唔做五區一次做齊。

### 背景

- Reactor（v0.9.15）已落地；Roy 授權跟流程一直推，到 Phase 4／美術／§9 規則先停夾。
- 逃亡線：lab → assembly → reactor → **blockade** → rooftop。
- 現況：`mapZone` = `lab | assembly | reactor`；`reactorAt = 285`；boss SWARM CORE @360。

### 授權（收窄）

允許：

1. **分區狀態：** 擴展 `mapZone` 至 `lab | assembly | reactor | blockade`。時間門檻建議 `blockadeAt ≈ 420`（7:00，boss@360 之後），寫清並可測。
2. **封鎖區視覺（唔係只 recolor）：** 邊緣裝飾換成軍事封鎖感（路障／沙袋／鐵絲網／裝甲車殘骸／崗哨／迷彩／鋼灰 barricades 等程序化 props）；色溫偏鋼灰／軍綠 trim（對比 reactor 紫青、assembly 琥珀、lab teal）；**可玩地面維持低對比暗底**；danger telegraph 色唔被裝飾搶走；**唔好紅機甲 hull**。
3. **輕量玩法理由：** blockade `waveMix` 微調（多 soldier／officer／chief／mech、少 staffer／drone panic）；唔好整新 boss／elite。
4. **UI：** 進入分區短 zh-HK 橫幅（例：「進入 · 軍事封鎖區」）；en 細字。
5. 測試（zone 觸發、decoration／mix）；回歸；截圖 reactor vs blockade（desktop＋390）；cache-bust **0.9.16**；更新 HANDOFF。

不允許：rooftop（本輪）、endless elites、horn bake、Precision／Morph、手機 GPU、武器大改、aim/hit 重寫、五區一次做齊。

### 目標

- 一場 run 由反應爐感過渡到軍事封鎖感，肉眼分得到；核心 bullet-heaven 操作不變。

### 完成條件

- Push＋報告＋截圖；停下。Recommended next：rooftop 區／endless beats（do not start in this task）。

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
