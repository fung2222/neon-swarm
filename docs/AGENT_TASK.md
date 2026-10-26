# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`。本文件是唯一本輪授權範圍。
> **所有文案／任務 MD 直接 commit＋push 到 GitHub**；Roy／Kimi 在 repo 打開即可，唔使下載轉發。

## 角色與責任

- **Roy：** 產品方向、試玩、最終驗收；可下 `ROY_OVERRIDE` 繞過規則（須記錄範圍／原因）。
- **Kimi K3.1：** 流程設計、獨立檢查、bug 重現、重大改動審核；**亦可直接改程式／文件**（改完同樣寫交接）。
- **Grok bot：** 按 `HANDOFF`＋本文件 queue **自動推進**實作／測試／文件；常規工作**唔使逐項等 Kimi**。

Grok 回報的測試 ≠ Kimi 獨立驗證。兩邊都改完要記：**作者、Task ID、版本、SHA、改了甚麼、測試、截圖、未驗證、下一步**。

## 自動推進 vs 停等審核

| 類型 | 處理 |
| --- | --- |
| 常規 bugfix、補測試、文件、按現有風格 rebake、小型 UI／效能修正 | Grok 完成→測→記→接 queue 下一項；**唔等 Kimi** |
| 新機體、核心操作、渲染／烘焙管線、碰撞 update order、重大數值經濟、廣告／付費、save format、Google Play 上架 | **重大改動**：完成後停等 Kimi 審核（或 Roy 點名審） |
| 美術一致性 | 跟 art bible／剪影規則執行；方向改變先停 |
| `ROY_OVERRIDE` | 照做、記範圍；唔擅自永久改規則 |
| 兩邊同時開工 | 唔改同一批檔；分開小範圍 commit |

## 產品優先（CYBER ARCADE／暴走機甲旗艦）

Google Play 多遊戲 app；暴走機甲＝星級旗艦。體驗：**快速入局、容易單手、坐車短局、吸引力、手機穩定慳電**。  
**優先：命中可靠 → 手機穩定 → 主角好看 → 再擴內容。** 詳見 `HANDOFF.md` §1b。

---

## 狀態：HORN-SILHOUETTE-DIRECTION → **completed interim**（v0.9.21；**HOLD for Roy 肉眼**）

**ROY direction（2026-10-26）：** 「我要機甲咁」— Japanese refined mecha + cyberpunk mil-tech；**reject** 現行塊狀／cube-stack 作為後續 mech 共用風格。本輪 = interim mecha silhouette pass for eyes only — **not** device-final-art-locked／**not** HANDOFF §9 locked。

### Completed this turn

**Task ID：** `HORN-SILHOUETTE-DIRECTION` — live cache-bust **`?v=0.9.21`**.

- `js/mech-builder.js` horn-only：longer limbs vs torso、narrower chest／pelvis、neck、thigh/shin wedges、sharper asymmetric pauldrons、slender arms + mid rifle；identity cues kept（single horn antenna、cyan chest core、asymmetric pauldrons、mid rifle、deep-gray／violet／cyan）。
- Rebake 32 PNG sheets + `horn_atlas.json`／`horn_anchors.json`；`js/muzzle.js` HORN_MUZZLE_BY_DIR synced from atlas.
- heavy／prototype stubs **unchanged**（no copy of new horn mesh）。
- Screenshots：`tests/screenshots/horn-silhouette-mecha/`（menu desktop／rear／mobile + ingame idle + bake cells）。
- Docs：art-bible silhouette note（Roy = mecha；blocky rejected；pending visual lock）；HANDOFF v0.9.21；本文件 HOLD。
- **誠實標：** implemented + screenshots；**not** Roy art lock；**not** §9 locked；no balance／combat／Phase 4／phone GPU。

### Queue（**HOLD — await Roy 肉眼 on live ?v=0.9.21**）

1. **Await Roy visual OK／iterate** on horn mecha silhouette — **do not polish further until he OK**。← **recommended next**
2. **HIT-FEEL-DEVICE**（常規驗收）— Roy 真機高速橫向怪；SwiftShader ≠ device。
3. **CONTENT** light only if safe — **no** Phase 4 Precision／Morph bulk。
4. Phone GPU／WebGL mid-run — **deferred by Roy**。
5. （背景）AIM-HIT-FAST-002 Kimi 獨立審。

**Do NOT start：** Phase 4／horn art lock／§9 落地／phone GPU 深入／further horn polish without Roy eyes。

### Recently completed（do not re-implement）

- `HORN-SILHOUETTE-DIRECTION` → **v0.9.21** interim mecha silhouette（本輪；awaiting Roy eyes）。
- `PERF-REBASELINE` → desktop v0.9.20 GTX 1070 Ti。
- `PHONE-STABLE-FOLLOWUP` → **v0.9.20**。
- `AIM-HIT-FAST-002` → **v0.9.19**／`3e3d20e`。

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
