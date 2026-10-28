# WEAPONS — 暴走機甲 / neon-swarm

> **Owner:** Grok bot (attack/power tables + counter roles) · **Product:** Roy Chan  
> **Live:** https://fung2222.github.io/neon-swarm/?v=0.9.158 · **Ship:** v0.9.158 WEAPONS-MD-TIP-SYNC-002 · UI a11y/docs sync (weapons unchanged)
> Keep this file synced every weapons ship. UI layout HOLD (v0.9.52) stays; this beat migrates loadout/HUD/fire rules.

## Product rules (locked)

| Rule | Value |
|------|--------|
| Loadout capacity | **2 primary + 2 secondary + 2 throw** (six slots total) |
| Primary catalog | **5** weapons · max **Lv5** · **3** branch paths · each branch → **2** ultimate/大招 forms |
| Secondary catalog | **5** weapons · max **Lv5** · **2** branch paths |
| Throw catalog | **4** weapons · max **Lv5** · **2** branch paths |
| HUD | Status chips unified (padding/radius/type); XP + key status readable |
| Icons | **Bottom centered rail**, smaller tiles, space-evenly P/S/T groups (clears stick); glyph icons OK |
| Titles | **No name labels on rail** (color families only); catalog zh names remain in pick cards / docs |
| Primary play | Continuous **auto-fire** while that primary is selected |
| Secondary play | Rescue / special-enemy tool — **rapid burst ≤3 shots** then **auto primary** (even if ammo remains); empty ammo also returns |
| Throw play | **Tap / triple-tap** to throw once — no hold-select mode; stays on primary |
| Multi-tap | **Double-tap** playfield → secondary (if owned); **triple-tap** → throw (if owned / off CD); ~360ms window; does not fight rail taps |

**Out of scope this beat:** Phase 4 Precision full playable · horn art lock · soft-juice invent.  
**Do not wipe** the existing run loop — migrate from `weaponSlots×4` carefully.

---

## Catalog (IDs · names · roles)

IDs are stable English snake keys used in code / saves. zh-HK names are product strings.

### Primary (5) — category `primary`

| ID | zh | en | Role | Counters (enemy kinds) | Weak vs |
|----|----|----|------|------------------------|---------|
| `gatling` | 機關雷射炮 | GATLING LASER | Sustained hitscan spray; starter | `soldier` `staffer` `guard` swarms | `shield` front · `bomber` fuse rush |
| `ion_beam` | 離子光束 | ION BEAM | Piercing beam; mid/long lane clear | `drone` `flanker` lines · `sniper` sightlines | `shield` · clustered `walker` |
| `tracking_bomb` | 追蹤爆彈 | TRACKING BOMB | Homing AoE payload | `artillery` `medic` backline · `commander` summons | Fast `flanker` · `jammer` (RoF) |
| `vulcan` | 火神 | VULCAN | Ultra-RoF short-range shred | Dense packs · `bomber` pre-fuse | `sniper` range · `shield` |
| `zero_laser` | 零度激光 | ZERO LASER | Chill pierce + slow residue | `mech` `hunter` elites · heat/berserk packs | `jammer` · open `drone` swarms |

### Secondary (5) — category `secondary` (ammo / energy)

| ID | zh | en | Resource | Role | Counters | Weak vs |
|----|----|----|----------|------|----------|---------|
| `acid_gun` | 硫酸槍 | ACID GUN | Energy pool | DoT puddle / armor melt | `shield` `walker` `mech` armor | Mobile `flanker` · `drone` |
| `shotgun` | 散彈槍 | SHOTGUN | Shells | Close cone burst | `soldier` rushes · `bomber` | Long `sniper` · `artillery` |
| `slow_gun` | 緩速槍 | SLOW GUN | Energy | Soft CC / kite | `flanker` `bomber` `hunter` charge | `shield` front · `jammer` |
| `attack_drone` | 攻擊兵衛 | ATTACK DRONE | Charges | Escort DPS / distraction | `medic` `artillery` · boss adds | `jammer` · elite AoE |
| `blackhole` | 黑洞炮 | BLACKHOLE CANNON | Charges | Pull + crush pulse | Clustered packs · `drone` clouds | Single `sniper` · boss i-frames |

### Throw (4) — category `throw` (tap)

