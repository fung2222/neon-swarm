# HIT-FEEL-DEVICE — Roy phone playtest checklist

> **Task id:** `HIT-FEEL-DEVICE`  
> **Status:** Active · waiting Roy phone notes（2026-10-27 Asia/Hong_Kong）  
> **Live:** https://fung2222.github.io/neon-swarm/?v=0.9.50  
> **Not:** Phase 4／horn lock／phone GPU deep cuts／new systems  
> **Honest:** Box／SwiftShader ≠ device. Grok can only pre-check headless／docs.

## How to open（phone）

1. Open https://fung2222.github.io/neon-swarm/?v=0.9.50 （hard-refresh／清 cache 若見到舊版）
2. Optional flags（HANDOFF §6）：`?fps=1`（看幀）、`?lang=zh`、`?autostart=1`、`?demo=1`
3. Portrait first（通勤直向）；有空再試 landscape
4. 用 **觸控搖桿** 真拖 — 唔好只靠桌面 WASD 當驗收

## Checklist — mark OK／NG／notes

### A. 命中可靠（AIM-HIT · pillar）

| # | Check | OK? | Notes |
|---|---|---|---|
| A1 | 敵人橫向高速掠過時，MG／laser **多數打中**（唔係明顯「睇中打唔中」） | | |
| A2 | 近身（幾乎貼面）開火：子彈／槍口唔離譜、仍然打到 | | |
| A3 | **邊跑邊反向射**（run one way, shoot opposite）：腿跟移動、槍跟瞄準、仍然命中 | | |
| A4 | Sticky 目標：近距離多隻時槍唔瘋狂跳目標 | | |

### B. Hurt／輸入手感（run-and-gun contract）

| # | Check | OK? | Notes |
|---|---|---|---|
| B1 | 受傷只有 tint／紅邊／數字等回饋 — **唔打斷跑步、唔鎖死搖桿** | | |
| B2 | 單手拖移順；自動開火唔卡 | | |
| B3 | 暫停／切去背景再返：跟 v0.9.20（停住；**唔** auto-resume）合理 | | |

### C. 戰鬥可讀（spot-check clarity beat · v0.9.48–50）

| # | Check | OK? | Notes |
|---|---|---|---|
| C1 | `#hud-zone` 區域晶片（zh-HK）睇得見、唔擋操作 | | |
| C2 | 開火時對應武器格黃閃可感知 | | |
| C3 | 精英衝鋒 warning lane 手機直向夠粗／夠亮 | | |
| C4 | 危險橙紅／拾取物／主角剪影唔被地板洗白 | | |

### D. 輕記穩定（唔當本 task 修 GPU）

| # | Check | OK? | Notes |
|---|---|---|---|
| D1 | ~2–5 分鐘短局有無「繪圖暫時中斷」？次數／何時 | | |
| D2 | 明顯掉幀／發熱？（只記；唔開 GPU 深入） | | |

## Grok box vs Roy phone

| Item | Owner |
|---|---|
| `aim-hit-fast.test.mjs` PASS、docs Active、live `?v=` | Grok（done 2026-10-27） |
| Real touch hit feel／hurt／readable／crash notes | **Roy phone only** |
| Claiming `device verified` | Only after Roy OK notes |

## Report back（最短）

Reply with：裝置／瀏覽器 · A/B/C 邊項 OK／NG · 一句「打得中／打唔中」· 有無 context-loss。  
Grok／Kimi 會按 notes 標 Complete 或開細 bug task — **仍唔**自動開 Phase 4。
