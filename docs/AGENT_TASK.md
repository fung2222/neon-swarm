# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`。本文件只定義目前授權範圍。

## 固定工作規則

1. 每輪只執行下面 **Active task**，完成或受阻後按格式報告並停下。
2. 長期方向以 `docs/HANDOFF.md` 為準。
3. `implemented` / `tested` / `visually reviewed` / `device verified` / `not verified` 不可混用。

## Active task

**Task ID:** `PHASE6-WEAPON-PICKUP-001`  
**名稱：** Phase 6 — 武器地面拾取選擇（不可靜靜覆蓋）  
**性質：** 玩法／UI；不改 horn、唔開 Precision／Morph、唔做手機 GPU、唔做 elite #2／五區地圖。

### 背景

- Phase 3 lab＋SENTINEL＋SWARM CORE（v0.9.10）Roy OK，叫繼續流程。
- HANDOFF Phase 6：**武器拾取遇到已有裝備時要提供替換／保留／槽位選擇；不可靜靜覆蓋裝備。**
- 現況：`kind: 'weapon'` gem 只 emit `{ type: 'weapon' }` → main 只播特效，**實際唔 grant 武器**；真正武器來自 level-up cards。

### 授權（收窄到可完成）

允許：

1. **拾取決策：** 撿到武器 crate／gem 時：
   - 未擁有該武器 → 獲得（或開選擇卡確認，擇一寫清）
   - 已擁有／已滿級 → **必須**暫停並給可點選選項（例如：升級疊層／保留現狀／若設計有槽則換槽）；**禁止**無 UI 直接改 `taken`
2. **UI：** 重用／微調現有 `level-cards` 風格；zh-HK 先行；手機＋桌面可點；唔遮死虛擬搖桿到無法選。
3. **邏輯：** `pausedForLevel`（或等價）擋戰鬥至玩家選完；事件可測；primary visual aim 規則不變。
4. 測試（未擁有／已擁有／max／取消保留）；回歸 logic／levelup／beats；截圖；cache-bust **0.9.11**；更新 HANDOFF 狀態段。

不允許：新武器數值大改、elite #2、boss 重做、地圖分區、horn bake、Precision／Morph、手機 GPU。

### 目標

- 地面武器拾取變成真實選擇，唔再只係金光特效。
- 誠實標：仍係現有武器 ID 池；唔係完整庫存／多槽裝備系統（除非現有架構已有槽位）。

### 完成條件

- Push＋報告＋截圖；停下。Recommended next：elite #2／下一地圖區（do not start）。

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
