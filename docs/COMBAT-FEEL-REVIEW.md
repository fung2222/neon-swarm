# COMBAT-FEEL REVIEW + V1 Prototype

> **Task merge:** t308 art brief · t309 COMBAT-FEEL-PROTOTYPE-001 · t310 COMBAT-FEEL V1  
> **Base tip:** v0.9.204 `131fc2d` MOBILE-WEBGL-DIAG — **do not undo** WebGL diag.  
> **Status:** Review + **preview prototype only**. **NOT** merged to live tip. Soft-juice invent ban still applies for formal ship.  
> **Wait Roy confirm** before any main tip bump for feel.

---

## 0. Deliverable map

| Item | Path |
|---|---|
| This review | `docs/COMBAT-FEEL-REVIEW.md` |
| Proto knobs + helpers | `js/combat-feel-proto.js` |
| How to open | `prototypes/combat-feel/README.md` |
| Branch | `proto/combat-feel-v1` |
| Gate | `?feelProto=1` (**OFF by default** — live tip feel unchanged) |
| Tests | `tests/combat-feel-proto.test.mjs` |
| Screenshots | `tests/screenshots/combat-feel-proto/` |

**NOT shipped to live tip:** no version bump past v0.9.204, no Pages default tip change, no damage/RoF/HP/hit-test/drop edits.

---

## 1. Ownership map (file / function evidence)

### 1.1 Fire

| Layer | Owner | Evidence |
|---|---|---|
| Emit fire event + muzzle coords | `js/logic.js` → `_emitBullet` / weapon tick → `events.push({ type: 'fire', weapon, muzzleX/Y/Z, … })` (~1818+) | Shared `muzzleWorld` from `js/muzzle.js` |
| Muzzle timer for anim | `logic.js` sets `this.muzzle = 0.06…0.18` per weapon; decays in `step` (~4536) | Drives view fireKick |
| SFX | `js/main.js` event loop `ev.type === 'fire'` → `audio.fire()` (~2000) | `js/audio.js` `SwarmAudio.fire()` |
| Particles / recipe | `main.js` `applyFeelBursts(muzzle, muzzleFeelFx(ev.weapon, …))` (~2010) | Recipes: `js/weapons-feel-fx.js` `muzzleFeelFx` / `FEEL_MUZZLE.gatling` |
| HUD slot pulse | `pulseWeaponSlotFire` via `js/slot-fire-pulse.js` | Yellow flash on rail |
| Hero recoil pose | `js/view.js` `sync()` uses `fireKick = game.muzzle`; procedural arms pull back (~3110); **2D puppet** `js/q-hero-2d-puppet.js` `syncHorn2dPuppet` `attackKick` (~514–525) | Current tip path = 2D puppet (`HORN_2D_SKELETON`, v0.9.203) |

### 1.2 Hit (player bullet → enemy)

| Layer | Owner | Evidence |
|---|---|---|
| Hit test | `logic.js` bullet loop `relativeSegmentHitsCircle` (~4274) | Continuous segment vs enemy |
| Damage | `logic.js` `_applyEnemyDamage` (~2939) — sets `e.hp`, `e.hit` timer | **No knockback position change** |
| Event | `events.push({ type: 'hit', x,z,color,kind,heavy,dmg,id })` (~4280) | `heavy` only for rocket/laser/grenade — **gatling hits are never heavy** |
| SFX / FX | `main.js` `ev.type === 'hit'` → `audio.hit()` + `particles.burst` capped `burstN(Math.min(n,8))` (~2058) | Heavy → tiny `kickFx` only |
| Float numbers | `spawnCombatFloat` → `js/damage-numbers.js` | Throttled per enemy id |
| Enemy flash | `view.js` sync enemies: `applySpriteFlash(m, { hit: e.hit > 0 })` (~3183); mesh emissive boost (~3189) | `sprites.js` `applySpriteFlash` (~338) slight white tint |

### 1.3 Hurt (player takes damage)

| Layer | Owner | Evidence |
|---|---|---|
| Logic | `logic.js` many AI ticks → `this.hitFlash = 0.28` + `events.push({ type: 'hurt', amount })` | Invuln separate |
| Presentation | `main.js` hurt → `audio.hurt()`, `kickFx`, vignette, float (~2172) | Contract: **does not lock stick** (`HIT-FEEL-DEVICE` B1) |
| Hero tint | `view.js` / puppet `hit` → material tint | Tint only — run continues (`sprites.js` comment ~574) |

### 1.4 Death / kill

