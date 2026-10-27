import {
  WEAPON_CATALOG, LOADOUT_CAPS, WEAPON_ID_ALIASES, normalizeWeaponId, weaponDef,
  PRIMARY_IDS, SECONDARY_IDS, THROW_IDS, ALL_WEAPON_IDS,
  emptyLoadout, starterLoadout, flattenLoadout, loadoutFromFlat,
  addToLoadout, swapLoadoutSlot, findInLoadout, isArmedInLoadout,
  weaponLevel, initialResource, ultimateIdStubs, categoryOf, hasEmptyInCategory, slotCountFilled,
  SLOT_WEAPONS as WEAPONS_SLOT_LIST, WEAPON_SLOT_MAX as WEAPONS_SLOT_MAX,
  emptyWeaponSlots as weaponsEmptySlots, isSlotWeapon as weaponsIsSlot,
  hasEmptyWeaponSlot as weaponsHasEmpty, weaponSlotLevel as weaponsSlotLevel,
  WEAPON_ICON, WEAPON_LABEL,
  BRANCH_UNLOCK_LV, ULT_UNLOCK_LV, branchLetter, branchIndex, branchOptions, ultOptions,
  branchStatMods, buildBranchOfferCards, buildUltOfferCards, needsBranchPick, needsUltPick,
  ULT_STUB_LABELS,
} from './weapons.js';
export {
  WEAPON_CATALOG, LOADOUT_CAPS, WEAPON_ID_ALIASES, normalizeWeaponId, weaponDef,
  PRIMARY_IDS, SECONDARY_IDS, THROW_IDS, ALL_WEAPON_IDS,
  emptyLoadout, starterLoadout, flattenLoadout, loadoutFromFlat,
  addToLoadout, swapLoadoutSlot, findInLoadout, isArmedInLoadout,
  weaponLevel, initialResource, ultimateIdStubs, WEAPON_ICON, WEAPON_LABEL,
  categoryOf, hasEmptyInCategory, slotCountFilled,
  BRANCH_UNLOCK_LV, ULT_UNLOCK_LV, branchLetter, branchIndex, branchOptions, ultOptions,
  branchStatMods, buildBranchOfferCards, buildUltOfferCards, needsBranchPick, needsUltPick,
  ULT_STUB_LABELS,
} from './weapons.js';
export const GAME_ID = 'neon-swarm';
export const KIT = '0.3.16';
export const TRIAL = { runsPerDay: 3, surviveSec: 480 };
export const ADS = {
  interstitialCooldownSec: 180,
  breaksBetweenInterstitials: 2,
  graceSec: 120,
  units: { android: {} },
};

/** Big open wilderness arena — soft edge, not a tight ring. */
export const ARENA = {
  half: 36,
  soft: 30,
  floorY: 0,
  spawnNear: 12,
  spawnFar: 18,
};

export const PLAYER = {
  speed: 5.4,
  radius: 0.42,
  hp: 7,
  fireCd: 0.10,          // continuous MG base RoF
  bulletSpeed: 28,
  bulletDmg: 0.30,       // per-pellet; ~45% nerf vs 0.55 (v0.8.3); RoF unchanged
  bulletLife: 0.62,
  magnet: 2.4,
  armor: 0,
  fireRange: 11,
};

/**
 * Mech roster — shared skeleton / select UI / bake pipeline; per-mech parts via `model`.
 * Playable vertical slice: `horn` only. `heavy` / `prototype` are showcase stubs
 * (playable:false — 「製作中」). Stub stats are NOT formal balance.
 *
 * Shape (single source of truth for UI + Game):
 *   id, model, stats{hp,speed,damage,fireRate}, starterWeapon, passive,
 *   plate/accent/trim/hot/visor, muzzle{dist,y}, bonus (legacy adapter — prefer stats)
 */
export const MECHS = [
  {
    id: 'horn',
    model: 'horn',
    playable: true,
    zh: '覺醒突擊型', en: 'AWAKEN ASSAULT', zhShort: '覺醒', enShort: 'AWAKEN',
    descZh: '深灰＋青紫 · 均衡突擊 · 開局護盾 +1 · 暴走縫隙青→洋紅', descEn: 'Deep-gray + cyan/violet · balanced · +1 shield · rampage cyan→magenta',
    hue: 'violet', plate: 0x1a1e28, accent: 0x3a2a55, trim: 0x00e5ff, hot: 0x00e5ff, visor: 0x7ad7ff,
    rampage: 0xff2bd6,
    stats: { hp: 1.14, speed: 1, damage: 1, fireRate: 1 },
    starterWeapon: 'gatling',
    passive: 'rampage',
    muzzle: { dist: 0.78, y: 0.95 },
    // legacy adapter (logic may still read these) — keep in sync with stats
    bonus: { maxHp: 1 },
  },
  {
    // STUB showcase — not startable. Stats provisional; do not treat as balance.
    id: 'heavy',
    model: 'heavy',
    playable: false,
    comingSoon: true,
    zh: '高速精密型', en: 'PRECISION FRAME', zhShort: '精密', enShort: 'PRECISION',
    descZh: '製作中 · 白粉精密機體（數值暫定，非正式平衡）', descEn: 'Coming soon · white-pink precision (stub stats, not balance)',
    hue: 'rose', plate: 0xe8dce6, accent: 0xf5eef3, trim: 0xff7ab0, hot: 0xffb0d0, visor: 0xffd6ea,
    stats: { hp: 1, speed: 0.92, damage: 1, fireRate: 1 },
    starterWeapon: 'gatling',
    passive: 'precision', // stub id — no unique ability yet
    muzzle: { dist: 0.72, y: 1.05 },
    bonus: { speedMul: 0.92, armor: 1 },
  },
  {
    // STUB showcase — not startable. Stats provisional; do not treat as balance.
    id: 'prototype',
    model: 'prototype',
    playable: false,
    comingSoon: true,
    zh: '可變結構原型', en: 'MORPH PROTOTYPE', zhShort: '原型', enShort: 'MORPH',
    descZh: '製作中 · 可變結構原型（數值暫定，非正式平衡）', descEn: 'Coming soon · morph prototype (stub stats, not balance)',
    hue: 'citrus', plate: 0x1a2218, accent: 0x2a3a22, trim: 0x00e5ff, hot: 0xffc21a, visor: 0x7cffea,
    stats: { hp: 1, speed: 1.06, damage: 1, fireRate: 1 },
    starterWeapon: 'gatling',
    passive: 'morph', // stub id — no morph states yet
    muzzle: { dist: 0.74, y: 0.98 },
    bonus: { speedMul: 1.06, magnetMul: 1.25 },
  },
];

export const MECH_BY_ID = Object.fromEntries(MECHS.map((m) => [m.id, m]));

/** Only horn is startable in the current vertical slice. */
export function isMechPlayable(mech) {
  const m = typeof mech === 'string' ? MECH_BY_ID[mech] : mech;
  return !!(m && m.playable !== false && !m.comingSoon);
}


/**
 * Derive runtime combat numbers from PLAYER base × mech.stats (+ legacy bonus fields).
 * UI bars / cards MUST call this (or read the same fields Game uses) — never a second fake table.
 */
