# RAMPAGE MECH — Active Agent Task

> 開始前必讀 `docs/HANDOFF.md`。本文件是唯一本輪授權範圍。

## 角色與責任

- **Roy：** 產品方向與最終驗收。
- **Kimi K3.1：** 流程設計、獨立檢查、bug 重現、修正範圍與審核。
- **Grok bot（Grok 4.7；名稱按 Roy 提供記錄）：** 程式／測試／文件實作。

Grok 回報的測試不得自動稱為 Kimi 獨立驗證。

## 狀態：HOLD — awaiting Kimi independent review

**Completed task (do not re-implement):** `AIM-HIT-FAST-002` → **v0.9.19**

- Precise quadratic intercept (`interceptAimDir` / `muzzleInterceptAimDir`); `AIM_LEAD_MAX_T` stays 0.30 for approx helper.
- Relative continuous collision (`relativeSegmentHitsCircle` + enemy `prevX/prevZ`); enemies move before projectiles in the shared dt.
- MG logic bullets: random angle jitter removed (no scatter excuse for misses).
- Regressions: `tests/aim-hit-fast.test.mjs` 002 cases + old cases; browser `tests/aim-hit-002-shots.mjs`; evidence `tests/screenshots/aim-hit-002/`.

**Do NOT start:** Phase 4 Precision／Morph、horn art lock、phone GPU cuts、maps、weapons balance、PERF rebaseline.

Next `AGENT_TASK.md` content comes only after Kimi review + Roy direction.
