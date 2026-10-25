# Asset naming — 暴走機甲 (v0.9.0 Phase 1)

Folders are relative to the game root. Prefer lowercase, ASCII, underscore separators. No spaces.

## Root layout

```
assets/
  sprites/          # in-game billboards (interim + future baked sheets)
  ammo/             # projectile / fragment PNGs
  floor/            # arena ground textures
  mechs/            # per-frame authored 3D + baked sheets (Phase 3+)
    horn/
    heavy/
    prototype/
  enemies/          # Phase 5 silhouette pack
  pickups/          # XP / heal / magnet / weapon / rare
  weapons/          # optional gun-layer / emblem art
  ui/               # cards, icons (optional)
tools/
  bake-mech-sprites.mjs   # stub bake contract (Phase 1)
```

## Mech IDs (stable)

| ID | Lore name | Notes |
|---|---|---|
| `horn` | 覺醒突擊型 Awaken Assault | Protagonist |
| `heavy` | 高速精密型 Precision | Select ID; full art Phase 2/4 |
| `prototype` | 可變結構原型 Morph Prototype | Select ID; morph Phase 4 |

## 3D sources

```
assets/mechs/{id}/source.glb          # future authored GLB (optional)
assets/mechs/{id}/preview.json        # optional showcase overrides
```

Phase 1 source of truth is still procedural: `js/view.js` → `buildPlayerMech(cfg)`.  
A future GLB must expose the same select API (`setMenuMech(id)`), not a parallel menu PNG.

## Baked sprite sheets (Phase 3 contract)

```
assets/mechs/{id}/sheets/
  {id}_{dir}_{action}_{frame}.png
  # or packed:
  {id}_{action}_{dirs}dir.png
  {id}_{action}_{dirs}dir.json   # frame rects + anchors
```

### Directions
- 4-dir first: `n` `e` `s` `w` (or `front` `right` `back` `left`)
- 8-dir later: add `ne` `se` `sw` `nw`

### Actions
| Token | Meaning |
|---|---|
| `idle` | standing |
| `run` | locomotion |
| `runfire` | run + fire (or upper composited) |
| `aim` | standing aim |
| `fire` | fire recoil frame(s) |
| `hurt` | hurt overlay / tint map |
| `death` | death |
| `morph_*` | prototype only |

### Frame index
Zero-padded 2 digits: `00`, `01`, …  
Example: `horn_e_run_02.png`

### Anchors file (per sheet or per cell)
JSON keys (normalized 0–1 or px — pick one per sheet and stick to it):

```json
{
  "foot": [0.5, 0.92],
  "pivot": [0.5, 0.55],
  "muzzle": [0.72, 0.48]
}
```

## Interim in-game sprites (current)

Legacy whole-body files remain until bake lands:

```
assets/sprites/mech_idle.png
assets/sprites/mech_move.png
assets/sprites/mech_move_1.png
assets/sprites/mech_move_2.png
assets/sprites/mech_attack.png
assets/sprites/mech_hit.png
…
```

Do **not** invent parallel `menu_horn.png` from text-to-image. Select uses live 3D.

## Enemies (Phase 5 naming preview)

```
assets/enemies/{role}/{role}_{dir}_{action}_{frame}.png
```

Roles: `scientist` `security` `shield` `sniper` `drone` `hunter` `heavy_gun` `commander`

## Pickups

```
assets/pickups/xp_shard.png
assets/pickups/repair_kit.png
assets/pickups/magnet_pulse.png
assets/pickups/weapon_crate.png
assets/pickups/buff_hex.png
assets/pickups/rare_unlock.png
```

## Weapons / ammo

```
assets/ammo/{weapon}.png          # existing
assets/weapons/{weapon}_emblem.png
assets/weapons/{weapon}_gunlayer.png   # optional independent gun
```

## Floors / zones (Phase 5)

```
assets/floor/background_arena.png     # current
assets/floor/zone_lab.png
assets/floor/zone_assembly.png
assets/floor/zone_reactor.png
assets/floor/zone_blockade.png
assets/floor/zone_rooftop.png
```

Playable ground stays low-contrast; décor stays at edges.