| ID | zh | en | Cooldown bias | Role | Counters | Weak vs |
|----|----|----|---------------|------|----------|---------|
| `frag` | 破片榴彈 | FRAG GRENADE | Med | Lobbed delayed blast | Clumps behind cover · `medic` | Lone `sniper` · airborne feel |
| `chill` | 冷卻彈 | CHILL BOMB | Med | AoE slow field | `bomber` `hunter` `flanker` | Already-slow packs |
| `flash` | 閃光彈 | FLASHBANG | Short | Interrupt / aim break | `sniper` telegraph · `artillery` aim | Blind-immune elites (none yet) |
| `gravity` | 重力彈 | GRAVITY BOMB | Long | Pull then crush | Swarm cores · `drone` rings | Sparse singles |

---


## Feel specs (Roy 2026-10-27 — locked for ship)

### Primary
| ID | Feel | Play loop |
|----|------|-----------|
| `gatling` | **laser-feel bullets** flying out | Continuous auto discrete bolts (not a solid hitscan beam) |
| `ion_beam` | **charge → fire → charge** | Wind-up then very high damage pierce shot; repeats |
| `tracking_bomb` | **track → stick → pop** | Homes to nearest foe, sticks briefly, quick auto explode, **small** AoE |
| `vulcan` | **minigun / 火神** | Ultra-RoF spray; short range; spin-up bias |
| `zero_laser` | **discrete laser bolts** one-by-one | Individual chill bolts (not a continuous beam) |

### Secondary
| ID | Feel | Play loop |
|----|------|-----------|
| `acid_gun` | **10 continuous dissolving shots** | Ammo pool 10; rapid stream that melts / DoT many foes |
| `shotgun` | **heavy pellet spray** | Dense close-range cone |
| `slow_gun` | **rush → stop/slow** | Sudden high-speed close rush then AoE slow field |
| `attack_drone` | **deploy 2 small drones** | Spend charge → 2 escort DPS drones |
| `blackhole` | **AoE pull to center** | Pull enemies inward then crush pulse |

### Throw
| ID | Feel | Notes |
|----|------|-------|
| `frag` | frag blast + shrapnel | Lobbed delayed blast |
| `chill` | cool field | AoE slow field |
| `flash` | flash interrupt | Short fuse; breaks aim / telegraph |
| `gravity` | gravity pull → crush | Pull then damage |

Branch/ult UI playable as of v0.9.54; **deep branch kits as of v0.9.55** (A/B/C distinct fire deltas). Ult kits **live** v0.9.123 (spec 0.9.121 · labels 0.9.122). Feel + kits in `WEAPON_CATALOG` / `branchStatMods` / `applyUltKitMods` + Game ticks.

**v0.9.56 ship (`WEAPONS-FEEL-FX-001`):** per-weapon muzzle/trail/burst FX recipes in `js/weapons-feel-fx.js` — gatling bolts, ion charge→punch, tracking stick→pop, vulcan spin sparks, zero chill+frost, acid mist, shotgun flash, slow rush ring, drone deploy puff, blackhole swirl, distinct throw bursts. MOBILE_GFX / webgl-guard respectful (shed rings; reuse pools). Screenshots `tests/screenshots/weapons-feel-fx/`.

**v0.9.57 ship (`WEAPONS-ICON-PLACEHOLDERS-001`):** neon SVG square tiles (dark plate + glyph; cyan primary / magenta secondary / amber throw) replace bare emoji on left rail + top status. `WEAPON_ICON_SRC` maps each id → `assets/weapons/{id}.png` for later Roy art swap. Empty + muted states. Not Roy final art. Screenshots `tests/screenshots/weapons-icon-placeholders/`.

---
## Level / branch / ultimate schema

```
Weapon
 ├─ level 1..5          (stack via pickup / level-up cards; Grok-owned numbers)
 ├─ branch A|B|C        (primary: 3; secondary/throw: 2) — unlock after Lv3 (design)
 │    └─ ultimate U1|U2 (primary only; pick one path per branch to evolve)
 └─ stats               (dmg, rate/cd, pierce, aoeR, resourceMax, counterTags[])
```

| Field | Primary | Secondary | Throw |
|-------|---------|-----------|-------|
| `maxLv` | 5 | 5 | 5 |
| `branches` | 3 (`A` `B` `C`) | 2 (`A` `B`) | 2 (`A` `B`) |
| `ultsPerBranch` | 2 | 0 (no 大招 this beat) | 0 |
| Resource | none (auto) | `ammo` or `energy` | charge / CD |