export function resolveMechCombat(mech) {
  const m = typeof mech === 'string' ? MECH_BY_ID[mech] : mech;
  const cfg = m || MECH_BY_ID.horn;
  const st = cfg.stats || {};
  const bonus = cfg.bonus || {};
  const speedMul = st.speed != null ? st.speed : (bonus.speedMul || 1);
  const damageMul = st.damage != null ? st.damage : 1;
  const fireRateMul = st.fireRate != null ? st.fireRate : 1;
  const armorAdd = bonus.armor || 0;
  const magnetMul = bonus.magnetMul || 1;
  // Prefer stats.hp multiplier when it meaningfully differs from 1; else legacy bonus.maxHp.
  let maxHp;
  if (st.hp != null && Math.abs(st.hp - 1) > 0.001) {
    maxHp = Math.max(1, Math.round(PLAYER.hp * st.hp));
  } else {
    maxHp = PLAYER.hp + (bonus.maxHp || 0);
  }
  return {
    maxHp,
    speed: PLAYER.speed * speedMul,
    bulletDmg: PLAYER.bulletDmg * damageMul,
    fireCd: PLAYER.fireCd / Math.max(0.25, fireRateMul),
    magnet: PLAYER.magnet * magnetMul,
    armor: PLAYER.armor + armorAdd,
    starterWeapon: cfg.starterWeapon || 'gatling',
    passive: cfg.passive || null,
    muzzle: cfg.muzzle || { dist: 0.72, y: 0.95 },
  };
}

/**
 * Hostiles are HUMANS first — the scientists and soldiers sent to stop the runaway mech —
 * with drones / walkers as their support. Every entry carries a Chinese + English name so the
 * view can paint a readable label and the death screen can say who stopped you.
 *   family: human | support     kind: silhouette used by view.js
 */
export const ENEMIES = {
  // ---- tier 1: lab crew (weak, numerous) ----
  staffer: {
    zh: '研究員', en: 'Lab Staff', family: 'human', kind: 'human', tier: 1,
    hp: 2, speed: 2.15, radius: 0.30, xp: 1, score: 10, chase: 1, damage: 1,
    color: 0xff3b6e, coat: 0xeef2fb, panic: true,
  },
  guard: {
    zh: '保安人員', en: 'Security', family: 'human', kind: 'human', tier: 1,
    hp: 3, speed: 2.0, radius: 0.32, xp: 1, score: 14, chase: 1, damage: 1,
    color: 0xffb020, coat: 0x2b3350, gun: true,
  },
  // ---- tier 2: line troops with light support ----
  soldier: {
    zh: '士兵', en: 'Soldier', family: 'human', kind: 'soldier', tier: 2,
    hp: 5, speed: 2.3, radius: 0.34, xp: 2, score: 22, chase: 1, damage: 1,
    color: 0x35d6ff, vest: 0x2a4a58, gun: true,
  },
  drone: {
    zh: '偵察機甲', en: 'Scout Drone', family: 'support', kind: 'drone', tier: 2,
    hp: 2, speed: 3.2, radius: 0.24, xp: 1, score: 12, chase: 1.15, damage: 1,
    color: 0x00e5ff,
  },
  // ---- tier 3: officers + heavier support ----
  officer: {
    zh: '隊長', en: 'Field Officer', family: 'human', kind: 'officer', tier: 3,
    hp: 12, speed: 1.75, radius: 0.4, xp: 4, score: 45, chase: 0.95, damage: 2,
    color: 0xff7ae6, coat: 0x3a1446, gun: true, shield: 0.35,
  },
  // ---- Phase 3 sniper (long rifle + red aim telegraph) — not a recolor ----
  sniper: {
    zh: '狙擊單位', en: 'Sniper Unit', family: 'human', kind: 'sniper', tier: 3,
    hp: 8, speed: 1.55, radius: 0.36, xp: 4, score: 48, chase: 0.7, damage: 1,
    color: 0xc93a4a, coat: 0x2a3328, gun: true, sniper: true,
  },
  // ---- Phase 3 shield guard (big front plate + frontal mitigation) — not a recolor ----
  shield: {
    zh: '盾衛', en: 'Shield Guard', family: 'human', kind: 'shield', tier: 3,
    hp: 24, speed: 1.05, radius: 0.48, xp: 5, score: 58, chase: 0.72, damage: 2,
    color: 0x6a8cff, coat: 0x243048, shieldGuard: true,
  },
  // ---- Phase 3 heavy artillery (big barrel + orange blast telegraph) — not a recolor ----
  artillery: {
    zh: '重炮單位', en: 'Heavy Artillery', family: 'support', kind: 'artillery', tier: 3,
    hp: 22, speed: 0.72, radius: 0.55, xp: 6, score: 70, chase: 0.35, damage: 2,
    color: 0xff8a20, coat: 0x2a2e28, artillery: true,
  },
  // ---- Phase 3 suicide bomber (compact runner + charge pack; red self-blast telegraph) — not a recolor ----
  bomber: {
    zh: '自爆單位', en: 'Suicide Bomber', family: 'support', kind: 'bomber', tier: 2,
    hp: 6, speed: 2.85, radius: 0.34, xp: 3, score: 36, chase: 1.05, damage: 1,
    color: 0xff2a6a, coat: 0x2a2c32, bomber: true,
  },
  // ---- Phase 3 flanker (lean runner + asymmetric blades/vents; cyan dash telegraph) — not a recolor ----
  flanker: {
    zh: '側襲單位', en: 'Flanker', family: 'support', kind: 'flanker', tier: 2,
    hp: 4, speed: 2.95, radius: 0.32, xp: 3, score: 30, chase: 1.1, damage: 1,
    color: 0x9b6dff, coat: 0x2a2e38, flanker: true,
  },
  // ---- Phase 3 medic (support pack / antenna / lime cross plate; white+teal) — not a recolor ----
  medic: {
    zh: '醫療支援', en: 'Combat Medic', family: 'support', kind: 'medic', tier: 2,
    hp: 4, speed: 2.45, radius: 0.33, xp: 3, score: 28, chase: 0.85, damage: 1,
    color: 0xb8fff0, coat: 0xe8f4f2, medic: true,
  },
  // ---- Phase 3 jammer (dish / mast / emitter pods; dark steel + magenta/violet) — not a recolor ----
  jammer: {
    zh: '干擾單位', en: 'Signal Jammer', family: 'support', kind: 'jammer', tier: 2,
    hp: 4, speed: 2.2, radius: 0.34, xp: 3, score: 32, chase: 0.75, damage: 1,
    color: 0xc44dff, coat: 0x1e222a, jammer: true,
  },
  walker: {
    zh: '重裝機甲', en: 'Heavy Walker', family: 'support', kind: 'walker', tier: 3,
    hp: 16, speed: 1.2, radius: 0.52, xp: 5, score: 55, chase: 0.85, damage: 2,
    color: 0xc9a227,
  },
  // ---- tier 4: elite scientists with escort mechs ----
  chief: {
    zh: '首席科學家', en: 'Chief Scientist', family: 'human', kind: 'chief', tier: 4,
    hp: 26, speed: 1.5, radius: 0.42, xp: 8, score: 110, chase: 0.9, damage: 2,
    color: 0xffe600, coat: 0xfff8dc, gun: false, aura: true,
  },
  mech: {
    zh: '護衛機甲', en: 'Escort Mech', family: 'support', kind: 'mech', tier: 4,
    hp: 40, speed: 1.35, radius: 0.6, xp: 10, score: 150, chase: 0.8, damage: 3,
    color: 0xff2bd6, shield: 0.25,
  },
  // ---- Phase 3 elite beat (SENTINEL PRIME) ----
  sentinel: {
    zh: '哨戒長', en: 'SENTINEL PRIME', family: 'support', kind: 'sentinel', tier: 5,
    hp: 90, speed: 1.15, radius: 0.72, xp: 18, score: 400, chase: 0.85, damage: 3,
    color: 0xb44dff, elite: true,
  },
  // ---- Phase 3 elite #2 (HUNTER RAID) — multi-segment telegraph ----
  hunter: {
    zh: '獵殺機甲', en: 'HUNTER RAID', family: 'support', kind: 'hunter', tier: 5,
    hp: 95, speed: 1.35, radius: 0.68, xp: 18, score: 420, chase: 0.95, damage: 3,
    color: 0x3de0ff, elite: true,
  },
  // ---- Phase 3 elite #3 (ARMY COMMANDER) — tall officer-mech; summon / attack mode shifts ----
  commander: {
    zh: '軍指揮官', en: 'ARMY COMMANDER', family: 'support', kind: 'commander', tier: 5,
    hp: 100, speed: 1.05, radius: 0.70, xp: 20, score: 450, chase: 0.8, damage: 3,
    color: 0xffb020, elite: true,
  },
  // ---- Phase 3 boss beat (SWARM CORE) ----
  swarm_core: {
    zh: '洪流核心', en: 'SWARM CORE', family: 'support', kind: 'swarm_core', tier: 6,
    hp: 200, speed: 0.55, radius: 1.15, xp: 40, score: 2000, chase: 0.4, damage: 4,
    color: 0xb8ff3a, boss: true,
  },
};

