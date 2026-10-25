# 暴走機甲 RAMPAGE MECH — Handoff

> For the next AI / human continuing this game.  
> **Contact style (Roy):** 解釋用繁體中文（廣東話都睇得明）；code、路徑、指令、commit message 用英文。UI copy 一律 **zh-HK 先行**，英文細字／small caps 喺下面。  
> Timezone: **Asia/Hong_Kong (UTC+8)**. Owner: **fung2222 (Roy Chan / 嘉豐)**.

**Status:** **v0.6.1** PNG sprite billboards (player idle/move/fire, colour-coded enemies, doctor NPC prop) · kit **v0.3.16** · CYBER ARCADE tier **Gold** · `games.json` status **wip**  
**HEAD:** v0.6.1 on `main` · 2026-10-25 HKT  
**Live:** https://fung2222.github.io/neon-swarm/ · demo `?demo=1` · trial probe `?hub=1&trial=1`  
**Repo:** https://github.com/fung2222/neon-swarm

---

## 1. What it is
3D bullet-heaven / survivor (Vampire Survivors–style): auto-fire, weapon + armor cards on level-up, endless swarm pressure. Player pilots a **violet + acid-green horned cyber mech** (fan homage to classic purple EVA aesthetics — **no logos / names / trademarks**) across an **open wilderness** arena (soft edge, not a tight ring). Hostile units are **robot/mech silhouettes**, not pure primitives.

## 2. SHA timeline (scaffold → current)

| SHA | When (HKT) | Note |
|---|---|---|
| `2d27836` | 2026-10-18 | v0.0 scaffold — cyber-kit v0.3.16 menu-home shell |
| `6f7aaf8` | 2026-10-18 | v0.1 bullet-heaven playable slice |
| `90a34b4` | 2026-10-18 | fix: `stage.render` so WebGL canvas is not black |
| `0ba6165` | 2026-10-18 | v0.2 polish — weapons, waves, juice, stick |
| `f007c02` | 2026-10-18 | cyberpunk hover-mech silhouette (replaces blob) |
| `7442fe9` | 2026-10-18 | **v0.3** open wilderness redesign |
| `a7785d9` | 2026-10-18 | v0.3.1 camera follow, mech anim, denser particles & swarm |
| `5397507` | 2026-10-18 | v0.3.2 EVA-mech palette, follow-stick, mech foes, big emblems |
| `4fef9ba` | 2026-10-18 | **v0.3.3** playfield stick — HUD overlay dead-zone |
| `71513d3` | 2026-10-19 | tests only — `tests/health.test.mjs` + `tests/balance.test.mjs` (no game code) |
| `66273e8` | 2026-10-19 | **v0.3.4** level-up fix — silent chime + cards ran dry after level 6 |
| `832096d` | 2026-10-19 | v0.5.0 rebrand 暴走機甲 / RAMPAGE MECH · three frames · human manhunt |
| `7776e74` | 2026-10-19 | v0.5.1 home layout — desktop copy left, showcase right |
| v0.6.0 | 2026-10-19 | **art pass** — anime mecha + hostiles, per-weapon shots, cube drops, staged kills goal, score+time results (**current**) |

Hub card: `fung2222/cyber-arcade@501e4e6` (WIP thumbs; stage line may still say v0.2 until hub sync — prefer this HANDOFF).

## 3. Current gameplay / tech snapshot
- **Kit:** vendored `vendor/cyber-kit/` **v0.3.16** (`VERSION` file).
- **Loop:** survive waves → XP → level-up cards (weapons / armor / util) → escalating `swarmPressure(t)`.
- **Camera:** full player follow; mild pinch/wheel zoom via kit `ViewInput` with `oneFingerOrbit: false` (first finger = move stick).
- **Stick:** drag-anywhere on `window`; stick/glow relocates under press; idle corner hint faint; no opaque finger disc.
- **Particles:** kit `Particles` pool **5200**.
- **Ads:** `naturalBreak` on game-over when `ads=1`. Never mid-swarm or on level-up cards.
- **Trial (partial):** `TRIAL.surviveSec = 480` (~8 min); hub flags via `readHub`. Unlock → hub `openStore` **not fully wired**.
- **i18n:** zh-HK / en via kit `i18n` + `js/strings.js`; `localStorage cyber.lang`.
- **Layout:** `#screen-start.menu-home` (kit home zones). House / book / gear only on home (`kit ≥ 0.3.15`).

Key files: `js/{main,view,logic,config,audio,strings}.js` · `css/game.css` · `index.html` · `tests/{logic,levelup,health,balance}.test.mjs` · `tests/smoke_files.py`.

