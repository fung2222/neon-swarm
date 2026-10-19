# ELITE / BOSS BEAT — design note for NEON SWARM v0.3.5 (proposal, not yet implemented)

Goal: give each run a **named beat with a readable telegraph** so the swarm stops being one continuous blur,
without breaking Roy's visual rules (no red mech hull, no tall props, mech silhouettes not primitives,
props must read at a glance).

## 1. Where it fits
| Run time | Beat | Purpose |
|---|---|---|
| 0:00–2:00 | warm-up waves (current) | build the first 5–6 cards |
| **2:00** | **elite #1 「哨戒長 · SENTINEL PRIME」** | first spike; teaches the telegraph |
| 4:00 | elite #2 (variant, more segments) | second spike |
| **6:00** | boss 「洪流核心 · SWARM CORE」 (only in non-trial runs) | landmark, score payoff |
| after 6:00 | elites every ~90 s, boss every 5 min (endless) | endless pressure without a hard wall |

Trial (`TRIAL.surviveSec = 480`) stays as-is; the boss at 6:00 lands *inside* the trial window so a trial
player can still feel the beat before the cap.

## 2. Elite: 哨戒長 SENTINEL PRIME
- **Silhouette:** heavy biped built from the existing `tank` parts (wide torso, shoulder cannons) at 1.8× scale,
  plus a floating `eliteRing` (kit `TorusGeometry`, acid green) that reads even in a crowded frame.
- **Palette:** violet (`0xb44dff`) hull + acid-green trim — **no red**, per Roy.
- **Telegraph (the whole point):** 1.2 s before a charge, the ring collapses inward and a **ground warning lane**
  (thin additive quad, cyan) draws from the elite toward the player. Sound: rising `synth.osc` sweep.
- **Behaviour:** slow walk → telegraph → **charge** (fast straight line, damaging) → 2 s recover.
  Only one elite at a time; normal spawns pause 1.5 s before it arrives (clean read).
- **HP:** ~90 × `swarmPressure(t).hpMul`; no armour; hit flash on the ring, not the hull (keeps the hull readable).
- **Reward:** 2–3 gold XP gems + a guaranteed **choice of 2 cards** on death (a real spike in power).
- **HUD:** small bilingual banner `精英出現 · ELITE INBOUND` for 1.5 s (zh-HK first, EN under).

## 3. Boss: 洪流核心 SWARM CORE
- **Silhouette:** large hexagonal core (dark plate + acid-green seams) hovering over a slow-rotating ring of
  small drone pods; pods detach as the boss loses HP → the boss *is* the swarm.
- **Phases (HP thirds):**
  1. **Orbit** — spawns runner pods in rings; telegraph floor once per 3 s.
  2. **Volley** — 6-way straight bullet lanes on a 4 s cycle; lanes drawn 0.8 s early (bullet-heaven rule:
     the pattern is always readable before it hurts).
  3. **Frenzy** — spawn rate doubles for 8 s, then recovers to phase 1 timing.
- **HP bar:** thin strip under the top HUD, bilingual label; no screen-blocking UI.
- **Drops:** fixed card choice of 3 + score bonus `5000 × (1 + t/60)`.

## 4. Code shape (small, testable)
- `config.js`: `ELITE`, `BOSS`, `BEATS = [{ at: 120, kind: 'elite' }, { at: 240, kind: 'elite' }, { at: 360, kind: 'boss' }, ...]`.
- `logic.js`: `Game._beatCheck(dt)` → events `{ type: 'beat', kind, name }`, `{ type: 'telegraph', ... }`;
  elite/boss are normal enemies with `elite: true` / `boss: true` so bullets, frost, nova and orbits all work unchanged.
- `view.js`: `enemyMeshFor('elite'|'boss')`, `warningLane()`, `eliteRing` pulse; all reuse existing materials.
- `main.js`: banner text + boss HP strip; sound on telegraph/charge/phase.
- `strings.js`: `beat.elite`, `beat.boss`, `beat.eliteIn`, `beat.bossIn`, `boss.hp` (zh/en pairs).
- `tests/beats.test.mjs`: beats fire at the right times; elite telegraph ≥ 1 s before damage; boss phases
  advance at HP thirds; trial runs still end at 480 s even with a boss alive.

## 5. Order of work
1. Logic + tests (no visuals) → confirm pacing numbers in `tests/balance.test.mjs` (target: circling player
   reaches elite #1 alive, dies somewhere in 2–4 min — see HANDOFF §6.4 for the current baseline).
2. Elite visuals + telegraph, phone 412×915 first.
3. Boss + HP strip + banner bilingual pass.
4. English pass, desktop 1280×800, `?demo=1` (demo must survive a modern enough run to show a beat, or skip beats).