export const ENEMY_BY_ID = ENEMIES;

/**
 * Sniper unit (PHASE3-ENEMY-SNIPER-001): keep distance, red aim telegraph, then shot.
 * Telegraph ≥0.8–1.2s — never silent instant snipe. Red = imminent damage.
 */
export const SNIPER = {
  telegraphSec: 1.0,
  cooldownSec: 3.0,
  idealMin: 7.5,
  idealMax: 12.5,
  retreatBelow: 6.0,
  approachAbove: 14.0,
  shotDamage: 2,
  shotRange: 18,
  beamHalfWidth: 0.45,
  repositionSpeedMul: 0.9,
};

/**
 * Shield Guard (PHASE3-ENEMY-SHIELD-001): slow chase, face player, frontal defense.
 * Clear rule: face · normalize(src − enemy) ≥ frontConeDot (~120° front cone)
 * → damage × (1 − frontMitigation); flank/rear take full damage.
 * Bash = short red contact-slam telegraph (not AoE orange).
 */
export const SHIELD_GUARD = {
  frontMitigation: 0.85,
  frontConeDot: 0.5,
  bashTelegraphSec: 0.65,
  bashCooldownSec: 2.6,
  bashRange: 1.55,
  bashDamage: 2,
  faceTurnRate: 4.5,
};

/**
 * Heavy Artillery (PHASE3-ENEMY-ARTILLERY-001): slow/stationary-ish, long orange blast telegraph,
 * then AoE impact at predicted/player-area aim zone. Orange = blast radius. Never silent.
 * Telegraph ≥0.8–1.2s.
 */
export const ARTILLERY = {
  telegraphSec: 1.0,
  cooldownSec: 3.8,
  blastRadius: 2.4,
  blastDamage: 2,
  idealMin: 8.0,
  idealMax: 14.0,
  retreatBelow: 5.0,
  approachAbove: 16.0,
  leadSec: 0.55,
  repositionSpeedMul: 0.55,
};

/**
 * Suicide Bomber (PHASE3-ENEMY-BOMBER-001): chase → red ground-circle telegraph under self ≥0.9s → AoE detonate.
 * Red = must-dodge self-blast (distinct from artillery orange aim-zone). Killed mid-telegraph = no explode.
 * Telegraph ≥0.9–1.2s. Fuse band ~2.2–3.2 world units.
 */
export const BOMBER = {
  telegraphSec: 1.0,
  blastRadius: 2.2,
  blastDamage: 3,
  fuseMin: 2.2,
  fuseMax: 3.2,
  chaseSpeedMul: 1.0,
  telegraphSpeedMul: 0.12,
};

/**
 * Flanker (PHASE3-ENEMY-FLANKER-001): arc/flank approach → cyan/danger dash telegraph ≥0.85s
 * → dash contact damage → recover → re-angle. Forces run-and-gun + close-range aim.
 * Steel + violet/cyan trim (no red hull). Killed mid-telegraph = no dash damage.
 */
export const FLANKER = {
  telegraphSec: 0.9,
  dashSpeed: 11.5,
  dashSec: 0.28,
  dashDamage: 2,
  dashHitRadius: 0.9,
  recoverSec: 1.35,
  flankIdealMin: 5.5,
  flankIdealMax: 9.5,
  dashCommitRange: 7.0,
  approachSpeedMul: 1.05,
  telegraphSpeedMul: 0.08,
  recoverSpeedMul: 0.55,
  flankStrafe: 1.2,
};

/**
 * Combat Medic (PHASE3-ENEMY-MEDIC-001): stay mid-range near wounded ordinary allies →
 * lime heal telegraph ≥0.7s → heal pulse (cap; no resurrect; ordinary-only, no elite/boss/player).
 * Soft flee when alone / low HP / player close. White/teal + lime cross (no red hull).
 */
export const MEDIC = {
  telegraphSec: 0.75,
  healAmount: 2,
  healRadius: 4.2,
  healMaxTargets: 2,
  recoverSec: 1.15,
  seekIdealMin: 3.2,
  seekIdealMax: 6.0,
  fleePlayerDist: 3.4,
  fleeHpFrac: 0.45,
  approachSpeedMul: 1.0,
  telegraphSpeedMul: 0.12,
  fleeSpeedMul: 1.3,
  recoverSpeedMul: 0.7,
};

/**
 * Signal Jammer (PHASE3-ENEMY-JAMMER-001): mid-range → violet jam telegraph ≥0.85s →
 * short fireCd mul debuff on player (×1.35 ~2.5s; stack cap 1, refresh OK) → recover/reposition.
 * Dark steel + magenta/violet emitters (no red hull). Kill mid-telegraph = no apply.
 * Visual: reuse hurt/overlay magenta flash — no new toast.
 */
export const JAMMER = {
  telegraphSec: 0.9,
  jamMul: 1.35,
  jamDuration: 2.5,
  jamRange: 9.0,
  recoverSec: 1.4,
  idealMin: 5.0,
  idealMax: 8.5,
  approachSpeedMul: 0.95,
  telegraphSpeedMul: 0.1,
  recoverSpeedMul: 0.65,
};

/**
 * Periodic arena danger pulse (PHASE6-PERIODIC-DANGER-001): mid–late must-dodge red circles.
 * Complementary to bomber (enemy fuse) and artillery (orange aim-zone) — this is an arena strike.
 * No damage during telegraph; skip while paused / level-up / weaponOffer / dead.
 */
export const DANGER_PULSE = {
  startAfter: 80,
  everySec: 20,
  telegraphSec: 1.0,
  radius: 2.4,
  damage: 2,
  maxConcurrent: 2,
  offsetMin: 1.8,
  offsetMax: 4.0,
};

/**
 * Late-run shrinking safe zone (PHASE6-ZONE-PRESSURE-001).
 * Persistent pollution boundary complementary to DANGER_PULSE (periodic red circles).
 * ARENA.soft/half unchanged for early game; pressure only after startAfter.
 */
export const ZONE_PRESSURE = {
  startAfter: 110,
  shrinkSec: 200,
  startR: 30,   // ~ARENA.soft
  endR: 16,     // playable floor — not a point
  dmgPerSec: 1.0,
  tickSec: 0.5,
};

/**
 * Kill score bonuses for positioning + clear efficiency (PHASE6-SCORE-POSITION-001).
 * Additive only — base e.score + floor(t) path unchanged. No mid-run toast.
 */
