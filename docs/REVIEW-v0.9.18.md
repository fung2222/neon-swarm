# 暴走機甲 v0.9.18 獨立進度審核

**審核日期：** 2026-10-26  
**審核基準：** `efaf1de65362fa0feed7e5ae40d4d127f7b8c969`  
**Live 版本：** `?v=0.9.18`，已核對與 `main` 相同版本線。

## 角色與責任

| 角色 | 名稱 | 責任 |
|---|---|---|
| 產品方向／最終取捨 | Roy | 決定美術方向、操作手感、優先次序與最終接受 |
| 流程設計／獨立審核／除錯 | **Kimi K3.1** | 設計工作流程、審查 source 與證據、重現 bug、界定修正範圍、撰寫審核與任務文件 |
| 實作／修改 | **Grok bot（Grok 4.7；名稱按 Roy 提供記錄）** | 按 Active task 修改程式與素材、執行測試、提交如實報告 |

**證據規則：** Grok 自己跑的測試是實作方測試；Kimi 重跑／重現後才列為本次獨立審核證據；Roy 真機試玩是產品驗收，三者不可混寫。

## 總結

v0.9.3 → v0.9.18 的實作進度很多，核心 bullet-heaven 與共用管線仍在，沒有改成其他類型。headless regression 全通過，已有截圖亦證明多個系統確實接入場景。

但目前應判定為 **「功能大幅擴充，需要一次修正與穩定性收斂」**，不宜直接開 Precision。最優先是高速移動目標命中問題；手機 WebGL context loss 仍未解決；主角目前外形亦未跟從原本參考 PNG 的修長日式機甲剪影。

## 本次實際完成的審核

- 核對 GitHub `main`：`efaf1de`，訊息為 v0.9.18 endless elites／boss。
- 核對 live `index.html` 與 `js/main.js`：均為 v0.9.18。
- 檢查 v0.9.3 → v0.9.18 的 source、tests、docs、烘焙素材及截圖。
- 重新執行 12 個 headless test files：`logic`、`levelup`、`health`、`balance`、`grenade-aim`、`bake-player`、`muzzle`、`milestone-a`、`aim-hit-fast`、`weapon-pickup`、`beats`、`map-zone`，全部 PASS；`smoke_files.py` 亦 PASS。
- 人工查看 horn、lab、Sentinel、Hunter、Swarm Core、武器拾取、五區及手機截圖。
- 以現行 `Game` 另寫高速橫向目標重現，確認現有測試漏掉高速小目標與相對運動碰撞。
- 本次完整 browser-hotfix 在審核環境的 SwiftShader 下逾時，**沒有獨立重跑完成 36/36，不作通過或失敗結論**；這不影響上述 headless PASS，但 browser 證據仍要分清來源。

## 已確認的產品進度

| 範圍 | 實際狀態 | 審核意見 |
|---|---|---|
| 普通敵人光圈／地板 | v0.9.4／0.9.8 已減光、減地板干擾 | 方向正確；高密度與手機仍須看實機 |
| GPU 減壓／context loss | v0.9.5／0.9.6 有減壓與恢復 overlay | **不是根治**；恢復後 hard reload，run 不能視作無縫恢復 |
| horn bake | v0.9.7 重新調模型、材質、燈光並輸出 32 cells | pipeline 有效；外形仍未達原本參考風格 |
| Lab／Sentinel | 有角色差異、telegraph→charge→recover | 已落地，不只是文件 |
| Swarm Core | HP 三相位、volley 預警、血條、獎勵 | 已有系統與測試；實際平衡仍需長 run |
| 武器拾取 | 獲得／升級／保留／滿級修復，共用卡片路徑 | 符合不可靜靜覆蓋裝備 |
| v0.9.12 aim/hit | 有近似 lead、子彈線段掃掠、近距 muzzle | **高速橫向小目標仍有明顯缺口，見 P0** |
| Hunter | 雙段衝刺、雙 warning lanes、recover | 已落地；高速命中問題直接影響這類戰鬥 |
| 五個地圖分區 | 同一 arena 更換邊飾、trim、waveMix、橫幅 | 不是無縫大地圖；技術進度成立，環境豐富度仍初步 |
| Endless | 90 秒 elite、300 秒 boss、存活時延後 | 排程與測試存在；未證明長期節奏好玩 |
| Precision／Morph | 仍鎖定 | 正確；目前不應偷開 |

## P0 — 高速怪命中仍需修正

### 使用者症狀

子彈在高速怪側邊飛過，往往目標轉向時才命中。此現象與本次 source 審查及重現一致，不是單純視覺錯覺。

### 目前三個技術缺口

1. **近似 lead 不是精確攔截解。**  
   `leadAimDir()` 只用 `currentDist / bulletSpeed` 估時間，再 clamp 到 `0.30s`；高速橫向目標需要解子彈與目標同時移動的 intercept。距離、目標速度及 muzzle offset 都會帶來側向誤差。

2. **掃掠只考慮子彈移動，沒有考慮敵人同時移動。**  
   現在 projectile loop 在 enemy movement 之前，使用：
   `bullet previous→current` 對 `enemy current circle`。  
   這能解子彈穿牆式 tunneling，但不能完整覆蓋雙方同時移動的交叉。已用解析案例確認：舊位置與新位置的靜態圓測試都 false，相對運動掃掠為 true。

3. **MG 實彈有隨機角度 jitter。**  
   `_fireMg()` 使用約 `0.08rad` jitter；對細小高速目標，隨機散佈會進一步放大預測誤差。自動瞄準的邏輯彈道不宜讓視覺散射抵消命中解。

### 獨立重現結果