## 4. v0.3.3 stick fix (do not regress)
- **Root cause:** kit `.hud-buttons { bottom: … }` + game `.hud-buttons.top { top: … }` left **both** `top` and `bottom` set → mute/pause strip stretched ~full height with `pointer-events: auto`, eating the right (and bottom-right) playfield. Stick listener also wrongly ignored `#hud` (full-screen overlay).
- **Fix:** `bottom: auto; height: auto` on `.hud-buttons.top`; decorative HUD `pointer-events: none`; drag-anywhere on `window`, excluding only real UI (`button` / `.icon-btn` / cards).

## 4b. v0.3.4 level-up fixes (do not regress)

1. **Silent level-up chime.** `SwarmAudio` had an instance method `level()`, but `SynthAudio` already owns `this.level` (a **number** — the music level), so the method was shadowed and every level-up threw `audio.level is not a function`. Renamed to **`levelChime()`**.
   - Rule: never name a `SwarmAudio` method the same as a `this.*` property in `vendor/cyber-kit/audio/synth.js`. `tests/health.test.mjs` now fails on any such collision.
2. **Cards ran dry after level 6.** All 15 cards could be taken repeatedly, so they were all "taken" and the pool emptied: `pickCards` returned `[]`, `showLevelCards` opened an empty panel (or nothing), and the run continued with **no more upgrades**. Now:
   - Cards carry an optional `max` (rate 6, orbit 4, spread 3, pierce 4, multi 3, nova 6, frost 3, rail 4, armor 3, deflect 3, speed 5, magnet 4; `dmg` / `plating` / `hp` uncapped). `spread` is now capped at 3 to match its own text.
   - `Game.taken` counts picks; `pickCards(rng, n, taken)` filters exhausted cards; if the capped pool is empty the draw falls back to the uncapped cards, so **a level-up always yields a choice**.
   - Card UI shows a `n/max` stack badge; the pick handler uses a snapshot of `taken` (incrementing during the panel build hid the badge).
   - Regression coverage: `tests/levelup.test.mjs` (200+ level-ups, no empty pick, no over-cap offer).

## 4c. v0.5.0 rebrand — gotchas that cost time (do not regress)