export const SCORE_POS = {
  moveWindowSec: 0.5,
  moveBonus: 2,
  safeBonus: 3,
  paceWindowSec: 2.5,
  paceMinKills: 4,
  paceBonus: 1,
  /** Hard cap: max paceBonus points awarded from one kill (prevents runaway). */
  paceCapPerKill: 1,
};

/**
 * Elite defaults (SENTINEL) + per-type overrides (BEATS-PLAN elite #2 = more segments).
 * Use eliteCfg(type) so _spawnElite / _tickElite stay shared.
 */
export const ELITE = {
  type: 'sentinel',
  telegraphSec: 1.2,
  chargeSpeed: 9.5,
  chargeSec: 0.55,
  recoverSec: 2.0,
  recoverShortSec: 0.5,
  walkSecMin: 1.6,
  walkSecMax: 2.8,
  spawnPauseSec: 1.5,
  walkSpeedMul: 0.85,
  chargeDamage: 3,
  comboSegs: 1,
  byType: {
    sentinel: { comboSegs: 1 },
    hunter: {
      telegraphSec: 1.25,
      chargeSpeed: 10.8,
      chargeSec: 0.48,
      recoverSec: 1.8,
      recoverShortSec: 0.55,
      walkSecMin: 1.2,
      walkSecMax: 2.2,
      walkSpeedMul: 1.05,
      chargeDamage: 3,
      comboSegs: 2,
      dualLane: true,
    },
    commander: {
      telegraphSec: 1.1,
      summonTelegraphSec: 1.0,
      attackTelegraphSec: 1.1,
      chargeSpeed: 8.8,
      chargeSec: 0.52,
      recoverSec: 1.7,
      recoverShortSec: 0.6,
      walkSecMin: 1.5,
      walkSecMax: 2.6,
      walkSpeedMul: 0.78,
      chargeDamage: 3,
      comboSegs: 1,
      dualLane: false,
      summonCount: 4,
      summonTypes: ['soldier', 'drone'],
      modeShift: true,
    },
  },
};

/** Merge ELITE defaults with per-type overrides (no byType nesting in result). */
export function eliteCfg(type) {
  const over = (ELITE.byType && type && ELITE.byType[type]) || {};
  const { byType, ...base } = ELITE;
  return { ...base, ...over };
}

/**
 * SWARM CORE boss (BEATS-PLAN §3) — HP-third phases: Orbit → Volley → Frenzy.
 * Kill reward: choice of 3 cards + score bonus 5000×(1+t/60).
 */
export const BOSS = {
  type: 'swarm_core',
  spawnPauseSec: 2.0,
  hoverSpeedMul: 0.55,
  contactDamage: 4,
  // Orbit (HP > 2/3)
  orbitCycleSec: 3.0,
  orbitTelegraphSec: 0.9,
  orbitSpawnCount: 3,
  // Volley (HP 1/3..2/3)
  volleyWays: 6,
  volleyCycleSec: 4.0,
  volleyTelegraphSec: 0.85,
  volleyBulletSpeed: 7.2,
  volleyBulletDamage: 2,
  volleyBulletLife: 2.4,
  volleyBulletRadius: 0.22,
  // Frenzy (HP ≤ 1/3): spawn spike then recover toward Orbit timing
  frenzyDurationSec: 8.0,
  frenzySpawnMul: 2.0,
  frenzyCycleSec: 1.5,
  // Reward
  cardChoices: 3,
  scoreBonusBase: 5000,
  podCount: 8,
};

/** Named run beats: elite #1 @2:00, elite #2 @4:00, boss @6:00 (inside trial window). */
export const BEATS = [
  { at: 120, kind: 'elite', id: 'sentinel' },
  { at: 240, kind: 'elite', id: 'hunter' },
  { at: 300, kind: 'elite', id: 'commander' },
  { at: 360, kind: 'boss', id: 'swarm_core' },
];

/**
 * Endless cadence after fixed boss (BEATS-PLAN §1 / v0.9.18).
 * Shape: ENDLESS config + Game._beatCheck → _endlessBeatCheck (not dynamic BEATS rows).
 * - Elites every eliteEvery sec after startAfter, rotating eliteRotate (sentinel/hunter/commander).
 * - Boss every bossEvery sec, reusing swarm_core.
 * - Max one elite; schedule defers while elite (or boss for boss beats) still alive.
 * - Gated on Game.endless === true so endless:false skips cadence; trial surviveSec unchanged.
 */
export const ENDLESS = {
  startAfter: 360,
  eliteEvery: 90,
  bossEvery: 300,
  eliteRotate: ['sentinel', 'hunter', 'commander'],
  bossId: 'swarm_core',
};


/**
 * Ground drops (v0.9.30 silhouettes).
 *   XP = green shards · Heal = white+green cross pack · Magnet = blue pulse disc
 *   Weapon = gold board landmark (v0.9.29 halo kept) · Shield = violet board (rare/legacy)
 * Gun emblems come from the weapon that is currently losing to the crowd.
 */
export const DROP = {
  xp: {
    letter: 'X', color: 0x3bff8a, zh: '經驗', en: 'XP',
    silhouette: 'shard', scale: 0.62,
    glowR: 0.38, glowOp: 0.36, rimInner: 0.32, rimOuter: 0.42, rimOp: 0.55,
  },
  heal: {
    letter: 'H', color: 0x7cff9a, zh: '修復', en: 'REPAIR',
    silhouette: 'pack', scale: 0.88,
    glowR: 0.52, glowOp: 0.44, rimInner: 0.44, rimOuter: 0.56, rimOp: 0.7,
  },
  magnet: {
    letter: 'M', color: 0x4aa8ff, zh: '磁吸', en: 'MAGNET',
    silhouette: 'disc', scale: 0.95,
    glowR: 0.7, glowOp: 0.4, rimInner: 0.58, rimOuter: 0.78, rimOp: 0.75,
  },
  shield: {
    letter: 'S', color: 0xb44dff, zh: '護盾', en: 'SHIELD',
    silhouette: 'board', scale: 0.9,
    glowR: 0.55, glowOp: 0.4, rimInner: 0.48, rimOuter: 0.58, rimOp: 0.6,
  },
  weapon: {
    letter: 'W', color: 0xffc21a, zh: '武器', en: 'WEAPON',
    silhouette: 'board', scale: 1.15,
    glowR: 0.74, glowOp: 0.58, rimInner: 0.62, rimOuter: 0.76, rimOp: 0.82,
  },
};

/** Rare magnet ground-drop chance after heal roll fails (XP/heal amounts unchanged). */
export const MAGNET_DROP_CHANCE = 0.025;

