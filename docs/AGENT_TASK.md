# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：PHASE6-EARLY-FEEDBACK-001 → **Complete**（`?v=0.9.37`）

**ROY（2026-10-26）ROY_OVERRIDE／continue：** 「好你繼續做落去佢未用得」— still on；safe usability only. Do NOT start Phase 4／horn art lock／phone GPU.

### Just shipped

**PHASE6-EARLY-FEEDBACK-001** → live cache-bust **`?v=0.9.37`**.

- Once-per-run **first kill** zh-HK toast「首殺」／FIRST BLOOD (~1.2s) via dedicated `#early-toast`（pointer-events:none；z below coach／beat）；light `kickFx`；deferred while run-coach visible
- Once-per-run **first level-up**（`from==='level'` only）：stronger `levelChime` + XP bar pulse（`.xp-first-level`）+ brief first-level glow；no card-pool change
- Soft **first heal** green micro-toast — skipped if coach／toast／pending kill toast（avoid stacking）
- Mobile：no heavy particles；MOBILE_GFX cuts respected
- Shots `tests/screenshots/phase6-early-feedback/`（1280+390 first-kill／first-level）；test `tests/early-feedback.test.mjs`

### Queue（usability thinning — next concrete）

1. **PHASE6-KILL-STREAK-LITE-001**（recommended）— soft streak toast／chime；still「未用得」without inventing Phase 4
2. OR **PHASE6-RESULT-SHARE-COPY-001** — over-screen share／copy juice
3. HIT-FEEL-DEVICE — preferred **when Roy can play on phone**（SwiftShader ≠ device）
4. Phone GPU／horn art lock — deferred／only after Roy OK

**Honest note：** Phase 6 usability queue thinning — remaining soft juice is thin; HIT-FEEL needs real phone.

**Do NOT start：** Phase 4 Precision／Morph／horn art lock／§9／phone GPU／balance rewrite／break mute／safe-area／damage numbers／run-loop coach.

### Recently completed（do not re-implement）

- `PHASE6-EARLY-FEEDBACK-001` → **v0.9.37** (`2c6b6df`)
- `PHASE6-SAFE-AREA-001` → **v0.9.36** (`eee063e`)
- `PHASE6-MUTE-PERSIST-001` → **v0.9.35** (`a026e1e`)
- `PHASE6-DAMAGE-NUMBERS-LITE-001` → **v0.9.34** (`3da3007`)
- `PHASE6-RUN-LOOP-UX-001` → **v0.9.33** (`7db11c0`)
- `PHASE6-BANNER-TIMING-001` → **v0.9.32** (`e578bae`)

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
