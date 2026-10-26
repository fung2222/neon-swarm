# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`。本文件只定義目前授權範圍。

## 固定工作規則

1. 每輪只執行下面 **Active task**，完成或受阻後按格式報告並停下。
2. 長期方向以 `docs/HANDOFF.md` 為準。
3. `implemented` / `tested` / `visually reviewed` / `device verified` / `not verified` 不可混用。

## Active task

**Task ID:** `PHASE6-MAP-ROOFTOP-001`  
**名稱：** Phase 6 — 天台逃出區 vertical slice（blockade → rooftop）  
**性質：** 地圖／敘事分區小片；不改 horn、唔開 Precision／Morph、唔做手機 GPU、唔做五區一次做齊。

### 背景

- Blockade（v0.9.16）已落地；Roy 授權跟流程一直推，到 Phase 4／美術／§9 規則先停夾。
- 逃亡線：lab → assembly → reactor → blockade → **rooftop**（最後一區）。
- 現況：`mapZone` 至 `blockade`；`blockadeAt = 420`；boss @360。

### 授權（收窄）

允許：

1. **分區狀態：** 擴展 `mapZone` 至五區齊：`lab | assembly | reactor | blockade | rooftop`。時間門檻建議 `rooftopAt ≈ 510`（8:30，blockade 之後），寫清並可測。
2. **天台視覺（唔係只 recolor）：** 邊緣裝飾換成天台／夜空逃出感（天線／通風口／直升機停機坪剪影／矮欄杆／遠方城市光點／夜空冷色邊緣等程序化 props）；色溫偏夜藍／冷白 trim（對比前四區）；**可玩地面維持低對比暗底**（可略偏瀝青灰，仍低對比）；danger telegraph 色唔被裝飾搶走；**唔好紅機甲 hull**；唔好加會挡視線嘅高 props。
3. **輕量玩法理由：** rooftop `waveMix` 微調（多 drone／mech／chief、少 staffer；天空壓迫感）；唔好整新 boss／elite（endless 另開）。
4. **UI：** 進入分區短 zh-HK 橫幅（例：「進入 · 天台逃出區」）；en 細字。
5. 測試（zone 觸發、decoration／mix；五區時間序）；回歸；截圖 blockade vs rooftop（desktop＋390）；cache-bust **0.9.17**；更新 HANDOFF（誠實標：同一 arena 換邊飾，五區敘事齊）。

不允許：endless elites（本輪）、horn bake、Precision／Morph、手機 GPU、武器大改、aim/hit 重寫、真正無縫大地圖。

### 目標

- 逃亡線五區邊飾／色溫／mix 齊；肉眼分得到天台；核心操作不變。

### 完成條件

- Push＋報告＋截圖；停下。Recommended next：endless ~90s elites after boss（do not start in this task）。

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