/** Level-up cards — weapons + armour. `shape` drives the big emblem in the pick UI. */
export const CARDS = [
  { id: 'dmg', kind: 'weapon', icon: '⚡', shape: 'bolt',
    zh: '火力強化', en: 'FIREPOWER', descZh: '主武器傷害 +0.35', descEn: 'Primary damage +0.35',
    apply: (s) => { s.bulletDmg += 0.35; } },
  { id: 'rate', kind: 'weapon', icon: '⏱', shape: 'clock', max: 6,
    zh: '連射超頻', en: 'RAPID FIRE', descZh: '主武器射速 +18%（最多 6）', descEn: 'Primary rate +18% (max 6)',
    apply: (s) => { s.fireCd = Math.max(0.045, s.fireCd * 0.82); } },
  { id: 'shotgun', kind: 'weapon', icon: '✴', shape: 'spread', max: 5,
    zh: '散彈槍', en: 'SHOTGUN', descZh: '副武器·近距扇形散彈（最多 5）', descEn: 'Secondary pellet cone (max 5)',
    apply: (s) => { s.shotgun = Math.min(5, (s.shotgun || 0) + 1); } },
  { id: 'multi', kind: 'weapon', icon: '◎', shape: 'lock', max: 3,
    zh: '鎖定多目標', en: 'MULTI-LOCK', descZh: '主武器同時鎖定 +1（最多 4）', descEn: 'Primary locks +1 foe (max 4)',
    apply: (s) => { s.multi = Math.min(4, (s.multi || 1) + 1); } },
  { id: 'pierce', kind: 'weapon', icon: '↗', shape: 'pierce', max: 4,
    zh: '穿透芯', en: 'PIERCE', descZh: '主武器穿透 +1（最多 4）', descEn: 'Primary pierce +1 (max 4)',
    apply: (s) => { s.pierce = Math.min(4, (s.pierce || 0) + 1); } },
  { id: 'orbit', kind: 'weapon', icon: '⟳', shape: 'orbit', max: 4,
    zh: '軌道刃', en: 'ORBIT BLADES', descZh: '環繞刃 +1（最多 4）', descEn: '+1 orbit blade (max 4)',
    apply: (s) => { s.orbits = Math.min(4, (s.orbits || 0) + 1); } },
  { id: 'nova', kind: 'weapon', icon: '✸', shape: 'nova', max: 6,
    zh: '新星脈衝', en: 'NOVA PULSE', descZh: '週期範圍傷害（最多 6）', descEn: 'Periodic AoE blast (max 6)',
    apply: (s) => { s.nova = (s.nova || 0) + 1; s.novaCd = Math.max(2.2, 4.5 - s.nova * 0.4); } },
  { id: 'armor', kind: 'armor', icon: '🛡', shape: 'shield', max: 3,
    zh: '裝甲板', en: 'ARMOR PLATE', descZh: '接觸傷害 −1（最少 1）· 裝甲層 +1', descEn: 'Contact dmg −1 (min 1) · armor +1',
    apply: (s) => { s.armor = Math.min(3, (s.armor || 0) + 1); } },
  { id: 'plating', kind: 'armor', icon: '▣', shape: 'plate',
    zh: '強化護盾', en: 'SHIELD PLATING', descZh: '最大 HP +2 並回滿', descEn: 'Max HP +2 & heal full',
    apply: (s) => { s.maxHp += 2; s.hp = s.maxHp; } },
  { id: 'deflect', kind: 'armor', icon: '◈', shape: 'deflect', max: 3,
    zh: '偏折力場', en: 'DEFLECTOR', descZh: '受傷後無敵時間更長（最多 3）', descEn: 'Longer i-frames after hit (max 3)',
    apply: (s) => { s.deflect = Math.min(0.75, (s.deflect || 0) + 0.25); } },
  { id: 'speed', kind: 'util', icon: '≫', shape: 'swift', max: 5,
    zh: '疾行', en: 'SWIFT', descZh: '移動 +12%（最多 5）', descEn: 'Move +12% (max 5)',
    apply: (s) => { s.speed *= 1.12; } },
  { id: 'magnet', kind: 'util', icon: '⊕', shape: 'magnet', max: 4,
    zh: '磁吸', en: 'MAGNET', descZh: '經驗吸取範圍↑（最多 4）', descEn: 'XP magnet↑ (max 4)',
    apply: (s) => { s.magnet *= 1.35; } },
  { id: 'hp', kind: 'armor', icon: '♥', shape: 'heart',
    zh: '護盾芯', en: 'SHIELD CORE', descZh: '最大 HP +1 並回滿', descEn: 'Max HP +1 & heal',
    apply: (s) => { s.maxHp += 1; s.hp = s.maxHp; } },
  // v0.9.53 catalog + v0.9.58 legacy purge — player cards = catalog ids only (aliases internal)
  { id: 'gatling', kind: 'weapon', icon: '⚡', shape: 'bolt', max: 5,
    zh: '機關雷射炮', en: 'GATLING LASER', descZh: '主武器·持續自動射擊（最多 5）', descEn: 'Primary auto-fire (max 5)',
    apply: (s) => { s.gatling = Math.min(5, (s.gatling || 0) + 1); s.bulletDmg = (s.bulletDmg || 1) + 0.18; } },
  { id: 'ion_beam', kind: 'weapon', icon: '═', shape: 'rail', max: 5,
    zh: '離子光束', en: 'ION BEAM', descZh: '主武器·穿透離子束（最多 5）', descEn: 'Primary piercing beam (max 5)',
    apply: (s) => { s.ion_beam = Math.min(5, (s.ion_beam || 0) + 1); s.laser = Math.min(5, (s.laser || 0) + 1); } },
  { id: 'tracking_bomb', kind: 'weapon', icon: '🚀', shape: 'nova', max: 5,
    zh: '追蹤爆彈', en: 'TRACKING BOMB', descZh: '主武器·追蹤爆炸彈（最多 5）', descEn: 'Primary homing bomb (max 5)',
    apply: (s) => { s.tracking_bomb = Math.min(5, (s.tracking_bomb || 0) + 1); s.rocket = Math.min(5, (s.rocket || 0) + 1); } },
  { id: 'vulcan', kind: 'weapon', icon: '☢', shape: 'bolt', max: 5,
    zh: '火神', en: 'VULCAN', descZh: '主武器·超高射速近距（最多 5）', descEn: 'Primary ultra-RoF shred (max 5)',
    apply: (s) => { s.vulcan = Math.min(5, (s.vulcan || 0) + 1); } },
  { id: 'zero_laser', kind: 'weapon', icon: '❄', shape: 'frost', max: 5,
    zh: '零度激光', en: 'ZERO LASER', descZh: '主武器·寒冰穿透激光（最多 5）', descEn: 'Primary chill pierce laser (max 5)',
    apply: (s) => { s.zero_laser = Math.min(5, (s.zero_laser || 0) + 1); } },
  { id: 'acid_gun', kind: 'weapon', icon: '☣', shape: 'frost', max: 5,
    zh: '硫酸槍', en: 'ACID GUN', descZh: '副武器·溶甲酸液（能源；最多 5）', descEn: 'Secondary acid (energy; max 5)',
    apply: (s) => { s.acid_gun = Math.min(5, (s.acid_gun || 0) + 1); s.plasma = Math.min(5, (s.plasma || 0) + 1); } },
  { id: 'slow_gun', kind: 'weapon', icon: '🕸', shape: 'orb', max: 5,
    zh: '緩速槍', en: 'SLOW GUN', descZh: '副武器·緩速彈（能源；最多 5）', descEn: 'Secondary slow (energy; max 5)',
    apply: (s) => { s.slow_gun = Math.min(5, (s.slow_gun || 0) + 1); } },
  { id: 'attack_drone', kind: 'weapon', icon: '🛸', shape: 'orbit', max: 5,
    zh: '攻擊兵衛', en: 'ATTACK DRONE', descZh: '副武器·護衛無人機（充能；最多 5）', descEn: 'Secondary escort drone (max 5)',
    apply: (s) => { s.attack_drone = Math.min(5, (s.attack_drone || 0) + 1); } },
  { id: 'blackhole', kind: 'weapon', icon: '◉', shape: 'nova', max: 5,
    zh: '黑洞炮', en: 'BLACKHOLE CANNON', descZh: '副武器·引力坍縮（充能；最多 5）', descEn: 'Secondary blackhole (max 5)',
    apply: (s) => { s.blackhole = Math.min(5, (s.blackhole || 0) + 1); } },
  { id: 'frag', kind: 'weapon', icon: '💣', shape: 'orb', max: 5,
    zh: '破片榴彈', en: 'FRAG GRENADE', descZh: '投擲·破片爆破（最多 5）', descEn: 'Throw frag blast (max 5)',
    apply: (s) => { s.frag = Math.min(5, (s.frag || 0) + 1); s.grenade = Math.min(5, (s.grenade || 0) + 1); } },
  { id: 'chill', kind: 'weapon', icon: '❄', shape: 'frost', max: 5,
    zh: '冷卻彈', en: 'CHILL BOMB', descZh: '投擲·緩速霜域（最多 5）', descEn: 'Throw chill field (max 5)',
    apply: (s) => { s.chill = Math.min(5, (s.chill || 0) + 1); } },
  { id: 'flash', kind: 'weapon', icon: '✦', shape: 'nova', max: 5,
    zh: '閃光彈', en: 'FLASHBANG', descZh: '投擲·致盲打斷（最多 5）', descEn: 'Throw flash interrupt (max 5)',
    apply: (s) => { s.flash = Math.min(5, (s.flash || 0) + 1); } },
  { id: 'gravity', kind: 'weapon', icon: '◎', shape: 'magnet', max: 5,
    zh: '重力彈', en: 'GRAVITY BOMB', descZh: '投擲·引力坍縮（最多 5）', descEn: 'Throw gravity crush (max 5)',
    apply: (s) => { s.gravity = Math.min(5, (s.gravity || 0) + 1); } },
  // PHASE6-TRADEOFF-CARDS-001 — build depth via trade-offs (existing card numbers unchanged)
  { id: 'overclock', kind: 'weapon', icon: '⚙', shape: 'overclock', max: 3,
    zh: '超頻過載', en: 'OVERCLOCK',
    descZh: '主武器射速↑（CD×0.85）· 裝甲 −1（最少 0）',
    descEn: 'Primary rate↑ (CD×0.85) · armor −1 (min 0)',
    apply: (s) => {
      s.fireCd = Math.max(0.045, (s.fireCd || 0.1) * 0.85);
      s.armor = Math.max(0, (s.armor || 0) - 1);
    } },
  { id: 'glass', kind: 'weapon', icon: '◇', shape: 'glass', max: 2,
    zh: '玻璃大炮', en: 'GLASS CANNON',
    descZh: '主武器傷害 +0.45 · 最大 HP −1（最少 3；當前 HP 同步上限）',
    descEn: 'Primary dmg +0.45 · max HP −1 (floor 3; clamp HP)',
    apply: (s) => {
      s.bulletDmg = (s.bulletDmg || 0) + 0.45;
      s.maxHp = Math.max(3, (s.maxHp || 3) - 1);
      s.hp = Math.min(s.hp, s.maxHp);
    } },
  { id: 'heavy_frame', kind: 'armor', icon: '▰', shape: 'heavy', max: 3,
    zh: '重裝機架', en: 'HEAVY FRAME',
    descZh: '裝甲 +1（最多 3）· 移動速度 ×0.88',
    descEn: 'Armor +1 (cap 3) · move speed ×0.88',
    apply: (s) => {
      s.armor = Math.min(3, (s.armor || 0) + 1);
      s.speed = Math.max(2.8, (s.speed || 5.4) * 0.88);
    } },
];

