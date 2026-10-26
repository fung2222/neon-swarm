# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：PHASE6-TRADEOFF-CARDS-001 → **Complete**（`?v=0.9.43`）

**ROY（2026-10-26 ~23:53 HKT）ROY_OVERRIDE／continue：** 「繼續去」— still on。Do NOT start Phase 4／horn art lock／phone GPU；do NOT invent more toast／streak／coach polish。

### Complete — PHASE6-TRADEOFF-CARDS-001

**PHASE6-TRADEOFF-CARDS-001** → live cache-bust **`?v=0.9.43`**（code `d44af7a`）.

- Exactly **3** trade-off cards additive to `CARDS`（existing numbers **unchanged**）:
  - `overclock` — MG fireCd×0.85 · armor−1（floor 0）；max 3
  - `glass` — bulletDmg+0.45 · maxHp−1（floor 3；hp clamp）；max 2
  - `heavy_frame` — armor+1（cap 3）· speed×0.88（floor 2.8）；max 3
- zh-HK／EN desc state both sides；emblems `overclock`／`glass`／`heavy`；**no** new toast
- Floors prevent NaN／soft-lock；pickCards safety net intact
- Tests `tests/tradeoff-cards.test.mjs`＋shots `tests/screenshots/phase6-tradeoff-cards/`

**Out of scope kept：** Phase 4；horn lock；phone GPU；soft-juice invent；swarmPressure rewrite；new elite／boss.

### Soft-juice → still **DONE** · Positioning trio（0.9.40–42）shipped

### Recently completed

- `PHASE6-TRADEOFF-CARDS-001` → **v0.9.43** (`d44af7a`)
- `PHASE6-ZONE-PRESSURE-001` → **v0.9.42** (`ddf39c4`)
- `PHASE6-PERIODIC-DANGER-001` → **v0.9.41** (`3040b5e`)

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