| Layer | Owner | Evidence |
|---|---|---|
| Remove + drops | `logic.js` `_kill(e, i, events)` (~2445) — splice enemy, score, gems | Dead enemies leave array → **stop dealing damage** |
| Kill event | `events.push({ type: 'kill', enemy, gore, elite })` | `isPunchKill` (~234): elites/heavy weapons only |
| Ordinary FX | `main.js` kill: local `particles.burst` only (~2086); **no** ring/wave/slowmo for grunts (v0.9.22 comment) | Elite/gore: ring + wave + `burstGore` + flash + kick |
| Scraps | `view.js` `burstGore` → `spawnFragments(..., n=10)` (~2898 / ~1605) | Only punch path today |

### 1.5 Combo / streak

| Layer | Owner | Evidence |
|---|---|---|
| State | `js/kill-streak.js` `noteStreakKill` — window 2200ms, milestones 5/10/15 | **Feedback only** — no DPS/XP mul |
| UI | `main.js` → `showEarlyToast` (~2110) | Kick only if `sk.kick` (milestone ≥10) |
| Break | `noteStreakBreak` on player hurt/dead | |

---

## 2. What exists / enabled / stubbed

### Enabled (live tip)

- Per-weapon **muzzle / explode recipes** (`weapons-feel-fx.js`) applied through pooled Particles / Shockwaves.
- Gatling = cyan bolt muzzle (4+2 sparks; mobile sheds secondary).
- Hit particles + dmg floats + soft hit SFX.
- Ordinary kill = small local burst; elite = punch package.
- Kill-streak toasts; first-kill toast; slot fire pulse.
- Player hurt vignette + kick (mobile-clamped via `kickFx`).
- Hero 2D puppet attack kick on `firing`.
- Enemy `e.hit` white tint (~0.12s).
- Mobile GPU shed skips particles/post; cool-pause; WebGL diag (v0.9.204).

### Present but weak / incoherent for “weighty funny cartoon”

- Gatling **hit** never sets `heavy` → no hit-stop / trauma on MG spray (by design for dense combat, but feels soft).
- Ordinary kill has **no scraps**, no lean/wobble — only a brief tint.
- Muzzle recipe is static (same burst every shot) — variety flag `mobileSkip` only sheds, doesn’t randomize.
- Puppet recoil exists but is subtle; baked sprite path has **no** gun-kick offset (gun plane stays planted).
- No enemy hurt **motion** (wobble/lean) — AI/collision untouched, but presentation reads “flash only”.
- Feel recipes are pure data; **no central presentation config** for hit lean / death scrap / recoil mul.

### Stub / out of scope (do not invent for formal ship)

- Soft-juice invent (HANDOFF / AGENT_TASK hard ban).
- Phase 4 abilities / more ult / BALANCE re-pass / §9 art lock.
- Full per-enemy anim packs; concept art as in-game textures.

---

## 3. Why feel may not cohere

1. **Fire loud, hit soft:** muzzle FX + SFX fire every shot; hit FX throttled and non-heavy for gatling → brain expects punch that never arrives on a spray kill chain.
2. **Kill tier gap:** grunt death is intentionally quiet (v0.9.22 anti-clutter); elite punch is loud — arcade “every kill pops” fantasy is missing for the **most common** enemy.
3. **No body language on grunts:** `e.hit` only tints; `applySpriteMotion` walk bob continues unchanged — no funny lean.
4. **Hero path split:** tip combat = 2D puppet (v0.9.203); recipes assume generic muzzle particles — puppet weapon kick not tied to feel recipe knobs.
5. **Combo is toast-only:** streak UI works, but no gentle escalation of *kill pop* intensity between milestones (only a tiny kick at ×10).

---

## 4. What to reuse (no architecture rewrite)

| System | Reuse how |
|---|---|
| `weapons-feel-fx.js` + `applyFeelBursts` | Swap / augment gatling steps when proto on |
| `Particles` / `Shockwaves` pools + `burstN` | Cap counts; never new unbounded pools |
| `spawnFragments` / `burstGore` | Pass **capped** scrap count on grunt kill |
| `kill-streak.js` | Keep milestones; no every-kill shake |
| `damage-numbers.js` | Keep throttle |
| `SwarmAudio.fire/hit/kill` | Keep; optional vol nudge later (not in V1) |
| `e.hit` timer + `applySpriteFlash` | Amplify tint + add lean in **view only** |
| `syncHorn2dPuppet` attackKick | Scale by `recoilStrength` when proto |
| `MOBILE_GFX` / shed / `kickFx` clamps | Always respect |
| URL / hub / pause / touch | Untouched |

