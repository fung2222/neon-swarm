# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`。本文件只定義目前授權範圍。

## 固定工作規則

1. 每輪只執行下面 **Active task**，完成或受阻後按格式報告並停下。
2. 長期方向以 `docs/HANDOFF.md` 為準。
3. `implemented` / `tested` / `visually reviewed` / `device verified` / `not verified` 不可混用。

## Active task

**Task ID:** `PHASE6-ENDLESS-ELITES-001`  
**名稱：** Phase 6 — endless elites after boss（~90s 週期）  
**性質：** 節奏／beats 擴展；重用現有 elite／boss 類型；不改 horn、唔開 Precision／Morph、唔做手機 GPU、唔做地圖五區重做。

### 背景

- 五區地圖（v0.9.17）已齊；Roy 授權跟流程一直推，到 Phase 4／美術／§9 規則先停夾。
- BEATS-PLAN：after 6:00 → elites every ~90 s，boss every ~5 min（endless pressure）。
- 現況：`BEATS` 只有 fixed `sentinel@120`、`hunter@240`、`swarm_core@360`；`_beatCheck` 只掃靜態表；trial `TRIAL.surviveSec=480` 仍要尊重。

### 授權（收窄）

允許：

1. **Endless elite 排程：** boss 之後（t≥360 且 boss beat 已觸發／或 t 過 boss at）每隔約 **90s** 再出一隻 elite；交替重用現有 `sentinel`／`hunter`（或可配置序列），**唔好發明新 elite 剪影**。
2. **可選輕量 endless boss：** 每隔約 **5 min**（300s）再出一隻 `swarm_core`（或明確寫「本輪只做 elite、boss 週期留 Recommended next」——優先兩邊都做若工作量可控）。
3. **約束：** max one elite at a time（沿用）；elite 仍在場時延後下次排程，唔好疊兩隻；spawn pause／telegraph／reward（XP＋2 卡）沿用現有路徑；`endless:false`／trial 行為唔好壞。
4. **實作形狀：** 可擴 `BEATS` 動態生成、或 `_beatCheck` 加 endless 分支、或 `ENDLESS = { eliteEvery: 90, bossEvery: 300, startAfter: 360 }`——擇一寫清並可測。
5. 測試：t≈450／540 等會再出 elite；max one；trial 480 仍結束；回歸 beats／logic／balance；cache-bust **0.9.18**；更新 HANDOFF＋BEATS-PLAN 狀態註記。截圖可選（elite banner 再出現一次即可）。

不允許：新 elite／boss 美術類型、horn bake、Precision／Morph、手機 GPU、地圖區重做、武器大改、aim/hit 重寫、改平衡數值表（hp／dmg 表）。

### 目標

- 打過 6:00 boss 之後 run 唔會「冇 landmark」；壓力有節奏地持續。

### 完成條件

- Push＋報告；停下。Recommended next：Phase 4 Precision／美術鎖定／§9 規則夾（**do not start** — Roy 要先停夾）。

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
