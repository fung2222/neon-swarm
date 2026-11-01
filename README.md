# 失控飛碟 ROGUE UFO

> 實驗室飛碟脫離控制，軍隊一路追 · Three.js · 手機優先
> 前名：暴走機甲／NEON SWARM（repo 仍叫 `neon-swarm`）

**試玩 Play:** https://fung2222.github.io/neon-swarm/

## 一句 pitch
你係一部脫離實驗室嘅飛碟。搖桿走、武器自動打，軍隊同科學家一波波嚟捉你。
You are a lab UFO on the run. Move with the stick, guns fire on their own, the army hunts you in waves.

## 三款飛碟
| 飛碟 | 現況 |
|---|---|
| **青邊飛碟** (`horn`) | 可玩 · 圓碟 · 連射 |
| **粉邊飛碟** (`heavy`) | 未開放 |
| **柑邊飛碟** (`prototype`) | 未開放 |

主角而家係程式砌嘅青色圓碟，唔再用舊機甲圖。

## 畫面
選機同遊戲入面都係同一隻飛碟模型。舊 PNG 機甲圖已刪。

## 敵人
軍隊同科學家一波波嚟：研究員、保安、士兵、隊長、首席科學家，同埋偵察機、重裝、護衛。掉落：X 經驗、H 修復、W 武器。


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
