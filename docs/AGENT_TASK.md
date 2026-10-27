# AGENT_TASK — 暴走機甲 / neon-swarm

> Live: https://fung2222.github.io/neon-swarm/ · Repo: https://github.com/fung2222/neon-swarm
> 審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。

## 狀態：**HOLD** — `WEAPONS-LEGACY-PURGE-001` shipped as **v0.9.58**（try on phone）

**Opened:** 2026-10-28 Asia/Hong_Kong — Roy「有D舊武器名及強化，其實係咪可以del, 宜家有新」([pt224u]) after icons/feel HOLD.  
**Closed → HOLD:** 2026-10-28 Asia/Hong_Kong — Grok bot purge player-facing legacy weapon cards/names then HOLD.

**Author:** Grok bot · **Shipped:** v0.9.58 · **SHA:** `6e73b53`  
**Prior:** v0.9.57 icon placeholders · v0.9.56 feel FX · Spec: `docs/WEAPONS.md`

### Shipped this beat

1. **v0.9.58 `WEAPONS-LEGACY-PURGE-001`** — delete player-facing duplicate unlock cards (`laser`/`rocket`/`grenade`/`plasma`); level-up + crates offer **catalog ids** with WEAPONS.md zh/en only; keep thin internal `WEAPON_ID_ALIASES`; reword MG-only buff copy → 主武器; `starterWeapon: 'gatling'`; HUD/loadout/result use catalog names.
2. Tests + screenshots: `tests/weapons-legacy-purge.*` · `tests/screenshots/weapons-legacy-purge/`.
3. `?v=0.9.58` cache-bust.

### Stub vs live（honest）

| Area | Live | Stub |
|------|------|------|
| Player weapon cards / names | **catalog 14 only** | — |
| Internal aliases (mg/laser/…) | fire/save/test ingest | never shown as card titles |
| Branch / ult / feel / icons | as v0.9.54–57 | full ult kits · Roy PNG art |
| Phase 4 / horn lock | — | **do not start** |
| Soft-juice invent | — | **do not invent** |

### Out of scope (still)

- Phase 4 Precision/Morph · horn art lock · soft-juice invent · deep phone GPU without ask · inventing brand-new unrelated systems · full unique ult kits unless Roy names them · ripping all internal `behavior:'mg'` fire engines in one go

### Next（after Roy try）

- Balance / feel feedback · drop real `assets/weapons/{id}.png` when Roy art ready · full ult kits **only if Roy names** · beauty polish when Roy asks · **do not invent more beauty slices**

審核回覆請直接改本文件或 `HANDOFF.md` 並 push；唔使經 Roy 轉發檔案。
