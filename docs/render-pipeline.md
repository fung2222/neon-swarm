# Render pipeline — single 3D source of truth (v0.9.0 Phase 1)

> Select shows **live 3D**. In-game uses **pre-rendered multi-dir sprites from that same model**.  
> Extends [milestone-b-asset-contract.md](./milestone-b-asset-contract.md). Naming: [asset-naming.md](./asset-naming.md).

## 1. Forbidden

- Separate text-to-image frames for menu vs gameplay
- Menu hero PNGs that do not match in-game armor / weapon / proportions
- Opaque-cropping current whole-body sheets to fake split-body

## 2. Phase 1 source of truth

| Layer | Implementation |
|---|---|
| Model | Procedural Three.js **`buildPlayerMech(cfg)`** in `js/view.js` |
| Select | `View.setMenuMech(id)` builds that mesh, pedestal + shadow, yaw drag |
| In-game (horn) | `buildBakedPlayerSprite` ← `assets/mechs/horn/sheets/` from same `buildPlayerMech`; legacy `assets/sprites/mech_*.png` fallback |

Future: drop a GLB at `assets/mechs/{id}/source.glb` and load it inside the same `setMenuMech` / bake path **without changing the select API** (`setMenuMech(id)`, card → `store.mech`).

```
        ┌─────────────────────────────┐
        │  buildPlayerMech / GLB      │  ← single visual identity
        └─────────────┬───────────────┘
              ┌───────┴────────┐
              ▼                ▼
     Select: live 3D     Bake tool → sprite sheets
     (yaw / auto-spin)   → in-game billboards (Phase 3)
```

## 3. Select showcase contract

- Dark background; **pedestal** + soft **contact shadow**
- Restrained bloom so plate / cyan core / violet trim still read
- Horizontal yaw only (mouse drag + one-finger touch on stage hit area)
- Idle slow auto-spin; user drag pauses auto-spin; resume after **~2.5 s** idle
- Pitch clamped / camera **stable framing** — rotate the **mech**, do not free-orbit the camera into chaos
- Card click → immediate `setMenuMech(id)` + persist `store.mech`

## 4. Bake contract (4-dir first, then 8-dir)

Even before full automation, bakers must honor:

### Camera
- Orthographic or long-FOV perspective with negligible foreshortening
- Elevation ≈ play feel: **~55–65°** down from horizontal for 2/3 top-down read  
  (match in-game billboard “standing” proportions, not pure top-down flat)
- Distance fixed so character height ≈ **70–80%** of cell

### Cell
- Uniform canvas per set (recommend square, e.g. 256² or 512²)
- Transparent background; prefer hard alpha (`alphaTest` ~0.45 friendly)
- Shared **foot baseline** Y across all dirs/actions
- Document **pivot** (waist/chest) and **muzzle** per facing

### Directions
1. Ship **4-dir**: N E S W  
2. Playtest move + aim  
3. Only then expand to **8-dir**

### Actions (minimum for protagonist acceptance)
`idle` · `run` (prefer 4 frames) · `runfire` or gun-layer fire · `hurt` · `death`

Upper aim independent of legs when assets allow (Milestone B). Until then, whole-body cells are acceptable **if baked from the same 3D rig**.

### Stub tool

```
node tools/bake-mech-sprites.mjs --id horn --dirs 4 --actions idle,run --dry-run
```

Phase 1 ships the **CLI contract + dry-run stub**. Full headless WebGL bake can land with Phase 3 art.

## 5. Integration notes for implementers

- Keep `aimX/aimZ` + fire-event muzzle fields from Milestone A
- Swap `buildPlayerSprite` maps for baked sheets when files exist; do not fork a second mech builder for gameplay
- `window.__rampageArt.buildPlayerMech` remains the offline art hook
- Link Milestone B anchors: foot / pivot / muzzle must match bake JSON

## 6. Parity checklist (before claiming “select == in-game”)

- [ ] Same model ID / GLB / procedural seed
- [ ] Same plate / accent / trim / core colors
- [ ] Same horn / shoulder / rifle silhouette cues
- [ ] Foot and muzzle anchors documented
- [ ] No T2I-only frames in either path

Until the checklist is green, README and this doc must say: **select = live 3D; in-game sprites = interim**.


## 7. Honesty note (v0.9.188 HORN-BAKE-INGAME-ALIGN)

Horn select (live 3D) and in-game (rebaked 8-dir sheets) share `buildPlayerMech` source. heavy/prototype: select live 3D unique meshes; bake stubs optional; not claimed in-game-aligned until sheets wired. **Interim for Roy 肉眼 — not §9 lock.**


## 8. Horn match approved (v0.9.193–197)

Roy chose rebuild-3D-from-approved (not T2I menu PNGs). Source of truth remains `buildPlayerMech` → select live 3D + `tools/bake-mech-sprites.mjs` 8-dir sheets. Target PNG: `sword-mech-sideview-approved.jpg`. Screenshots: `tests/screenshots/horn-match-approved/`. **Interim — HOLD for Roy 肉眼; not §9 / device-final.**

### Mixamo true-3D combat (v0.9.198–200)
- **v0.9.200:** `HORN_TRUE_3D=false`; no boot `preloadMixamoHero`; combat = baked PNG only until menu verified on phone.
- Select `setMenuMech` always `buildPlayerMech` (try/catch → bare pedestal+mech). Mixamo never on turntable / never on boot path.
- Prior path (paused): Mixamo GLB + AnimationMixer + height-fit; re-enable after menu OK.
- **Interim — HOLD for Roy 肉眼; not §9 lock.**

### Q 2D skeleton demo (v0.9.203)
- Combat horn: `HORN_2D_SKELETON` → `js/q-hero-2d-puppet.js` (bone Groups + canvas charcoal+cyan parts; idle/walk/attack).
- No Spine Editor runtime files; no Mixamo/`meshopt` on boot. `HORN_TRUE_3D=false`.
- Select menu still `buildPlayerMech`. Other mechs keep baked/legacy sprites.
- **Interim — HOLD for Roy 肉眼; not §9 lock.**