**v0.9.53 ship:** full catalog IDs/names/feel/counters; branch/ult **data stubs**. All 14 wired with feel-matched behaviors.
**v0.9.75:** catalog fire status **live** (docs stub cleared); full unique ult kits still stub.
**v0.9.76:** over CTA tap ≥44 (UI only; weapons unchanged).
**v0.9.77:** home play/endless CTA tap ≥44 (UI only; weapons unchanged).
**v0.9.78:** coach controls sync (copy only; weapons unchanged).
**v0.9.79:** gfx reload CTA tap ≥44 (UI only; weapons unchanged).
**v0.9.80:** branch EN labels live (`branchNamesEn`); sec/throw naming table below; full unique ult kits still stub.

**v0.9.82 WEAPONS-ULT-EN-LABELS-001:** U1/U2 cards use POWER AMP / CADENCE AMP (light amp); FORM I/II stub retired; full kits still stub.

**v0.9.54 ship (`WEAPONS-BRANCH-PICK-001`):** branch pick at Lv≥3 + primary ult pick at Lv≥5 via level-cards; `weaponBranches`/`weaponUlts`; light `branchStatMods`.

**v0.9.55 ship (`WEAPONS-BRANCH-KITS-001`):** deep A/B/C branch kits — distinct fire/behavior (not only % bumps). Ult U1/U2 still **light amplifiers** only (no full unique ult fire paths).

**v0.9.56 ship (`WEAPONS-FEEL-FX-001`):** combat feel FX polish (see Feel specs + `js/weapons-feel-fx.js`).

**v0.9.57 ship (`WEAPONS-ICON-PLACEHOLDERS-001`):** neon SVG placeholder icons + `WEAPON_ICON_SRC` PNG hooks.

### Branch naming (primary) — live in code · EN documented v0.9.85 WEAPONS-BRANCH-PRIMARY-EN-DOCS-001

| Weapon | A | B | C |
|--------|---|---|---|
| gatling | 過熱連射 / OVERHEAT BURST | 穿甲芯 / AP CORE | 散射網 / SCATTER NET |
| ion_beam | 長焦聚焦 / LONG FOCUS | 連鎖跳電 / CHAIN ARC | 裂縫切割 / SLIT CUT |
| tracking_bomb | 三重彈頭 / TRIPLE WARHEAD | 黏著地雷 / STICKY MINE | 自殺無人機 / KAMIKAZE DRONE |
| vulcan | 彈幕風暴 / BARRAGE STORM | 燒夷彈 / INCENDIARY | 機槍堡壘 / GUN FORTRESS |
| zero_laser | 絕對零度 / ABSOLUTE ZERO | 霜爆裂縫 / FROST BURST | 寒晶護盾 / CRYSTAL SHIELD |

Ult forms = `{branch}U1` / `{branch}U2` (`gatling_A_U1`, …) — **selectable in v0.9.54** via ult offer cards; unique kit names+effects **specced** v0.9.121 (labels/code follow).

### Ult light amplifiers (v0.9.88 WEAPONS-ULT-LIGHT-AMP-DOCS-001)

Live labels (v0.9.82) + documented multipliers (no full unique kits):

| Key | zh | en | Effect |
|-----|----|----|--------|
| U1 | 傷害強化 | POWER AMP | `dmgMul × 1.2` (stacks on branch kit) |
| U2 | 射速強化 | CADENCE AMP | `cdMul × 0.85` (stacks on branch kit) |

Applied in `branchStatMods(..., ult)` after branch letter mods. **v0.9.121:** unique ult kits **specified** below. **v0.9.122:** unique card labels **live**. Light amp stubs remain fallback export only. HARD BAN「full ult invent」lifted for this Active beat only (Roy 2026-10-28「好你順住去」).

### Unique ult kits (v0.9.121 WEAPONS-ULT-SPEC-001 — Grok-owned first-pass)

Primary only · stacks on branch letter kits · **behavior deltas preferred** over bare % amps.
Light amp (U1 dmg×1.2 / U2 cd×0.85) remains **fallback** until code ships (v0.9.122+ labels, v0.9.123+ kits).
Schema id = `{weapon}_{branch}_U{n}` (30 forms). Sec/throw `ultsPerBranch:0`.

