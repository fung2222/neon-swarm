/**
 * WEAPONS-FEEL-FX-001 (v0.9.56) — combat feel FX recipes (pure; no THREE).
 * Spec: docs/WEAPONS.md feel table. Callers apply bursts via existing Particles / Shockwaves.
 * Respect MOBILE_GFX: recipes already scale counts; caller still applies burstN / shed.
 */

import { WEAPON_ID_ALIASES, weaponDef } from './weapons.js';

/** Map fire/explode tags → catalog id. */
export function normalizeFeelWeaponId(id) {
  if (!id) return null;
  const def = weaponDef(id);
  if (def) return def.id;
  const mapped = WEAPON_ID_ALIASES[id];
  if (mapped && weaponDef(mapped)) return mapped;
  // Legacy fire tags that never entered aliases
  const LEGACY = {
    laser: 'ion_beam',
    dmg: 'gatling',
    rate: 'gatling',
  };
  return LEGACY[id] || id;
}

/**
 * One burst step: { color, n, speed, up, life, size, bright, ring?, wave? }
 * ring: { n, speed, life } | false
 * wave: { r0, r1, dur, a } | false
 */
function B(color, n, o = {}) {
  return {
    color,
    n,
    speed: o.speed != null ? o.speed : 2.4,
    up: o.up != null ? o.up : 0.3,
    life: o.life != null ? o.life : 0.2,
    size: o.size != null ? o.size : 0.32,
    bright: o.bright != null ? o.bright : 1.0,
    ring: o.ring || false,
    wave: o.wave || false,
    kick: o.kick || null,
    flashMs: o.flashMs || 0,
  };
}

const FEEL_MUZZLE = Object.freeze({
  // Primary
  gatling: [
    B(0x00e5ff, 4, { speed: 3.2, up: 0.15, life: 0.14, size: 0.28 }), // laser-bolt muzzle
    B(0x7ad7ff, 2, { speed: 1.6, up: 0.35, life: 0.12, size: 0.2, mobileSkip: true }),
  ],
  ion_beam: [
    B(0xb060ff, 6, { speed: 2.8, up: 0.55, life: 0.28, size: 0.42 }), // punch fire
    B(0x00e5ff, 4, { speed: 4.2, up: 0.2, life: 0.18, size: 0.3 }),
    B(0xffe600, 2, { speed: 1.4, up: 0.8, life: 0.16, size: 0.22, mobileSkip: true }),
  ],
  tracking_bomb: [
    B(0xff9a1f, 3, { speed: 2.0, up: 0.4, life: 0.22, size: 0.34 }),
    B(0xffe600, 2, { speed: 1.2, up: 0.6, life: 0.16, size: 0.24, mobileSkip: true }),
  ],
  vulcan: [
    B(0xff6a1a, 5, { speed: 3.8, up: 0.1, life: 0.12, size: 0.26 }), // spin sparks
    B(0xffe600, 3, { speed: 2.4, up: 0.25, life: 0.1, size: 0.2 }),
    B(0xff2a4a, 2, { speed: 1.5, up: 0.45, life: 0.1, size: 0.18, mobileSkip: true }),
  ],
  zero_laser: [
    B(0x7ad7ff, 3, { speed: 2.6, up: 0.2, life: 0.2, size: 0.3 }), // chill bolt trail spark
    B(0xb8e8ff, 2, { speed: 1.4, up: 0.5, life: 0.18, size: 0.22, mobileSkip: true }),
  ],
  // Secondary
  acid_gun: [
    B(0xb8ff3a, 4, { speed: 2.8, up: 0.35, life: 0.22, size: 0.3 }), // dissolve mist
    B(0x7cff3a, 3, { speed: 1.6, up: 0.7, life: 0.28, size: 0.26, mobileSkip: true }),
  ],
  shotgun: [
    B(0xffe600, 7, { speed: 4.5, up: 0.15, life: 0.12, size: 0.28 }), // pellet flash
    B(0xff9a1f, 3, { speed: 2.2, up: 0.4, life: 0.14, size: 0.22, mobileSkip: true }),
  ],
  slow_gun: [
    B(0x00e5ff, 5, { speed: 3.0, up: 0.1, life: 0.2, size: 0.34, ring: { n: 10, speed: 5, life: 0.22 } }), // rush ring
    B(0x7ad7ff, 2, { speed: 1.5, up: 0.4, life: 0.16, size: 0.22, mobileSkip: true }),
  ],
  attack_drone: [
    B(0x00e5ff, 4, { speed: 1.8, up: 1.2, life: 0.28, size: 0.36 }), // deploy puff
    B(0xb060ff, 3, { speed: 1.2, up: 0.8, life: 0.22, size: 0.28, mobileSkip: true }),
  ],
  blackhole: [
    B(0xb060ff, 6, { speed: 1.4, up: 0.2, life: 0.35, size: 0.4, wave: { r0: 0.2, r1: 2.4, dur: 0.45, a: 0.7 } }),
    B(0x05010f, 4, { speed: 2.8, up: 0.05, life: 0.25, size: 0.3 }), // pull swirl dark
    B(0xff2bd6, 2, { speed: 2.0, up: 0.3, life: 0.18, size: 0.22, mobileSkip: true }),
  ],
  // Throw
  frag: [
    B(0xff9a1f, 3, { speed: 2.2, up: 0.5, life: 0.18, size: 0.3 }),
  ],
  chill: [
    B(0x7ad7ff, 3, { speed: 2.0, up: 0.4, life: 0.2, size: 0.28 }),
  ],
  flash: [
    B(0xffe600, 4, { speed: 3.0, up: 0.3, life: 0.12, size: 0.32 }),
  ],
  gravity: [
    B(0xb060ff, 3, { speed: 1.8, up: 0.25, life: 0.22, size: 0.3 }),
  ],
});

