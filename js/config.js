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
  spawnNear: 13,
  spawnFar: 19,
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

export const ENEMIES = {
  runner:    { hp: 2, speed: 2.45, radius: 0.32, xp: 1, score: 10, color: 0xff2bd6, chase: 1 },
  tank:      { hp: 9, speed: 1.1,  radius: 0.52, xp: 3, score: 35, color: 0xb44dff, chase: 0.85 },
  splitter:  { hp: 4, speed: 1.7,  radius: 0.4,  xp: 2, score: 22, color: 0xffe600, chase: 0.95, split: 2 },
  swarmling: { hp: 1, speed: 3.5,  radius: 0.22, xp: 1, score: 8,  color: 0x3bff8a, chase: 1.15 },
};

/**
 * Level-up cards — weapons + armor.
 * `shape` drives the large SVG emblem in the pick UI; `icon` is a glyph fallback.
 * kind: weapon | armor | util
 */
export const CARDS = [
  // `max` caps how many times a card may be taken; cards without it are uncapped.
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

const CARDS_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

/** True once a card has hit its `max` stacks (uncapped cards are never exhausted). */
export function cardExhausted(card, taken) {
  return !!card && card.max != null && (taken[card.id] || 0) >= card.max;
}

export function xpToLevel(lv) {
  return Math.floor(3 + lv * 1.8 + lv * lv * 0.25);
}

export function swarmPressure(t) {
  const k = Math.min(1, t / 100);
  const early = t < 20 ? 0.95 + t * 0.06 : 2.15;
  const density = early + k * 2.0 + Math.min(1.6, Math.max(0, t - 15) / 180);
  const hpMul = 1 + Math.min(2.2, Math.max(0, t - 12) / 90);
  const speedMul = 1 + Math.min(0.45, Math.max(0, t - 18) / 200);
  return { density, hpMul, speedMul };
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
