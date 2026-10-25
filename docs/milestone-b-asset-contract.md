# Milestone B — Split-body asset contract

> Status: **contract only** (v0.8.6). Milestone A ships with whole-body PNG fallback.
> Do **not** fake upper/lower compositing by opaque-cropping current sheets.

## Current inventory (`assets/sprites/`)

| File | Role |
|---|---|
| `mech_idle.png` | Standing idle (whole body) |
| `mech_move.png` | Single move fallback |
| `mech_move_1.png` / `mech_move_2.png` | 2-frame walk cycle |
| `mech_attack.png` | Standing aim / fire pose |
| `mech_defend.png` | Defend (unused in A fallback priority) |
| `mech_hit.png` | Death / hurt map (A uses tint overlay for hurt) |
| `mech_victory.png` | Victory |
| `enemy_*.png` / `npc_doctor.png` | Hostiles / NPC |

**Confirmed:** no split-body sheets, no independent gun layer, no per-direction lower body.

## Required new assets (before implementing true move+aim)

### 1. Lower body (locomotion)

- **Directions:** 4-dir preferred first (`N / E / S / W` or camera-relative `front / back / left / right`).
- **Actions:** `idle` + `move` (walk).
- **Walk frames:** prefer **4 frames** per direction (2-frame is the current temporary limit).
- **Foot anchor:** shared baseline so plant Y never pops when flipping dir or swapping upper.

### 2. Upper body **or** independent gun

- Must rotate / flip independently of legs for **360° aim** (or at least continuous yaw toward sticky target).
- If full upper torso is too expensive, ship a **gun/arm layer** that pivots around a chest socket.
- Fire / recoil can be 1–2 frames on the upper/gun only.

### 3. Anchors (per direction)

Document in pixels (or normalized 0–1) for each facing:

| Anchor | Purpose |
|---|---|
| **Pivot** | Attach upper to lower (chest / waist) |
| **Foot baseline** | Ground contact Y — keep constant across frames |
| **Muzzle** | World spawn for bullets + VFX (matches logic `MUZZLE_BY_WEAPON`) |

### 4. Canvas / scale

- **Canvas:** uniform size per character set (recommend square or fixed height sheet cell).
- **Character height:** ~**70–80%** of canvas height (matches current in-world billboard feel).
- **Foot baseline:** same Y across idle/move/attack cells so `plane.position.y = h * 0.5` stays stable.
- **Alpha:** hard edges preferred (`alphaTest` ~0.45); avoid soft fog fringes.

### 5. Recommended production order

1. **4-dir lower body** idle + 4-frame walk  
2. **Independent gun / upper** with muzzle anchor (360° aim)  
3. Only then consider **8-dir × all actions** explosion (idle/move/aim/fire/hit)

Do **not** jump to 8-dir full sheets before (1)+(2) playtest.

### 6. Integration notes (for the implementer)

- View already tracks conceptual `locomotion` / `weapon` / hurt overlay (v0.8.6).
- Swap fallback whole-body maps for layered meshes only when assets land.
- Keep `aimX/aimZ` + fire event muzzle fields — they are ready for a gun bone/sprite.
- No Canvas2D rewrite; stay on Three.js billboards.

### 7. Out of scope for B art

- Re-arting all 3 mech colorways as full unique sheets (tint / palette swap OK).
- Complex FSM (reload / roll / stamina).
- Monetization / hub art.