1. **Drop rendering pool.** `View.sync` rebuilds `gemG` every frame. A mesh must never be both in the scene and in the pool: the old `_take()` helper re-parented without popping, which rendered a trail of duplicate letter cubes for one drop. The current code pops the slot, tags `userData.poolKey`, and sweeps `_dropLive` (last frame's slots) *after* placing this frame's drops. Letter/icon textures are cached once per glyph (`LETTER_TEX` / `WEAPON_TEX`).
2. **Menu showcase vs in-run mech.** `showMenu()` calls `view.setMenuMech(id)` + `view.setPlayerVisible(false)`; `startRun()` calls `hideMenuMech()` + `setPlayerVisible(true)`. Without this, two mechs render on top of each other on the home screen. `disposeTree()` must dispose **materials too**, or every frame switch leaks GPU memory.
3. **Human scale.** Humans are scaled 1.24–1.5 in `humanMesh()`; at 1.0 they vanish next to a 3 m mech on a 412 px phone.
4. **Balance is data.** `swarmPressure()` (density / hp / speed) and `waveMix()` (who spawns when) in `js/config.js`, plus the enemy cap and wave burst size in `js/logic.js`, are the knobs. Re-run `tests/balance.test.mjs` after touching any of them — the first tuning pass dropped the median to 52 s, which is why the cap went 55 → 24.

## 4d. v0.6.0 art pass (what changed, and the rules behind it)

**Player frames.** `buildPlayerMech(cfg)` uses a stylised Japanese-anime mecha language: beveled
armour (`beveledGeo`), trapezoid slabs (`slab`) for pauldrons / skirt / shins, a separate helmet with
visor and brow V-fin, backpack thruster cones, skirt armour and elbow joints. Fan-style silhouette
language only — no specific design, name or logo.

**Hostiles.** Humans first, and they must read against a dark blue floor:
- `humanMesh()` — coat/vest torso, helmet or hair, glowing eyewear, weapon arm, boots.
- Each type owns an accent colour used for the **visor, chest stripe and unit ring**:
  staffer coral `#ff3b6e`, guard amber `#ffb020`, soldier cyan `#35d6ff`, officer pink `#ff7ae6`,
  chief gold `#ffe600`, walker gold `#c9a227`, escort mech magenta `#ff2bd6`, drone cyan.
- `unitRing()` is deliberately **small and thin** (0.34–0.52 radius, 0.3–0.34 opacity). An earlier
  pass used 0.5–0.8 at 0.5–0.75 and the rings swallowed the units.
- Rule: never use plain green for a ground unit (it merges with the floor glow) and never rely on
  size alone to separate tiers — colour + silhouette + ring together.

**Projectiles.** `WEAPON_SHOT` in `js/config.js` maps every weapon to `{ shot, tiers[3], size }`.
`shotTier(stacks)` picks the colour band (0–1 / 2–3 / 4+ stacks). `view.js` builds one geometry per
shot kind — `bolt`, `spike`, `blade` (crescent), `star`, `lance`, `wave`, `orb` — pools meshes per
`weapon:tier`, and adds a **thin torus ring** (two at tier 2) rather than a glow sphere. The first
attempt used a translucent sphere and it hid the silhouette completely.

**Drops.** One solid cube per pickup with an icon face that billboards to the camera
(`DROP_TEX` cache): `X` XP (green), `H` repair (cyan), weapon (gold, emblem drawn per weapon
family: gun / blade / orb / lance / star). The cube only sways ±0.25 rad — a full spin turned the
icon away from the camera.

**Contract goal + results.** `Game.goalKills` starts at 40; each clear adds +40/+10 and scores
`250 × goalsCleared`. The HUD shows kills still needed; the results screen puts **score** and
**time** in two big cards, with kills and contracts cleared underneath.

**HUD layout.** Desktop: `[HP|LV] … [GOAL] … [TIME|SCORE] [mute][pause]`, right panel offset
112 px so the 44 px icon buttons never overlap it. Phone (≤560 px): same row, smaller type, goal
chip drops to its own line under the left panel. `verify/hud.mjs` asserts zero overlap rectangles.

## 5. Testing a browser build (important)
- **Use GPU.** Launch headless Chromium with **no GL flags** — on Roy's machine that picks the NVIDIA D3D11 path (60 FPS). Adding `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader` drops to **~3 FPS**, the game looks frozen, and every recorded timestamp is wrong. Only use SwiftShader to *reproduce* a slow device.
- `?fps=1` shows the FPS/rate chip in-game; `?lang=en|zh`, `?demo=1`, `?autostart=1` are the other useful flags.
- A drag-stick run needs a real `Input.dispatchTouchEvent` drag; keyboard `WASD` only works on non-touch contexts (mobile emulation ignores it).

## 6. Known issues / gaps
1. **Trial unlock UX incomplete** — survive-sec gate exists; elite-milestone + “unlock Gold → return to hub store” path still TODO (see stub trial.rule).
2. **Hub `games.json` name/thumb may lag** — v0.5.0 renamed the game to 暴走機甲 / RAMPAGE MECH; the hub entry (name + thumbAlt) must match. Sync hub when touching cyber-arcade.
3. **No Android / Capacitor** packaging yet (`play: not-submitted`).
4. **Balance / content** — no named elite/boss beats yet (see `docs/BEATS-PLAN.md`). Baseline from `tests/balance.test.mjs` (v0.5.0, seeded, auto-pick first card): circling median **~212 s** (spread 103–299 s); idle ≈ 13 s; fleeing ≈ 31 s. Frames: heavy tanks longest, proto shortest in sim. Long-run pacing still untested by Roy on a phone.
5. **Smoke** — `tests/{logic,levelup,health,balance}` + `tests/smoke_files.py` run headless; a Playwright pass (412×915 + 1280×800, zh + en, zero console errors) passes as of v0.3.4 but is **not committed to the repo** — re-run it before calling “done”.
6. **Trademark hygiene** — the horn and heavy frames are palette/silhouette homages only. Never ship names, logos, or exact reproductions; keep the neutral frame names.

## 7. Next steps (suggested order)
1. Roy playtest on phone + desktop (`?demo=1`, real stick, frame picker, level-up cards, 3+ min run) — v0.5.0 is the first build with the new name, frames and human enemies.
2. One elite/boss beat + readable telegraph (`docs/BEATS-PLAN.md` has the design); then another balance pass (run `tests/balance.test.mjs` before/after).
3. Finish trial → `returnToHub({ openStore: true })` when cap hits; align `games.json` trial.rule.
4. Refresh hub thumb from a live frame-picker shot; update `name` / `thumbAlt` zh+en.
5. Only after Roy says go: Capacitor 8 + AdMob stubs.

## 7. Roy preferences (binding for this series)
- **Language / contact:** 對 Roy 同 handoff 解釋用 **zh-HK（廣東話都睇得明）**；code / paths / shell / commits 用 English.
- **UI:** every string bilingual zh-HK + en; zh first, EN under; shared `cyber.lang`.
- **Never port `fung2222/sono` code** — concepts only; rebuild on cyber-kit.
- **Original IP only** — no trademarked names, console trade dress, gambling wheels.
- **Mobile-first** portrait one-thumb where possible; still good on desktop.
- **Juice** without muddy bloom — kit Glow default LOW; moderate haze.
- **Ads** only at natural breaks; paid tiers no forced interstitials.
- **Tier rule:** genre saturated with free Play clones → Free; distinctive mid/large → Silver/Gold. Swarm = **Gold**.
- **Web not public for now** — public arcade root is placeholder; monetised hub lives at Roy’s **unlisted lab URL** (from memory/owner — **do not commit the path**).
- **Author credit:** 嘉豐 on fighter restart and recent game commits.

## 8. Kit menu-home rules (bilingual) — v0.3.8 → v0.3.16
Apply on every CYBER game home (`#screen-start` + class `menu-home`):

| Rule | Detail |
|---|---|
| Zones | `.menu-top` / `.menu-brand` / `.menu-cta` / `.menu-meta` — brand mid-high, Start lower, mid breathing gap |
| Icons | **House** (Arcade Menu, only if `shouldShowArcadeMenu`) · **Book** (howto: 玩法｜操控｜私隱) · **Gear** (settings: lang / mute / volume / glow) |
| v0.3.15 | Home icons **only** on `#screen-start` / `.menu-home`; hide off-home leftovers |
| How-to | `CyberUI.howto` / `mountHowto` — content bilingual; privacy tab links `privacy.html` |
| i18n | `i18n.add({ key: ['中文', 'English'] })`; toggle persists `cyber.lang` |
| Hub return | `readHub` / `returnToHub` / `kit.arcadeMenu` — show 「選單 · 其他遊戲」 when `hub=1` or `ret=` |
| ViewInput | v0.3.16 shared pinch zoom / orbit **in-play only**; swarm uses `oneFingerOrbit: false` |

Kit tag: `fung2222/cyber-kit@v0.3.16` (`0272c8a`).

## 9. Hub `games.json` tiers (CYBER ARCADE)
Source of truth: `fung2222/cyber-arcade/games.json`.

| Tier | Games (ids) |
|---|---|
| **Free** | `cyber-snake`, `data-fuse`, `neon-recall`, `cyber-mini-pack` |
| **Silver** | `neon-stick-duel`, `neon-stick-run`, **`neon-sort` (wip)** |
| **Gold** | `cyber-ninja`, `cyber-board`, `cyber-tower`, **`neon-swarm` (wip)** |

Trial default: 3 runs/day + per-game caps. Stub for this repo: `docs/GAMES-JSON-STUB.md`.

## 10. Session context (2026-10-17 → 2026-10-19)
- Fighter **neon-stick-duel** work **paused** after sprite FULL RESTART (`c1c82ab`) — do not resume unless Roy asks.
- Run / tower / board polished (board i18n + volume; tower close radial after place; camera zoom/rotate on games **2,3,5,8,9** via kit ViewInput 0.3.16 → data-fuse, neon-recall, cyber-mini-pack, cyber-board, cyber-tower).
- New games: **neon-swarm (Gold)** + **neon-sort (Silver)**; hub WIP cards + thumbs.
- Swarm iteration focus ended at **`4fef9ba`**.
- **2026-10-19 (this session):** audited swarm against the HANDOFF, added the test suite (`71513d3`), shipped **v0.3.4** level-up fixes. Roy chose direction **A: keep polishing the swarm** over neon-sort for now.

## 11. Dev
```bash
cd /workspace && python3 -m http.server 18940
# http://127.0.0.1:18940/neon-swarm/
```

Run the headless suite before pushing:
```bash
node tests/logic.test.mjs && node tests/levelup.test.mjs && node tests/health.test.mjs
node tests/balance.test.mjs   # long-run pacing numbers (prints 30/60/…s marks)
python tests/smoke_files.py
```


## 4e. v0.6.1 PNG sprites (2026-10-25)

Approved art wired as camera-facing billboard planes (not procedural meshes):

- `assets/sprites/player_{idle,move,fire}.png` — state swap by move / muzzle
- `assets/sprites/enemy_{magenta,lime,orange}.png` — type map in `js/sprites.js` (`ENEMY_SPRITE_KEY`)
- `assets/sprites/npc_doctor.png` — map prop near spawn `(3.6, 0, -2.4)` until a shop hook exists
- Cache bump `?v=0.6.1` on `css/game.css` + `js/main.js`
- **Later:** VFX / shot feel (Roy: one-pellet fire feels weak) — sprites-first, no big VFX rewrite in 0.6.1
