# NEON SWARM 霓虹洪流 — Handoff

Status: **v0.1 playable slice** (2026-10-18) · kit **v0.3.16** · CYBER ARCADE tier **Gold**.
Live: https://fung2222.github.io/neon-swarm/ · `?demo=1` limp autopilot.

## v0.1 scope
- One-thumb drag / virtual stick / WASD move; auto-fire pulse at nearest foe.
- Enemies: runner, tank, splitter (splits into runners).
- XP gems → level-up pick 1 of 3 cards (damage, fire rate, orbit blades, speed, magnet, HP).
- Endless capped pressure via `swarmPressure(t)`; survive timer + score; best score/time saved.
- Bilingual zh-HK/EN; menu-home house/book/gear; hub hooks; trial surviveSec cap when `trial=1`.

## Ad breaks
`naturalBreak` on game-over only when `ads=1`. Never mid-swarm or on level-up cards.

## Next
More weapons, elites/bosses, meta unlocks, Capacitor, proper thumbs for hub.
