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
  fireCd: 0.38,
  bulletSpeed: 14,
  bulletDmg: 1,
  bulletLife: 1.15,
  magnet: 2.4,
  armor: 0,
};

/**
 * The three selectable frames. Neutral names on purpose — the first two are palette/silhouette
 * homages only (no names, logos or exact reproductions of any existing IP).
 *   plate/accent/trim drive the mech hull; `title` is the home-screen card.
 */
export const MECHS = [
  {
    id: 'horn',
    zh: '角盔機型', en: 'HORN FRAME', zhShort: '角盔', enShort: 'HORN',
    descZh: '紫綠角盔 · 均衡 · 開局多 1 點護盾', descEn: 'Violet horned · balanced · +1 starting shield',
    hue: 'violet', plate: 0x2a1048, accent: 0x8b3dff, trim: 0x7cff3a, hot: 0xb8ff4a, visor: 0x7ad7ff,
    bonus: { maxHp: 1 },
  },
  {
    id: 'heavy',
    zh: '重裝機型', en: 'HEAVY FRAME', zhShort: '重裝', enShort: 'HEAVY',
    descZh: '白藍重裝 · 慢 8% · 接觸傷害 −1', descEn: 'White/blue heavy · 8% slower · contact damage −1',
    hue: 'ice', plate: 0x101c33, accent: 0xdfe9ff, trim: 0x2f9bff, hot: 0x8fdcff, visor: 0x9ef2ff,
    bonus: { speedMul: 0.92, armor: 1 },
  },
  {
    id: 'prototype',
    zh: '原創機型', en: 'PROTO FRAME', zhShort: '原創', enShort: 'PROTO',
    descZh: '原創霓虹 · 快 6% · 經驗吸取 +25%', descEn: 'Original neon · 6% faster · +25% XP pull',
    hue: 'citrus', plate: 0x2a1a06, accent: 0xffc21a, trim: 0x00e5ff, hot: 0xffef8a, visor: 0x7cffea,
    bonus: { speedMul: 1.06, magnetMul: 1.25 },
  },
];

export const MECH_BY_ID = Object.fromEntries(MECHS.map((m) => [m.id, m]));

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
};

export const ENEMY_BY_ID = ENEMIES;

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
    zh: '脈衝強化', en: 'PULSE+', descZh: '傷害 +1', descEn: 'Damage +1',
    apply: (s) => { s.bulletDmg += 1; } },
  { id: 'rate', kind: 'weapon', icon: '⏱', shape: 'clock', max: 6,
    zh: '射速超頻', en: 'FIRE RATE', descZh: '射速 +18%（最多 6 次）', descEn: 'Fire rate +18% (max 6)',
    apply: (s) => { s.fireCd = Math.max(0.11, s.fireCd * 0.82); } },
  { id: 'orbit', kind: 'weapon', icon: '⟳', shape: 'orbit', max: 4,
    zh: '軌道刃', en: 'ORBIT BLADES', descZh: '環繞刃 +1（最多 4）', descEn: '+1 orbit blade (max 4)',
    apply: (s) => { s.orbits = Math.min(4, (s.orbits || 0) + 1); } },
  { id: 'spread', kind: 'weapon', icon: '✴', shape: 'spread', max: 3,
    zh: '散射脈衝', en: 'SPREAD', descZh: '額外 ±18° 子彈（最多 3）', descEn: 'Extra ±18° shots (max 3)',
    apply: (s) => { s.spread = Math.min(3, (s.spread || 0) + 1); } },
  { id: 'pierce', kind: 'weapon', icon: '↗', shape: 'pierce', max: 4,
    zh: '穿透芯', en: 'PIERCE', descZh: '子彈穿透 +1（最多 4）', descEn: 'Bullet pierce +1 (max 4)',
    apply: (s) => { s.pierce = Math.min(4, (s.pierce || 0) + 1); } },
  { id: 'multi', kind: 'weapon', icon: '◎', shape: 'lock', max: 3,
    zh: '鎖定多目標', en: 'MULTI-LOCK', descZh: '同時鎖定 +1 敵人（最多 4）', descEn: 'Lock +1 extra foe (max 4)',
    apply: (s) => { s.multi = Math.min(4, (s.multi || 1) + 1); } },
  { id: 'nova', kind: 'weapon', icon: '✸', shape: 'nova', max: 6,
    zh: '新星脈衝', en: 'NOVA PULSE', descZh: '週期範圍傷害（最多 6）', descEn: 'Periodic AoE blast (max 6)',
    apply: (s) => { s.nova = (s.nova || 0) + 1; s.novaCd = Math.max(2.2, 4.5 - s.nova * 0.4); } },
  { id: 'frost', kind: 'weapon', icon: '❄', shape: 'frost', max: 3,
    zh: '冷凍協議', en: 'FROST', descZh: '命中減速敵人（最多 3）', descEn: 'Hits slow enemies (max 3)',
    apply: (s) => { s.frost = Math.min(0.54, (s.frost || 0) + 0.18); } },
  { id: 'rail', kind: 'weapon', icon: '═', shape: 'rail', max: 4,
    zh: '軌道炮', en: 'RAIL SHOT', descZh: '子彈速度 +25%、壽命↑（最多 4）', descEn: 'Bullet speed +25%, life↑ (max 4)',
    apply: (s) => { s.bulletSpeed *= 1.25; s.bulletLife = Math.min(2.2, (s.bulletLife || 1.15) * 1.2); } },
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
  dmg: '⚡', rate: '⏱', orbit: '⟳', spread: '✴', pierce: '↗', multi: '◎', nova: '✸', frost: '❄', rail: '═',
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

