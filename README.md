# 暴走機甲 RAMPAGE MECH

> 賽博朋克子彈天堂 · cyberpunk bullet heaven · Three.js · 手機優先  
> 前身前名：NEON SWARM 霓虹洪流（repo 仍叫 `neon-swarm`）

**試玩 Play:** https://fung2222.github.io/neon-swarm/ · **狀態 Status:** v0.5.0 改名 + 三款機體 + 人類追捕（cyber-kit menu-home）

## 一句 pitch
實驗室造出嚟嘅機甲啟動之後失控暴走。玩家控制呢部失控機甲，科學家同軍隊一波一波嚟捉你；生存得越耐，佢哋派嘅級別越高。  
You are the mech the lab built — and it is not going back in the cage. Scientists and soldiers hunt you; the longer you survive, the higher the tier they send.

## 三款機體 Three frames
| 機體 Frame | 特點 |
|---|---|
| **角盔機型 HORN** | 紫綠角盔 · 均衡 · 開局多 1 點護盾 |
| **重裝機型 HEAVY** | 白藍重裝 + 肩炮 · 慢 8% · 接觸傷害 −1 |
| **原創機型 PROTO** | 原創霓虹 · 快 6% · 經驗吸取 +25% |

> 命名用中性名稱：前兩款只係**配色／剪影致敬**，冇任何商標名、logo 或原作品圖案。

## 敵人 Enemies
人類主導、機甲支援：研究員 → 保安 → 士兵 → 隊長 → **首席科學家**；支援單位：偵察機甲、重裝機甲、護衛機甲。掉落：**X**（經驗方塊）、**H**（修復）、**W**（武器圖示、方塊）。

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
文件：[docs/HANDOFF.md](docs/HANDOFF.md) · [docs/BEATS-PLAN.md](docs/BEATS-PLAN.md) · [docs/GAMES-JSON-STUB.md](docs/GAMES-JSON-STUB.md) · [privacy.html](privacy.html)
