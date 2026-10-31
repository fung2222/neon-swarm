# Cyber Hub Art Bible — 賽博街機美術聖經

> Living hub + 機甲雷台 shared visual contract. **Locks hexes already in tip/CSS/hub** — does not invent a new brand.  
> Tip frozen at **v0.9.205** (no version bump from this doc). Deep 3D / white-run / Tripo-rig paused.  
> Related tip art: [art-bible.md](./art-bible.md) · feel spirit: [COMBAT-FEEL-REVIEW.md](./COMBAT-FEEL-REVIEW.md)  
> Grok Page (iterate-ready): ask bot for Cyber Hub Art Bible canvas link.

**Roy 決策（2026-10-31）：** 「開始著手全部都搞」——下一 unlock = 固定 colorboard + silhouette rules。優先 cyber hub 短休閒，統一 neon／gunmetal；剪影清晰優先過幼細 3D；搞笑誇張但有力量 OK；hub + 機甲雷台共用同一色板同線條語言。

---

## 1. 目的／範圍 Purpose & scope

呢份 bible 係 Cyber Hub（賽博街機短休閒）同機甲雷台（standalone fighter）嘅共用視覺合約。目標係鎖死已經喺 tip／CSS／hub 入面用緊嘅色同剪影語言。

| 項 | 內容 |
|---|---|
| 共用範圍 | Hub 短遊 UI／sprite／thumb + 機甲雷台 palette／line language |
| Tip 狀態 | neon-swarm 凍結 **v0.9.205** COMBAT-FEEL-V1 — 除非 bible 明文 reuse，否則 tip art／balance 唔動 |
| 暫停 | Deep 3D chase、white-run 深化、Tripo／Mixamo-first rig pipeline |
| 優先 | 固定 colorboard + silhouette → 再用呢套 bible 做一隻 hub demo 短遊 |
| Fun pillars | 射擊／連擊重量感 + kill 爽感；短局 ~1 分鐘有高潮；解鎖霓虹玩具 |
| 產品主人 | Roy（粵語 PO）— 標題可 zh-Hant；hex 保持英文可讀 |

---

## 2. 色板 Colorboard（鎖定現有 hex）

來源：`docs/art-bible.md`、`css/game.css`、cyber-arcade hub（`#05010f` / `#00e5ff` / `#ff2bd6`）。

### 核心 10 色（locked）

| 角色 Role | Hex | 來源／用途 Source |
|---|---|---|
| Primary bg | `#05010f` | body／arena／hub 底 — near-black violet plate |
| Gunmetal plate | `#1a1e28` | 主角炭灰裝甲（art-bible charcoal plate） |
| Gunmetal mid | `#2a303a` | 裝甲層次／accent plates |
| Neon cyan | `#00e5ff` | `--player-cyan`／`--weapon-primary`／visor／chest core |
| Cyan soft | `#7ad7ff` | `--player-cyan-soft` muzzle／secondary beam |
| Neon magenta | `#ff2bd6` | `--player-pink`／`--weapon-secondary`／rampage seam |
| Accent warn | `#ff3b5c` | 危險／受傷讀（telegraph 唔搶玩家 cyan） |
| Accent acid | `#7cff3a` | hazard／OK／acid trim（`--warn-acid`） |
| UI label | `#9a93bf` | `--hud-chip-label` 次要字 |
| UI text | `#e8ffff` | 主讀字／亮文（tip HUD cyan-white） |

### 輔助色（可用，唔升主 brand）

| 角色 | Hex | 注意 |
|---|---|---|
| Throw／reward gold | `#ffb428` / `#ffe600` | 武器 throw／goal chrome — 唔好當主裝甲色 |
| Warn orange | `#ff9a1f` | 爆炸預覽／blast radius |
| Violet（非主角） | `#8b3dff` | 敵／electric tier only — **唔**做 horn／hub 主角主色 |
| Charcoal accent | `#1e242e` | 細板層次 |

### Do / Don't

**Do**

- 底永遠近黑 `#05010f`，裝甲 gunmetal，trim 用 cyan／magenta
- 霓虹只做 visor／chest core／joint trim — 唔整 mesh 發光
- 玩家能量讀 cyan；危險讀 warn／acid；兩者唔互換
- Hub thumb／機甲雷台／tip UI 共用同一套 hex
- Bloom 只做 restrained rim，唔洗白 cyan tracer

**Don't**

- Invent 新主色或 pastel soft UI
- 紫／violet 當主角主 identity（Roy：炭灰＋青）
- 全畫面 neon bloom wash 食晒裝甲色
- 用地板／裝飾偷 warn 紅／acid 綠
- 為單一小遊戲另開無關 art style

---

## 3. 剪影規則 Silhouette

風格優先：**silhouette clarity over fine 3D**。喜劇誇張、有力量感 OK；一眼要讀到角色／武器／威脅。

