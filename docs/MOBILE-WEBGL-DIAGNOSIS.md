# Mobile WebGL / black-screen diagnosis — 暴走機甲 (neon-swarm)

> **Tip:** v0.9.204 `MOBILE-WEBGL-DIAG-001`  
> **Date:** 2026-10-30 Asia/Hong_Kong  
> **Box ≠ phone:** SwiftShader / headless Chrome results are **box-simulated only**.  
> **Do not claim Android fully fixed without Roy’s real-device evidence.**

Live (after Pages deploy): https://fung2222.github.io/neon-swarm/?v=0.9.204  
Hub entry keeps `hub` / `tier` / `ads` / `ret` query params.

---

## 1. Call-flow (latest tip, real files)

### A — Boot → first frame

1. `index.html` loads `js/main.js?v=0.9.204` (ES module).
2. Top-level: `MOBILE_GFX` detect (`main.js` ~65–73) → `createStage` (`vendor/cyber-kit/core/renderer.js` `createStage`)  
   - WebGLRenderer ctor fail → `onFatal` → `showGfxRecover('boot-webgl')` then rethrow.
3. `View` / `Particles` / `NeonCity` / contextlost listeners attached (`main.js` ~270–292).
4. `boot()` (`main.js`): fonts race → `showMenu()` → `ui.loaded()` → `gfxDiag.markBootOk()` + clear auto-reload budget → `stage.loop(...)`.
5. **v0.9.204:** `boot().catch` → `showGfxRecover('boot-js', e)` — **not** labeled as GPU.

### B — Sustained high-load combat

`stage.loop` → `tick` → `Game` update + `view.sync` + particles + `stage.render` (EffectComposer bloom).  
Mobile: `burstN`, lower bloom, `kickFx` clamps, particle pool 1600.

### C — Shed level rise

Every ~30 frames on MOBILE_GFX while `play|level` (`main.js` loop):  
`computeShedLevel` (`js/webgl-guard.js`) from `runT` / `avgFrameMs` → monotonic 0–3 → `applyShedToStage` (PR via `pixelRatioForShed`, bloom via `bloomStrengthForShed`) + particle/post skips.  
**Diag:** `gfxDiag.noteShed` + `sampleRenderer` / `sampleGame`.

### D — Cool-pause

`shouldCoolPause` when shed ≥2 and hot streak (`SHED.frameMsHot` / `hotSamples`) → `pauseRun()` (pause UI, **not** gfx overlay) + interrupt snapshot `reason:'cool-pause'`.  
Note text now says 冷卻暫停, not “繪圖中斷”.

### E — Real `webglcontextlost` / `restored`

- lost: `preventDefault`, `S.gfxLost=true`, snapshot, `showGfxRecover('lost')`, freeze loop.  
- restored: **auto-reload** only if `shouldAutoReloadOnRestore` (max 2 / 5 min); else `showGfxRecover('reload-cap')` — no infinite loop.

### F — JS exceptions / asset fails

| Path | UI kind | Title |
|---|---|---|
| `createStage` WebGL ctor | `boot-webgl` | 繪圖暫時中斷 |
| `boot().catch` | `boot-js` | **程式錯誤（非繪圖卡）** |
| frame `try/catch` | `loop-js` / `loop-gl` | JS title vs GPU body |
| contextlost | `lost` | 繪圖暫時中斷 |

Critical assets: menu avoids meshopt/GLB (v0.9.201–202). Combat horn = 2D puppet (`q-hero-2d-puppet.js`); part CanvasTextures **shared** since v0.9.204.

### G — Reload / restart / leave-return

- Manual gfx reload / `location.reload` after restore.  
- `visibilitychange` / `pagehide` → `pauseRun` (no auto-resume).  
- `startRun` resets shed + clears interrupt snapshot.  
- `disposeTree` skips `texture.userData.shared` (part lib / atlases).

---

## 2. Root-cause report (confidence)