| Weapon | Branch | U1 zh / en | U1 effect | U2 zh / en | U2 effect |
|--------|--------|------------|-----------|------------|-----------|
| `gatling` | A 過熱連射 | 超頻爆發 / OVERCLOCK BURST | 雙束超頻連射・熱累加快 | 冷卻噴射 / COOLANT JET | 過熱更慢・射速↑ |
| `gatling` | B 穿甲芯 | 貫穿光束 / PIERCE BEAM | 穿透+2・單發更硬 | 穿甲連射 / AP CADENCE | 保留穿透・射速↑ |
| `gatling` | C 散射網 | 錐形新星 / CONE NOVA | 五向寬錐散射 | 密網掃射 / DENSE NET | 四向密網・射速↑ |
| `ion_beam` | A 長焦聚焦 | 太陽矛 / SOLAR LANCE | 更長充能・超高傷穿透 | 快焦重擊 / SNAP FOCUS | 縮短充能・節奏↑ |
| `ion_beam` | B 連鎖跳電 | 連鎖風暴 / CHAIN STORM | 跳電+2・範圍↑ | 電弧節奏 / ARC CADENCE | 跳電+1・射速↑ |
| `ion_beam` | C 裂縫切割 | 雙縫撕裂 / DUAL SLIT | 雙裂縫並行切割 | 快縫連切 / RAPID SLIT | 更快充能・節奏↑ |
| `tracking_bomb` | A 三重彈頭 | 五重彈幕 / PENTA WARHEAD | 一次五枚微彈頭 | 集群節奏 / CLUSTER BEAT | 三重保留・射速↑ |
| `tracking_bomb` | B 黏著地雷 | 粘彈集群 / STICKY CLUSTER | 雙雷・長黏・爆圈↑ | 地雷節奏 / MINE BEAT | 黏著保留・射速↑ |
| `tracking_bomb` | C 自殺無人機 | 蜂群衝鋒 / SWARM DIVE | 雙機疾速追蹤 | 疾速節奏 / SEEK BEAT | 更快尋敵・射速↑ |
| `vulcan` | A 彈幕風暴 | 彈幕超載 / BARRAGE OVERLOAD | 三向超密彈幕 | 風暴節奏 / STORM BEAT | 雙向保留・射速↑ |
| `vulcan` | B 燒夷彈 | 燃燒風暴 / BURN STORM | 燒夷更猛更久 | 燒夷節奏 / INCENDIARY BEAT | 燒夷保留・射速↑ |
| `vulcan` | C 機槍堡壘 | 要塞終極 / FORTRESS ULT | 更慢移・穿透↑・傷害↑ | 堡壘連射 / FORTRESS CADENCE | 堡壘保留・射速↑ |
| `zero_laser` | A 絕對零度 | 絕對凍結 / ABSOLUTE FREEZE | 寒緩大幅強化 | 零度節奏 / ZERO BEAT | 寒緩保留・射速↑ |
| `zero_laser` | B 霜爆裂縫 | 霜爆新星 / FROST NOVA | 霜爆圈更大更痛 | 霜爆節奏 / FROST BEAT | 霜爆保留・射速↑ |
| `zero_laser` | C 寒晶護盾 | 寒晶壁垒 / CRYSTAL BASTION | 護盾更厚更久 | 護盾節奏 / SHIELD BEAT | 護盾保留・射速↑ |


### Branch naming stubs (secondary) — live in code · documented v0.9.80

| Weapon | A | B |
|--------|---|---|
| acid_gun | 溶甲霧 / DISSOLVE MIST | 酸池陷阱 / ACID POOL |
| shotgun | 寬扇 / WIDE FAN | 獨頭彈 / SLUG |
| slow_gun | 凍膠 / FROST GEL | 黏網 / STICKY WEB |
| attack_drone | 護衛編隊 / ESCORT WING | 自爆衝鋒 / SUICIDE CHARGE |
| blackhole | 引力井 / GRAVITY WELL | 奇點爆破 / SINGULARITY |

### Branch naming stubs (throw) — live in code · documented v0.9.80

| Weapon | A | B |
|--------|---|---|
| frag | 高爆 / HE BLAST | 破片雨 / SHRAPNEL RAIN |
| chill | 霜域 / FROST FIELD | 急凍芯 / SNAP FREEZE |
| flash | 致盲 / BLIND | 電磁脈衝 / EMP |
| gravity | 坍縮 / COLLAPSE | 引力錘 / GRAVITY HAMMER |