/** Icon shown on drops for the weapon that is "carrying" the run (see Game.weaponIcon). */
export const WEAPON_ICONS = {
  dmg: '⚡', rate: '⏱', laser: '═', shotgun: '✴', rocket: '🚀', grenade: '💣', plasma: '☢',
  multi: '◎', pierce: '↗', orbit: '⟳', nova: '✸',
  gatling: '⚡', ion_beam: '═', tracking_bomb: '🚀', vulcan: '☢', zero_laser: '❄',
  acid_gun: '☣', slow_gun: '🕸', attack_drone: '🛸', blackhole: '◉',
  frag: '💣', chill: '❄', flash: '✦', gravity: '◎',
  ...WEAPON_ICON,
};

/** Large English labels drawn on neon pickup frames (readable at a glance). */
export const WEAPON_DROP_LABEL = {
  dmg: 'DMG', rate: 'ROF', laser: 'ION', shotgun: 'SG', rocket: 'TRK',
  grenade: 'FRAG', plasma: 'ACID', multi: 'MULTI', pierce: 'PRC',
  orbit: 'ORB', nova: 'NOVA',
  gatling: 'GAT', ion_beam: 'ION', tracking_bomb: 'TRK', vulcan: 'VUL', zero_laser: 'ZERO',
  acid_gun: 'ACID', slow_gun: 'SLOW', attack_drone: 'DRN', blackhole: 'BH',
  frag: 'FRAG', chill: 'CHILL', flash: 'FLASH', gravity: 'GRAV',
};

const CARDS_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

/** True once a card has hit its `max` stacks (uncapped cards are never exhausted). */
export function cardExhausted(card, taken) {
  return !!card && card.max != null && (taken[card.id] || 0) >= card.max;
}

export function xpToLevel(lv) {
  return Math.floor(3 + lv * 1.8 + lv * lv * 0.25);
}

/**
 * Pressure curve for a human-led manhunt: crew first, then soldiers + drones, then officers and
 * walkers, then chiefs with escort mechs. Everything scales with time but the wave mix is what
 * makes it feel like a hunt.
 */
export function swarmPressure(t) {
  const k = Math.min(1, t / 150);
  const density = 0.75 + t * 0.007 + k * 1.2 + Math.min(1.0, Math.max(0, t - 30) / 280);
  const hpMul = 1 + Math.min(1.8, Math.max(0, t - 25) / 140);
  const speedMul = 1 + Math.min(0.35, Math.max(0, t - 20) / 240);
  return { density, hpMul, speedMul };
}

/**
 * Phase 6 map zones (v0.9.17) — same arena; edge décor + wave mix shift.
 * Escape path (HANDOFF): lab → assembly → reactor → blockade → rooftop.
 * Implemented: all five zones.
 * assemblyAt = 195s (3:15), after sentinel@120 and before hunter@240.
 * reactorAt  = 285s (4:45), after hunter@240 and before boss@360.
 * blockadeAt = 420s (7:00), after boss@360.
 * rooftopAt  = 510s (8:30), after blockade@420.
 */
export const MAP_ZONE = {
  assemblyAt: 195,
  reactorAt: 285,
  blockadeAt: 420,
  rooftopAt: 510,
};

