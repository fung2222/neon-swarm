# NEON SWARM 霓虹洪流 — Handoff

Status: **v0.3.3 playfield-stick HUD dead-zone fix** (2026-10-18) · kit **v0.3.16** · CYBER ARCADE tier **Gold**.
Live: https://fung2222.github.io/neon-swarm/ · `?demo=1`

## v0.3.3 playfield stick
- **Root cause:** kit `.hud-buttons { bottom: … }` + game `.hud-buttons.top { top: … }` left both `top` and `bottom` set → mute/pause strip stretched ~full height with `pointer-events: auto`, eating the right playfield (and bottom-right). Stick listener also wrongly ignored `#hud` (full-screen overlay).
- **Fix:** `bottom: auto; height: auto` on `.hud-buttons.top`; decorative HUD `pointer-events: none`; drag-anywhere on `window`, excluding only real UI (`button` / `.icon-btn` / cards).

## v0.3.2 feedback pass
- **Player mech:** Violet + acid-green cyber silhouette with horn helm (fan homage to classic purple EVA aesthetics — no logos / names / trademarks). Cyan accents kept on visor & thrusters.
- **Virtual stick:** Drag-anywhere; stick/glow relocates under the press point. No opaque finger-press disc blocking the playfield. Idle corner hint stays faint.
- **Enemies:** Robot/mech silhouettes per type (lean runner, heavy tank, twin splitter, scout swarmling) — not pure geometric primitives.
- **Level-up cards:** Much larger icons with unique readable SVG emblems per upgrade shape.
- Keeps: full follow cam, dense particles (5200), high swarm cap, open wilderness map, cyan accents OK beside EVA palette.

## v0.3.1
- Camera full player follow; mech walk/idle/fire/hurt anim; denser particles & swarm.

## v0.3 redesign
- Open arena, wilderness props, cyan mech (superseded by v0.3.2 palette), armor/weapon cards, `stage.render`.

## Ad breaks
`naturalBreak` on game-over when `ads=1`. Never mid-swarm or on level-up cards.