EN titles also live as `branchNamesEn` on each catalog id (v0.9.80) — branch/ult cards no longer stub `PATH A`.

### Deep branch kit deltas (v0.9.55 — Grok-owned numbers)

| Weapon | A | B | C |
|--------|---|---|---|
| gatling | 過熱連射 — RoF↑ + overheat stutter | 穿甲芯 — pierce+2 | 散射網 — 3-bolt cone |
| ion_beam | 長焦聚焦 — longer charge, big dmg/pierce | 連鎖跳電 — chain jumps on hit | 裂縫切割 — short charge narrow slit |
| tracking_bomb | 三重彈頭 — 3 micro warheads | 黏著地雷 — stick×2.6 | 自殺無人機 — seek↑ then pop |
| vulcan | 彈幕風暴 — denser dual spray | 燒夷彈 — burn DoT | 機槍堡壘 — slow-move fortress + pierce |
| zero_laser | 絕對零度 — chill×1.85 | 霜爆裂縫 — frost burst AoE | 寒晶護盾 — tiny self-shield on fire |

Secondary/throw A/B: deepened mods (pellets/aoe/slow/pull/etc.) where fire path already exists.

---

## Balance tables (Grok-owned · **v0.9.124 BALANCE-PASS-001** retune; prior baseline v0.9.55 / ult kits v0.9.123)

Numbers are a **named fair first pass** vs current enemy HP (~soldier 5 · walker 12 · mech 40 · elites ~90–100 · boss 200) after unique ult kits. Stacked branch+U1 dmgMul pulled where late melted.

### Primary base (Lv1)

| ID | dps≈ | hit | cadence | pierce | notes |
|----|------|-----|---------|--------|-------|
| gatling | 8–10 | **0.95** | cd **0.105** | 0 | laser-feel flying bolts; starter (slight RoF trim) |
| ion_beam | 8–11 | **3.3** | charge 0.55 + cd 0.12 | 3 | charge→fire→charge; stacked A+U1 capped |
| tracking_bomb | 8–10 | **2.55** AoE1.6 | cd **1.45** · stick 0.35 | 0 | track → stick → pop; slow cadence punch-up |
| vulcan | 9–12 | **0.48** | cd **0.048** · spinUp 0.4 | 0 | minigun spray; Lv1 melt trimmed |
| zero_laser | 8–10 | **1.35** + chill | cd 0.28 | 1 | discrete bolts; chill still the identity |

LvN ≈ Lv1 × `(1 + 0.18*(N-1))` damage; CD × `(1 - 0.06*(N-1))` floor 55% of Lv1.

### Secondary base (Lv1) + resource

| ID | hit | cadence | pool | regen / reload | notes |
|----|-----|---------|------|----------------|-------|
| acid_gun | **0.90** + dissolve | cd 0.12 | **ammo 10** | +1 / 2.2s | 10 continuous dissolving shots |
| shotgun | **0.72**×10 pellets | cd 0.70 | shells 8 | +1 / 1.4s | heavy close spray |
| slow_gun | 0.6 + slow 1.6s | cd 1.1 | energy 28 | 5/s out | rush close → AoE stop/slow |
| attack_drone | 0.7 / tick | deploy 5.5s | charges 2 | +1 / 8s | deploy **2** drones |
| blackhole | **2.0** pull | cd 2.6 · dur 1.2 | charges 2 | +1 / 10s | AoE pull to center |

Empty pool → `activeMode` returns to **primary** (product rule).

### Throw base (Lv1)

| ID | dmg | fuse/s | cd/s | radius | notes |
|----|-----|--------|------|--------|-------|
| frag | **3.0** | 0.55 | 1.7 | 2.4 | frag blast + shrapnel |
| chill | 1.0 + slow 1.8s | 0.35 | 2.0 | 2.8 · dur 2.2 | cool field |
| flash | 0.25 + stun 0.9 | 0.12 | 1.4 | 3.2 | flash interrupt / aim break |
| gravity | 2.8 | 0.45 | 2.8 | 3.2 · pull 0.9s | gravity pull → crush |

### Counter matrix (summary)