/** Weighted wave table. Optional zone overrides lab table. */
export function waveMix(t, zone = null) {
  const z = zone || (
    t >= MAP_ZONE.rooftopAt ? 'rooftop'
      : t >= MAP_ZONE.blockadeAt ? 'blockade'
        : t >= MAP_ZONE.reactorAt ? 'reactor'
          : t >= MAP_ZONE.assemblyAt ? 'assembly'
            : 'lab'
  );
  if (z === 'rooftop') {
    // Rooftop: sky pressure — light sniper/shield/artillery/bomber/flanker/jammer; medic rare.
    return [['drone', 0.22], ['mech', 0.18], ['chief', 0.14], ['officer', 0.08], ['soldier', 0.07], ['walker', 0.02], ['sniper', 0.07], ['shield', 0.04], ['artillery', 0.07], ['bomber', 0.04], ['flanker', 0.03], ['medic', 0.02], ['jammer', 0.02]];
  }
  if (z === 'blockade') {
    // Blockade: military pressure — mid artillery + shield; light bomber/flanker/medic/jammer.
    return [['soldier', 0.21], ['officer', 0.17], ['chief', 0.14], ['mech', 0.13], ['sniper', 0.05], ['shield', 0.10], ['artillery', 0.05], ['bomber', 0.03], ['flanker', 0.05], ['medic', 0.04], ['jammer', 0.03]];
  }
  if (z === 'reactor') {
    // Reactor: energy facility — light sniper/shield/artillery/bomber/medic/jammer; flanker rare.
    return [['drone', 0.19], ['mech', 0.16], ['officer', 0.15], ['walker', 0.09], ['soldier', 0.07], ['chief', 0.04], ['sniper', 0.07], ['shield', 0.06], ['artillery', 0.06], ['bomber', 0.04], ['flanker', 0.02], ['medic', 0.03], ['jammer', 0.02]];
  }
  if (z === 'assembly') {
    // Assembly bay: industrial — shield mid; jammer rare; light bomber/flanker/medic.
    return [['soldier', 0.24], ['walker', 0.21], ['officer', 0.10], ['drone', 0.08], ['chief', 0.03], ['staffer', 0.03], ['sniper', 0.04], ['shield', 0.10], ['artillery', 0.04], ['bomber', 0.03], ['flanker', 0.05], ['medic', 0.04], ['jammer', 0.01]];
  }
  if (t < 18) return [['staffer', 0.6], ['guard', 0.25], ['drone', 0.15]];
  if (t < 40) return [['staffer', 0.32], ['guard', 0.2], ['soldier', 0.3], ['drone', 0.18]];
  // Mid-late lab: sniper/bomber/flanker/medic/jammer after ~40s; shield after ~65s; artillery late.
  if (t < 65) return [['staffer', 0.16], ['soldier', 0.26], ['drone', 0.18], ['officer', 0.09], ['walker', 0.09], ['sniper', 0.08], ['bomber', 0.05], ['flanker', 0.04], ['medic', 0.03], ['jammer', 0.02]];
  if (t < 100) return [['soldier', 0.19], ['drone', 0.13], ['walker', 0.12], ['officer', 0.14], ['chief', 0.08], ['sniper', 0.10], ['shield', 0.08], ['bomber', 0.05], ['flanker', 0.04], ['medic', 0.04], ['jammer', 0.03]];
  return [['soldier', 0.12], ['walker', 0.15], ['officer', 0.14], ['chief', 0.12], ['mech', 0.10], ['sniper', 0.09], ['shield', 0.08], ['artillery', 0.05], ['bomber', 0.05], ['flanker', 0.04], ['medic', 0.03], ['jammer', 0.03]];
}

export function pickEnemyType(rng, t, zone = null) {
  const mix = waveMix(t, zone);
  let r = rng();
  for (const [id, w] of mix) {
    if (r < w) return id;
    r -= w;
  }
  return mix[mix.length - 1][0];
}

/**
 * Draw n distinct level-up cards that are still available.
 * Fully exhausted cards drop out; when the pool runs dry the safety net is drawn from the
 * uncapped cards (dmg / plating / hp), so a level-up ALWAYS yields a pickable choice.
 */
export function pickCards(rng, n = 3, taken = null) {
  const exhausted = (c) => cardExhausted(c, taken || {});
  let pool = CARDS.filter((c) => !exhausted(c));
  if (!pool.length) pool = CARDS.filter((c) => c.max == null);
  if (!pool.length) pool = CARDS.slice();
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    const j = Math.floor(rng() * pool.length);
    out.push(pool.splice(j, 1)[0]);
  }
  return out;
}


/**
 * Phase 6 multi-slot inventory (v0.9.28).
 * Fireable weapon systems that occupy HUD slots. MG upgrades (dmg/rate/…) do NOT.
 * Cap 6 (2P+2S+2T): start with gatling in P0.
 */
/** Phase 6 + v0.9.53 weapons redesign — loadout 2P+2S+2T (see docs/WEAPONS.md / js/weapons.js). */
export const SLOT_WEAPONS = WEAPONS_SLOT_LIST;
export const WEAPON_SLOT_MAX = WEAPONS_SLOT_MAX;

export function isSlotWeapon(id) {
  return weaponsIsSlot(id);
}

export function emptyWeaponSlots() {
  return weaponsEmptySlots();
}

export function slotFilledCount(slots) {
  return (slots || []).filter(Boolean).length;
}

export function hasEmptyWeaponSlot(slots, max = WEAPON_SLOT_MAX) {
  return weaponsHasEmpty(slots);
}

/** Display level for a slot weapon (gatling/mg defaults to 1). */
export function weaponSlotLevel(id, taken = {}) {
  return weaponsSlotLevel(id, taken);
}


/**
 * Phase 6 weapon-crate offer (v0.9.11 + v0.9.28 slots + v0.9.29 polish).
 * Always returns a pickable choice list — never silently mutates `taken` / slots.
 * Modes: take | upgrade | max | swap (new type, inventory full).
 * Rule: fireable ownership = presence in `weaponSlots`; `taken` holds stack levels only.
 * For slot weapons, "owned" means currently slotted (orphan stacks are pruned by Game).
 */