| Finding | Confidence | Evidence |
|---|---|---|
| **「繪圖暫時中斷」 mid-run ⇒ overlay from `showGfxRecover('lost')` (contextlost) or (pre-0.9.204) any boot catch mislabel** | **High** for UI mapping; **Medium** that Roy’s device actually fires contextlost | strings `gfx.title`; handlers in `main.js`; cool-pause does **not** use that title |
| **Pre-0.9.204: plain JS boot errors shown as GPU fault** | **High** | `boot().catch → showGfxRecover('boot')` used GPU copy |
| **Black screen without overlay possible if loop threw (no try/catch)** | **Medium** | kit `loop` schedules rAF then calls fn; throw left canvas dead with HUD possibly live |
| **Infinite restore→reload loop on unstable GPU** | **Medium** | unconditional `location.reload` on restored |
| **2D puppet rebuilt per `setMech` leaked CanvasTextures on restart** | **High** (restart path); **Low** as sole mid-run cause | `buildPartLibrary()` each build; `disposeTree` did not dispose maps |
| **Mid-run shed `setPixelRatio` reallocates composer RTs (≤3×/run)** | **Low–Medium** contributor | `renderer.js` `setPixelRatio` → `resize` |
| **True Android GPU OOM / driver reset** | **Unknown** without device console | Not proven; phone not hot ≠ not contextlost |
| **Memory leak as primary mid-run cause** | **Unproven** | Must compare `renderer.info.memory` samples in diag dump on device |
| **`looksLikeWebGlError` scanning `err.stack` false-positive** | **High** (box) | Stack paths like `webgl-guard.js` flipped boot-js→boot-webgl; v0.9.204 scans name+message only |
| **`showGfxRecover` wiped `__NS_GFX_DIAG.simulate*`** | **High** (box) | Re-expose without preserving helpers; restore tests / phone triage broken until fixed |

**Most likely explanation for Roy’s “play a while → 繪圖暫時中斷”:** real or soft **WebGL context loss** (or restore path), not cool-pause UI.  
**Most likely for “black screen” without that title:** render/loop exception or silent GPU stall without `webglcontextlost`.

---

## 3. What v0.9.204 fixed vs diagnostic-only

**Fixed (minimal, evidence-based):**

1. Separate **boot-js / boot-webgl / loop-js / loop-gl / lost / reload-cap** overlays.  
2. Frame-loop `try/catch` → classified overlay (no silent black).  
3. Auto-reload **cap** after contextrestored.  
4. Shared 2D puppet part textures + safer `disposeTree`.  
5. Cool-pause interrupt note wording.  
6. Capped `gfx-diag` ring buffer + `window.__NS_GFX_DIAG`.

**Not claimed fixed:** Android Chrome mid-run stability on real silicon.

**Unchanged (constraints):** Three.js r169, weapon balance, skeleton art look, hub query params, shed/cool-pause kept, no Phase4 / soft-juice / BALANCE / §9.

---

## 4. Phone steps for Roy (highest value)

1. Hard-refresh: `https://fung2222.github.io/neon-swarm/?v=0.9.204&diag=1&fps=1` (keep hub `ret` if from arcade).  
2. Chrome → `chrome://inspect` or `chrome://inspect/#devices` → Console.  
3. Play until fault **or** 3–5 minutes heavy combat.  
4. On fault, read overlay **title**:  
   - 「繪圖暫時中斷」→ GPU/context path  
   - 「程式錯誤（非繪圖卡）」→ JS path (screenshot body + Diag line)  
5. In console: `copy(JSON.stringify(__NS_GFX_DIAG.dump(), null, 2))` → paste to Roy/chat.  
6. Optional simulate (box-like): `__NS_GFX_DIAG.simulateLost()` then restore.  
7. Background test: play → Home 30s → return (expect **pause**, not auto-resume; note black vs overlay).

---

## 5. Deploy / verify

```bash
# already on origin/main after push
# GitHub Pages serves /docs? No — project site from repo root (existing).
```

Verify after deploy:

- View source / Network: `main.js?v=0.9.204`  
- Console: `[neon-swarm] gfx-diag ready` with `?diag=1`  
- `?diag=1` → `__NS_GFX_DIAG.summary()` returns string  
- Simulate JS fault title ≠ GPU title  

---

## 6. Test matrix

| # | Case | Result locus |
|---|---|---|
| 1 | Normal open | box browser PASS |
| 2 | Init JS throw | box: classify + UI title PASS |
| 3 | Asset soft path | box bootOk PASS |
| 4 | lose_context | box-sim PASS (≠ real Adreno crash) |
| 5 | restore + reload cap | box-sim PASS |
| 6 | shed / cool-pause | unit + box PASS |
| 7 | combat counts | box PASS |
| 8 | repeat start textures | box PASS (growth bounded) |
| 9 | Android bg return | **not phone-verified** |
| 10 | long run + reload | CTA present; **long run phone TBD** |

Unit: `node tests/gfx-diag.test.mjs` + `node tests/webgl-guard.test.mjs`  
Browser: `node tests/mobile-webgl-diag-browser.mjs`

---

## 7. Affected files

- `js/gfx-diag.js` (new)  
- `js/main.js`  
- `js/webgl-guard.js`  
- `js/strings.js`  
- `js/q-hero-2d-puppet.js`  
- `js/view.js` (`disposeTree`)  
- `index.html` (`?v=0.9.204`)  
- `tests/gfx-diag.test.mjs`  
- `tests/mobile-webgl-diag-browser.mjs`  
- `docs/MOBILE-WEBGL-DIAGNOSIS.md`