| Enemy | Best tools |
|-------|------------|
| soldier / staffer / guard | gatling · vulcan · shotgun · frag |
| drone | ion_beam · blackhole · gravity |
| flanker | slow_gun · chill · ion_beam |
| sniper | flash · ion_beam · tracking_bomb |
| artillery | tracking_bomb · attack_drone · flash |
| bomber | slow_gun · chill · vulcan (pre-fuse) · shotgun |
| shield | acid_gun · zero_laser (flank) · blackhole |
| medic | tracking_bomb · frag · attack_drone |
| walker / mech | acid_gun · zero_laser · tracking_bomb |
| jammer | prefer high-burst shotgun / frag (avoid RoF stack) |
| elites / boss | mix primary sustain + throw interrupt; secondary for armor |

---

## Loadout data model (code)

```
loadout = {
  primary:   [id|null, id|null],   // max 2
  secondary: [id|null, id|null],   // max 2
  throw:     [id|null, id|null],   // max 2
}
activePrimaryIndex: 0|1
activeSecondaryIndex: 0|1
fireMode: 'primary' | 'secondary'   // throw never holds mode
secondaryAmmo / secondaryEnergy     // per-id pools on Game
```

**Flat HUD order (left column top→bottom):** P0, P1, S0, S1, T0, T1.  
**Compatibility:** `weaponSlots` flattened view of the six loadout cells (tests / pickup / pulse). Legacy ids `mg`→`gatling`, `laser`→`ion_beam`, `rocket`→`tracking_bomb`, `plasma`→`acid_gun` (secondary) / `zero_laser` (catalog), `grenade`→`frag` alias on ingest.

Start run: `primary[0] = 'gatling'`, all else empty (same “one starter gun” feel as v0.9.28 mg).

---

## HUD / play wiring (v0.9.53)

1. **Top strip** `#weapon-status` — active weapon name · Lv · mode (主/副) · ammo/energy if secondary · throw CD hints.  
2. **Bottom centered** `#weapon-rail` — square tiles grouped P/S/T (no name labels; water fill on S/T); pointer selects primary/secondary; throw tile = immediate throw request.  
3. **Map** stays mid–bottom; stick bottom.  
4. Legacy `#weapon-slots` kept as top status mirror **or** hidden once rail+status live (ship keeps both: rail = select, top = compact status).

---

## Art pipeline (for Roy — later)

Each weapon needs a **real square icon** (not emoji forever).

### Spec
- Size: **128×128** master PNG (game displays ~52–64 CSS px).  
- Style: neon / mech HUD — match `docs/art-bible.md` cyan+magenta; dark plate + glowing glyph.  
- Safe padding: 12% inset so glow isn’t clipped.  
- Filename: `assets/weapons/{id}.png` (+ optional `@2x`).  
- Also provide a 32×32 monochrome silhouette for muted/empty states if possible.

### How Roy can create / hand off
1. Sketch or commission one icon per catalog ID (14 total).  
2. Drop files into `assets/weapons/` named exactly by ID (`gatling.png`, …).  
3. Tell Grok bot 「武器圖好咗」— bot wires `WEAPON_ICON_SRC[id]` and swaps placeholders.  
4. Optional: one spritesheet `weapons-atlas.png` + JSON frame map (same naming).  
5. Placeholders in v0.9.53 = emoji / CSS neon tiles with zh initial — **OK**.

### Checklist for Roy
- [ ] 5 primary icons  
- [ ] 5 secondary icons  
- [ ] 4 throw icons  
- [ ] Confirm colors don’t collide with enemy telegraphs (red = danger, keep weapon icons cyan/amber/violet)

---

## Pipeline after HUD merge (v0.9.62–0.9.64)

- **v0.9.62 rail-clear:** `--hud-stick-clear` +36px; mute/pause stacked; stronger water meniscus + active glow.
- **v0.9.63 color-tokens:** `--weapon-primary/secondary/throw` shared; cards `cat-*`.
- **v0.9.64 branch-card layout:** branch/ult pick cards shorter + ellipsis + scroll max-height (UI only; no ult invent).

## HUD merge (v0.9.61) — supersedes v0.9.60 scattered chips

In-run portrait rhythm (tokens in `css/game.css`):

1. **Top `#hud-hub`** — one large **horizontally centered** panel (`--hud-hub-top` / `--hud-hub-max-w`)
   - HP **bar** left + LV · **TIME** center · SCORE (+ ARM if >0)
   - XP bar with **%** (`#xp-pct`)
   - goal + zone inside hub meta row
