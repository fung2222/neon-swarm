# NEON SWARM 霓虹洪流 — Handoff

Status: **v0.2 polish** (2026-10-18) · kit **v0.3.16** · CYBER ARCADE tier **Gold**.
Live: https://fung2222.github.io/neon-swarm/ · `?demo=1`

## v0.2
- More level-up cards: spread, pierce, multi-lock, nova pulse, frost (+ prior pulse/rate/orbit/speed/magnet/HP).
- Enemy mix: runner / tank / splitter / swarmling + periodic wave bursts.
- Juice: particles, shockwaves, trauma shake, hurt flash, XP pop, nova ring.
- Virtual stick: deadzone, larger pad, drag-anywhere, active glow.
- Death → retry/menu with score / best / time / kills; howto covers move + auto-fire + level-up.
- `stage.render` every frame (required for visible canvas).
- Player art: cyberpunk hover-mech silhouette (nose, canopy, fins, thrusters) — not a glowing circle; faces move/aim.

## Ad breaks
`naturalBreak` on game-over when `ads=1`. Never mid-swarm or on level-up cards.
