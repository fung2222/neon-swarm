# Art Bible — 暴走機甲 RAMPAGE MECH (v0.9.0 Phase 1)

> Living visual + lore contract. Phase 1 ships docs + protagonist select slice.  
> Related: [asset-naming.md](./asset-naming.md) · [render-pipeline.md](./render-pipeline.md) · [milestone-b-asset-contract.md](./milestone-b-asset-contract.md)

## 1. Lore (one-pager)

An underground military-industrial corporation runs **mech personality-sync** experiments. The protagonist frame awakens mid-test and flees the containment lab. The corp responds with waves of scientists, security, drones, hunter mechs, and eventually army units.

Three selectable frames exist as IDs:

| ID | Name | Role (Phase) |
|---|---|---|
| `horn` | **覺醒突擊型 / Awaken Assault** | Protagonist — Phase 1 deep slice |
| `heavy` | **高速精密型 / Precision Frame** | White-pink precision — Phase 2 select polish / Phase 4 abilities |
| `prototype` | **可變結構原型 / Morph Prototype** | Morphing armor/thrusters — Phase 2 / 4 |

Phase 1 only vertical-slices the protagonist on the select screen. The other two keep selectable IDs and light palette/label updates; full unique silhouettes and abilities come later.

## 2. Visual style

- Japanese refined mecha + cyberpunk mil-tech
- Clear **arcade silhouettes** readable when shrunk
- Play camera ≈ **2/3 top-down**; fluent **2D run-shoot** in-game
- **Not** hyper-realistic
- **Not** meaningless surface noise on every plate
- **Not** full-screen neon bloom wash that erases armor color

At play scale, frames and enemies must stay distinguishable by **silhouette + color + motion**.

## 3. Color tokens (hex)

### Player weapons / friendly energy
| Token | Hex | Use |
|---|---|---|
| `--player-cyan` | `#00e5ff` | MG tracers, friendly energy, personality core |
| `--player-cyan-soft` | `#7ad7ff` | Soft muzzle / secondary beam |
| `--player-pink` | `#ff2bd6` | Rampage / special player accents |
| `--player-purple` | `#b060ff` / `#8b3dff` | Electric purple tiers, horn violet ID |

### Enemy attacks / danger language
| Token | Hex | Meaning |
|---|---|---|
| `--warn-red` | `#ff3b3b` / `#ff2a4a` | Imminent hit / telegraph |
| `--warn-orange` | `#ff9a1f` / `#ffb020` | Blast radius / explosion preview |
| `--warn-acid` | `#b8ff3a` / `#7cff3a` | Persistent hazard / acid pool |

**Rule:** warning colors must not be stolen by floor décor or bloom.

### Pickups
| Token | Hex | Use |
|---|---|---|
| `--pickup-xp` | `#3bff8a` | XP shards (green energy) |
| `--pickup-heal` | `#e8fff0` + green cross | Repair |
| `--pickup-magnet` | `#2f9bff` | Magnet pulse |
| `--pickup-weapon` | `#ffc21a` | Weapon crate gold frame |
| `--pickup-buff` | `#b44dff` | Temp hex buff |
| `--pickup-rare` | `#ffc21a` + `#ff2bd6` pillar | Rare unlock — never confuse with XP |

### Protagonist ID (覺醒突擊型)
| Part | Hex |
|---|---|
| Charcoal plate | `#1a1e28` / `#2a303a` |
| Charcoal accent plates | `#1e242e` |
| Cyan neon edge trim / core | `#00e5ff` |
| Visor slit | `#00e5ff` |
| Rampage seam | cyan `#00e5ff` → magenta `#ff2bd6` |

**Target ref (Roy 2026-10-28):** `sword-mech-sideview-approved.jpg` / `roy-approved-ref.jpg` — slender charcoal+cyan swept-crest swordsman. **Do not** use purple/violet as primary horn identity. Violet token `#8b3dff` remains for electric tiers / enemy language only.