2. **Mute/pause** — top-right icon buttons outside hub (may lightly attach)
3. **Bottom `#weapon-rail`** — centered, **space-evenly**, **no name labels**; color families via `--wrail-primary/secondary/throw`
4. **Water-cup fill** — `.wrail-fill` `--fill` on secondary (ammo/energy) + throw (CD remaining); primary full + ready pulse when active
5. **`#weapon-status`** — hidden (active = rail cell highlight)
6. Stick raised via `--hud-stick-clear` above rail band

### Prior overlap rhythm (v0.9.60) — historical

1. Row 1 — HP/LV left · TIME/SCORE · mute/pause
2. Row 2 — XP alone
3. Row 3 — `#weapon-status` under XP; rail showed full names
4. Side — goal + zone at `--hud-side-top`
5. Bottom rail + stick clear

## Controls / HUD / floor (v0.9.59)

| Rule | Value |
|------|--------|
| Play arena floor | **Near-black** plate — no multi-color / zone-tint flash on main floor |
| Danger / zone-pressure edges | **Kept** as safety telegraphs (not removed) |
| Soft / hard / pad rings | Near-black only — no teal/amber/violet zone recolor |
| Double-tap (playfield) | Arm owned **secondary** + start `secondaryBurstLeft = 3` |
| Triple-tap (playfield) | Fire owned **throw** off CD (one shot) |
| Debounce | ~300–400ms (`TAP_WINDOW_MS = 360`); stick drag ≠ tap |
| `secondaryBurstMax` | **3** — after 3 `_consumeSecondary` returns → `fireMode = primary` |
| Balance | **v0.9.124 BALANCE-PASS-001 shipped** — Lv1 + stacked branch/ult dmgMul fair retune; further only after Roy try |

---

## Legacy map (v0.9.58 — internal aliases only)

Player-facing level-up / crate cards use **catalog ids only**. Legacy unlock cards
(`laser`／鐳射炮, `rocket`／火箭炮, `grenade`, `plasma`) were **removed** from `CARDS`.
`shotgun` stays (same catalog id · secondary). Generic buffs (`dmg`/`rate`/`multi`/`pierce`/
`overclock`/`glass`) reworded off bare「機槍」→「主武器」. Mech `starterWeapon` = `gatling`.

| Legacy id (ingest only) | Catalog id | Notes |
|-------------------------|------------|-------|
| `mg` | `gatling` | starter; fire tag may still emit `mg`; HUD shows 機關雷射炮 |
| `laser` | `ion_beam` | crates/saves normalize; no player card titled 鐳射炮 |
| `shotgun` | `shotgun` | same id · **secondary** |
| `rocket` | `tracking_bomb` | no player card titled 火箭炮 |
| `grenade` | `frag` | throw |
| `plasma` | `acid_gun` | secondary energy |

`WEAPON_ID_ALIASES` + `normalizeWeaponId()` keep fire-path / save / test compat.
Do **not** re-add player cards under legacy ids.

---

## Stub vs live (this ship)

