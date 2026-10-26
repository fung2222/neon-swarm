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
    starterWeapon: 'mg',
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
    starterWeapon: 'mg',
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
    starterWeapon: 'mg',
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
    starterWeapon: cfg.starterWeapon || 'mg',
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
  // ---- Phase 3 boss beat (SWARM CORE) ----
  swarm_core: {
    zh: '洪流核心', en: 'SWARM CORE', family: 'support', kind: 'swarm_core', tier: 6,
    hp: 200, speed: 0.55, radius: 1.15, xp: 40, score: 2000, chase: 0.4, damage: 4,
    color: 0xb8ff3a, boss: true,
  },
};

export const ENEMY_BY_ID = ENEMIES;

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
  { at: 360, kind: 'boss', id: 'swarm_core' },
];


/**
 * Drops. Everything lands as a big letter, a weapon icon or a plain cube:
 *   X = XP crate (green cube)   H = repair (cyan cube)   S = shield (violet cube)
 * Gun emblems come from the weapon that is currently losing to the crowd.
 */
export const DROP = {
  xp: { letter: 'X', color: 0x3bff8a, zh: '經驗', en: 'XP' },
  heal: { letter: 'H', color: 0x00e5ff, zh: '修復', en: 'REPAIR' },
  shield: { letter: 'S', color: 0xb44dff, zh: '護盾', en: 'SHIELD' },
  weapon: { letter: 'W', color: 0xffc21a, zh: '武器', en: 'WEAPON' },
};