1. **手機尺寸可讀** — 約 64–96 px 高仍分到頭／肩／武器／背包；唔靠微 rivet
2. **粗輪廓優先** — 厚 outline／硬邊剪影 > soft painterly edge；遠距一 silhouette 讀完
3. **誇張比例 OK** — 大肩、長肢、大武器、清楚 core — 搞笑但仍然「勁」
4. **主角可讀 cues（reuse tip）** — 單角天線、cyan chest personality core、不對稱肩甲、中距槍（art-bible §4）
5. **敵人唔靠換色** — 攻擊職能要用形狀差，唔係 hue-only swap

**拒塊狀玩具讀：** 唔鎖舊 cube-stack／塊狀共用體型。方向係日系精修機甲 + cyberpunk mil-tech：人形比例、肢長於軀幹、銳角板件。

---

## 4. 線條與形狀 Line & shape

| 項 | 規則 |
|---|---|
| 邊 | Hard edges、清楚 panel seams；少圓潤軟邊 |
| Neon trim 位置 | Visor slit、chest core、關節環、武器 trace — cyberpunk trim，唔係 whole-mesh glow |
| 裝甲 | Gunmetal matte plate + 薄 cyan／magenta edge；層次用 `#1a1e28`→`#2a303a` |
| Rampage／特殊 | Seam 由 cyan `#00e5ff` → magenta `#ff2bd6` |
| Hub + 機甲雷台 | 同一 panel／trim 文法；fighter 可以更重影、hub 更簡，但色同線條唔分家 |

Dim-arena：可玩地板同 ambient 要比子彈、敵人、pickup **更暗**；優先降地板 albedo，唔好靠抬 bloom。

---

## 5. 允許 vs 禁止 Allowed / banned

### Allowed

- 2D／簡化 3D 剪影、粗線、誇張有力造型
- 鎖定色板上嘅 neon toys／解鎖物／thumb
- Reuse tip charcoal+cyan 語言同 COMBAT-FEEL V1 呈現精神
- 短局 arcade／shoot／combo 讀法清晰嘅 FX
- Hub 同機甲雷台共享 palette／line（產品可分，美術唔分家）

### Banned

- Photoreal 3D chase／白模跑圖當主交付
- 新開無關 art style（二次元軟、水彩、擬真軍事貼圖）
- Pastel soft UI 或亮灰底
- Mixamo-first／Tripo-rig 當 hub 主 pipeline
- Bump tip version 或重開 tip balance／§9 lock 聲稱
- 全 mesh emissive glow、bloom wash、warn 色當裝飾

---

## 6. 動感／手感 hooks

對齊 COMBAT-FEEL-V1 精神，**唔重開 tip balance**：重量感來自短 muzzle、可讀 hit、清楚 kill pop — 唔靠改數值。

- **Weighty hits：** 短而亮嘅 cyan muzzle／hit spark；puppet／sprite 有可見 kick，唔靠全屏白閃
- **Kill read：** 普通擊殺要有短 pop + 少量 scrap；elite 先至用大 punch package
- **Combo：** streak／連擊係反饋高潮（toast／細 kick），唔偷偷加 DPS
- **短局高峰：** 約 1 分鐘內有可感峰值（波次、玩具解鎖、殺意高潮）
- **禁：** 每槍全屏 flash、每殺 camera trauma、抬 bloom 食色

---

## 7. 新資產驗收 Checklist

狀態截至 2026-10-31（Asia/Hong_Kong）。任一新資產（AI 或手繪）必須過：

- [ ] 只用鎖定 colorboard hex（主色唔偏離）
- [ ] 手機縮圖／64–96 px 剪影一眼可讀
- [ ] Neon 只喺 visor／core／joints／weapon trim
- [ ] Hard edge＋panel seams；無 soft pastel
- [ ] 危險色唔同玩家 cyan 撞車
- [ ] 風格同 hub／機甲雷台線條語言一致
- [ ] 唔引入 photoreal／Mixamo-first／新 art style
- [ ] 若 reuse tip：無 bump version、無改 balance
- [ ] Kill／hit 讀法清楚（短 pop，唔洗畫面）
- [ ] Roy 肉眼 OK 先當 lock（唔自稱 §9）

---

## 8. 批准後下一步 Next

Roy 批准呢份 bible 之後：做**一隻** hub demo 短遊，只用呢套色板＋剪影，唔開深 3D pipeline，唔動 tip v0.9.205。

| 項 | 內容 |
|---|---|
| **候選 Demo** | **霓虹掃射 Neon Sweep** — 約 60 秒單手 arena shoot；cyan tracer＋gunmetal 敵影；kill pop／短 combo 高峰；解鎖一個 neon toy |
| 點解呢個 | 對齊 hub ethos（短 shoot／arcade）同 fun pillars；最快驗證 colorboard＋silhouette 係咪夠玩 |
| 明確唔做 | white-run 深化、Tripo-rig、tip version bump、機甲雷台當 hub 休閒塞入 |

---

*Docs-only add. Tip version remains v0.9.205. Does not replace [art-bible.md](./art-bible.md) for tip combat lore — this is the hub unlock contract.*
