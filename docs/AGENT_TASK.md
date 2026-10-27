# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：**HOLD** — `WEAPONS-ICON-PLACEHOLDERS-001` + `WEAPONS-FEEL-FX-001` shipped as **v0.9.57** / **v0.9.56**（try on phone）

**Opened:** 2026-10-28 Asia/Hong_Kong — Roy「搞多啲步驟流程」after v0.9.55 HOLD（polish later; keep advancing process）.  
**Closed → HOLD:** 2026-10-28 Asia/Hong_Kong — Grok bot ship two sequential slices then HOLD.

**Author:** Grok bot · **Shipped:** v0.9.57 · **SHA:** `0fdc8a4`  
**Prior:** v0.9.56 feel FX · v0.9.55 branch kits · Spec: `docs/WEAPONS.md`

### Shipped this beat

1. **v0.9.56 `WEAPONS-FEEL-FX-001`** — per-weapon combat feel FX (muzzle/trail/charge/stick/frost/explode/puddle/slow/deploy/blackhole/flash) matching locked feel specs; MOBILE_GFX / pool-respecting; extend existing Particles/Shockwaves.
2. **v0.9.57 `WEAPONS-ICON-PLACEHOLDERS-001`** — neon SVG square tiles (cyan/magenta/amber by category) replace bare emoji on left rail + top status; `WEAPON_ICON_SRC` → `assets/weapons/{id}.png` ready for Roy art; empty/muted states; layout from v0.9.52–53 kept.
3. Tests + screenshots: `tests/screenshots/weapons-feel-fx/` · `tests/screenshots/weapons-icon-placeholders/`.
4. `?v=0.9.57` cache-bust.

### Stub vs live（honest）

| Area | Live | Stub |
|------|------|------|
| Branch pick UI (Lv3) | playable level-cards + apply | — |
| Branch combat kits A/B/C | deep fire/behavior deltas | balance tune after Roy try |
| Ult pick UI (Lv5 primary) | playable + light stat amp | **full unique ult fire paths** (Roy has NOT named) |
| Feel fire + FX | helpers + feel FX recipes live | further beauty polish later (Roy said polish later) |
| Icons | **neon SVG placeholders** + `WEAPON_ICON_SRC` | **Roy final art** PNGs |
| Phase 4 / horn lock | — | **do not start** |
| Soft-juice invent | — | **do not invent** |

### Out of scope (still)

- Phase 4 Precision/Morph · horn art lock · soft-juice invent (toast/streak/coach invent) · deep phone GPU without ask · inventing brand-new unrelated systems · full unique ult kits unless Roy names them

### Next（after Roy try）

- Balance / feel feedback from phone · drop real `assets/weapons/{id}.png` when Roy art ready · full ult kits **only if Roy names** · beauty polish when Roy asks · **do not invent more beauty slices after these two**

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
