# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/?v=0.9.199 · Repo: https://github.com/fung2222/neon-swarm

## 狀態：**HOLD — tip `v0.9.199` (`MENU-MECH-PHONE-FIX-001`). Menu showcase always `buildPlayerMech`; Mixamo combat-only + fallbacks. Wait Roy phone 肉眼.**

**Author:** Grok bot

### Tip
https://fung2222.github.io/neon-swarm/?v=0.9.199

### Roy report (2026-10-29)
Phone tip v0.9.198 showed menu UI (暴走機甲 / 啟動暴走) but **center mech showcase pure black** (開唔到). Authorized fix [t283u]/[t284ua0].

### This tip (v0.9.199)
1. **Menu / home turntable:** always `buildPlayerMech` — **do not** put Mixamo on select showcase (restores pedestal + mech on phone).
2. **Combat:** keep Mixamo when `mixamoReady()`; wrap `buildMixamoPlayer` / sprites Mixamo branch in try/catch → baked PNG fallback; never leave player null.
3. **Hardening:** apply `MIXAMO_FIT_H` via Box3 height-fit (+ footprint); zero-mesh / load throw marks failed; guard `m.map` on material convert.

### Still HARD BAN
- Phase 4 **abilities** / Precision gameplay invent
- soft-juice invent
- more ult invent
- BALANCE re-pass
- Claiming **final art lock / HANDOFF §9 locked / device-final** without Roy 肉眼 OK
- Do NOT invent menu PNGs from text-to-image (art-bible: select = live 3D)
- Do NOT bring back pause `#btn-glow`

### Why HOLD / Roy decision needed
Phone menu black-void fix shipped. Please try tip on phone:

1. **Menu mech visible again?** (pedestal + procedural horn, not black)
2. **In-combat Mixamo still OK** (or falls back to sheets cleanly)?
3. Lock / more polish later?

Live: https://fung2222.github.io/neon-swarm/?v=0.9.199

Still HARD BAN: Phase 4 abilities / soft-juice invent / more ult invent / BALANCE re-pass / pause `#btn-glow` / invent menu PNGs from T2I.


### Shipped this beat (slice table)

| Ver | ID | What |
|---|---|---|
| v0.9.186 | `MECH-HORN-ROY-PNG` | Open Active art track; lift horn/heavy/proto/Roy-PNG bans for this Active; keep Phase4/soft-juice/ult/BALANCE bans |
| v0.9.187 | `HORN-MECHA-DEEPEN` | Deepen buildPlayerMech horn (plates/asym/horn sweep/mil-tech); rebake 8-dir sheets; muzzle/atlas sync; interim for Roy try — not §9 lock |
| v0.9.188 | `HORN-BAKE-INGAME-ALIGN` | Honesty: in-game horn billboards = rebaked sheets (same buildPlayerMech); art-bible/render-pipeline/README note |
| v0.9.189 | `MECH-HEAVY-SILHOUETTE` | Unique Precision (heavy) mesh — compact wide stance, twin shoulder pods, sensor crown; white-pink; bake 4-dir stub; NOT recolor horn |
| v0.9.190 | `MECH-PROTOTYPE-SILHOUETTE` | Unique Morph (prototype) mesh — morph seams, dual fins+monocle, fold-panel pack; citrus; bake 4-dir stub; NOT recolor horn |
| v0.9.191 | `WEAPONS-PNG-PATH` | Wire WEAPON_ICON_SRC preferSrc→assets/weapons/{id}.png + SVG fallback; README drop path; no Roy PNGs yet — HOLD note |
| v0.9.192 | `GAMES-JSON-STAGE-009` | games.json stub stage → tip; art beat HOLD for Roy 肉眼 on horn (+ optional heavy/proto); weapons PNG drop ask |
| v0.9.193 | `HORN-MATCH-APPROVED-3D` | Active rewrite — Roy chose rebuild-3D-from-approved charcoal+cyan PNG (not T2I menu drop); target sword-mech-sideview-approved |
| v0.9.194 | `HORN-MESH-MATCH-001` | Rebuild buildHorn mesh/materials — charcoal matte plates, cyan neon edge trim, slender limbs, swept-back crest, cyan visor slit, circular hinges; drop purple block read |
| v0.9.195 | `HORN-REBAKE-MATCH-001` | Rebake horn 8-dir sheets from new buildPlayerMech; sync muzzle/atlas/anchors; cool bake fill (no purple kick) |
| v0.9.196 | `HORN-INGAME-MATCH-001` | Confirm in-game uses new sheets; screenshots select + bake + in-game vs approved under tests/screenshots/horn-match-approved/ |
| v0.9.197 | `GAMES-JSON-STAGE-010` | art-bible/render-pipeline honesty (target=approved PNG); games.json stage → tip; HOLD for Roy 肉眼 — not §9 lock |
| v0.9.198 | `HORN-MIXAMO-TRUE3D-001` | Mixamo-skinned Q hero true 3D in combat (horn); AnimationMixer walk/idle; meshopt+webp play.glb; baked-sprite fallback; select preview same mesh; **HOLD for Roy 肉眼** — not §9 lock |
| v0.9.199 | `MENU-MECH-PHONE-FIX-001` | Menu showcase always `buildPlayerMech` (no Mixamo on turntable); combat Mixamo try/catch + height-fit + zero-mesh fail; phone black-void fix — **HOLD for Roy 肉眼** — not §9 lock |

### Preserve
stick hide · hub flush · gear L + pause R · settings 畫質 · rail · water CD · dbl/tpl · tap≥44 · over title · soft-pins · balance/GPU shipped · unique ult kits · bans above
