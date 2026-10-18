# NEON SWARM 霓虹洪流 — Handoff (scaffold)

Status: **v0.0 shell** (2026-10-18) · Pages-ready menu-home + NeonCity attract · **not playable slice yet** · kit **v0.3.16** · proposed CYBER ARCADE tier **Gold**.
Series rules: `fung2222/cyber-arcade/docs/ARCADE-HANDOFF.md`. No Capacitor yet. Do not commit any unlisted hub lab path.

## Pitch
Bullet heaven / Vampire Survivors–style: one-thumb move, auto-attack, timed weapon level-ups, endless swarm pressure.

## Proposed names
| | zh-HK | EN | slug |
|---|---|---|---|
| **Pick** | 霓虹洪流 | NEON SWARM | `neon-swarm` |
| Alt A | 霓虹倖存 | NEON SURVIVOR | `neon-survivor` |
| Alt B | 賽博掃蕩 | CYBER SWEEP | `cyber-sweep` |

## Tier suggestion — Gold (HK$28)
Deep combat loop + weapon builds like CYBER NINJA / NEON BASTION. Trial (planned): daily 3 runs; stop after ~8 min / first elite milestone; unlock prompt back to hub.

## v0.1 vertical slice (must feel fun in 60s) — NOT built yet
1. Portrait arena (tilted neon plaza) + one-thumb virtual stick / drag-to-move.
2. Player auto-fires **1 weapon** (neon pulse orb) at nearest foe.
3. **3 enemy types** max: runner, tank, splitter (simple meshes).
4. XP gems → level-up pick **1 of 3** card choices (damage / rate / orbit blades) — 2–3 level-ups in first minute.
5. Survive timer + kill score; death → retry/menu; best time/score in localStorage.
6. Bilingual strings + house/book/gear menu-home; `?demo=1` limp autopilot.
7. Endless planned for v0.2+: capped HP/speed curve, milestone every 2 min, theme shift.

Out of v0.1: full weapon roster, meta unlocks, bosses, Capacitor, ads wiring beyond hub stubs.

## Shell now
- `index.html` kit menu-home (house/book/gear via CyberUI).
- Attract NeonCity; Play/Endless enter scaffold run (timer + score stub only).
- Hub hooks: `readHub` / arcade menu / trial note placeholder.
- `privacy.html`, `robots.txt` Disallow, `noindex`.

## Next coding steps
1. `js/logic.js` + `js/view.js`: move, auto-aim, spawn waves, XP, level-up UI.
2. Juice: Particles / Shockwaves / SynthAudio confirms.
3. `tests/logic.test.mjs` + `tests/smoke.py`.
4. Hub: add `games.json` entry from `docs/GAMES-JSON-STUB.md` when Roy confirms slug/tier.
5. Re-vendor kit only from tagged cyber-kit releases.

## Ad breaks (planned)
Interstitial only on game-over Retry/Menu when `ads=1`. Never mid-swarm / at level-up cards / at milestone banner.