### Scene
| Token | Hex / note |
|---|---|
| Arena bg | near-black `#05010f` |
| Floor | **dim** cool gray — low contrast playable ground |
| Ambient | restrained; armor colors must still read |

## 4. Silhouette rules

1. Readable at ~64–96 px screen height (phone HUD scale).
2. Head / shoulders / weapon / backpack define the read — not micro rivets.
3. Protagonist cues: **single horn antenna**, **cyan chest personality core**, **asymmetric pauldrons**, **mid rifle**.
4. Enemies differ by attack-role silhouette (Phase 5/6 pack) — not hue-only swaps.
5. Foot baseline and muzzle anchors stay consistent across dirs (see Milestone B + render-pipeline).

### Horn silhouette direction (Roy 2026-10-26 → v0.9.21)

- **Wanted:** Japanese refined mecha + cyberpunk mil-tech (this bible’s style line) — humanoid-mecha proportions, longer limbs vs torso, sharper angular plates.
- **Rejected:** blocky／塊狀／cube-stack body as the shared style for later mechs. Do **not** lock the old toy-block read.
- **Status:** interim mecha pass shipped in `buildPlayerMech` (horn only) + rebaked sheets **v0.9.21**. Screenshots under `tests/screenshots/horn-silhouette-mecha/`. **Roy 2026-10-26:** interim silhouette accepted for pipeline continue（「繼續出去啦」）；**still not** device-final-art-locked／HANDOFF §9 locked. **Lifted 2026-10-28** for Active `MECH-HORN-ROY-PNG`; **Roy 17:57 chose**「跟圖重做 3D 再 bake」→ Active `HORN-MATCH-APPROVED-3D` rebuilds horn mesh to approved PNG then rebakes. Still **not** §9 / device-final without Roy 肉眼 OK.

## 5. Dim-arena rule

- Keep the playable floor and ambient **dimmer than bullets, enemies, and pickups**.
- Prefer lowering floor albedo / ambient over raising bloom.
- Bloom is a **restrained rim**, never a wash that flattens cyan MG tracers into white.

## 6. Select vs in-game honesty (Phase 1 → bake align)

| Surface | Source |
|---|---|
| **Select / home** | Live procedural Three.js `buildPlayerMech(cfg)` — rotatable 3D |
| **In-game (horn)** | Baked multi-dir sheets from **same** `buildPlayerMech` under `assets/mechs/horn/sheets/` (via `buildBakedPlayerSprite`) |
| **In-game fallback** | Legacy `assets/sprites/mech_*.png` only when bake atlas missing for that mech id |

**HORN-BAKE-INGAME-ALIGN (v0.9.188):** horn in-game billboards use rebaked sheets — not a second art pipeline. **HORN-MESH-MATCH-001 / HORN-REBAKE-MATCH-001 (v0.9.194–195):** horn 3D rebuilt toward approved charcoal+cyan slender swept-crest; sheets rebaked from same `buildPlayerMech`. heavy / prototype still select-3D stubs. Until Roy 肉眼 lock, sheets are **interim**. Target = `sword-mech-sideview-approved` — **not** §9 lock.

## 7. Out of scope here

Full three-mech anim packs, white-pink unique mesh, morph states, map districts, grenade front-arc rewrite, weapon-swap chooser, enemy silhouette pack — Phases 2–5.

## 8. Shared skeleton vs per-mech (code shape)

**Shared (do not fork per frame):**
- Procedural / GLB load path → `buildPlayerMech` or future loader behind `setMenuMech(id)`
- Select UI, drag yaw, auto-spin, pedestal
- Run / fire / hurt / death controller hooks
- Weapon mounts, muzzle fields, bake pipeline
- Stats UI reading `resolveMechCombat(mech)`

**Per-mech (`MECHS` entry):**
- `id`, `model` (parts key — never “recolor horn and call it pink”)
- `stats` { hp, speed, damage, fireRate }, `starterWeapon`, `passive`
- Materials / proportions / armor parts / muzzle offsets

Order: protagonist proves fun → precision proves reusable → morph proves extensible → then mass enemies / maps / weapons.