測試使用現行 v0.9.18 `Game`，固定 seed、單一目標、垂直恆速衝刺、只計衝刺時發射的 MG，並等子彈全部解決；不是正常生存模式的命中率。

| 條件 | 目前結果 |
|---|---|
| 速度 4／7、半徑 0.3、60 Hz、無 jitter | 5 發中 5 |
| 速度 9.5、半徑 0.3、60 Hz、無 jitter | 5 發中 4 |
| 速度 10.8、半徑 0.3、60 Hz、無 jitter | 5 發中 3 |
| 速度 14、半徑 0.3、60 Hz、無 jitter | 5 發中 2 |
| 速度 10.8、半徑 0.24、60 Hz、無 jitter | 5 發中 3 |
| 速度 10.8、半徑 0.24、30 Hz、無 jitter | 4 發中 2 |
| 速度 10.8、半徑 0.68、60／30 Hz、無 jitter | 全部命中 |

這證明 **速度、目標半徑與 frame step 會改變結果**；現有低速正面測試不足以保證高速橫向命中。上述數字是診斷基線，不是正式遊戲平衡目標。

### 修正方向

下一份 Active task 應要求：

- 先加入會在 v0.9.18 失敗的高速橫向／相對掃掠 regression。
- 使用精確 quadratic／iterative intercept，處理無正解與最大射程，不再依賴簡單 `0.30s` cap。
- 檢查從 player 而非實際 muzzle 計算帶來的誤差；必要時做 muzzle-origin 二次求解。
- 保存 enemy previous position，使用 bullet 與 enemy 的相對掃掠，或等價的 continuous collision。
- 檢查 MG 實彈 jitter；可保留視覺微散，但不可破壞自動瞄準命中。
- 不得用放大 hitbox、降低敵速、提高傷害或 global slow-motion 隱藏問題。

## P1 — 穩定性與效能證據未跟上內容增長

- Roy 手機 mid-run context loss 仍有回報；v0.9.5／0.9.6 是恢復與減壓，不是已根治。
- `docs/PERF-BASELINE.md` 是 **v0.9.3** 的桌面初測，不是 v0.9.18。
- 舊初測即使排除超長 stall，也只有約 28–46 FPS，且三輪差異很大；不可稱為穩定 60 FPS。
- v0.9.9–0.9.18 加了很多敵人、boss、hazard 與地圖邊飾，應在高速命中修正後重新做目前版本的真 GPU baseline；手機另列實機驗收。

## P1 — 主角外形：管線正確，但視覺來源不是舊參考圖

目前事實：

- selection live 3D 與 gameplay baked PNG **彼此一致**。
- 它們共同來自 `js/mech-builder.js` 的程序化模型。
- 它們**不是**從舊 `assets/sprites/mech_*.png` 的外形直接生成。

舊參考是修長、窄肩、長腿、銳角日式機甲；目前模型是大方肩、方塊軀幹、厚重青色腳件。Roy 認為目前總圖貼肉酸是有實際外形差異根據的。

這屬之前已延後的美術定稿工作，不是現在要推翻整條管線。建議在 Precision 前做一次 horn art lock：

1. Roy 確認是否以舊 PNG 為主要 silhouette 參考。
2. 若確認，重建 `buildPlayerMech` 的比例、肩甲、頭、胸、腿與武器輪廓，或製作真正 GLB。
3. 由同一模型重新輸出 selection 與 4-dir bake。
4. 不可以把單張舊 PNG 當成已擁有四方向模型；也不可 selection 用舊圖、gameplay 繼續用不相符方塊。

## P2 — 地圖與視覺驗收仍需加強

- 五區目前主要是同一 arena 的邊緣 props＋色溫＋waveMix，不是完整無縫地圖；HANDOFF 有誠實標註，這點正確。
- 截圖中的地面與邊飾很暗，很多 props 只在畫面邊緣出現；可讀性有改善，但地區身份與環境豐富度未到最終品質。
- 多個 `phase*-shots.mjs` 是**截圖工具**，不是嚴格 browser assertion；部分只打印 page errors，即使有 errors 仍可能輸出 `shots OK`。不可把這些輸出當作完整自動化驗收。
- v0.9.7 之後應補新的手機 selection／gameplay 截圖；舊 phase0 手機圖不能證明新 bake 在手機上光度與比例正確。

## P2 — 文件需要收斂

- `HANDOFF.md` 頂部已到 v0.9.18，但 §11 仍寫 v0.9.13／PHASE3-ELITE2-001，明顯過時。
- `AGENT_TASK.md` 是已完成的 v0.9.18 任務，必須更換，避免下一位重做。
- `render-pipeline.md` 仍寫 builder 在 `view.js`、局內只是 interim PNG、bake 是 dry-run stub。
- `milestone-b-asset-contract.md` 與 `art-bible.md` 亦有舊 Phase 1 狀態；藝術原則可保留，但狀態段要更新或明確標成歷史。
- 角色分工與審核證據邊界應寫入 HANDOFF，避免實作方自己的 PASS 被當成獨立審核。

## 建議次序

1. **v0.9.19 候選：高速目標 intercept＋relative swept collision，只修這個 bug。**
2. 重跑完整 regression、真實 browser 高速戰鬥與 Roy 試玩。
3. 對修正後版本重新做真 GPU baseline；手機 context loss 另開專項，不夾在命中修正。
4. horn art lock：決定舊參考圖要保留哪些比例與剪影，再修模型＋rebake。
5. 補目前版本手機截圖與真正有 assertion 的 browser checks。
6. 上述收斂後，才決定是否開始 Precision；不要同時開 Morph 或更多地圖內容。
