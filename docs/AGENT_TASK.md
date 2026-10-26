# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`。本文件只定義目前授權範圍。

## 固定工作規則

1. 每輪只執行下面 **Active task**，完成或受阻後按格式報告並停下。
2. 長期方向以 `docs/HANDOFF.md` 為準。
3. `implemented` / `tested` / `visually reviewed` / `device verified` / `not verified` 不可混用。

## Active task

**Task ID:** `PHASE6-MAP-ASSEMBLY-001`  
**名稱：** Phase 6 — 機甲組裝區 vertical slice（lab → assembly）  
**性質：** 地圖／敘事分區小片；不改 horn、唔開 Precision／Morph、唔做手機 GPU、唔做五區一次做齊。

### 背景

- Elite #2（v0.9.13）已落地；Roy 叫繼續流程。
- HANDOFF 逃亡線分區：收容實驗室 → **機甲組裝** → 能源反應爐 → 軍事封鎖 → 天台逃出。
- 現況：全程 lab 邊緣色溫＋crate／fence；未有真正「換區」敘事。

### 授權（收窄）

允許：

1. **分區狀態：** run 內可切換／推進 `mapZone`（或等價）：至少 `lab` → `assembly`。觸發可用時間門檻（建議 ~3:00–3:30 進入組裝，喺 hunter@4:00 前有感）、或擊殺／距離——擇一寫清並可測。
2. **組裝區視覺（唔係只 recolor）：** 邊緣裝飾換成組裝廠感（半完成機甲骨架、吊臂／龍門、零件托盤、警示條紋等程序化 props）；邊緣色溫可偏暖工業橙／琥珀 trim，**可玩地面維持低對比暗底**（沿用 0.9.8 原則）；danger 色（紅／橙／酸綠 telegraph）唔被裝飾搶走。
3. **輕量玩法理由：** 組裝區敵人 mix 微調（例如多啲 walker／soldier、少啲 staffer panic）或 1 個組裝主題雜兵剪影（可選，勿膨脹）；唔好整新 boss。
4. **UI：** 進入分區時短 zh-HK 橫幅（例：「進入 · 機甲組裝區」）；en 細字。
5. 測試（zone 觸發、decoration／mix 切換唔爆）；回歸；截圖 lab vs assembly；cache-bust **0.9.14**；更新 HANDOFF。

不允許：一次做齊五區、reactor／blockade／rooftop、endless elites、horn bake、Precision／Morph、手機 GPU、武器大改、aim/hit 重寫。

### 目標

- 一場 run 由實驗室感過渡到組裝廠感，肉眼分得到；核心 bullet-heaven 操作不變。
- 誠實標：仍係同一 arena 換邊飾／色溫／mix，唔係無縫大地圖。

### 完成條件

- Push＋報告＋截圖；停下。Recommended next：reactor 區／endless beats（do not start）。

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
