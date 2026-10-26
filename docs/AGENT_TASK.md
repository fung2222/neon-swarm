# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`、`docs/BEATS-PLAN.md`。本文件只定義目前授權範圍。

## 固定工作規則

1. 每輪只執行下面 **Active task**，完成或受阻後按格式報告並停下。
2. 長期方向以 `docs/HANDOFF.md` 為準。
3. `implemented` / `tested` / `visually reviewed` / `device verified` / `not verified` 不可混用。

## Active task

**Task ID:** `PHASE3-ELITE2-001`  
**名稱：** Phase 3 — 精英 #2（約 4:00，variant／多段 telegraph）  
**性質：** 內容 beat；不改 horn、唔開 Precision／Morph、唔做手機 GPU、唔鋪五區地圖、唔重做 boss。

### 背景

- AIM-HIT-FAST（v0.9.12）Roy OK，叫繼續流程。
- BEATS-PLAN：2:00 SENTINEL、**4:00 elite #2（variant, more segments）**、6:00 SWARM CORE。
- 現況：`BEATS` 只有 sentinel@120 + swarm_core@360；缺第二精英。

### 授權（收窄）

允許：

1. **BEATS：** `{ at: 240, kind: 'elite', id: '…' }`；沿用 max-one-elite、spawn pause、zh-HK 橫幅、擊殺 2 卡＋XP。
2. **剪影：** 與 SENTINEL **可辨不同**（例如獵殺機甲／雙段衝刺型）；程序化 mesh；**禁止只 recolor**；**唔用紅機殼**。
3. **多段節拍：** 「more segments」＝比 SENTINEL 多一段可讀壓力，例如：telegraph → charge → 短 recover → **第二段 telegraph／charge**，或雙 warning lane。每段 telegraph ≥1.2s 先傷。
4. 字串 zh-HK／en；擴充 `beats.test.mjs`（240s 觸發、多段時序、仍 max one）；回歸；截圖；cache-bust **0.9.13**；更新 HANDOFF。

不允許：endless 90s elite 循環、五區地圖、武器數值大改、horn bake、Precision／Morph、手機 GPU、改 aim/hit 核心（除非回歸）。

### 目標

- 跑到 ~4:00 出現第二精英，剪影＋多段 telegraph 與 SENTINEL 分得清。
- 誠實標：仍係 lab 地圖上嘅第二 beat，唔係新地圖區。

### 完成條件

- Push＋報告＋截圖；停下。Recommended next：下一地圖區／endless beats（do not start）。

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
