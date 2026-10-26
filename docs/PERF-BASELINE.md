# Performance baseline — 200 active enemies (real GPU)

**Task:** `PERF-200-REAL-GPU-001`  
**Date:** 2026-10-26 (Asia/Hong_Kong)  
**Repo HEAD when measured:** `c3c0565` (docs-only; live game binary still v0.9.3 / `6ddc483` on GH Pages)  
**Status:** measured on desktop hardware GPU — **not** SwiftShader; **not** phone device-verified.

## Disclosure (test-only runtime controls)

These controls were injected via Puppeteer `page.evaluate` into the live page. Formal `js/*.js`, CSS, assets, bake, and vendor were **not** modified.

1. **Invulnerability** — `game.invuln` held very high + HP topped up so the run never ends mid-measure.
2. **Level-up pause suppressed** — `pausedForLevel` cleared / XP clamped so card UI cannot freeze the sim.
3. **Enemy HP inflated** — spawned enemies set to huge HP so weapons (left **on**) do not instantly clear density.
4. **Maintain ~200 active enemies** — interval tops up to 200 with fixed mix; not cumulative-spawn counting.
5. **Fixed seed / loadout** — reseeding via same-origin `Game({ seed: 200001, mech: 'horn' })` after Start; mix 80 soldier / 60 drone / 40 staffer / 20 walker.

Impact: numbers reflect render + sim cost of a dense live swarm with weapons firing, **not** a normal survival attempt where the player dies or the level-up modal pauses the game.

## Environment

| Item | Value |
|---|---|
| Machine | Roy desktop (`b52e06fe-1990-484b-8424-7ad901ca9a4a`) |
| OS | Microsoft Windows 11 專業版 10.0.26300 |
| GPU | NVIDIA GeForce GTX 1070 Ti |
| Driver | 582.78 (nvidia-smi) / Win32 32.0.15.8278 |
| Power plan | 平衡 (Balanced) |
| Chrome | 155.0.8059.86 |
| WebGL UNMASKED_RENDERER | `ANGLE (NVIDIA, NVIDIA GeForce GTX 1070 Ti (0x00001B82) Direct3D11 vs_5_0 ps_5_0, D3D11)` |
| WebGL vendor | `Google Inc. (NVIDIA)` |
| URL | `https://fung2222.github.io/neon-swarm/?v=0.9.3&lang=en&fps=1&mute=1` |
| Viewport | 1280×800, DPR 1 (confirmed) |
| Glow / bloom | Game default (`stage.setGlow('low')` as shipped) |
| Tab | Headed Chrome, `bringToFront`; background-throttling flags disabled |

Agent box SwiftShader was **not** used for these numbers.

## Method

- Harness: `tests/performance-200-enemies.mjs` (test-only).
- Real `requestAnimationFrame` frame deltas while the normal stage loop runs `tick` + `stage.render` (no manual `game.step` fast-forward as FPS).
- Per run: **10 s warmup** (discarded) + **60 s capture**; **3 runs** same session.
- Enemy count sampled during maintain loop: **200–200** every run.
- Evidence: `tests/performance-results/` (local; not committed by default).

### Reproduce

On the hardware-GPU Windows machine:

```bat
cd C:\Users\fung2\perf-neon
set CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
set OUT_DIR=C:\Users\fung2\perf-neon\results
set RUNS=3
node performance-200-enemies.mjs
```

Or from the repo copy of the harness with `puppeteer-core` available and the same env vars.

## Results (raw rAF inclusive of multi-second stalls)

| Run | Frames | Avg FPS | Avg ms | p95 ms | p99 ms | Worst ms | >33.3 ms | >50 ms |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 2351 | 39.08 | 25.59 | 36.00 | 53.90 | 4295.6 | 390 | 30 |
| 2 | 445 | 7.25 | 137.98 | 54.00 | 1295.70 | 27032.1 | 152 | 32 |
| 3 | 1481 | 24.78 | 40.35 | 88.50 | 158.30 | 5794.8 | 727 | 296 |

### Supplementary (frames ≤1000 ms only — hitch-excluded, not a substitute for raw)

| Run | Trimmed frames | Trimmed avg FPS | # frames >1000 ms |
|---:|---:|---:|---:|
| 1 | 2348 | 45.52 | 3 |
| 2 | 440 | 29.77 | 5 |
| 3 | 1479 | 28.32 | 2 |

**Interpretation:** Run 2 is contaminated by multi-second stalls (worst ~27 s); treat raw run-2 avg FPS as non-representative. Even hitch-excluded, sustained ~200-enemy load sits roughly **~28–46 FPS** on this GTX 1070 Ti / Chrome 155 setup — below a locked 60 FPS. High run-to-run variance means this is a first baseline, not a polished CI gate.

## Input / visual

- Pointer drag on playfield: virtual stick activated; player displaced ~3.27 world units — qualitative **reactive**.
- Screenshot `tests/performance-results/stress-200-enemies.png`: dense neon swarm + HUD visible; **not** black/broken; default glow/bloom visible. Captured near stress start (HUD TIME ~0:01). On-screen FPS counter showed ~56 at that instant (instantaneous HUD, not the 60 s average).

## Errors

- Page errors: none
- Console errors: none

## Limits / not verified

- Not phone / HONOR real-device.
- Not agent-box SwiftShader (correctly excluded).
- Not a claim about shipping balance or “feels smooth in casual play” at natural spawn caps (~60).
- Long stalls may include OS/compositor focus events; flags were set to reduce throttling but Windows is not a closed lab.

## Files

- `tests/performance-200-enemies.mjs`
- `tests/performance-results/*` (JSON/CSV/PNG/probe)
- `docs/PERF-BASELINE.md` (this file)

No formal game source changes. Do not commit until Roy approves.
