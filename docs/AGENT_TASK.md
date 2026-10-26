# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`、`docs/BEATS-PLAN.md`（精英／boss 節奏參考）。本文件只定義目前授權範圍。

## 固定工作規則

1. 每輪只執行下面 **Active task**，完成或受阻後按格式報告並停下。
2. 長期方向以 `docs/HANDOFF.md` 為準。
3. `implemented` / `tested` / `visually reviewed` / `device verified` / `not verified` 不可混用。

## Active task

**Task ID:** `PHASE3-BOSS-SWARM-CORE-001`  
**名稱：** Phase 3 — 洪流核心 SWARM CORE（約 6:00 boss beat）  
**性質：** 內容 vertical slice；不改 horn 形狀、唔開 Precision／Morph、唔做手機 GPU、唔鋪五區地圖。

### 背景

- Phase 3 lab slice（v0.9.9）已落地：三種雜兵剪影＋ SENTINEL PRIME；Roy 手感 OK，叫繼續流程。
- BEATS-PLAN：約 **6:00** boss「洪流核心 · SWARM CORE」；trial 窗口內要能感受到。
- 現況：`BEATS` 只有 elite #1 at 120；無 boss 實體／血條／相位。

### 授權（本輪範圍要收窄到可完成）

允許：

1. **Boss 定義：** `config` 加 `BOSS`／`BEATS` entry `{ at: 360, kind: 'boss', id: 'swarm_core' }`（或等價）；單場同時最多一隻 boss。
2. **剪影：** 程序化可辨「六角核心＋環繞小 drone pod」感；**禁止只 recolor** 現有敵人；色板跟 BEATS-PLAN（暗板＋酸綠縫；**唔用紅機殼**）。
3. **三相位（HP 三分）：**
   - Orbit — 週期召喚 runner／drone 類小怪；地面 telegraph 可讀
   - Volley — 多向直線彈道；**lanes 至少提早 ~0.8s 畫出** 再傷
   - Frenzy — 短時 spawn 加壓後回復
4. **UI：** 頂部細血條＋ zh-HK 先行橫幅（`beat.boss*`）；擊殺有明確 reward（卡片選擇／分數加成擇一，寫清）。
5. **邏輯事件：** `beat`／`bossIn`／phase／telegraph 等；spawn pause 讓剪影可讀；trial 仍於 `TRIAL.surviveSec` 結束（boss 存活唔擋 trial end）。
6. 字串 zh-HK／en；`beats.test.mjs`（時序、相位、telegraph 先於傷害、trial）；相關回歸；截圖桌面＋手機；cache-bust **0.9.10**；更新 HANDOFF 狀態段。

不允許：第二精英大改、五區地圖、武器數值大改、horn bake／Precision／Morph playable、手機 GPU 專案、無關 AI 美術包。

### 目標

- 非 trial／trial 跑到 ~6:00 會出現可讀 SWARM CORE；相位與 telegraph 先於傷害。
- 誠實標：仍係 lab 地圖上的 boss beat，唔係完整五區或 endless elite 節奏。

### 完成條件

- Push＋報告＋截圖；停下。Recommended next：elite #2／地圖下一區／拾取選擇器（do not start）。

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
