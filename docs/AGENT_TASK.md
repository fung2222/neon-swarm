# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：PHASE6-KILL-STREAK-LITE-001 → **Complete**（`?v=0.9.38`）

**ROY（2026-10-26）ROY_OVERRIDE／continue：** 「好你繼續做落去佢未用得」— still on；safe usability only. Do NOT start Phase 4／horn art lock／phone GPU.

### Just shipped

**PHASE6-KILL-STREAK-LITE-001** → live cache-bust **`?v=0.9.38`**.

- Soft consecutive-kill streak（window **2.2s**）；reset on timeout／hurt／death
- Milestone toasts only（**5／10／15**）via `#early-toast`「連殺 ×N」／STREAK ×N ~1.0s；`pointer-events:none`
- **Feedback only — no DPS／XP／score multiplier from streak**（documented）
- Skip／catch-up if first-kill／early toast busy；tiny `kickFx` at **10+** only
- Mobile-light；no heavy particles
- Shots `tests/screenshots/phase6-kill-streak/`（1280+390 streak-5／10）；test `tests/kill-streak.test.mjs`

### Queue（usability very thin）

1. **PHASE6-RESULT-SHARE-001**（recommended if quick）— over-screen share／copy line
2. HIT-FEEL-DEVICE — when Roy can play on phone（SwiftShader ≠ device）
3. Stop auto-inventing soft juice；phone GPU／horn art lock — deferred／only after Roy OK

**Honest note：** Phase 6 usability queue nearly empty after streak；prefer result-share once more then pause invention until phone HIT-FEEL.

**Do NOT start：** Phase 4 Precision／Morph／horn art lock／§9／phone GPU／balance／economy／break early-feedback／safe-area／mute／damage numbers.

### Recently completed（do not re-implement）

- `PHASE6-KILL-STREAK-LITE-001` → **v0.9.38** (`fc61ddc`)
- `PHASE6-EARLY-FEEDBACK-001` → **v0.9.37** (`fc61ddc`)
- `PHASE6-SAFE-AREA-001` → **v0.9.36** (`fc61ddc`)
- `PHASE6-MUTE-PERSIST-001` → **v0.9.35** (`fc61ddc`)
- `PHASE6-DAMAGE-NUMBERS-LITE-001` → **v0.9.34** (`fc61ddc`)
- `PHASE6-RUN-LOOP-UX-001` → **v0.9.33** (`fc61ddc`)

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