/** Level-up cards — weapons + armour. `shape` drives the big emblem in the pick UI. */
export const CARDS = [
  { id: 'dmg', kind: 'weapon', icon: '⚡', shape: 'bolt',
    zh: '火力強化', en: 'FIREPOWER', descZh: '機槍傷害 +0.35', descEn: 'MG damage +0.35',
    apply: (s) => { s.bulletDmg += 0.35; } },
  { id: 'rate', kind: 'weapon', icon: '⏱', shape: 'clock', max: 6,
    zh: '連射超頻', en: 'RAPID FIRE', descZh: '機槍射速 +18%（最多 6）', descEn: 'MG rate +18% (max 6)',
    apply: (s) => { s.fireCd = Math.max(0.045, s.fireCd * 0.82); } },
  { id: 'laser', kind: 'weapon', icon: '═', shape: 'rail', max: 4,
    zh: '鐳射炮', en: 'LASER', descZh: '解鎖／強化穿透鐳射束（最多 4）', descEn: 'Unlock/upgrade piercing laser (max 4)',
    apply: (s) => { s.laser = Math.min(4, (s.laser || 0) + 1); } },
  { id: 'shotgun', kind: 'weapon', icon: '✴', shape: 'spread', max: 4,
    zh: '散彈槍', en: 'SHOTGUN', descZh: '近距扇形散彈（最多 4）', descEn: 'Close-range pellet cone (max 4)',
    apply: (s) => { s.shotgun = Math.min(4, (s.shotgun || 0) + 1); } },
  { id: 'rocket', kind: 'weapon', icon: '🚀', shape: 'nova', max: 3,
    zh: '火箭炮', en: 'ROCKET', descZh: '慢速火箭＋範圍爆炸（最多 3）', descEn: 'Slow rocket + AoE blast (max 3)',
    apply: (s) => { s.rocket = Math.min(3, (s.rocket || 0) + 1); } },
  { id: 'grenade', kind: 'weapon', icon: '💣', shape: 'orb', max: 3,
    zh: '手榴彈／迫擊砲', en: 'GRENADE / MORTAR', descZh: '拋射延遲爆破（最多 3）', descEn: 'Lobbed delayed blast (max 3)',
    apply: (s) => { s.grenade = Math.min(3, (s.grenade || 0) + 1); } },
  { id: 'plasma', kind: 'weapon', icon: '☢', shape: 'frost', max: 3,
    zh: '電漿／鏹水', en: 'PLASMA / ACID', descZh: '電漿團＋殘留毒池（最多 3）', descEn: 'Plasma blob + lingering puddle (max 3)',
    apply: (s) => { s.plasma = Math.min(3, (s.plasma || 0) + 1); } },
  { id: 'multi', kind: 'weapon', icon: '◎', shape: 'lock', max: 3,
    zh: '鎖定多目標', en: 'MULTI-LOCK', descZh: '機槍同時鎖定 +1（最多 4）', descEn: 'MG locks +1 foe (max 4)',
    apply: (s) => { s.multi = Math.min(4, (s.multi || 1) + 1); } },
  { id: 'pierce', kind: 'weapon', icon: '↗', shape: 'pierce', max: 4,
    zh: '穿透芯', en: 'PIERCE', descZh: '機槍穿透 +1（最多 4）', descEn: 'MG pierce +1 (max 4)',
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
];

/** Icon shown on drops for the weapon that is "carrying" the run (see Game.weaponIcon). */
export const WEAPON_ICONS = {
  dmg: '⚡', rate: '⏱', laser: '═', shotgun: '✴', rocket: '🚀', grenade: '💣', plasma: '☢',
  multi: '◎', pierce: '↗', orbit: '⟳', nova: '✸',
};

/** Large English labels drawn on neon pickup frames (readable at a glance). */
export const WEAPON_DROP_LABEL = {
  dmg: 'MG', rate: 'ROF', laser: 'LASER', shotgun: 'SG', rocket: 'RKT',
  grenade: 'GRN', plasma: 'PLAS', multi: 'MULTI', pierce: 'PRC',
  orbit: 'ORB', nova: 'NOVA',
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
 * Phase 6 map zones (v0.9.16) — same arena; edge décor + wave mix shift.
 * Escape path (HANDOFF): lab → assembly → reactor → blockade → rooftop.
 * Implemented: lab + assembly + reactor + blockade.
 * assemblyAt = 195s (3:15), after sentinel@120 and before hunter@240.
 * reactorAt  = 285s (4:45), after hunter@240 and before boss@360.
 * blockadeAt = 420s (7:00), after boss@360.
 */
export const MAP_ZONE = {
  assemblyAt: 195,
  reactorAt: 285,
  blockadeAt: 420,
};

/** Weighted wave table. Optional zone overrides lab table. */
export function waveMix(t, zone = null) {
  const z = zone || (
    t >= MAP_ZONE.blockadeAt ? 'blockade'
      : t >= MAP_ZONE.reactorAt ? 'reactor'
        : t >= MAP_ZONE.assemblyAt ? 'assembly'
          : 'lab'
  );
  if (z === 'blockade') {
    // Blockade: military pressure — more soldier/officer/chief/mech, fewer staffer/drone.
    return [['soldier', 0.30], ['officer', 0.24], ['chief', 0.18], ['mech', 0.18], ['walker', 0.08], ['drone', 0.02]];
  }
  if (z === 'reactor') {
    // Reactor: energy facility pressure — more drone/mech/officer, fewer staffer/guard.
    return [['drone', 0.28], ['mech', 0.22], ['officer', 0.22], ['walker', 0.14], ['soldier', 0.1], ['chief', 0.04]];
  }
  if (z === 'assembly') {
    // Assembly bay: industrial pressure — more soldier/walker, fewer panic staffers.
    return [['soldier', 0.32], ['walker', 0.28], ['officer', 0.18], ['drone', 0.12], ['chief', 0.06], ['staffer', 0.04]];
  }
  if (t < 18) return [['staffer', 0.6], ['guard', 0.25], ['drone', 0.15]];
  if (t < 40) return [['staffer', 0.32], ['guard', 0.2], ['soldier', 0.3], ['drone', 0.18]];
  if (t < 65) return [['staffer', 0.2], ['soldier', 0.35], ['drone', 0.25], ['officer', 0.1], ['walker', 0.1]];
  if (t < 100) return [['soldier', 0.3], ['drone', 0.2], ['walker', 0.18], ['officer', 0.22], ['chief', 0.1]];
  return [['soldier', 0.25], ['walker', 0.25], ['officer', 0.2], ['chief', 0.15], ['mech', 0.15]];
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
 * Phase 6 weapon-crate offer (v0.9.11).
 * Always returns a pickable choice list — never silently mutates `taken`.
 * Modes: take (not owned) | upgrade (owned, below max) | max (at cap).
 * Architecture is stack counts in `taken` — no multi-slot inventory.
 */
export function buildWeaponPickupOffer(weaponId, taken = {}) {
  const base = CARDS_BY_ID[weaponId];
  if (!base || base.kind !== 'weapon') return null;
  const stacks = (taken && taken[weaponId]) || 0;
  const owned = stacks > 0;
  const atMax = base.max != null && stacks >= base.max;
  const mode = atMax ? 'max' : (owned ? 'upgrade' : 'take');
  const choices = [];

  if (!atMax) {
    choices.push({
      id: base.id,
      kind: base.kind,
      icon: base.icon,
      shape: base.shape,
      max: base.max,
      apply: base.apply,
      pickupAction: owned ? 'upgrade' : 'take',
      zh: owned ? `${base.zh} · 升級疊層` : `${base.zh} · 獲得`,
      en: owned ? `${base.en} · UPGRADE` : `${base.en} · TAKE`,
      descZh: owned
        ? `疊層 ${stacks}→${stacks + 1}${base.max != null ? `／${base.max}` : ''} · ${base.descZh}`
        : `裝備此武器 · ${base.descZh}`,
      descEn: owned
        ? `Stack ${stacks}→${stacks + 1}${base.max != null ? `/${base.max}` : ''} · ${base.descEn}`
        : `Equip · ${base.descEn}`,
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
      zh: '兌換修復',
      en: 'CONVERT TO REPAIR',
      descZh: `已滿級（${stacks}${base.max != null ? `／${base.max}` : ''}）· 回復 2 護盾`,
      descEn: `At max (${stacks}${base.max != null ? `/${base.max}` : ''}) · restore 2 HP`,
      apply: (s) => { s.hp = Math.min(s.maxHp, s.hp + 2); },
    });
  }

  choices.push({
    id: '_pickup_keep',
    kind: 'util',
    icon: '↩',
    shape: 'deflect',
    max: null,
    pickupAction: 'keep',
    zh: '保留現狀',
    en: 'KEEP CURRENT',
    descZh: atMax ? '已滿級 · 唔改裝備' : '唔攞呢件 · 繼續用現有裝備',
    descEn: atMax ? 'At max · leave gear unchanged' : 'Decline · keep current gear',
    apply: () => {},
  });

  return { weaponId, mode, stacks, owned, atMax, choices, base };
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
