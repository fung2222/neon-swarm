# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`。本文件只定義目前授權範圍。

## 固定工作規則

1. 每輪只執行下面 **Active task**，完成或受阻後按格式報告並停下。
2. 長期方向以 `docs/HANDOFF.md` 為準。
3. `implemented` / `tested` / `visually reviewed` / `device verified` / `not verified` 不可混用。

## Active task

**Task ID:** `AIM-HIT-FAST-001`  
**名稱：** 高速衝刺怪命中感 — 掃掠碰撞＋輕量超前瞄準  
**性質：** 手感／命中修復；不改平衡數值表、唔開新內容、唔改 horn 形狀。

### 背景

- Roy（2026-10-26）回報：精準度感覺下降，**高速怪衝向自己時子彈好像永遠打唔中**。
- 現況：
  1. 瞄準用敵人**當前位置**，無 lead（drone `speed` 3.2×chase×`speedMul` 對 MG 28 速易偏）。
  2. 子彈碰撞係點圓檢測；大 `dt`／細 hitbox 會 **tunnel** 穿過去。
  3. 槍口 `muzzleWorld` 約 ~0.9 單位前；怪貼近時子彈可能喺目標**前方**生成再飛走。
- 唔係 Phase 6 pickup 直接改壞；係既有自動瞄＋碰撞缺口，lab 多 drone 後更明顯。

### 授權（收窄）

允許：

1. **掃掠碰撞：** 子彈每幀用上一幀→本幀線段 vs 敵人圓（`b.r + e.r`）；取代／補強純點檢測。純函式可單測。
2. **輕量 lead：** MG／laser（可含其他 hitscan-ish 直射）用敵人 `vx/vz`（或 chase 方向×speed）估飛行時間，瞄預測點；clamp 勿過度超前（例如 lead 時間 cap ~0.25–0.35s）。sticky 規則保留，但可對「明顯更近／急閉合」略優先（唔好拆晒 sticky）。
3. **近距槍口：** 目標距離 < 槍口水平距＋敵半徑時，縮短 spawn 或由玩家中心偏向目標，避免子彈喺怪後方／側邊生成漏打。
4. 測試（tunnel 高速橫切、lead 命中、近距貼臉）；回歸 logic／beats／grenade／muzzle；可選簡單截圖；cache-bust **0.9.12**；HANDOFF 記一筆。

不允許：改 `PLAYER.bulletDmg`／敵人 HP 表「靠加傷害扮命中」、精英／boss 重做、地圖、horn bake、Precision／Morph、手機 GPU 專案。

### 目標

- 高速衝刺／drone 貼近時，連續 MG 明顯較易打中（唔係 100% 鎖定，但唔再「永遠打唔中」）。
- 誠實標：仍係自動瞄 bullet-heaven，唔係手動準星。

### 完成條件

- Push＋報告；停下。Recommended next：elite #2／下一地圖區（do not start），除非 Roy 再報命中。

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
