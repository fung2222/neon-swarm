# RAMPAGE MECH — Active Agent Task

> 這是下一位 agent 的唯一本輪任務入口。開始前必讀 `docs/HANDOFF.md`，本文件只定義目前授權範圍，不取代 HANDOFF 的長期方向。

## 固定工作規則

1. 每輪只執行下面 **Active task**，不要自行開始後續階段或其他優化。
2. 開始時記錄實際 HEAD、工作樹狀態與執行環境；不要假設仍是舊 SHA。
3. 保持現有可運行遊戲，不回退無關工作，不碰 `tests/screenshots/` 舊有未追蹤檔。
4. 文件、測試工具與產品程式改動必須分開報告；未獲明確批准，不要 commit。
5. `implemented`、`tested`、`visually reviewed`、`device verified`、`user reported`、`not verified` 不可混用。
6. 完成或遇到阻礙後提交報告並停下，等待下一版 `AGENT_TASK.md`。

## Active task

**Task ID:** `PERF-200-REAL-GPU-001`  
**名稱：** 200-enemy real-GPU performance baseline  
**性質：** 量測與 test-only harness；不是優化、美術或平衡任務。

### 背景

- 自動化環境已回報只能使用 ANGLE＋SwiftShader，沒有可用的硬件 GL；該環境不得產生「真 GPU」效能結論。
- Roy 桌面已回報可候選使用 NVIDIA GeForce GTX 1070 Ti＋Chrome；開始時仍要重新驗證，不可直接當成事實。
- HONOR 手機不在線；手機實機不在本任務範圍，手機模擬不可冒充實機。

### 授權範圍

允許：

- 在真正硬件 GPU 的 Chrome 環境執行量測。
- 新增 test-only harness、量測輸出與效能報告。
- 為維持可重現壓力場景，在 **測試頁／測試 runtime** 控制敵人、隨機種子或玩家存活條件，但必須完整披露。

不允許：

- 修改正式遊戲 JS／CSS、戰鬥邏輯、平衡、敵人光圈、素材或 bake。
- 趁機優化渲染、粒子、排序、HUD 或武器。
- 修改 `vendor/cyber-kit`。
- 把 SwiftShader、手機模擬、手動 fast-forward 或離線 `game.step()` 的數字當成實時硬件 FPS。
- 將舊有 `tests/screenshots/` 或本輪大量原始產物直接加入 commit。
- 未經批准 commit。

### 執行步驟

1. **確認 baseline**
   - 記錄目前 HEAD、working tree、遊戲版本與 Chrome 版本。
   - 確認文件 commit 不與本測試工具混在一起。

2. **確認是真 GPU**
   - 用 WebGL renderer 資訊記錄實際 GPU／ANGLE backend。
   - 若結果是 SwiftShader、llvmpipe、其他 software renderer，或不能確認硬件加速，立即停止並回報；不要跑一組數字補償。

3. **固定測試環境**
   - 桌面建議 viewport：1280×800，DPR 1；如無法固定，記錄實際值。
   - 使用目前遊戲預設 glow／bloom，不改畫質設定。
   - 記錄裝置、OS、GPU、driver、電源狀態，以及其他會影響結果的條件。
   - 測試時保持分頁 foreground，避免背景 throttling。

4. **建立可重現的 200-enemy 場景**
   - 必須是同一時刻約 200 個 active enemies，而不是整段累計生成 200 個。
   - 固定敵人組合、spawn 配置、random seed、玩家裝備／武器與鏡頭條件。
   - 使用正常 `requestAnimationFrame` 與正式 render path 實時運行；不可只手動 stepping 或 fast-forward。
   - 若為免玩家中途死亡而使用 test-only invulnerability／freeze 等安排，必須在報告最上方披露，並說明它對測試的影響。

5. **量測**
   - 暖機 10 秒後，連續量測 60 秒。
   - 同環境跑 3 次；如環境限制只能跑 1 次，明確標為 preliminary，不可當穩定基準。
   - 保存每輪原始 frame-time 數據，至少報告：平均 FPS、平均 frame time、p95／p99 frame time、最差 frame、超過 33.3 ms 與 50 ms 的幀數。
   - 記錄 page errors／console errors、實際敵人數範圍，以及測試期間是否仍維持目標壓力。
   - 做一次真實 pointer／touch drag 移動檢查，描述輸入是否仍有即時反應；這是觀察項目，不偽裝成精密 latency 數據。

6. **保存證據**
   - 至少一張實際壓力場景截圖，畫面需能看出敵人密度與 HUD。
   - 保存原始 JSON 或 CSV、renderer 資訊及可重現指令。
   - 截圖必須實際查看；報告有沒有黑屏、嚴重遮擋或渲染異常。

### 建議新增位置

如需要新增文件，可使用：

```text
tests/performance-200-enemies.mjs       # test-only harness / runner
tests/performance-results/             # 本地原始輸出，不預設提交
docs/PERF-BASELINE.md                  # 精簡結果、環境、方法與限制
```

實際實作可按現有測試架構調整，但不可為遷就工具而改正式遊戲。

### 完成條件

- 真 GPU 身份有明確證據，或依規則安全停止。
- 200 active enemies、正常 rAF／render path、測試時長與固定條件均可重現。
- 有原始數據、彙總數據、截圖與環境資料，沒有只給孤立的「60 FPS」。
- 正式遊戲 source、assets、bake、戰鬥平衡與光圈均無改動。
- `git diff --stat` 與新增檔案清單已列出，舊有未追蹤 screenshots 沒有被混入。
- 報告清楚區分桌面真 GPU、自動化軟件渲染與尚未驗證的手機實機。

### 回報格式

```text
Task ID:
Result: completed / blocked / preliminary
HEAD and working tree:
Real GPU evidence:
Test environment:
Harness and runtime controls:
200-enemy verification:
Run count and duration:
FPS / frame-time results:
Input and visual observations:
Errors:
Files changed / generated:
Git diff --stat:
Not verified:
Recommended next task (do not start it):
```

完成後停下。不要自行開始光圈收斂、horn bake 畫質或任何優化。