| Piece | Status |
|-------|--------|
| Catalog IDs + zh/en strings | **live** (v0.9.58 player cards = catalog only) |
| Loadout 2+2+2 model | **live** |
| Merged hub + color water rail | **live** (v0.9.61) |
| Stick/hub clear + water polish | **live** (v0.9.62) |
| Shared P/S/T color tokens | **live** (v0.9.63) |
| Branch card layout polish | **live** (v0.9.64) |
| Stick hide-until-touch | **live** (v0.9.65) |
| Stick clamp above rail | **live** (v0.9.66) |
| Water-fill edge states (drained/on-cd/burst) | **live** (v0.9.67) |
| Rail phone tap target ≥44px | **live** (v0.9.68) |
| Branch/ult path chip (A/B/C·U) | **live** (v0.9.69) |
| Branch EN path titles (`branchNamesEn`) | **live** (v0.9.80) |
| Primary branch naming table EN columns | **live** (v0.9.85 WEAPONS-BRANCH-PRIMARY-EN-DOCS-001) |
| Branch kit hints match branchNames | **live** (v0.9.86 WEAPONS-BRANCH-HINT-SYNC-001) |
| Ult light-amp labels (U1 POWER AMP / U2 CADENCE AMP) | fallback stubs kept (v0.9.82); cards use unique titles |
| Unique ult card labels (30 forms) | **live** (v0.9.122 WEAPONS-ULT-LABELS-001) |
| Ult pick UI (Lv5 primary) unique kits | **live** (v0.9.123) — stacks on branch letter |
| Unique ult kits (30 forms primary×branch×U) | **live** (v0.9.123 WEAPONS-ULT-KITS-001; spec v0.9.121; labels v0.9.122) |
| Ult light-amp multipliers documented (×1.2 / ×0.85) | **live** (v0.9.88 WEAPONS-ULT-LIGHT-AMP-DOCS-001) |
| HUD hub region a11y | **live** (v0.9.91 HUD-HUB-A11Y-001) |
| Pause/over dialog a11y | **live** (v0.9.92–0.9.93) |
| Share btn aria-label | **live** (v0.9.94 SHARE-BTN-ARIA-001) |
| Boss HP region a11y | **live** (v0.9.95 BOSS-HP-A11Y-001) |
| Hub armor i18n | **live** (v0.9.96 HUB-ARMOR-I18N-001) |
| Level-card focus ring | **live** (v0.9.97 LEVEL-CARD-FOCUS-001) |
| Level screen dialog a11y | **live** (v0.9.101 LEVEL-DIALOG-A11Y-001) |
| XP bar progressbar a11y | **live** (v0.9.102 XP-BAR-A11Y-001) |
| HUD zone/goal status a11y | **live** (v0.9.103–0.9.104) |
| Neon/icon btn focus rings | **live** (v0.9.108–0.9.109) |
| Stick/fps aria-hidden | **live** (v0.9.110 / v0.9.113) |
| Rail path corner badge (A/B/C·U) | **live** (v0.9.73) |
| Home/settings tap ≥44px | **live** (v0.9.70) |
| In-run mute/pause ≥44px | **live** (v0.9.71) |
| Home mech-card tap ≥44 tall | **live** (v0.9.72) |
| HUD no-overlap vertical rhythm | **live** (v0.9.60; superseded layout) |
| Bottom color-only rail (no names) | **live** (v0.9.61) |
| Bottom rail + unified status HUD | **live** (v0.9.59; status hidden in 0.9.61) |
| Near-black arena floor | **live** (v0.9.59) |
| Multi-tap secondary / throw | **live** (v0.9.59) |
| Secondary ≤3 burst → primary | **live** (v0.9.59) |
| Primary auto-fire (gatling, ion_beam) | **live** (exemplars) |
| Secondary ammo/energy → auto primary | **live** (shotgun, acid_gun) |
| Throw tap (frag) | **live** |
| Other catalog fire | **live** (v0.9.75) all 14 exemplar + feel behaviors |
| Branch pick UI (Lv3) | **live** level-cards + apply |
| Ult pick UI (Lv5 primary) | **live** unique kits (v0.9.123) |
| Branch deep kits A/B/C | **live** (v0.9.55) distinct fire/behavior |
| Real art icons | **placeholder** — Roy art pipeline above |
| Full balance pass vs all elites | **v0.9.124 BALANCE-PASS-001 done** — further retune only after Roy try |

---

## Test / evidence

- `tests/weapons-loadout.test.mjs` — capacity, normalize, mode switch, empty→primary  
- `tests/weapons-catalog.test.mjs` — full roster presence  
- `tests/weapons-branch-pick.test.mjs` — unlock gates, offers, Game apply branch/ult  
- `tests/weapons-branch-kits.test.mjs` — A≠B≠C combat deltas (gatling + ion/vulcan/zero/tracking)
- `tests/weapons-ult-labels.test.mjs` + `tests/weapons-ult-kits.test.mjs` — 30 unique ult labels + behavior kits  
- `tests/weapons-branch-shots.mjs` → `tests/screenshots/weapons-branch/`  
- `tests/weapons-branch-kits-shots.mjs` → `tests/screenshots/weapons-branch-kits/`  
- Screenshots: … + hud-overlap-fix (v0.9.60) + **hud-merge (v0.9.61)**
- `tests/weapons-legacy-purge.test.mjs` + `tests/screenshots/weapons-legacy-purge/`
- `tests/weapons-hud-controls-floor.test.mjs` + `tests/screenshots/weapons-hud-controls-floor/`  
- Box = SwiftShader ≠ Roy device try → **HOLD for Roy try** after push
