# NEON SWARM 霓虹洪流 — Handoff

> For the next AI / human continuing this game.  
> **Contact style (Roy):** 解釋用繁體中文（廣東話都睇得明）；code、路徑、指令、commit message 用英文。UI copy 一律 **zh-HK 先行**，英文細字／small caps 喺下面。  
> Timezone: **Asia/Hong_Kong (UTC+8)**. Owner: **fung2222 (Roy Chan / 嘉豐)**.

**Status:** **v0.3.3** playfield-stick HUD dead-zone fix · kit **v0.3.16** · CYBER ARCADE tier **Gold** · `games.json` status **wip**  
**HEAD:** `4fef9ba` (`4fef9ba2ebb2f3eaf568d46de54a5048d0ef63f7`) · 2026-10-18 12:15 HKT  
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
| **`4fef9ba`** | 2026-10-18 | **v0.3.3** playfield stick — HUD overlay dead-zone (**current HEAD**) |

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

Key files: `js/{main,view,logic,config,audio,strings}.js` · `css/game.css` · `index.html` · `tests/logic.test.mjs` · `tests/smoke_files.py`.

## 4. v0.3.3 stick fix (do not regress)
- **Root cause:** kit `.hud-buttons { bottom: … }` + game `.hud-buttons.top { top: … }` left **both** `top` and `bottom` set → mute/pause strip stretched ~full height with `pointer-events: auto`, eating the right (and bottom-right) playfield. Stick listener also wrongly ignored `#hud` (full-screen overlay).
- **Fix:** `bottom: auto; height: auto` on `.hud-buttons.top`; decorative HUD `pointer-events: none`; drag-anywhere on `window`, excluding only real UI (`button` / `.icon-btn` / cards).

## 5. Known issues / gaps
1. **Trial unlock UX incomplete** — survive-sec gate exists; elite-milestone + “unlock Gold → return to hub store” path still TODO (see stub trial.rule).
2. **Hub `games.json` stage/thumbAlt may lag** — older text mentioned circular arena / v0.2 polish; wilderness + EVA-mech is current. Sync hub when touching cyber-arcade.
3. **No Android / Capacitor** packaging yet (`play: not-submitted`).
4. **Balance / content** — no named elite/boss beats yet; long-run pacing untested by Roy.
5. **Smoke** — `tests/smoke_files.py` + logic unit; full Playwright headless smoke like older games may still be thin — verify before calling “done”.
6. **Trademark hygiene** — keep EVA as palette/silhouette homage only; never ship names, logos, or exact reproductions.

## 6. Next steps (suggested order)
1. Roy playtest on phone + desktop (`?demo=1`, real stick, level-up cards, 3+ min run).
2. Finish trial → `returnToHub({ openStore: true })` when cap hits; align `games.json` trial.rule.
3. One elite/boss beat + readable telegraph; then balance pass on HP / spawn density.
4. Refresh hub thumb from live wilderness + EVA-mech frame; update `thumbAlt` zh/en.
5. Harden smoke (412×915 + 1280×800, zh+en, zero console errors) → mark closer to `done`.
6. Only after Roy says go: Capacitor 8 + AdMob stubs.

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

## 11. Dev
```bash
cd /workspace && python3 -m http.server 18940
# http://127.0.0.1:18940/neon-swarm/
```
