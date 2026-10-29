# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/?v=0.9.202 · Repo: https://github.com/fung2222/neon-swarm

## 狀態：**HOLD — tip `v0.9.202` (`PHONE-MENU-CTA-VISIBLE-001`). Punch phone menu CSS mid-band + keep `#mech-stage` off Start CTA; brighter plate/bg; startRun try/catch + pointerup. Mixamo still paused. Wait Roy phone 肉眼.**

**Author:** Grok bot

### Tip
https://fung2222.github.io/neon-swarm/?v=0.9.202

### Roy report (2026-10-29)
Phone tip v0.9.201: **選單仲係黑** + **啟動暴走 does NOTHING** (no reaction). HTML chrome OK. Not only WebGL black — menu CTA / input path may be broken too (or WebGL fail freezes interaction).

### Root causes (this tip)
1. **Black canvas:** cyber-kit `#screen-start` @max-760 radial `rgba(5,1,15,.45→.85)` composites over charcoal WebGL (box mid avg ~15) → OLED pitch black. Meshopt already cut in 0.9.201 — overlay was the remaining crush.
2. **Dead Start:** `#mech-stage` `inset:0` + `touch-action:none` + `preventDefault` can steal/swallow taps meant for `#btn-play` on some Android WebViews (Honor). Puppeteer click worked; phone touch path did not.

### This tip (v0.9.202)
1. **CSS:** punch clear mid-band window on `#screen-start.menu-home`; clip `#mech-stage` to mid-band (top 16% / bottom 28%); raise CTA z-index.
2. **JS:** brighter menu plate + non-black `scene.background` while menu; `startRun` try/catch + toast; `#btn-play`/`#btn-endless` pointerup+click debounce.
3. **Misc:** `sprites.js` `depth:false` → `depthWrite:false` (Three warn).
4. **Cache-bust:** `?v=0.9.202`. Mixamo / `HORN_TRUE_3D=false` still paused.

### Still HARD BAN
- Phase 4 **abilities** / Precision gameplay invent
- soft-juice invent
- more ult invent
- BALANCE re-pass
- Claiming **final art lock / HANDOFF §9 locked / device-final** without Roy 肉眼 OK
- Do NOT invent menu PNGs from text-to-image (art-bible: select = live 3D)
- Do NOT bring back pause `#btn-glow`

### Why HOLD / Roy decision needed
Please hard-refresh phone tip and check:
1. **Menu mech visible?** (cyan plate + charcoal horn, not black void)
2. **Start (啟動暴走) starts a run?**
3. After both OK → re-enable Mixamo combat lazily.

Live: https://fung2222.github.io/neon-swarm/?v=0.9.202

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
| v0.9.200 | `PHONE-MENU-BLACK-001` | `HORN_TRUE_3D=false`; remove boot Mixamo preload; menu try/catch; combat baked PNG only until menu OK — **HOLD for Roy 肉眼** — not §9 lock |
| v0.9.201 | `MENU-NO-MESHOPT-BOOT-001` | Cut `q-hero-3d.js`/meshopt from boot graph (flag-only module); brighter menu + stage plate; Mixamo still paused — **HOLD for Roy 肉眼** — not §9 lock |
| v0.9.202 | `PHONE-MENU-CTA-VISIBLE-001` | Punch phone menu CSS mid-band; `#mech-stage` off Start CTA; brighter plate/bg; startRun try/catch + pointerup — **HOLD for Roy 肉眼** — not §9 lock |

### Preserve
stick hide · hub flush · gear L + pause R · settings 畫質 · rail · water CD · dbl/tpl · tap≥44 · over title · soft-pins · balance/GPU shipped · unique ult kits · bans above