export function buildWeaponPickupOffer(weaponId, taken = {}, slots = null) {
  const nid = normalizeWeaponId(weaponId) || weaponId;
  // Prefer exact card id; legacy alias crates (laser/plasma/…) resolve via normalizeWeaponId → catalog card.
  const base = CARDS_BY_ID[weaponId] || CARDS_BY_ID[nid];
  // Synthetic starter may lack card — only real weapon cards are crate targets.
  if (!base || base.kind !== 'weapon') return null;
  const stacks = Math.max((taken && taken[nid]) || 0, (taken && taken[weaponId]) || 0);
  const slotWeapon = isSlotWeapon(nid) || isSlotWeapon(weaponId);
  const flat = Array.isArray(slots) ? slots : (slots && slots.primary ? flattenLoadout(slots) : slots);
  const inSlots = !!(flat && slotWeapon && (flat.includes(nid) || flat.includes(weaponId)
    || flat.some((s) => normalizeWeaponId(s) === nid)));
  // Slot weapons: when slots provided, owned = on the bar. slots=null → legacy stacks.
  // Non-slot cards (dmg/rate/…) always use stacks.
  const owned = slotWeapon
    ? (slots == null ? stacks > 0 : inSlots)
    : stacks > 0;
  const atMax = base.max != null && stacks >= base.max
    && (slotWeapon && slots != null ? inSlots : true);
  const def = weaponDef(nid);
  const cat = def && def.category;
  // Category indices in flat HUD: P0,P1,S0,S1,T0,T1
  const CAT_RANGE = { primary: [0, 1], secondary: [2, 3], throw: [4, 5] };
  const catRange = cat ? CAT_RANGE[cat] : null;
  let categoryFull = false;
  if (slotWeapon && flat && !owned && catRange) {
    const filled = catRange.every((i) => {
      const s = flat[i];
      return !!s && normalizeWeaponId(s) !== nid;
    });
    categoryFull = filled;
  }
  const slotsFull = slotWeapon && flat && !owned && (!hasEmptyWeaponSlot(flat) || categoryFull);
  let mode = atMax ? 'max' : (owned ? 'upgrade' : (slotsFull ? 'swap' : 'take'));
  const choices = [];
  const PICKUP_HEAL = 2;

  if (mode === 'swap') {
    // Prefer same-category swap targets when category is full (2P+2S+2T).
    const consider = (sid, i) => {
      const ns = normalizeWeaponId(sid) || sid;
      if (!sid || ns === 'gatling' || sid === 'mg') return;
      if (categoryFull && catRange && (i < catRange[0] || i > catRange[1])) return;
      const out = CARDS_BY_ID[ns] || CARDS_BY_ID[sid];
      const outZh = out ? out.zh : sid;
      const outEn = out ? out.en : sid.toUpperCase();
      choices.push({
        id: base.id,
        kind: base.kind,
        icon: base.icon,
        shape: base.shape,
        max: base.max,
        apply: base.apply,
        pickupAction: 'swap',
        swapIndex: i,
        swapOut: sid,
        zh: `換下 ${outZh}`,
        en: `SWAP OUT ${outEn}`,
        descZh: `第${i + 1}格 → ${base.zh} · 卸走 ${outZh}`,
        descEn: `Slot ${i + 1} → ${base.en} · drop ${outEn}`,
      });
    };
    (flat || []).forEach(consider);
    // Fallback: if somehow only starter filled, allow any non-null (except force-keep gatling if alone).
    if (!choices.length) {
      (flat || []).forEach((sid, i) => {
        if (!sid) return;
        if (categoryFull && catRange && (i < catRange[0] || i > catRange[1])) return;
        const ns = normalizeWeaponId(sid) || sid;
        const out = CARDS_BY_ID[ns] || CARDS_BY_ID[sid];
        const outZh = out ? out.zh : (ns === 'gatling' || sid === 'mg' ? '機關雷射炮' : sid);
        const outEn = out ? out.en : (ns === 'gatling' || sid === 'mg' ? 'GATLING' : sid.toUpperCase());
        choices.push({
          id: base.id,
          kind: base.kind,
          icon: base.icon,
          shape: base.shape,
          max: base.max,
          apply: base.apply,
          pickupAction: 'swap',
          swapIndex: i,
          swapOut: sid,
          zh: `換下 ${outZh}`,
          en: `SWAP OUT ${outEn}`,
          descZh: `第${i + 1}格 → ${base.zh}`,
          descEn: `Slot ${i + 1} → ${base.en}`,
        });
      });
    }
  } else if (!atMax) {
    const nextLv = stacks + 1;
    choices.push({
      id: base.id,
      kind: base.kind,
      icon: base.icon,
      shape: base.shape,
      max: base.max,
      apply: base.apply,
      pickupAction: owned ? 'upgrade' : 'take',
      zh: owned
        ? `升級 · Lv${stacks}→${nextLv}`
        : `裝上 · ${base.zh}`,
      en: owned
        ? `UPGRADE · Lv${stacks}→${nextLv}`
        : `TAKE · ${base.en}`,
      descZh: owned
        ? `疊層${base.max != null ? ` ${nextLv}／${base.max}` : ''} · ${base.descZh}`
        : `加進武器欄 · ${base.descZh}`,
      descEn: owned
        ? `Stack${base.max != null ? ` ${nextLv}/${base.max}` : ''} · ${base.descEn}`
        : `Add to weapon bar · ${base.descEn}`,
    });
  } else {
    // At max: optional consolation — small heal (cheap, no XP cascade into another pause).
    choices.push({
      id: '_pickup_heal',
      kind: 'util',
      icon: '♥',
      shape: 'heart',
      max: null,
      pickupAction: 'convertHeal',
      healAmount: PICKUP_HEAL,
      zh: `兌成修復 +${PICKUP_HEAL}`,
      en: `CONVERT · +${PICKUP_HEAL} HP`,
      descZh: `已滿級（${stacks}${base.max != null ? `／${base.max}` : ''}）· 回復 ${PICKUP_HEAL} 點生命`,
      descEn: `At max (${stacks}${base.max != null ? `/${base.max}` : ''}) · restore ${PICKUP_HEAL} HP`,
      apply: (s) => { s.hp = Math.min(s.maxHp, s.hp + PICKUP_HEAL); },
    });
  }

  choices.push({
    id: '_pickup_keep',
    kind: 'util',
    icon: '↩',
    shape: 'deflect',
    max: null,
    pickupAction: 'keep',
    zh: '唔要 · 繼續跑',
    en: 'SKIP · KEEP RUNNING',
    descZh: mode === 'swap'
      ? '唔換欄 · 箱子唔攞 · 恢復戰鬥'
      : (atMax ? '唔兌修復 · 箱子唔攞 · 恢復戰鬥' : '箱子唔攞 · 恢復戰鬥'),
    descEn: mode === 'swap'
      ? 'No swap · decline crate · resume'
      : (atMax ? 'No heal · decline crate · resume' : 'Decline crate · resume fight'),
    apply: () => {},
  });

  return { weaponId, mode, stacks, owned, atMax, choices, base, slotsFull: !!slotsFull };
}


export { CARDS_BY_ID };

/**
 * Weapon identity for projectile art: every weapon owns a shot shape, a base colour that shifts
 * with its stack level, and how big the shot reads. view.js turns `shot` into geometry.
 *   shot : bolt | spike | blade | star | lance | wave | orb
 */
/**
 * Projectile art: MG is a procedural cyan line (no sprite). Specials use small PNGs under assets/ammo/.
 *   shot : line | laser | splash | rocket | grenade | plasma | blade | wave | orb
 */
export const WEAPON_SHOT = {
  mg:       { shot: 'line',    tiers: ['#00e5ff', '#7ad7ff', '#ffffff'], size: 0.72, sprite: null },
  dmg:      { shot: 'line',    tiers: ['#00e5ff', '#7ad7ff', '#ffffff'], size: 0.78, sprite: null },
  rate:     { shot: 'line',    tiers: ['#7ad7ff', '#00e5ff', '#b060ff'], size: 0.7,  sprite: null },
  laser:    { shot: 'laser',   tiers: ['#9ef2ff', '#00e5ff', '#ffffff'], size: 1.35, sprite: 'laser' },
  shotgun:  { shot: 'splash',  tiers: ['#7ad7ff', '#00e5ff', '#ffe600'], size: 0.85, sprite: 'shotgun_splash' },
  rocket:   { shot: 'rocket',  tiers: ['#c9d2e0', '#00e5ff', '#ffe600'], size: 1.15, sprite: 'rocket' },
  grenade:  { shot: 'grenade', tiers: ['#8a93a8', '#00e5ff', '#b8ff3a'], size: 1.0,  sprite: 'grenade' },
  mortar:   { shot: 'grenade', tiers: ['#8a93a8', '#00e5ff', '#b8ff3a'], size: 1.05, sprite: 'mortar' },
  plasma:   { shot: 'plasma',  tiers: ['#b8ff3a', '#7affc0', '#00e5ff'], size: 1.05, sprite: 'plasma' },
  pierce:   { shot: 'line',    tiers: ['#9ef2ff', '#4fb8ff', '#ffffff'], size: 0.85, sprite: null },
  multi:    { shot: 'line',    tiers: ['#00e5ff', '#35d6ff', '#ffffff'], size: 0.75, sprite: null },
  orbit:    { shot: 'blade',   tiers: ['#ffe600', '#ff9a1f', '#ff2bd6'], size: 1.0,  sprite: null },
  nova:     { shot: 'wave',    tiers: ['#ffe600', '#ffb020', '#ff6b1f'], size: 1.2,  sprite: null },
};

/** Ammo / fragment PNG paths (relative to game root). */
export const AMMO_PATHS = {
  rocket: './assets/ammo/rocket.png',
  laser: './assets/ammo/laser.png',
  shotgun_splash: './assets/ammo/shotgun_splash.png',
  grenade: './assets/ammo/grenade.png',
  mortar: './assets/ammo/mortar.png',
  plasma: './assets/ammo/plasma.png',
  fragment: './assets/ammo/fragment.png',
};

/** stack count -> colour tier index (0 = fresh, 1 = upgraded, 2 = maxed). */
export function shotTier(stacks) {
  return stacks >= 4 ? 2 : stacks >= 2 ? 1 : 0;
}
