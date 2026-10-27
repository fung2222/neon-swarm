# WEAPONS — 暴走機甲 / neon-swarm

> **Owner:** Grok bot (attack/power tables + counter roles) · **Product:** Roy Chan  
> **Live:** https://fung2222.github.io/neon-swarm/ · **Ship:** v0.9.53 `WEAPONS-REDESIGN-001`  
> Keep this file synced every weapons ship. UI layout HOLD (v0.9.52) stays; this beat migrates loadout/HUD/fire rules.

## Product rules (locked)

| Rule | Value |
|------|--------|
| Loadout capacity | **2 primary + 2 secondary + 2 throw** (six slots total) |
| Primary catalog | **5** weapons · max **Lv5** · **3** branch paths · each branch → **2** ultimate/大招 forms |
| Secondary catalog | **5** weapons · max **Lv5** · **2** branch paths |
| Throw catalog | **4** weapons · max **Lv5** · **2** branch paths |
| HUD | All weapon list + status at **top**; combat map mid–bottom |
| Icons | **Left column**, stacked square tiles (P / S / T groups); left-hand select |
| Primary play | Continuous **auto-fire** while that primary is selected |
| Secondary play | Switch to secondary (ammo/energy limited); empty → **auto back to primary** |
| Throw play | **Tap to throw** — no hold-select mode |

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

Branch/ult UI still stubs; feel is encoded in `WEAPON_CATALOG[].feel` + `behavior` and Game tick paths.

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

**v0.9.53 ship:** full catalog IDs/names/feel/counters; branch/ult **data stubs** (no branch UI). All 14 wired with feel-matched behaviors (exemplars fully tuned; stubs share projectile helpers).

### Branch naming stubs (primary)

| Weapon | A | B | C |
|--------|---|---|---|
| gatling | 過熱連射 | 穿甲芯 | 散射網 |
| ion_beam | 長焦聚焦 | 連鎖跳電 | 裂縫切割 |
| tracking_bomb | 三重彈頭 | 黏著地雷 | 自殺無人機 |
| vulcan | 彈幕風暴 | 燒夷彈 | 機槍堡壘 |
| zero_laser | 絕對零度 | 霜爆裂縫 | 寒晶護盾 |

Ult forms = `{branch}U1` / `{branch}U2` ids reserved (`gatling_A_U1`, …) — not selectable in v0.9.53.

---

## Balance tables (Grok-owned · v0.9.53 baseline)

Numbers are **fair first pass** vs current enemy HP (~soldier 3–5 · walker/mech higher · elites/boss separate). Tune only in a named balance ship.

### Primary base (Lv1)

| ID | dps≈ | hit | cadence | pierce | notes |
|----|------|-----|---------|--------|-------|
| gatling | 8–10 | 1.0 | cd 0.10 | 0 | laser-feel flying bolts; starter |
| ion_beam | 9–12 | **3.6** | charge 0.55 + cd 0.12 | 3 | charge→fire→charge; high per-shot |
| tracking_bomb | 7–9 | 2.4 AoE1.6 | cd 1.5 · stick 0.35 | 0 | track nearest → stick → auto explode |
| vulcan | 11–14 | 0.55 | cd 0.045 · spinUp 0.4 | 0 | minigun spray; short range |
| zero_laser | 8–10 | 1.5 + chill | cd 0.28 | 1 | discrete bolts one-by-one |

LvN ≈ Lv1 × `(1 + 0.18*(N-1))` damage; CD × `(1 - 0.06*(N-1))` floor 55% of Lv1.

### Secondary base (Lv1) + resource

| ID | hit | cadence | pool | regen / reload | notes |
|----|-----|---------|------|----------------|-------|
| acid_gun | 0.85 + dissolve | cd 0.12 | **ammo 10** | +1 / 2.2s | 10 continuous dissolving shots |
| shotgun | 0.7×10 pellets | cd 0.70 | shells 8 | +1 / 1.4s | heavy close spray |
| slow_gun | 0.6 + slow 1.6s | cd 1.1 | energy 28 | 5/s out | rush close → AoE stop/slow |
| attack_drone | 0.7 / tick | deploy 5.5s | charges 2 | +1 / 8s | deploy **2** drones |
| blackhole | 2.2 pull | cd 2.6 · dur 1.2 | charges 2 | +1 / 10s | AoE pull to center |

Empty pool → `activeMode` returns to **primary** (product rule).

### Throw base (Lv1)

| ID | dmg | fuse/s | cd/s | radius | notes |
|----|-----|--------|------|--------|-------|
| frag | 3.2 | 0.55 | 1.7 | 2.4 | frag blast + shrapnel |
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
2. **Left column** `#weapon-rail` — square tiles grouped P/S/T; pointer selects primary/secondary; throw tile = immediate throw request.  
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

## Legacy map (migration)

| Legacy slot id | New id | Notes |
|----------------|--------|-------|
| `mg` | `gatling` | starter; dmg/rate cards still buff primary gatling stats |
| `laser` | `ion_beam` | pierce beam |
| `shotgun` | `shotgun` | same id · now **secondary** |
| `rocket` | `tracking_bomb` | primary homing |
| `grenade` | `frag` | throw |
| `plasma` | `acid_gun` | secondary energy (acid role); `zero_laser` is new primary |

Pickup / cards accept legacy ids and normalize via `normalizeWeaponId()`.

---

## Stub vs live (this ship)

| Piece | Status |
|-------|--------|
| Catalog IDs + zh/en strings | **live** |
| Loadout 2+2+2 model | **live** |
| Left rail + top status HUD | **live** |
| Primary auto-fire (gatling, ion_beam) | **live** (exemplars) |
| Secondary ammo/energy → auto primary | **live** (shotgun, acid_gun) |
| Throw tap (frag) | **live** |
| Other catalog fire | **stub** shared placeholder / remapped legacy |
| Branch pick UI / ultimates | **stub data only** |
| Real art icons | **placeholder** — Roy art pipeline above |
| Full balance pass vs all elites | **baseline tables** — tune later |

---

## Test / evidence

- `tests/weapons-loadout.test.mjs` — capacity, normalize, mode switch, empty→primary  
- `tests/weapons-catalog.test.mjs` — full roster presence  
- Screenshots: `tests/screenshots/weapons-redesign/` (mobile 390 + desktop 1280)  
- Box = SwiftShader ≠ Roy device try → **HOLD for Roy try** after push
