export const GAME_ID = 'neon-swarm';
export const KIT = '0.3.16';
export const TRIAL = { runsPerDay: 3, surviveSec: 480 };
export const ADS = {
  interstitialCooldownSec: 180,
  breaksBetweenInterstitials: 2,
  graceSec: 120,
  units: { android: {} },
};

export const ARENA = { half: 7.5, floorY: 0 };
export const PLAYER = {
  speed: 5.2,
  radius: 0.38,
  hp: 7,
  fireCd: 0.38,
  bulletSpeed: 14,
  bulletDmg: 1,
  bulletLife: 1.1,
  magnet: 2.2,
};

export const ENEMIES = {
  runner: { hp: 2, speed: 2.4, radius: 0.32, xp: 1, score: 10, color: 0x00e5ff, chase: 1 },
  tank:   { hp: 8, speed: 1.15, radius: 0.48, xp: 3, score: 35, color: 0xff2bd6, chase: 0.85 },
  splitter:{ hp: 4, speed: 1.7, radius: 0.4, xp: 2, score: 22, color: 0xffe600, chase: 0.95, split: 2 },
};

/** Upgrade cards shown on level-up (id, zh, en, apply(state)) */
export const CARDS = [
  { id: 'dmg', zh: '脈衝強化', en: 'PULSE+', descZh: '傷害 +1', descEn: 'Damage +1',
    apply: (s) => { s.bulletDmg += 1; } },
  { id: 'rate', zh: '射速超頻', en: 'FIRE RATE', descZh: '射速 +18%', descEn: 'Fire rate +18%',
    apply: (s) => { s.fireCd = Math.max(0.12, s.fireCd * 0.82); } },
  { id: 'orbit', zh: '軌道刃', en: 'ORBIT BLADES', descZh: '環繞刃 +1', descEn: '+1 orbit blade',
    apply: (s) => { s.orbits = (s.orbits || 0) + 1; } },
  { id: 'speed', zh: '疾行', en: 'SWIFT', descZh: '移動 +12%', descEn: 'Move +12%',
    apply: (s) => { s.speed *= 1.12; } },
  { id: 'magnet', zh: '磁吸', en: 'MAGNET', descZh: '經驗吸取範圍↑', descEn: 'XP magnet↑',
    apply: (s) => { s.magnet *= 1.35; } },
  { id: 'hp', zh: '護盾芯', en: 'SHIELD CORE', descZh: '最大 HP +1 並回滿', descEn: 'Max HP +1 & heal',
    apply: (s) => { s.maxHp += 1; s.hp = s.maxHp; } },
];

export function xpToLevel(lv) {
  return Math.floor(3 + lv * 1.8 + lv * lv * 0.25);
}

/** Spawn budget grows then soft-caps for endless playability */
export function swarmPressure(t) {
  const k = Math.min(1, t / 120);
  // gentle first 20s, then punchy; soft-cap later
  const early = t < 20 ? 0.55 + t * 0.04 : 1.35;
  const density = early + k * 1.2 + Math.min(0.9, Math.max(0, t - 20) / 280);
  const hpMul = 1 + Math.min(2.0, Math.max(0, t - 15) / 100);
  const speedMul = 1 + Math.min(0.4, Math.max(0, t - 20) / 220);
  return { density, hpMul, speedMul };
}

export function pickCards(rng, n = 3) {
  const pool = CARDS.slice();
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    const j = Math.floor(rng() * pool.length);
    out.push(pool.splice(j, 1)[0]);
  }
  return out;
}
