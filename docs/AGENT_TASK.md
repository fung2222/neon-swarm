# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`。本文件只定義目前授權範圍。

## 固定工作規則

1. 每輪只執行下面 **Active task**，完成或受阻後按格式報告並停下。
2. 長期方向以 `docs/HANDOFF.md` 為準。
3. `implemented` / `tested` / `visually reviewed` / `device verified` / `not verified` 不可混用。

## Active task

**Task ID:** `MOBILE-GPU-PRESSURE-001`  
**名稱：** 手機更強 GPU 減壓（降 context loss 機率）  
**性質：** 穩定性／效能；不改武器傷害、刷怪數值、bake、選機。  
**狀態：** implemented（headless tested；**not** device verified）— v0.9.6

### 實作摘要（2026-10-26）

- `MOBILE_GFX` only：`PARTICLE_POOL` 1200、`MAX_PR` 固定 1、`burstN` ×0.4、Shockwaves 池 10。
- `kickFx` wrapper：手機 `bloomDamp` ≤0.25，trauma／slowmo ×0.5；桌面原樣 `fx.kick`。
- 普通擊殺：手機跳過 `particles.ring` + `waves.spawn`；burst 保留。精英／punch／explode／nova 仍有 ring／wave，但 kick 已削弱。
- NeonCity dust：手機 `dustArea` 28／`dustHeight` 5（桌面 48／8）。
- cache-bust **0.9.6**（`index.html` + `main.js` 註解）。無 vendor 改動；恢復 overlay 保留。

### 背景（Roy 2026-10-26）

- v0.9.5 恢復 overlay **已實機出現**（「繪圖暫時中斷」）——捕捉 OK。
- 試玩到終點附近仍觸發 context loss；需再減手機繪圖壓力，唔係再改文案。

### 完成條件

- 相關改動已 commit／push。
- Headless smoke／既有 unit 仍過。
- 真機再玩到終點 context loss 機率：**not verified**（等 Roy 再試）。

### Recommended next（do not start here）

請 Roy 實機驗證 v0.9.6：試玩到終點附近是否仍常觸發「繪圖暫時中斷」。若仍炸 GPU，另開 task 再減 bloom／敵人光效或更激進池裁切。

### 回報格式

```text
Task ID:
Result:
HEAD:
What changed:
How to verify:
Tests:
Not verified:
Recommended next (do not start):
```
