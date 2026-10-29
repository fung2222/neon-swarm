/**
 * COMBAT-FEEL V1 prototype (preview only).
 * Enabled ONLY when URL has ?feelProto=1 (or ?feel=1).
 * Default OFF — live tip feel unchanged. Soft-juice invent ban still applies for formal ship.
 *
 * Scope: gatling fire + ordinary grunt (soldier/staffer/security/human) presentation.
 * Does NOT change damage, fire rate, HP, hit detection, or drops.
 */
export function isFeelProtoEnabled(search = typeof location !== 'undefined' ? location.search : '') {
  try {
    const q = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    const v = q.get('feelProto') || q.get('feel');
    return v === '1' || v === 'true' || v === 'on';
  } catch (_) {
    return false;
  }
}

/** Central knobs — names fit existing feel / muzzle / kick vocabulary. */
export const COMBAT_FEEL_V1 = Object.freeze({
  // A Fire (gatling)
  muzzleFlashDuration: 0.10,
  muzzleSparkCount: 5,
  muzzleVariety: 3,
  recoilStrength: 0.55,
  // B Hit
  hitFlashDuration: 0.16,
  hitSparkCount: 5,
  hitSparkSize: 0.34,
  // Visual lean only — never moves e.x/e.z (collision/AI safe)
  hitLeanAmp: 0.14,
  // C Funny hurt
  hurtWobbleAmp: 0.18,
  hurtWobbleHz: 18,
  // D Kill (ordinary grunt)
  deathParticleCount: 6,
  deathScrapCount: 4,
  deathWave: false, // big boom reserved for elites
  // E Combo — reuse kill-streak; tiny kick only at milestone≥10 (existing STREAK_KICK_AT)
  streakKickMul: 1.0,
  // Caps / mobile
  effectMaxCount: 24,
  screenShakeStrength: 0.02,
  weaponId: 'gatling',
  gruntKinds: Object.freeze(['soldier', 'human', 'staffer', 'guard', 'security']),
});

export function isFeelProtoWeapon(weaponId, cfg = COMBAT_FEEL_V1) {
  if (!weaponId) return false;
  const id = String(weaponId);
  return id === cfg.weaponId || id === 'mg' || id === 'dmg' || id === 'rate';
}

export function isFeelProtoGrunt(enemy, cfg = COMBAT_FEEL_V1) {
  if (!enemy) return false;
  const kind = enemy.kind || enemy.type || '';
  // Elites / bosses / special roles → not ordinary grunt (even if kind is human/soldier)
  if (enemy.elite || enemy.boss) return false;
  if (enemy.sniper || enemy.shieldGuard || enemy.artillery || enemy.bomber
      || enemy.flanker || enemy.medic || enemy.jammer || enemy.officer) {
    return false;
  }
  if (cfg.gruntKinds.includes(kind)) return true;
  // Lab staff / security often kind:'human' without a listed kind
  if (enemy.family === 'human') return true;
  return false;
}

/**
 * Gatling muzzle recipe override for proto — short, varied, capped.
 * Returns steps compatible with applyFeelBursts / weapons-feel-fx B().
 */
export function protoGatlingMuzzleSteps(cfg = COMBAT_FEEL_V1, { mobile = false, variety = 0 } = {}) {
  const v = ((variety % (cfg.muzzleVariety || 3)) + (cfg.muzzleVariety || 3)) % (cfg.muzzleVariety || 3);
  const life = cfg.muzzleFlashDuration || 0.1;
  const n = mobile ? Math.max(2, Math.round((cfg.muzzleSparkCount || 5) * 0.55)) : (cfg.muzzleSparkCount || 5);
  const colors = [0x00e5ff, 0x7ad7ff, 0xe8fbff];
  const c = colors[v] || colors[0];
  const steps = [
    {
      color: c,
      n,
      speed: 3.6 + v * 0.35,
      up: 0.12 + v * 0.04,
      life,
      size: 0.30 + v * 0.03,
      bright: 1.05,
      ring: false,
      wave: false,
    },
  ];
  if (!mobile && v === 1) {
    steps.push({
      color: 0xffffff,
      n: 1,
      speed: 1.2,
      up: 0.5,
      life: life * 0.7,
      size: 0.18,
      bright: 0.9,
      ring: false,
      wave: false,
    });
  }
  return steps;
}

/** Hit spark steps for real hits only (caller gates on ev.type==='hit'). */
export function protoHitSparkSteps(cfg = COMBAT_FEEL_V1, { mobile = false, color = 0x00e5ff } = {}) {
  const n = mobile
    ? Math.max(2, Math.round((cfg.hitSparkCount || 5) * 0.55))
    : (cfg.hitSparkCount || 5);
  return [
    {
      color: color || 0x00e5ff,
      n: Math.min(n, cfg.effectMaxCount || 24),
      speed: 3.4,
      up: 1.0,
      life: 0.22,
      size: cfg.hitSparkSize || 0.34,
      bright: 1.05,
      ring: false,
      wave: false,
    },
  ];
}

/** Ordinary grunt kill burst — short pop, no elite boom. */
export function protoGruntKillSteps(cfg = COMBAT_FEEL_V1, { mobile = false, color = 0x8a93a8 } = {}) {
  const n = mobile
    ? Math.max(2, Math.round((cfg.deathParticleCount || 6) * 0.55))
    : (cfg.deathParticleCount || 6);
  return [
    {
      color: color || 0x8a93a8,
      n: Math.min(n, cfg.effectMaxCount || 24),
      speed: 2.8,
      up: 1.3,
      life: 0.28,
      size: 0.36,
      bright: 1.0,
      ring: false,
      wave: false,
    },
    {
      color: 0x00e5ff,
      n: mobile ? 1 : 2,
      speed: 2.0,
      up: 1.8,
      life: 0.2,
      size: 0.28,
      bright: 0.95,
      ring: false,
      wave: false,
    },
  ];
}

export function protoRecoilMul(cfg = COMBAT_FEEL_V1) {
  return 1 + Math.max(0, cfg.recoilStrength || 0);
}

export function protoHurtLean(hitT, tSec, cfg = COMBAT_FEEL_V1) {
  if (!(hitT > 0)) return 0;
  const amp = cfg.hurtWobbleAmp || 0.18;
  const hz = cfg.hurtWobbleHz || 18;
  const lean = cfg.hitLeanAmp || 0.14;
  // Short decaying wobble + lean away — visual only
  const decay = Math.min(1, hitT / 0.12);
  return (Math.sin((tSec || 0) * hz * Math.PI * 2) * amp + lean) * decay;
}
