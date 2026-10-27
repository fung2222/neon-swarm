# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：**Active** → **HIT-FEEL-DEVICE**（Roy phone playtest · HOLD for notes）

**Opened:** 2026-10-27 ~08:28 HKT — Roy「跟流程去」on phone after clarity beat HOLD；safe auto-queue ≈0；documented next = HIT-FEEL-DEVICE.

**Live to play:** https://fung2222.github.io/neon-swarm/?v=0.9.50  
**Baseline HEAD:** `933a414`（v0.9.50 elite lane read；no code change this task）  
**Checklist doc:** `docs/HIT-FEEL-DEVICE.md`

### Scope（this Active only）

- Roy **device** verification of hit feel／close-range／run-and-gun／hurt feedback on live `?v=0.9.50`.
- Includes AIM-HIT-FAST-002 (v0.9.19) still **not device-verified**.
- **NOT** Phase 4／Morph／horn art lock／phone GPU deep cuts／soft-juice invent／new game systems.

### Grok box pre-check（2026-10-27 ~08:28 HKT）

| Check | Result |
|---|---|
| `tests/aim-hit-fast.test.mjs`（legacy + 002） | **PASS** |
| Live cache-bust `index.html` `?v=` | **0.9.50** |
| SwiftShader / box GPU feel | **not** device evidence — do **not** claim hit-feel verified |

### What needs Roy phone（blockers for Complete）

See full checklist in `docs/HIT-FEEL-DEVICE.md`. Short:

1. **命中** — strafe／fast lateral enemies；close range；reverse run-and-gun
2. **手感** — hurt tint 唔斷跑；stick aim／auto-fire 順；gun 8-dir 唔跳到煩
3. **可讀** — elite lanes／danger／pickups 手機直向仍睇得清（clarity beat spot-check）
4. **穩定（輕記）** — 短局有無「繪圖暫時中斷」；**唔**當本 task 去深入 GPU

### After Roy notes

- Pass → mark HIT-FEEL-DEVICE **Complete**／`device verified`；HOLD or Roy-named next
- Fail → narrow bug task（aim／hurt／input）— still ban Phase 4／GPU invent
- Grok：**HOLD** — do not auto-queue new content while Active is HIT-FEEL-DEVICE

### Do NOT auto-start

Phase 4／horn art lock／phone GPU／soft-juice invent／4th priority enemy／balance overhaul／Morph.

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
