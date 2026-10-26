# Performance baseline — 200 active enemies (real GPU)

**Task:** `PERF-REBASELINE`  
**Date:** 2026-10-26 (Asia/Hong_Kong)  
**Repo HEAD when measured:** `4fa3f4a` (or later on `main`; live game binary **v0.9.20**)  
**Status:** measured on desktop hardware GPU — **not** SwiftShader; **not** phone device-verified.  
**Do not treat as playability done.**

## Disclosure (test-only runtime controls)

These controls were injected via Puppeteer `page.evaluate` into the live page. Formal `js/*.js`, CSS, assets, bake, and vendor were **not** modified.

1. **Invulnerability** — `game.invuln` held very high + HP topped up so the run never ends mid-measure.
2. **Level-up pause suppressed** — `pausedForLevel` cleared / XP clamped so card UI cannot freeze the sim.
3. **Enemy HP inflated** — spawned enemies set to huge HP so weapons (left **on**) do not instantly clear density.
4. **Maintain ~200 active enemies** — interval tops up to ~200 with fixed mix; not cumulative-spawn counting.
5. **Fixed seed / loadout** — reseeding via same-origin `Game({ seed: 200001, mech: 'horn' })` after Start; mix 80 soldier / 60 drone / 40 staffer / 20 walker.

Impact: numbers reflect render + sim cost of a dense live swarm with weapons firing, **not** a normal survival attempt where the player dies or the level-up modal pauses the game.

## Environment

| Item | Value |
|---|---|
| Machine | Roy desktop (`b52e06fe-1990-484b-8424-7ad901ca9a4a`) |
| OS | Microsoft Windows 11 專業版 10.0.26300 |
| GPU | NVIDIA GeForce GTX 1070 Ti |
| Driver | 582.78 (nvidia-smi) |
| Power plan | 平衡 (Balanced) |
| Chrome | 155.0.8059.86 |
| WebGL UNMASKED_RENDERER | `ANGLE (NVIDIA, NVIDIA GeForce GTX 1070 Ti (0x00001B82) Direct3D11 vs_5_0 ps_5_0, D3D11)` |
| WebGL vendor | `Google Inc. (NVIDIA)` |
| URL | `https://fung2222.github.io/neon-swarm/?v=0.9.20&lang=en&fps=1&mute=1` |
| Viewport | 1280×800, DPR 1 (confirmed) |
| Glow / bloom | Game default desktop path (MOBILE_GFX cuts do **not** apply) |
| Tab | Headed Chrome, `bringToFront`; background-throttling flags disabled |

Agent box SwiftShader was **not** used for these numbers.

## Method

- Harness: `tests/performance-200-enemies.mjs` (test-only; now defaults to `?v=0.9.20`).
- Real `requestAnimationFrame` frame deltas while the normal stage loop runs `tick` + `stage.render` (no manual `game.step` fast-forward as FPS).
- Per run: **10 s warmup** (discarded) + **60 s capture**; **3 runs** same session.
- Enemy count sampled during maintain loop: **200–201** every run.
- Evidence (local / optional small JSON): `tests/performance-results/` — large CSV/PNG dumps **not** committed by default.

### Reproduce

On the hardware-GPU Windows machine:

```bat
cd C:\Users\fung2\perf-neon
set CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
set OUT_DIR=C:\Users\fung2\perf-neon\results-v0920
set RUNS=3
set GAME_URL=https://fung2222.github.io/neon-swarm/?v=0.9.20&lang=en&fps=1&mute=1
node performance-200-enemies.mjs
```

Or from the repo copy of the harness with `puppeteer-core` available and the same env vars.

## Results (v0.9.20 — raw rAF)

| Run | Frames | Avg FPS | Avg ms | p95 ms | p99 ms | Worst ms | >33.3 ms | >50 ms |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 3600 | 60.00 | 16.67 | 16.80 | 16.80 | 16.90 | 0 | 0 |
| 2 | 3587 | 59.78 | 16.73 | 16.80 | 16.90 | 66.70 | 7 | 1 |
| 3 | 3494 | 58.23 | 17.17 | 18.00 | 18.20 | 66.70 | 8 | 4 |

**Interpretation:** On this GTX 1070 Ti / Chrome 155 desktop, live **v0.9.20** sustains roughly **~58–60 FPS** under the disclosed ~200-enemy stress (weapons on, HP inflated). Runs 2–3 show a few brief hitches (worst ~67 ms) but no multi-second stalls. This is a **desktop** baseline only — **not** phone-verified, **not** a claim that casual play at natural spawn caps is “done,” and **not** playability acceptance.

Compared with the previous v0.9.3-era baseline (below), this session is far cleaner (near display refresh, low hitch count). Treat as rebaseline evidence after content/GPU-cut work through v0.9.20; desktop `MOBILE_GFX` path was unchanged by phone cuts, so gains vs 0.9.3 may also reflect cleaner measurement conditions (fewer OS/focus stalls) and cumulative ship changes since then.

## Input / visual

- Pointer drag on playfield: virtual stick activated; player displaced ~3.24 world units — qualitative **reactive**.
- Screenshot captured locally on the desktop machine (`results-v0920/stress-200-enemies.png`); not committed (multi-MB). Dense swarm + HUD expected; page/console errors: **none**.

## Errors

- Page errors: none
- Console errors: none

## Limits / not verified

- Not phone / HONOR real-device (Roy deferred phone GPU / mid-run WebGL for later).
- Not agent-box SwiftShader (correctly excluded from baseline numbers).
- Not a claim about shipping balance or “feels smooth in casual play” at natural spawn caps (~60).
- Not HIT-FEEL-DEVICE or HORN silhouette acceptance.

## Previous baseline (v0.9.3 era — historical)

Measured earlier the same day on the **same** GTX 1070 Ti / Chrome 155 / 1280×800 setup against `?v=0.9.3`. Raw averages were highly variable (~7–39 FPS) with multi-second stalls (worst ~27 s on run 2). Hitch-excluded rough band was ~28–46 FPS. Kept here only for comparison; **superseded** by the v0.9.20 table above for current desktop baseline.

| Run (v0.9.3) | Avg FPS (raw) | Worst ms |
|---:|---:|---:|
| 1 | 39.08 | 4295.6 |
| 2 | 7.25 | 27032.1 |
| 3 | 24.78 | 5794.8 |

## Files

- `tests/performance-200-enemies.mjs`
- `tests/performance-results/summary.json` (+ small run/probe JSON; CSV/PNG local-only)
- `docs/PERF-BASELINE.md` (this file)

No formal game source / balance changes for this task.