const FEEL_EXPLODE = Object.freeze({
  frag: [
    B(0xff6a1a, 10, { speed: 5.0, up: 1.6, life: 0.36, size: 0.5, wave: { r0: 0.3, r1: 2.6, dur: 0.38, a: 0.85 } }),
    B(0xffe600, 6, { speed: 3.2, up: 1.0, life: 0.24, size: 0.34, mobileSkip: true }), // shrapnel
  ],
  chill: [
    B(0x7ad7ff, 9, { speed: 2.6, up: 1.2, life: 0.4, size: 0.42, ring: { n: 10, speed: 4, life: 0.22 }, wave: { r0: 0.25, r1: 2.8, dur: 0.5, a: 0.65 } }),
    B(0xe8fbff, 4, { speed: 1.4, up: 1.6, life: 0.35, size: 0.28, mobileSkip: true }),
  ],
  flash: [
    B(0xffe600, 12, { speed: 5.5, up: 0.8, life: 0.18, size: 0.55, flashMs: 70 }),
    B(0xffffff, 4, { speed: 3.0, up: 0.4, life: 0.1, size: 0.4, mobileSkip: true }),
  ],
  gravity: [
    B(0xb060ff, 8, { speed: 2.0, up: 0.3, life: 0.4, size: 0.45, wave: { r0: 0.15, r1: 3.0, dur: 0.55, a: 0.75 } }),
    B(0xff2bd6, 5, { speed: 3.5, up: 0.6, life: 0.25, size: 0.32 }),
  ],
  tracking_bomb: [
    B(0xff9a1f, 8, { speed: 4.0, up: 1.4, life: 0.32, size: 0.42, wave: { r0: 0.2, r1: 1.8, dur: 0.32, a: 0.7 } }),
    B(0xffe600, 4, { speed: 2.4, up: 0.9, life: 0.2, size: 0.28, mobileSkip: true }),
  ],
  rocket: [
    B(0xff9a1f, 8, { speed: 4.0, up: 1.4, life: 0.32, size: 0.42, wave: { r0: 0.2, r1: 1.8, dur: 0.32, a: 0.7 } }),
  ],
  acid_gun: [
    B(0xb8ff3a, 7, { speed: 2.4, up: 1.3, life: 0.4, size: 0.38 }),
    B(0x7cff3a, 4, { speed: 1.5, up: 1.8, life: 0.45, size: 0.3, mobileSkip: true }),
  ],
  plasma: [
    B(0xb8ff3a, 7, { speed: 2.4, up: 1.3, life: 0.4, size: 0.38 }),
  ],
  grenade: [
    B(0xff6a1a, 10, { speed: 5.0, up: 1.6, life: 0.36, size: 0.5, wave: { r0: 0.3, r1: 2.6, dur: 0.38, a: 0.85 } }),
  ],
  blackhole: [
    B(0xb060ff, 8, { speed: 1.8, up: 0.25, life: 0.4, size: 0.44, wave: { r0: 0.2, r1: 3.2, dur: 0.5, a: 0.8 } }),
    B(0x05010f, 5, { speed: 3.0, up: 0.05, life: 0.28, size: 0.34 }),
  ],
});

const DEFAULT_MUZZLE = [
  B(0x00e5ff, 3, { speed: 2.4, up: 0.3, life: 0.2, size: 0.32 }),
  B(0x7ad7ff, 2, { speed: 1.2, up: 0.5, life: 0.16, size: 0.26, mobileSkip: true }),
];

const DEFAULT_EXPLODE = [
  B(0x00e5ff, 12, { speed: 4.5, up: 1.8, life: 0.4, size: 0.55, wave: { r0: 0.35, r1: 1.8, dur: 0.4, a: 0.8 } }),
];

