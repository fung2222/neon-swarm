# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/?v=0.9.205 · Repo: https://github.com/fung2222/neon-swarm

## 狀態：**SHIPPED — tip `v0.9.205` (`COMBAT-FEEL-V1`). Feel default ON. WebGL diag (0.9.204) + 2D puppet (0.9.203) kept. Box smoke only — phone not verified.**

**Author:** Grok bot

### Tip
https://fung2222.github.io/neon-swarm/?v=0.9.205

### Roy go-ahead (2026-10-30)
Confirmed「合併爽感」→ integrate COMBAT-FEEL V1 into formal tip, default ON (widget t314).

### This tip (v0.9.205)
1. **Feel ON by default:** gatling varied muzzle + recoilMul; ordinary-grunt hit sparks + lean/wobble; kill pop + ≤4 scraps; combo streak reuse.
2. **Debug force-off:** `?feelProto=0` (or `feel=0` / `off` / `false`).
3. **Preserved:** v0.9.204 WebGL diag; FX caps/pools; hub URL params; touch; pause; no damage/RoF/HP/hit-test/drops/Phase4/ult/BALANCE/§9 edits.
4. **Cache-bust:** `?v=0.9.205`. Review: `docs/COMBAT-FEEL-REVIEW.md`.

### Still HARD BAN
- Phase 4 **abilities** / Precision gameplay invent
- soft-juice invent **beyond** this V1 set
- more ult invent
- BALANCE re-pass
- Claiming **final art lock / HANDOFF §9 locked / device-final** without Roy 肉眼 OK
- Do NOT invent menu PNGs from text-to-image (art-bible: select = live 3D)
- Do NOT bring back pause `#btn-glow`
- Do NOT re-enable Mixamo boot/preload that blacked phone menus

### Phone check (not yet verified)
Hard-refresh: https://fung2222.github.io/neon-swarm/?v=0.9.205
1. Gatling muzzle variety + puppet recoil feel richer?
2. Grunt hit lean/sparks + kill scraps ≤4?
3. Mid-run no「繪圖暫時中斷」for 2–5 min?
4. Optional A/B: same build with `?feelProto=0`

Still HARD BAN: Phase 4 abilities / soft-juice invent beyond V1 / more ult invent / BALANCE re-pass / pause `#btn-glow` / invent menu PNGs from T2I.


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
| v0.9.203 | `Q-2D-SKELETON-DEMO` | Combat horn free 2D bone puppet (canvas parts + bone hierarchy; idle/walk/attack); no Spine Editor; Mixamo still off; menu path preserved — **HOLD for Roy 肉眼** — not §9 lock |
| v0.9.204 | `MOBILE-WEBGL-DIAG-001` | JS vs WebGL classify, diag ring, reload cap; shared puppet textures — box only; phone not claimed |
| v0.9.205 | `COMBAT-FEEL-V1` | Gatling+grunt feel default ON; `?feelProto=0` force-off; no balance/hit-test edits; WebGL diag kept — box smoke; phone not verified |

### Preserve
stick hide · hub flush · gear L + pause R · settings 畫質 · rail · water CD · dbl/tpl · tap≥44 · over title · soft-pins · balance/GPU shipped · unique ult kits · bans above
