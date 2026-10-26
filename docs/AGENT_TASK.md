# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`、`docs/BEATS-PLAN.md`（精英節奏參考）。本文件只定義目前授權範圍。

## 固定工作規則

1. 每輪只執行下面 **Active task**，完成或受阻後按格式報告並停下。
2. 長期方向以 `docs/HANDOFF.md` 為準。
3. `implemented` / `tested` / `visually reviewed` / `device verified` / `not verified` 不可混用。

## Active task

**Task ID:** `PHASE3-LAB-SLICE-001`  
**名稱：** Phase 3 — 收容實驗室小片（剪影敵人＋一個精英 telegraph）  
**性質：** 內容 vertical slice；不改 horn 形狀、唔開 Precision／Morph、唔做手機 GPU 專案。

### 背景

- Phase 2 光圈＋地板可讀性已推；Roy 延後機體形狀與手機 context loss。
- HANDOFF Phase 3：實驗室 — 研究員、保安、drone＋一個有清晰剪影／telegraph 的精英；唔係只換色。
- 現況：`staffer`／`guard` 共用 `enemy_lime`；BEATS-PLAN 有 SENTINEL 提案未實作。

### 授權（本輪範圍要收窄到可完成）

允許：

1. **剪影區分：** 為 lab 三類（staffer／scientist 白袍退後感、guard／security 手槍追擊感、drone 小型飛行）做可辨剪影——可用程序化 mesh／新 sprite key／明顯比例差；**禁止只 recolor**。
2. **一個精英 beat：** 參考 BEATS-PLAN「哨戒長」簡化版——可讀 telegraph（地面 warning 或 ring collapse）→ 衝刺／壓力 → 恢復；zh-HK 橫幅；單場同時最多一隻精英。
3. **輕量實驗室敘事：** 邊緣裝飾／區域色溫微調（收容實驗室感），保持低對比可玩地面；唔開五張地圖。
4. 字串 zh-HK／en；測試（spawn／telegraph 時序／回歸）；截圖；cache-bust **0.9.9**。

不允許：重做 horn bake、Precision／Morph playable、武器數值大改、全套 boss SWARM CORE（留下一輪）、無關 AI 美術包塞滿。

### 目標

- 實驗室前段：三種雜兵剪影可辨；至少一次精英出現有 telegraph 先傷。
- 誠實標：仍係 vertical slice，唔係完整五區地圖。

### 完成條件

- Push＋報告＋截圖；停下。Recommended next：精英打磨／boss 或地圖下一區（do not start）。

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