function filterMobile(steps, mobile) {
  if (!mobile) return steps.map((s) => ({ ...s }));
  // Count scaling left to caller burstN(); here only shed rings + skip secondary bursts.
  return steps
    .filter((s) => !s.mobileSkip)
    .map((s) => ({
      ...s,
      ring: false, // skip rings on mobile (pool pressure)
      wave: s.wave && s.wave.a >= 0.75 ? { ...s.wave, a: s.wave.a * 0.7 } : false,
    }));
}

/** Muzzle / fire-moment FX for a weapon id or fire tag. */
export function muzzleFeelFx(weaponId, { mobile = false } = {}) {
  const id = normalizeFeelWeaponId(weaponId);
  const steps = (id && FEEL_MUZZLE[id]) || DEFAULT_MUZZLE;
  return filterMobile(steps, mobile);
}

/** Explode / AoE burst FX keyed by tag (weapon id preferred). */
export function explodeFeelFx(tag, { mobile = false, radius = 1.6 } = {}) {
  const id = normalizeFeelWeaponId(tag) || tag;
  const steps = (id && FEEL_EXPLODE[id]) || DEFAULT_EXPLODE;
  const out = filterMobile(steps, mobile);
  for (const s of out) {
    if (s.wave) {
      s.wave = { ...s.wave, r1: Math.max(s.wave.r1, radius * 1.05) };
    }
  }
  return out;
}

/** Charge glow while ion (or similar) winds up. */
export function chargeFeelFx(weaponId, progress = 0.5, { mobile = false } = {}) {
  const id = normalizeFeelWeaponId(weaponId);
  const p = Math.max(0, Math.min(1, progress));
  const n = mobile ? 1 : 1 + Math.round(p * 2);
  if (id === 'ion_beam') {
    return filterMobile([
      B(0xb060ff, n, { speed: 0.6 + p * 1.2, up: 0.8, life: 0.18, size: 0.22 + p * 0.18, bright: 0.7 + p * 0.3 }),
      B(0x00e5ff, 1, { speed: 0.4, up: 0.5, life: 0.14, size: 0.18, mobileSkip: true }),
    ], mobile);
  }
  return filterMobile([
    B(0x00e5ff, 1, { speed: 0.8, up: 0.4, life: 0.14, size: 0.2 }),
  ], mobile);
}

/** Stick spark when tracking bomb latches. */
export function stickFeelFx({ mobile = false } = {}) {
  return filterMobile([
    B(0xffe600, 5, { speed: 2.8, up: 1.0, life: 0.18, size: 0.28 }),
    B(0xff9a1f, 3, { speed: 1.6, up: 0.6, life: 0.14, size: 0.22, mobileSkip: true }),
  ], mobile);
}

/** Frost hit residue (zero laser). */
export function frostHitFeelFx({ mobile = false } = {}) {
  return filterMobile([
    B(0x7ad7ff, 4, { speed: 1.8, up: 1.2, life: 0.32, size: 0.3 }),
    B(0xe8fbff, 2, { speed: 1.0, up: 1.6, life: 0.28, size: 0.22, mobileSkip: true }),
  ], mobile);
}

/** Slow rush ring field. */
export function slowFieldFeelFx({ mobile = false } = {}) {
  return filterMobile([
    B(0x00e5ff, 6, { speed: 2.2, up: 0.15, life: 0.28, size: 0.34, ring: { n: 12, speed: 5, life: 0.24 }, wave: { r0: 0.3, r1: 2.6, dur: 0.4, a: 0.55 } }),
  ], mobile);
}

/** Drone deploy puff. */
export function deployDronesFeelFx({ mobile = false } = {}) {
  return filterMobile([
    B(0x00e5ff, 5, { speed: 1.6, up: 1.4, life: 0.32, size: 0.38 }),
    B(0xb060ff, 3, { speed: 1.1, up: 1.0, life: 0.26, size: 0.28, mobileSkip: true }),
  ], mobile);
}

/** Blackhole pull swirl (on cast). */
export function blackholeFeelFx(r = 3.4, { mobile = false } = {}) {
  return explodeFeelFx('blackhole', { mobile, radius: r });
}

/** Flashbang interrupt burst. */
export function flashFeelFx({ mobile = false } = {}) {
  return explodeFeelFx('flash', { mobile });
}

/** Acid dissolve mist on puddle. */
export function puddleFeelFx({ mobile = false } = {}) {
  return filterMobile([
    B(0xb8ff3a, 4, { speed: 1.2, up: 1.5, life: 0.4, size: 0.32 }),
    B(0x7cff3a, 2, { speed: 0.8, up: 1.8, life: 0.45, size: 0.26, mobileSkip: true }),
  ], mobile);
}

/** Catalog of feel keys covered (for tests). */
export const FEEL_FX_WEAPON_IDS = Object.freeze(Object.keys(FEEL_MUZZLE));

export function feelFxCoversCatalog(ids) {
  return ids.every((id) => !!FEEL_MUZZLE[id] || !!FEEL_EXPLODE[id]);
}
