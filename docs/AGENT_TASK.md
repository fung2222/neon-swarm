# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：**HOLD**（Active = none）— PHONE-STABLE-CONTEXT-001 **shipped**／await Roy phone verify

**Opened:** 2026-10-27 — Roy phone reply「A」= first option = Phone GPU／mid-run WebGL（中途斷圖）；prior Active was HOLD after HIT-FEEL-DEVICE Complete.

**Shipped:** 2026-10-27 Asia/Hong_Kong — **v0.9.51** `PHONE-STABLE-CONTEXT-001`

**Live:** https://fung2222.github.io/neon-swarm/?v=0.9.51  

### What shipped

- Mid-run **GPU shed** on `MOBILE_GFX` only（run time＋frame budget → lower PR／bloom／half particle ticks；sustained hot → cool-pause，no auto-resume）.
- **Context-loss recovery note**：`sessionStorage` interrupt snapshot on `webglcontextlost`；gfx overlay＋menu show last score／time after reload（**not** seamless Three resume — still prefer reload）.
- Module `js/webgl-guard.js`；tests `tests/webgl-guard.test.mjs`.
- Desktop path unchanged；balance／Phase 4／horn／soft-juice **untouched**.

### Honest gaps

- Box＝SwiftShader ≠ device GPU — **not** device-verified mid-run stability.
- Cool-pause／shed reduce pressure；cannot guarantee zero context loss on every phone.

### Process next（do NOT auto-start）

**HOLD for Roy phone verify** of mid-run WebGL on live `?v=0.9.51`（long run／heat／background commute）.  
**Ban** auto Phase 4／Morph／horn art lock／soft-juice invent／new systems.

**Options after phone reply：** continue phone-stable slice／named polish／HOLD／only if Roy names Phase 4 or horn.

---

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
