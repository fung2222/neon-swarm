# 暴走機甲 RAMPAGE MECH

> 賽博朋克子彈天堂 · cyberpunk bullet heaven · Three.js · 手機優先  
> 前身前名：NEON SWARM 霓虹洪流（repo 仍叫 `neon-swarm`）

**試玩 Play:** https://fung2222.github.io/neon-swarm/?v=0.9.145 · **狀態 Status:** v0.9.142 GAMES-JSON-STAGE-004（safe polish）

> **Phone hit-feel:** [docs/HIT-FEEL-DEVICE.md](docs/HIT-FEEL-DEVICE.md) **Complete**／`device verified`（Roy「Ok」2026-10-27）。**Safe pipeline tip:** v0.9.115 — a11y/docs sync；HARD BAN Phase4/horn/soft-juice/full ult/BALANCE/deep GPU。

## 一句 pitch
實驗室造出嚟嘅機甲啟動之後失控暴走。玩家控制呢部失控機甲，科學家同軍隊一波一波嚟捉你；生存得越耐，佢哋派嘅級別越高。  
You are the mech the lab built — and it is not going back in the cage. Scientists and soldiers hunt you; the longer you survive, the higher the tier they send.

## 三款機體 Three frames
| 機體 Frame | 特點 |
|---|---|
| **覺醒突擊型 AWAKEN** (`horn`) | 深灰＋青紫 · 均衡 · 開局護盾 +1 · Phase 1 主角切片 |
| **高速精密型 PRECISION** (`heavy`) | 預留 stub · 現行：慢 8% · 護甲 +1 |
| **可變結構原型 MORPH** (`prototype`) | 預留 stub · 現行：快 6% · 磁吸 +25% |

> Phase 1 只深切主角機選機 3D；其餘兩台係可選 stub（唔同 id／stats），**唔係**把主角機重新上色。數值一律讀 `MECHS` + `resolveMechCombat`。

## 選機 vs 遊戲內外觀 Select vs in-game (honest)
| 畫面 | 來源 |
|---|---|
| **選機 Select** | Live Three.js `buildPlayerMech`（可拖曳旋轉） |
| **遊戲內 In-game** | 暫用 `assets/sprites/mech_*.png` billboard（**interim**） |

同一 3D 來源烘焙多方向 sprite 係 Phase 3。而家**唔好**宣稱選機同遊戲內已共用烘焙圖。規格見 `docs/art-bible.md` · `docs/render-pipeline.md`。

## 敵人 Enemies
人類主導、機甲支援：研究員 → 保安 → 士兵 → 隊長 → **首席科學家**；支援單位：偵察機甲、重裝機甲、護衛機甲。掉落：**X**（經驗方塊）、**H**（修復）、**W**（武器圖示、方塊）。


## 玩法重點 Gameplay
- **每種武器射出唔同樣**：閃電菱形、尖刺、新月刃、四角星、長槍、衝擊波、光球；等級越高顏色越猛（細光環 = 已升級）。
- **掉落一律係立體方塊**：`X` 經驗（綠）、`H` 修復（青）、武器圖示（金）。
- **合約目標**：HUD 顯示仲差幾多擊殺，達標即加分並提升下一目標。
- **結算睇分數同時間**：兩張大卡顯示本局分數／存活時間，下面再列擊殺同完成合約數。
## 語言 Language
繁體中文（香港）+ English · `localStorage cyber.lang` · `?lang=en|zh`

## 技術 Tech
Three.js r169 + [cyber-kit](https://github.com/fung2222/cyber-kit) **v0.3.16**（`vendor/cyber-kit/`），純 ES modules，冇 build step。

## CYBER ARCADE
屬於 [CYBER ARCADE](https://github.com/fung2222/cyber-arcade) 系列。建議級別 **Gold**（試玩上限見 `docs/HANDOFF.md`）。暫未包裝 Capacitor。

## 開發 Development
```bash
cd /workspace && python3 -m http.server 18940
# http://127.0.0.1:18940/neon-swarm/
node tests/logic.test.mjs && node tests/levelup.test.mjs && node tests/health.test.mjs && node tests/balance.test.mjs
```
文件：[docs/art-bible.md](docs/art-bible.md) · [docs/render-pipeline.md](docs/render-pipeline.md) · [docs/asset-naming.md](docs/asset-naming.md) · [docs/HANDOFF.md](docs/HANDOFF.md) · [privacy.html](privacy.html)
