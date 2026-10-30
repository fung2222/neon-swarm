# Q 3D white-run prototype (path 2)

**Separate from tip.** Tip stays **v0.9.205**. Do **not** merge to formal tip / GitHub Pages without Roy confirmation. `HORN_TRUE_3D` on tip stays `false`. Not 2D A10 puppet work.

Goal: open on phone and feel **move/run** controls on a pure white empty stage.

## What it is

- Self-contained page under `prototypes/q-3d-white-run/`
- White floor + white background (+ very light grid so motion reads)
- Hero uses existing Mixamo walk asset already in repo
- Left virtual joystick (appear-under-finger) + desktop WASD/arrows
- Third-person camera follow behind

## Model / animation used

**Default:** `assets/mechs/horn/q-hero-mixamo-walk.play.glb`  
(~876KB meshopt+webp; same Mixamo walking clip tip `js/q-hero-3d.js` would use when true-3D is on)

| Query | Asset |
|-------|--------|
| *(none)* | `q-hero-mixamo-walk.play.glb` + walk clip via `AnimationMixer` |
| `?fbx=1` | `assets/q-hero-tripo-mixamo-walking.fbx` + `.fbm` textures (~24MB; no meshopt) |
| `?static=1` | `assets/q-hero-tripo.glb` (~61MB; no clips; still movable) |

Idle = walk clip paused at frame 0. Move = unpause + timeScale by stick magnitude.

## Open locally (PC)

From repo root (`neon-swarm/`):

```bash
# any static server that serves the repo root (ES modules + large assets)
npx --yes serve -l 5173 .
# or: python3 -m http.server 5173
```

Then open:

```text
http://127.0.0.1:5173/prototypes/q-3d-white-run/
```

Desktop: **WASD** / arrow keys.  
Phone browser on same machine: same URL if the device can reach the host.

## Open on phone (same LAN)

1. PC: start the static server bound to all interfaces, e.g.  
   `npx --yes serve -l tcp://0.0.0.0:5173 .`  
   or `python3 -m http.server 5173 --bind 0.0.0.0`
2. Find PC LAN IP (e.g. `ipconfig` / `hostname -I`).
3. Phone (same Wi‑Fi):  
   `http://<PC-LAN-IP>:5173/prototypes/q-3d-white-run/`
4. Press & drag on the **left ~70%** of the screen → virtual stick → run.

**Not claimed phone-fixed** — this is a proto for Roy to try on device. Box / desktop ≠ phone WebGL.

If the default meshopt GLB fails to boot on a given phone, retry:

```text
http://<PC-LAN-IP>:5173/prototypes/q-3d-white-run/?fbx=1
```

## Controls

| Input | Action |
|-------|--------|
| Touch drag (left area) | Virtual stick move |
| WASD / arrows | Move (desktop) |
| Stick release | Hide stick; idle pose |

Camera lags behind facing direction so running feel is clear.

## Hard bans (unchanged)

- No Phase4 / soft-juice invent beyond V1 / more ult / BALANCE / §9
- No second particle system
- No tip version bump / no Pages deploy from this folder alone
- Do not resume 2D A10 puppet work in this proto

## Known limits

- Prototype only — not wired into combat / tip menu
- Default GLB uses **meshopt**; some phones historically disliked meshopt at tip boot — this page is isolated, but if WebGL dies, use `?fbx=1`
- Only one locomotion clip (Mixamo walk); no separate run/idle FBX set
- No claim of “phone OK” until Roy tries on device
- Large FBX/static GLB paths need a decent network if served over LAN

## Files

```text
prototypes/q-3d-white-run/index.html
prototypes/q-3d-white-run/main.js
prototypes/q-3d-white-run/README.md
```

Assets are referenced from existing `assets/` (not re-downloaded, not copied).
