# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：**HOLD** — `WEAPONS-HUD-CONTROLS-FLOOR-001` shipped as **v0.9.59**（try on phone）

**Opened:** 2026-10-28 Asia/Hong_Kong — Roy phone「地板轉有顏色地全黑好難玩，控可連按螢幕2下轉副，連3下投；副連射≤3自動回主；壯態方塊統一；武器欄細D最下排；標題完整；平衡？」([pt226u])  
**Closed → HOLD:** 2026-10-28 Asia/Hong_Kong — Grok bot ship floor+taps+burst+HUD then HOLD.

**Author:** Grok bot · **Shipped:** v0.9.59 · **SHA:** `(pending push)`  
**Prior:** v0.9.58 legacy purge · Spec: `docs/WEAPONS.md`

### Shipped this beat

1. **v0.9.59 `WEAPONS-HUD-CONTROLS-FLOOR-001`**
   - **Floor:** play arena near-black; soft/hard/pad rings no zone color flash; keep danger-pulse + zone-pressure edge telegraphs.
   - **Controls:** double-tap playfield → secondary (if owned); triple-tap → throw (if owned / off CD); ~360ms debounce; rail taps untouched; stick move intact.
   - **Secondary burst:** `secondaryBurstMax=3` — rapid rescue burst then auto-return to primary even if ammo remains; empty ammo still returns.
   - **HUD:** unified status chip chrome; weapon rail **smaller tiles, bottom single horizontal row** (clears stick); full catalog zh names (機關雷射炮 etc.).
2. Tests + screenshots: `tests/weapons-hud-controls-floor.*` · `tests/screenshots/weapons-hud-controls-floor/`.
3. `?v=0.9.59` cache-bust.

### Balance note (answered to Roy)

Attack balance is **first-pass only** — **not** a finished balance ship. This beat does **not** invent a huge balance retune (only the 3-shot secondary burst counter).  
**Next optional (after Roy try):** named **`BALANCE-PASS`** — do not start without Roy.

### Stub vs live（honest）

| Area | Live | Stub |
|------|------|------|
| Near-black floor + bottom weapon row | **v0.9.59** | — |
| Multi-tap + secondary ≤3 burst | **v0.9.59** | — |
| Player weapon cards / names | catalog 14 only | — |
| Branch / ult / feel / icons | as v0.9.54–57 | full ult kits · Roy PNG art |
| Balance tables | first-pass | named BALANCE-PASS |
| Phase 4 / horn lock | — | **do not start** |
| Soft-juice invent | — | **do not invent** |

### Out of scope (still)

- Phase 4 Precision/Morph · horn art lock · soft-juice invent · deep phone GPU without ask · inventing beauty polish beyond this HUD unify · full unique ult kits unless Roy names them · inventing large balance retune

### Next（after Roy try）

- Phone verify floor readability + double/triple tap + burst return + bottom rail
- Optional **BALANCE-PASS** only if Roy asks
- Drop real `assets/weapons/{id}.png` when Roy art ready · full ult kits **only if Roy names**
- **do not invent more beauty slices**

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