/** Weighted wave table: what the lab throws at you at time t. */
export function waveMix(t) {
  if (t < 18) return [['staffer', 0.6], ['guard', 0.25], ['drone', 0.15]];
  if (t < 40) return [['staffer', 0.32], ['guard', 0.2], ['soldier', 0.3], ['drone', 0.18]];
  if (t < 65) return [['staffer', 0.2], ['soldier', 0.35], ['drone', 0.25], ['officer', 0.1], ['walker', 0.1]];
  if (t < 100) return [['soldier', 0.3], ['drone', 0.2], ['walker', 0.18], ['officer', 0.22], ['chief', 0.1]];
  return [['soldier', 0.25], ['walker', 0.25], ['officer', 0.2], ['chief', 0.15], ['mech', 0.15]];
}

export function pickEnemyType(rng, t) {
  const mix = waveMix(t);
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

export { CARDS_BY_ID };

/**
 * Weapon identity for projectile art: every weapon owns a shot shape, a base colour that shifts
 * with its stack level, and how big the shot reads. view.js turns `shot` into geometry.
 *   shot : bolt | spike | blade | star | lance | wave | orb
 */
export const WEAPON_SHOT = {
  dmg:    { shot: 'bolt',  tiers: ['#4dff9a', '#8dff3a', '#ffe600'], size: 0.9 },
  rate:   { shot: 'spike', tiers: ['#7ad7ff', '#00e5ff', '#b060ff'], size: 0.78 },
  orbit:  { shot: 'blade', tiers: ['#ffe600', '#ff9a1f', '#ff2bd6'], size: 1.0 },
  spread: { shot: 'star',  tiers: ['#ff6bd6', '#ff2bd6', '#ff2b6e'], size: 0.95 },
  pierce: { shot: 'lance', tiers: ['#9ef2ff', '#4fb8ff', '#2b4dff'], size: 1.1 },
  multi:  { shot: 'orb',   tiers: ['#b8ff4a', '#35d6ff', '#ffffff'], size: 0.85 },
  nova:   { shot: 'wave',  tiers: ['#ffe600', '#ffb020', '#ff6b1f'], size: 1.2 },
  frost:  { shot: 'orb',   tiers: ['#d8f6ff', '#7ad7ff', '#3b8bff'], size: 0.9 },
  rail:   { shot: 'lance', tiers: ['#ffffff', '#c9b6ff', '#8b3dff'], size: 1.25 },
};

/** stack count -> colour tier index (0 = fresh, 1 = upgraded, 2 = maxed). */
export function shotTier(stacks) {
  return stacks >= 4 ? 2 : stacks >= 2 ? 1 : 0;
}