---

## 5. Presentation improvements **without** balance / hit-test changes

Allowed (proto):

- Stronger short muzzle + 2–3 flash varieties (particles only).
- Puppet upper-body / weapon recoil multiplier.
- On **real** `hit` events: brighter sparks, stronger tint, **visual lean/wobble** (no `e.x/e.z` push).
- On ordinary grunt `kill`: short pop + ≤4 scraps; no full-screen flash; no every-kill camera shake.
- Streak: reuse toast; optional slightly clearer toast only at milestones.

Forbidden:

- Damage, RoF, HP, hit radius, drop rates, pierce, overheat numbers.
- Engine / render architecture swap; new heavy deps.
- Unbounded timers/listeners; dispose of shared geo/mat/tex.
- Claiming Android OK without Roy phone.

---

## 6. Art director notes (t308 fold-in)

### Hero silhouette path (current)

- **Combat tip:** `HORN_2D_SKELETON` → `js/q-hero-2d-puppet.js` charcoal+cyan bone doll (idle/walk/attack).
- **Select/menu:** `buildPlayerMech` procedural 3D (`view.js` / `mech-builder.js`).
- **Mixamo true-3D:** off (`HORN_TRUE_3D=false`); baked PNG path remains fallback for non-horn.
- Silhouette cues: single horn, cyan core, rifle — art-bible §4. Funny exaggerated = lean into **attackKick** + readable muzzle cyan, not bloom wash.

### Particles / shake / SFX locations

- Particles: cyber-kit `Particles` in `main.js` (~245).
- Shockwaves: `Shockwaves` (~251).
- Camera shake / trauma: `FxState` via `kickFx` + `fx.shake` in play loop (~2419).
- SFX: `js/audio.js`.
- DOM flash: `#fx-flash`; hurt edge: `flashHurtVignette`.

### Improves without architecture change

- Proto knobs + view lean + puppet recoil mul + capped grunt scraps.
- Keep dim arena / restrained bloom (art-bible §5).

### Hurts Android (avoid)

- Full-screen white flash spam; per-kill trauma; uncapped fragments; rings on mobile; disposing shared materials; raising bloom; long transparent overlays; new per-frame allocations in hot loops.
- v0.9.126 shed already skips feel rings / particle ticks — **do not** fight shed.

---

## 7. Minimal prototype design (one weapon + one grunt)

**Weapon:** `gatling` (starter full-auto).  
**Grunt:** `soldier` / lab `human` family non-elite (see `COMBAT_FEEL_V1.gruntKinds`).

| Beat | Design | Knob |
|---|---|---|
| A Fire | Short muzzle, cyan variety ×3, puppet recoil↑ | `muzzleFlashDuration`, `muzzleVariety`, `recoilStrength` |
| B Hit | Real hits only; sparks + tint; **lean not knockback** | `hitSparkCount`, `hitLeanAmp` |
| C Hurt funny | Short wobble while `e.hit>0` | `hurtWobbleAmp`, `hurtWobbleHz` |
| D Kill | Short pop + ≤4 scraps; no elite boom | `deathParticleCount`, `deathScrapCount` |
| E Combo | Existing streak toast; kick only ≥10 | `streakKickMul` (1.0) |

Gate: `?feelProto=1`. Default off → **identical** to v0.9.204 feel.

---

## 8. Android checklist (Roy must verify — box ≠ phone)

- [ ] Mid-run no「繪圖暫時中斷」with `feelProto=1` for 2–5 min.
- [ ] Gatling spray readable; no white-out.
- [ ] Grunt wobble does not look like teleport / stuck AI.
- [ ] Particle count stays sane in dense waves (shed still rises).
- [ ] Pause / hub return / URL params still work.
- [ ] Compare `feelProto=0` vs `=1` same build.

**Box / SwiftShader ≠ device.** Do **not** claim phone OK from this review.

---

## 9. How to revert

```bash
# Discard proto branch work / stay on tip:
git checkout main   # tip remains v0.9.204 131fc2d

# Or keep branch but play without proto:
open '.../neon-swarm/?v=0.9.204'          # flag off
# vs preview:
open '.../neon-swarm/?feelProto=1&autostart=1'
```

If any main commit ever lands with flag off, revert that commit; tip feel stays as before.

---

## 10. Next

**Wait Roy confirm** (肉眼 on preview) before formal integrate tip / version bump for feel.
