# NEON SWARM 霓虹洪流 — Handoff

Status: **v0.3.1 camera-follow + juice** (2026-10-18) · kit **v0.3.16** · CYBER ARCADE tier **Gold**.
Live: https://fung2222.github.io/neon-swarm/ · `?demo=1`

## v0.3.1 feedback pass
- **Camera:** Full player follow (iso offset) — no more weak 25% drift toward origin.
- **Mech anim:** Walk cycle (legs/arms), idle hover bob, fire punch kick, hurt flinch, thruster pulse.
- **Particles:** Larger pool (5200), denser hit/kill/xp/nova/fire bursts, kill rings, move thruster trail.
- **Swarm:** Higher density/cap (55→145), bigger/faster waves, 12 initial spawns.
- Keeps: open wilderness, cyan mech, auto-fire, `stage.render` every frame.

## v0.3 redesign
- **Player color:** cyan primary + magenta accents (cool neon). Red only for damage flash / hurt overlay — not body primary.
- **Map:** Large open arena (`ARENA.half=36`) with soft clamp rim — survivor roam, not a tight circle. Enemies spawn near the player off-camera.
- **Camera:** Mild zoom in/out via `ViewInput` (pinch / wheel) and `+/-`. One-finger left for move stick.
- **Player mesh:** Humanoid mech/robot (legs, torso, head/visor, arms, pack) — readable silhouette from iso.
- **XP gems:** Green crystal + torus ring so pickups read as XP.
- **Level-up cards:** Icon + kind tag (WEAPON / ARMOR / UTIL). New armor cards: Armor Plate, Shield Plating, Deflector; new weapon: Rail Shot.
- **Enemies:** Distinct shapes — octahedron runner, cube tank, hourglass splitter, tetrahedron swarmling.
- **Environment:** Wilderness mode — `buildings: 0`, no tall skyline in play space. Low obstacles only (crates, low walls, barrels, debris).
- Keeps: auto-fire survivor loop, `stage.render` every frame, menu-home, hub params, trial, ads-on-over.

## v0.2 (prior)
- More cards, enemy mix, juice, virtual stick, hover-mech blob, `stage.render`.

## Ad breaks
`naturalBreak` on game-over when `ads=1`. Never mid-swarm or on level-up cards.
