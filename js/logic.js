import { ARENA, PLAYER, ENEMIES, DROP, xpToLevel, swarmPressure, pickCards, pickEnemyType, MECH_BY_ID, WEAPON_ICONS, shotTier, resolveMechCombat, ELITE, BOSS, BEATS, ENDLESS, buildWeaponPickupOffer, eliteCfg, MAP_ZONE, SNIPER, SHIELD_GUARD, ARTILLERY, BOMBER, FLANKER, MEDIC, JAMMER, DANGER_PULSE, ZONE_PRESSURE, SCORE_POS, SLOT_WEAPONS, WEAPON_SLOT_MAX, isSlotWeapon, emptyWeaponSlots, hasEmptyWeaponSlot, weaponSlotLevel, MAGNET_DROP_CHANCE, CARDS_BY_ID, normalizeWeaponId, weaponDef, starterLoadout, flattenLoadout, loadoutFromFlat, addToLoadout, swapLoadoutSlot, findInLoadout, isArmedInLoadout, initialResource, categoryOf, LOADOUT_CAPS, weaponLevel, buildBranchOfferCards, buildUltOfferCards, needsBranchPick, needsUltPick, branchStatMods } from './config.js';
import { muzzleWorld } from './muzzle.js';

const WEAPON_IDS = Object.keys(WEAPON_ICONS);

/** Per-weapon muzzle distance (along aim) + height. Used by _emitBullet + fire VFX. */
const MUZZLE_BY_WEAPON = {
  mg: { dist: 0.72, y: 0.95 },
  gatling: { dist: 0.72, y: 0.95 },
  vulcan: { dist: 0.68, y: 0.92 },
  laser: { dist: 0.90, y: 1.05 },
  ion_beam: { dist: 0.90, y: 1.05 },
  zero_laser: { dist: 0.88, y: 1.02 },
  shotgun: { dist: 0.62, y: 0.88 },
  rocket: { dist: 0.78, y: 1.10 },
  tracking_bomb: { dist: 0.78, y: 1.10 },
  grenade: { dist: 0.55, y: 0.75 },
  frag: { dist: 0.55, y: 0.75 },
  chill: { dist: 0.55, y: 0.75 },
  flash: { dist: 0.55, y: 0.75 },
  gravity: { dist: 0.55, y: 0.75 },
  plasma: { dist: 0.70, y: 0.98 },
  acid_gun: { dist: 0.70, y: 0.98 },
  slow_gun: { dist: 0.66, y: 0.94 },
  attack_drone: { dist: 0.50, y: 1.20 },
  blackhole: { dist: 0.80, y: 1.05 },
};

/** Weapons that update body visual facing (primary). Secondaries keep their own fire-event aim. */
const PRIMARY_VISUAL_WEAPONS = new Set(['mg', 'gatling', 'vulcan', 'laser', 'ion_beam', 'zero_laser', 'tracking_bomb', 'rocket']);

/** ~120° forward fan: cos(60°) = 0.5 */
export const GRENADE_FAN_DOT = 0.5;
/** Fixed throw distance along forward when no legal front target (rule: throw forward, never defer). */
export const GRENADE_FORWARD_DIST = 6.5;

/**
 * Pick grenade aim: only targets in forward fan (dir·forward >= GRENADE_FAN_DOT).
 * If none, aim along forward at GRENADE_FORWARD_DIST (fixed forward throw).
 * Pure helper — exported for unit tests.
 */
export function resolveGrenadeThrow(px, pz, forwardX, forwardZ, enemies, maxRange = 11) {
  let fx = forwardX, fz = forwardZ;
  let fl = Math.hypot(fx, fz);
  if (fl < 1e-6) { fx = 0; fz = 1; fl = 1; }
  fx /= fl; fz /= fl;

  let best = null;
  let bestD = Infinity;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e || e.hp <= 0) continue;
    const dx = e.x - px, dz = e.z - pz;
    const dist = Math.hypot(dx, dz);
    if (dist > maxRange || dist < 1e-6) continue;
    const dot = (dx / dist) * fx + (dz / dist) * fz;
    if (dot < GRENADE_FAN_DOT - 1e-9) continue;
    if (dist < bestD) { bestD = dist; best = e; }
  }
  if (best) {
    const dx = best.x - px, dz = best.z - pz;
    const dist = Math.hypot(dx, dz) || 1;
    return {
      dx: dx / dist,
      dz: dz / dist,
      dist,
      target: best,
      mode: 'target',
      forwardX: fx,
      forwardZ: fz,
    };
  }
  return {
    dx: fx,
    dz: fz,
    dist: GRENADE_FORWARD_DIST,
    target: null,
    mode: 'forward',
    forwardX: fx,
    forwardZ: fz,
  };
}


/** Max lead time (s) for straight-projectile aim prediction. */
export const AIM_LEAD_MAX_T = 0.30;

/**
 * Segment–circle hit test (XZ). Pure helper for swept bullet collision.
 * @returns {boolean}
 */
export function segmentHitsCircle(x0, z0, x1, z1, cx, cz, r) {
  if (!(r > 0)) return false;
  const dx = x1 - x0, dz = z1 - z0;
  const len2 = dx * dx + dz * dz;
  let t = 0;
  if (len2 > 1e-12) {
    t = ((cx - x0) * dx + (cz - z0) * dz) / len2;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
  }
  const px = x0 + t * dx;
  const pz = z0 + t * dz;
  const rr = r * r;
  const ox = px - cx, oz = pz - cz;
  return ox * ox + oz * oz < rr;
}

/**
 * Aim direction toward a lightly predicted intercept of a moving target.
 * Flight time ≈ currentDist / bulletSpeed, clamped to maxLeadT.
 */
export function leadAimDir(px, pz, ex, ez, evx, evz, bulletSpeed, maxLeadT = AIM_LEAD_MAX_T) {
  const dx0 = ex - px, dz0 = ez - pz;
  const dist = Math.hypot(dx0, dz0);
  const spd = Math.max(1e-3, bulletSpeed || 1);
  const leadT = Math.min(Math.max(0, maxLeadT), dist / spd);
  const tx = ex + (evx || 0) * leadT;
  const tz = ez + (evz || 0) * leadT;
  let dx = tx - px, dz = tz - pz;
  const len = Math.hypot(dx, dz) || 1;
  return { dx: dx / len, dz: dz / len, leadT, dist, tx, tz };
}

/**
 * If the target is closer than the muzzle horizontal offset (+ enemy radius),
 * pull spawn back toward the player along aim so the bullet does not appear past the foe.
 */
/**
 * Continuous collision for simultaneously moving bullet + enemy (XZ).
 * Equivalent to segment–circle in relative space: fix enemy at start, subtract
 * enemy delta from bullet end. Same time interval for both segments.
 */
export function relativeSegmentHitsCircle(bx0, bz0, bx1, bz1, ex0, ez0, ex1, ez1, r) {
  const rbx1 = bx1 - (ex1 - ex0);
  const rbz1 = bz1 - (ez1 - ez0);
  return segmentHitsCircle(bx0, bz0, rbx1, rbz1, ex0, ez0, r);
}

/**
 * Quadratic intercept aim. Solves |E + V t - P| = S t for smallest t in (0, maxLeadT].
 * Falls back to clamped linear prediction when no valid root (stationary / no solution).
 * Unlike leadAimDir, this is a closed-form intercept — not dist/speed with a 0.30s cap alone.
 */
export function interceptAimDir(px, pz, ex, ez, evx, evz, bulletSpeed, maxLeadT = AIM_LEAD_MAX_T) {
  const dx0 = ex - px, dz0 = ez - pz;
  const dist = Math.hypot(dx0, dz0);
  const spd = Math.max(1e-3, bulletSpeed || 1);
  const maxT = Math.max(0, maxLeadT == null ? AIM_LEAD_MAX_T : maxLeadT);
  const vx = evx || 0, vz = evz || 0;
  const v2 = vx * vx + vz * vz;

  // Near-stationary target → aim at current position
  if (v2 < 1e-8) {
    const len = dist || 1;
    return {
      dx: dx0 / len, dz: dz0 / len, leadT: Math.min(maxT, dist / spd),
      dist, tx: ex, tz: ez, ok: true, exact: true,
    };
  }

  // |D + V t|^2 = S^2 t^2  →  (V·V - S^2) t^2 + 2 D·V t + D·D = 0
  const a = v2 - spd * spd;
  const b = 2 * (dx0 * vx + dz0 * vz);
  const c = dx0 * dx0 + dz0 * dz0; // == dist^2 ≥ 0

  let bestT = -1;
  if (Math.abs(a) < 1e-8) {
    // Linear: b t + c = 0
    if (Math.abs(b) > 1e-8) {
      const t = -c / b;
      if (t > 1e-6 && t <= maxT) bestT = t;
    }
  } else {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const s = Math.sqrt(disc);
      const t0 = (-b - s) / (2 * a);
      const t1 = (-b + s) / (2 * a);
      for (const t of [t0, t1]) {
        if (t > 1e-6 && t <= maxT && (bestT < 0 || t < bestT)) bestT = t;
      }
    }
  }

  if (bestT > 0) {
    const tx = ex + vx * bestT;
    const tz = ez + vz * bestT;
    let dx = tx - px, dz = tz - pz;
    const len = Math.hypot(dx, dz) || 1;
    return { dx: dx / len, dz: dz / len, leadT: bestT, dist, tx, tz, ok: true, exact: true };
  }

  // No positive root within maxT: aim at predicted point at maxT (or current if maxT=0)
  const leadT = maxT;
  const tx = ex + vx * leadT;
  const tz = ez + vz * leadT;
  let dx = tx - px, dz = tz - pz;
  const len = Math.hypot(dx, dz) || 1;
  return { dx: dx / len, dz: dz / len, leadT, dist, tx, tz, ok: false, exact: false };
}

/**
 * Two-stage intercept from player then actual muzzle (cardinal offset).
 * Provisional dir → muzzleWorld → re-solve from muzzle; one extra pass if dir snap changes.
 */
export function muzzleInterceptAimDir(px, pz, ex, ez, evx, evz, bulletSpeed, maxLeadT = AIM_LEAD_MAX_T) {
  let lead = interceptAimDir(px, pz, ex, ez, evx, evz, bulletSpeed, maxLeadT);
  const mw1 = muzzleWorld(px, pz, lead.dx, lead.dz);
  const muzzleHoriz = Math.hypot(mw1.x - px, mw1.z - pz);
  const tDist = Math.hypot(ex - px, ez - pz);
  // Inside muzzle reach: keep player-origin aim (closeMuzzlePos shortens spawn).
  // Re-solving from a muzzle that sits past the foe produces backward wild shots.
  if (tDist < muzzleHoriz + 0.35) return lead;
  lead = interceptAimDir(mw1.x, mw1.z, ex, ez, evx, evz, bulletSpeed, maxLeadT);
  const mw2 = muzzleWorld(px, pz, lead.dx, lead.dz);
  if (mw2.dir !== mw1.dir) {
    lead = interceptAimDir(mw2.x, mw2.z, ex, ez, evx, evz, bulletSpeed, maxLeadT);
  }
  return lead;
}

export function closeMuzzlePos(px, pz, mwX, mwZ, aimX, aimZ, targetDist, targetR = 0.3) {
  const muzzleHoriz = Math.hypot(mwX - px, mwZ - pz);
  if (!(targetDist < muzzleHoriz + (targetR || 0))) {
    return { x: mwX, z: mwZ, shortened: false, spawnDist: muzzleHoriz };
  }
  const len = Math.hypot(aimX, aimZ) || 1;
  const ax = aimX / len, az = aimZ / len;
  const spawnDist = Math.max(0.1, Math.min(muzzleHoriz, Math.max(0.1, targetDist - (targetR || 0) * 0.5)));
  return { x: px + ax * spawnDist, z: pz + az * spawnDist, shortened: true, spawnDist };
}

function isPunchKill(e, heavyWeapon = false) {
  if (heavyWeapon) return true;
  const k = e && e.kind;
  return k === 'chief' || k === 'mech' || k === 'walker' || k === 'officer' || k === 'sentinel' || k === 'hunter' || k === 'commander' || k === 'swarm_core' || !!(e && (e.elite || e.boss));
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Split a kill worth `xp` into readable X crates. */
function cratesFor(xp) {
  if (xp <= 3) return [{ letter: 'X', xp }];
  const n = Math.min(3, Math.ceil(xp / 4));
  const base = Math.floor(xp / n);
  const out = [];
  for (let i = 0; i < n; i++) out.push({ letter: 'X', xp: i === n - 1 ? xp - base * (n - 1) : base });
  return out;
}

export class Game {
  constructor({ seed = 1, endless = true, mech = 'horn' } = {}) {
    this.rng = mulberry32(seed >>> 0);
    this.endless = endless;
    this.mech = MECH_BY_ID[mech] || MECH_BY_ID.horn;
    this.t = 0;
    this.score = 0;
    this.kills = 0;
    this.alive = true;
    this.level = 1;
    this.xp = 0;
    this.xpNeed = xpToLevel(1);
    this.pendingCards = null;
    this.pausedForLevel = false;
    this.taken = {};
    // v0.9.53 loadout 2P+2S+2T; weaponSlots = flatten for HUD/pickup compat.
    this.loadout = starterLoadout();
    this.weaponSlots = flattenLoadout(this.loadout);
    this.fireMode = 'primary'; // 'primary' | 'secondary' — throw never holds mode
    this.activePrimaryIndex = 0;
    this.activeSecondaryIndex = 0;
    this.weaponResources = Object.create(null); // id → { type, current, max }
    this.throwCdT = Object.create(null); // id → remaining cd
    this._throwRequest = null; // id requested by HUD tap this frame
    // v0.9.54 branch / ult picks (playable stubs)
    this.weaponBranches = Object.create(null); // id → 'A'|'B'|'C'
    this.weaponUlts = Object.create(null); // id → 'U1'|'U2'
    this.pendingPathOffer = null; // { kind, weaponId, choices } queued behind levelup/pickup

    this.px = 0; this.pz = 0;
    this.vx = 0; this.vz = 0;
    // Single source: resolveMechCombat(mech) — same numbers select UI should show
    const rc = resolveMechCombat(this.mech);
    this.maxHp = rc.maxHp;
    this.hp = this.maxHp;
    this.speed = rc.speed;
    this.fireCd = rc.fireCd;
    this.fireT = 0;
    this.bulletDmg = rc.bulletDmg;
    this.bulletSpeed = PLAYER.bulletSpeed;
    this.bulletLife = PLAYER.bulletLife;
    this.fireRange = PLAYER.fireRange || 11;
    this.magnet = rc.magnet;
    this.armor = rc.armor;
    this.starterWeapon = rc.starterWeapon;
    this.passive = rc.passive;
    this.mechMuzzle = rc.muzzle;
    this.deflect = 0;
    this.orbits = 0;
    this.pierce = 0;
    this.multi = 1;
    this.nova = 0;
    this.novaCd = 0;
    this.novaT = 0;
    this.frost = 0;
    // Special weapon stacks (0 = locked)
    this.laser = 0;
    this.shotgun = 0;
    this.rocket = 0;
    this.grenade = 0;
    this.plasma = 0;
    this.gatling = 1;
    this.ion_beam = 0;
    this.tracking_bomb = 0;
    this.vulcan = 0;
    this.zero_laser = 0;
    this.acid_gun = 0;
    this.slow_gun = 0;
    this.attack_drone = 0;
    this.blackhole = 0;
    this.frag = 0;
    this.chill = 0;
    this.flash = 0;
    this.gravity = 0;
    this.laserT = 0;
    this.shotgunT = 0;
    this.rocketT = 0;
    this.grenadeT = 0;
    this.plasmaT = 0;
    this.vulcanT = 0;
    this.zeroLaserT = 0;
    this.slowGunT = 0;
    this.droneT = 0;
    this.blackholeT = 0;
    this.invuln = 1.5;

    this.enemies = [];
    this.bullets = [];
    this.zones = []; // plasma puddles / delayed blasts
    this.gems = [];
    this.spawnAcc = 0;
    this.hitFlash = 0;
    this.jamT = 0;
    this.jamFireMul = 1;
    this.muzzle = 0;
    this.aimHold = 0;
    // Aim facing (unit xz) — independent of move velocity (Milestone A)
    this.aimX = 0;
    this.aimZ = 1;
    // Primary visual body facing — updated ONLY by primary weapons (mg/laser)
    this.visualAimX = 0;
    this.visualAimZ = 1;
    this._sticky = null;
    this._stickyUntil = 0;
    this._nextEid = 1;
    this.waveT = 8;
    this.killer = null;
    this.goalKills = 40;
    this.goalsCleared = 0;
    // Phase 3 elite / boss beats + Phase 6 endless cadence (v0.9.18)
    this._beatsFired = Object.create(null);
    this._spawnPauseUntil = 0;
    this._nextEndlessEliteAt = null; // set lazily after ENDLESS.startAfter
    this._nextEndlessBossAt = null;
    this._endlessEliteIdx = 0;
    // Phase 6 map zone (lab → assembly @195 → reactor @285)
    this.mapZone = 'lab';
    this.bossHazards = []; // volley bullets + orbit floor telegraphs
    // Phase 6 periodic arena danger pulses (v0.9.41)
    this.dangerPulses = [];
    this._nextDangerPulseAt = null;
    this._nextDangerPulseId = 1;
    // Phase 6 shrinking safe zone (v0.9.42)
    this.zonePressureActive = false;
    this.safeR = ZONE_PRESSURE.startR != null ? ZONE_PRESSURE.startR : 30;
    this._zonePressureTickAcc = 0;
    this._zonePressureStarted = false;
    // Phase 6 score positioning (v0.9.44) — move / safe-zone / pace bonuses
    this.scoreMove = 0;
    this.scoreSafe = 0;
    this.scorePace = 0;
    this._lastMovedAt = -999;
    this._recentKillTs = [];
    for (let i = 0; i < 10; i++) this._spawn();
  }

  moveDir(dx, dz) {
    const len = Math.hypot(dx, dz) || 1;
    this.vx = dx / len;
    this.vz = dz / len;
  }
  stopMove() { this.vx = 0; this.vz = 0; }

  /** Sync flat weaponSlots from structured loadout (HUD / pickup compat). */
  _syncSlotsFromLoadout() {
    if (!this.loadout) this.loadout = starterLoadout();
    this.weaponSlots = flattenLoadout(this.loadout);
  }

  applyCard(card) {
    if (!card) return;
    const action = card.pickupAction;
    // v0.9.54: branch / ult path picks (no taken stack)
    if (action === 'branch') {
      const wid = normalizeWeaponId(card.weaponId) || card.weaponId;
      if (!this.weaponBranches) this.weaponBranches = Object.create(null);
      if (wid && card.branch) this.weaponBranches[wid] = String(card.branch).toUpperCase();
      this.pendingCards = null;
      this.pausedForLevel = false;
      this.pendingFrom = null;
      this._queueWeaponPathOffers(wid);
      if (this.xp >= this.xpNeed) this._levelUp();
      else this._flushPathOffer();
      return;
    }
    if (action === 'ult') {
      const wid = normalizeWeaponId(card.weaponId) || card.weaponId;
      if (!this.weaponUlts) this.weaponUlts = Object.create(null);
      if (wid && card.ult) this.weaponUlts[wid] = String(card.ult).toUpperCase();
      this.pendingCards = null;
      this.pausedForLevel = false;
      this.pendingFrom = null;
      if (this.xp >= this.xpNeed) this._levelUp();
      else this._flushPathOffer();
      return;
    }
    const synthetic = action === 'keep' || action === 'convertHeal';
    if (!this.taken) this.taken = {};
    if (!this.loadout) this.loadout = starterLoadout();
    this._syncSlotsFromLoadout();

    const nid = normalizeWeaponId(card.id) || card.id;
    const already = isArmedInLoadout(this.loadout, nid) || isArmedInLoadout(this.loadout, card.id);

    // Category-full OR total-full → swap offer (never silent).
    if (!synthetic && action !== 'swap' && isSlotWeapon(card.id) && !already) {
      const def = weaponDef(nid);
      const catFull = def && this.loadout[def.category]
        && !this.loadout[def.category].some((x) => x == null)
        && !this.loadout[def.category].includes(nid);
      if (catFull || !hasEmptyWeaponSlot(this.weaponSlots)) {
        this._openSwapOffer(nid, card);
        return;
      }
    }

    if (action === 'swap') {
      this._swapWeaponSlot(card.swapIndex, nid);
      if (typeof card.apply === 'function') card.apply(this);
      this.taken[nid] = (this.taken[nid] || 0) + 1;
      if (card.id !== nid) this.taken[card.id] = (this.taken[card.id] || 0) + 1;
    } else {
      if (action !== 'keep') card.apply(this);
      if (!synthetic) {
        this.taken[nid] = (this.taken[nid] || 0) + 1;
        if (card.id !== nid) this.taken[card.id] = (this.taken[card.id] || 0) + 1;
      }
      if (!synthetic && isSlotWeapon(card.id) && !already) {
        this._fillWeaponSlot(nid);
      }
    }

    this._pruneUnslottedWeapons();
    this.pendingCards = null;
    this.pausedForLevel = false;
    this.pendingFrom = null;
    // Queue branch/ult if this weapon just crossed unlock lv
    if (!synthetic && isSlotWeapon(card.id)) this._queueWeaponPathOffers(nid);
    if (this.xp >= this.xpNeed) this._levelUp();
    else this._flushPathOffer();
  }

  /** Branch kit mods (deep A/B/C + light ult amp). */
  _weaponMods(weaponId) {
    const nid = normalizeWeaponId(weaponId) || weaponId;
    if (!nid) return branchStatMods(null, null, null);
    const br = this.weaponBranches && this.weaponBranches[nid];
    const ult = this.weaponUlts && this.weaponUlts[nid];
    return branchStatMods(nid, br, ult);
  }

  /** Tiny crystal shield from zero_laser C adds temporary armor while timer active. */
  _effectiveArmor() {
    let a = this.armor || 0;
    if ((this._branchShieldT || 0) > 0) a += 2.4;
    return a;
  }

  _refreshBranchShield(mods) {
    if (!mods || !(mods.selfShield > 0)) return;
    this._branchShieldT = Math.max(this._branchShieldT || 0, mods.selfShieldDur || 0.35);
  }

  /** Ion B: jump residual damage to nearby foes after a hit. */
  _ionChainJump(fromEnemy, jumps, range, dmg, events) {
    if (!jumps || jumps <= 0 || !fromEnemy) return;
    let src = fromEnemy;
    const hit = new Set([fromEnemy]);
    let remain = jumps;
    let curDmg = dmg * 0.7;
    while (remain > 0) {
      let best = null, bestD = range;
      for (const e of this.enemies) {
        if (hit.has(e) || e.hp <= 0) continue;
        const d = Math.hypot(e.x - src.x, e.z - src.z);
        if (d < bestD) { bestD = d; best = e; }
      }
      if (!best) break;
      hit.add(best);
      const dead = this._applyEnemyDamage(best, curDmg, src.x, src.z, events, { hitTime: 0.1, pushHit: true });
      events.push({ type: 'chainJump', x: best.x, z: best.z, fromX: src.x, fromZ: src.z });
      if (dead) {
        const idx = this.enemies.indexOf(best);
        if (idx >= 0) {
          this._kill(best, idx, events);
          events.push({ type: 'kill', enemy: best, gore: false });
        }
      }
      src = best;
      curDmg *= 0.75;
      remain -= 1;
    }
  }

  /** Frost burst AoE (zero B) around a hit/kill point. */
  _frostBurstAt(x, z, r, dmg, chill, events) {
    if (!(r > 0)) return;
    for (let j = this.enemies.length - 1; j >= 0; j--) {
      const e = this.enemies[j];
      if (Math.hypot(e.x - x, e.z - z) > r + e.r) continue;
      const dead = this._applyEnemyDamage(e, dmg, x, z, events, { hitTime: 0.1, pushHit: true });
      if (chill) e.slow = Math.max(e.slow || 0, chill);
      if (dead) {
        this._kill(e, j, events);
        events.push({ type: 'kill', enemy: e, gore: false });
      }
    }
    events.push({ type: 'frostBurst', x, z, r });
  }

  /**
   * Queue branch (Lv3+) or ult (primary Lv5+) offer behind current pause.
   * Prefer branch before ult; does not overwrite a pending offer for another weapon.
   */
  _queueWeaponPathOffers(weaponId) {
    const nid = normalizeWeaponId(weaponId) || weaponId;
    if (!nid || !weaponDef(nid)) return;
    if (!this.weaponBranches) this.weaponBranches = Object.create(null);
    if (!this.weaponUlts) this.weaponUlts = Object.create(null);
    if (!this.taken) this.taken = {};
    // Keep existing queued offer unless it is for this same weapon (refresh)
    if (this.pendingPathOffer && this.pendingPathOffer.weaponId !== nid) return;
    if (needsBranchPick(nid, this.taken, this.weaponBranches)) {
      const offer = buildBranchOfferCards(nid);
      if (offer) this.pendingPathOffer = offer;
      return;
    }
    if (needsUltPick(nid, this.taken, this.weaponBranches, this.weaponUlts)) {
      const offer = buildUltOfferCards(nid, this.weaponBranches[nid]);
      if (offer) this.pendingPathOffer = offer;
    }
  }

  /** Open queued branch/ult as pendingCards pause. Returns true if opened. */
  _flushPathOffer() {
    if (!this.pendingPathOffer || !this.pendingPathOffer.choices || !this.pendingPathOffer.choices.length) {
      return false;
    }
    if (this.pausedForLevel && this.pendingCards && this.pendingCards.length) return false;
    const offer = this.pendingPathOffer;
    this.pendingPathOffer = null;
    this.pendingCards = offer.choices;
    this.pausedForLevel = true;
    this.pendingFrom = offer.kind; // 'branch' | 'ult'
    return true;
  }

  /** v0.9.29/v0.9.53: HUD loadout is the only fireable set — drop orphan stacks. */
  _pruneUnslottedWeapons() {
    this._syncSlotsFromLoadout();
    for (const id of SLOT_WEAPONS) {
      if (id === 'gatling' || id === 'mg') continue;
      if (!isArmedInLoadout(this.loadout, id)) this._clearSlotWeaponState(id);
    }
  }

  /** True if this weapon is in the loadout (and therefore allowed to fire when selected). */
  _slotArmed(weaponId) {
    if (!weaponId) return false;
    if (!this.loadout) this.loadout = starterLoadout();
    const nid = normalizeWeaponId(weaponId) || weaponId;
    return isArmedInLoadout(this.loadout, nid) || isArmedInLoadout(this.loadout, weaponId);
  }

  _fillWeaponSlot(weaponId) {
    const nid = normalizeWeaponId(weaponId) || weaponId;
    if (!isSlotWeapon(nid) && !isSlotWeapon(weaponId)) return false;
    if (!this.loadout) this.loadout = starterLoadout();
    if (isArmedInLoadout(this.loadout, nid)) {
      this._syncSlotsFromLoadout();
      return false;
    }
    const i = addToLoadout(this.loadout, nid);
    if (i < 0) return false;
    const def = weaponDef(nid);
    if (def && def.category === 'secondary') {
      this.weaponResources[nid] = initialResource(nid);
    }
    this._syncSlotsFromLoadout();
    return true;
  }

  /** Zero combat stacks for a slot weapon removed from the bar. */
  _clearSlotWeaponState(weaponId) {
    const nid = normalizeWeaponId(weaponId) || weaponId;
    if (!nid || nid === 'gatling' || nid === 'mg') return;
    if (this.taken) {
      delete this.taken[nid];
      delete this.taken[weaponId];
      // Drop legacy alias keys (mg/laser/rocket/grenade/plasma)
      for (const [legacy, neu] of Object.entries({
        mg: 'gatling', laser: 'ion_beam', rocket: 'tracking_bomb',
        grenade: 'frag', plasma: 'acid_gun',
      })) {
        if (neu === nid) delete this.taken[legacy];
      }
    }
    if (this.weaponResources) delete this.weaponResources[nid];
    if (nid === 'laser' || nid === 'ion_beam') { this.laser = 0; this.ion_beam = 0; this.laserT = 0; }
    else if (nid === 'shotgun') { this.shotgun = 0; this.shotgunT = 0; }
    else if (nid === 'rocket' || nid === 'tracking_bomb') { this.rocket = 0; this.tracking_bomb = 0; this.rocketT = 0; }
    else if (nid === 'grenade' || nid === 'frag') { this.grenade = 0; this.frag = 0; this.grenadeT = 0; }
    else if (nid === 'plasma' || nid === 'acid_gun') { this.plasma = 0; this.acid_gun = 0; this.plasmaT = 0; }
    else if (nid === 'vulcan') { this.vulcan = 0; this.vulcanT = 0; }
    else if (nid === 'zero_laser') { this.zero_laser = 0; this.zeroLaserT = 0; }
    else if (nid === 'slow_gun') { this.slow_gun = 0; this.slowGunT = 0; }
    else if (nid === 'attack_drone') { this.attack_drone = 0; this.droneT = 0; }
    else if (nid === 'blackhole') { this.blackhole = 0; this.blackholeT = 0; }
    else if (nid === 'chill') { this.chill = 0; }
    else if (nid === 'flash') { this.flash = 0; }
    else if (nid === 'gravity') { this.gravity = 0; }
  }

  _swapWeaponSlot(index, newId) {
    if (!this.loadout) this.loadout = starterLoadout();
    this._syncSlotsFromLoadout();
    const nid = normalizeWeaponId(newId) || newId;
    if (index == null || index < 0 || index >= this.weaponSlots.length) return false;
    if (!isSlotWeapon(nid) && !isSlotWeapon(newId)) return false;
    const cats = ['primary', 'primary', 'secondary', 'secondary', 'throw', 'throw'];
    const idxs = [0, 1, 0, 1, 0, 1];
    const cat = cats[index];
    const ci = idxs[index];
    const old = this.loadout[cat][ci];
    if (old && old !== nid) this._clearSlotWeaponState(old);
    // Clear duplicate of nid elsewhere
    for (const c of ['primary', 'secondary', 'throw']) {
      for (let i = 0; i < this.loadout[c].length; i++) {
        if (this.loadout[c][i] === nid) this.loadout[c][i] = null;
      }
    }
    this.loadout[cat][ci] = nid;
    if (weaponDef(nid)?.category === 'secondary') {
      this.weaponResources[nid] = initialResource(nid);
    }
    this._syncSlotsFromLoadout();
    return true;
  }

  /** HUD: select primary/secondary tile. Throw tiles call requestThrow instead. */
  selectWeaponTile(flatIndex) {
    if (!this.loadout) this.loadout = starterLoadout();
    this._syncSlotsFromLoadout();
    const id = this.weaponSlots[flatIndex];
    if (!id) return false;
    const def = weaponDef(id);
    if (!def) return false;
    if (def.category === 'primary') {
      this.activePrimaryIndex = flatIndex; // 0 or 1
      this.fireMode = 'primary';
      return true;
    }
    if (def.category === 'secondary') {
      this.activeSecondaryIndex = flatIndex - 2; // 0 or 1 in secondary arr
      this.fireMode = 'secondary';
      const res = this.weaponResources[id] || initialResource(id);
      this.weaponResources[id] = res;
      if (res && res.current <= 0) {
        this.fireMode = 'primary';
        return false;
      }
      return true;
    }
    if (def.category === 'throw') {
      this.requestThrow(id);
      return true;
    }
    return false;
  }

  requestThrow(weaponId) {
    const nid = normalizeWeaponId(weaponId) || weaponId;
    if (!this._slotArmed(nid)) return false;
    const cd = (this.throwCdT && this.throwCdT[nid]) || 0;
    if (cd > 0) return false;
    this._throwRequest = nid;
    return true;
  }

  activePrimaryId() {
    if (!this.loadout) return 'gatling';
    const id = this.loadout.primary[this.activePrimaryIndex] || this.loadout.primary[0];
    return id || 'gatling';
  }

  activeSecondaryId() {
    if (!this.loadout) return null;
    return this.loadout.secondary[this.activeSecondaryIndex] || this.loadout.secondary[0] || null;
  }

  _consumeSecondary(id, amount = 1) {
    const res = this.weaponResources[id];
    if (!res) return true;
    res.current = Math.max(0, res.current - amount);
    if (res.current <= 0) {
      this.fireMode = 'primary';
      return false;
    }
    return true;
  }

  _regenSecondary(dt) {
    if (!this.weaponResources) return;
    const inCombat = (this.enemies || []).length > 0;
    for (const id of Object.keys(this.weaponResources)) {
      const def = weaponDef(id);
      if (!def || !def.base) continue;
      const res = this.weaponResources[id];
      if (!res || res.current >= res.max) continue;
      const rate = inCombat ? (def.base.regenIn || 0) : (def.base.regenOut || 0);
      if (def.resource === 'ammo' || def.resource === 'charges') {
        // discrete reload timer stored on res._acc
        res._acc = (res._acc || 0) + dt;
        const need = def.base.reload || 1.4;
        if (res._acc >= need) {
          res._acc = 0;
          res.current = Math.min(res.max, res.current + 1);
        }
      } else if (rate > 0) {
        res.current = Math.min(res.max, res.current + rate * dt);
      }
    }
  }

  _openSwapOffer(weaponId, pendingCard = null) {
    if (!this.taken) this.taken = {};
    if (!this.weaponSlots) this.weaponSlots = emptyWeaponSlots();
    const offer = buildWeaponPickupOffer(weaponId, this.taken, this.weaponSlots);
    if (!offer || offer.mode !== 'swap') {
      // Safety: if offer builder can't swap, refuse rather than silent overwrite.
      this.pendingCards = [{
        id: '_pickup_keep', kind: 'util', icon: '↩', shape: 'deflect', max: null,
        pickupAction: 'keep', zh: '欄位已滿', en: 'SLOTS FULL',
        descZh: '武器欄已滿 · 無法新增', descEn: 'Weapon bar full · cannot add',
        apply: () => {},
      }];
      this.pausedForLevel = true;
      this.pendingFrom = 'pickup';
      this._pendingSwapCard = null;
      return null;
    }
    // Preserve original card.apply if level-up deferred into swap (already on choices).
    this.pendingCards = offer.choices;
    this.pausedForLevel = true;
    this.pendingFrom = 'pickup';
    this._pendingSwapCard = pendingCard || null;
    return offer;
  }

  /**
   * Phase 6: pause and offer take / upgrade / keep (never silent overwrite).
   * Returns offer meta or null if weapon id is unknown.
   */
  _offerWeaponPickup(weaponId) {
    if (!this.taken) this.taken = {};
    if (!this.weaponSlots) this.weaponSlots = emptyWeaponSlots();
    const offer = buildWeaponPickupOffer(weaponId, this.taken, this.weaponSlots);
    if (!offer) return null;
    this.pendingCards = offer.choices;
    this.pausedForLevel = true;
    this.pendingFrom = 'pickup';
    return offer;
  }

  _levelUp() {
    this.level++;
    this.xp -= this.xpNeed;
    if (this.xp < 0) this.xp = 0;
    this.xpNeed = xpToLevel(this.level);
    if (!this.taken) this.taken = {};
    this.pendingCards = pickCards(this.rng, 3, this.taken);
    this.pausedForLevel = true;
  }

  _pickType() {
    return pickEnemyType(this.rng, this.t, this.mapZone);
  }

  _softClamp(x, z, radius = 0) {
    const lim = ARENA.half - radius;
    const soft = ARENA.soft - radius;
    const r = Math.hypot(x, z);
    if (r <= soft || r < 1e-6) return { x, z };
    if (r > lim) {
      const s = lim / r;
      return { x: x * s, z: z * s };
    }
    const t = (r - soft) / Math.max(0.001, lim - soft);
    const pull = t * t * 0.35;
    const s = 1 - pull * ((r - soft) / r);
    return { x: x * s, z: z * s };
  }

  _spawn(type) {
    type = type || this._pickType();
    const def = ENEMIES[type];
    if (!def) return;
    const ang = this.rng() * Math.PI * 2;
    const dist = ARENA.spawnNear + this.rng() * (ARENA.spawnFar - ARENA.spawnNear);
    const c = this._softClamp(this.px + Math.cos(ang) * dist, this.pz + Math.sin(ang) * dist, def.radius);
    const { hpMul, speedMul } = swarmPressure(this.t);
    this.enemies.push({
      id: this._nextEid++,
      type, kind: def.kind, family: def.family, nameZh: def.zh, nameEn: def.en,
      x: c.x, z: c.z, prevX: c.x, prevZ: c.z, vx: 0, vz: 0,
      hp: def.hp * hpMul, maxHp: def.hp * hpMul,
      speed: def.speed * speedMul, r: def.radius,
      xp: def.xp, score: def.score, color: def.color, chase: def.chase,
      damage: def.damage || 1, shield: def.shield || 0,
      hit: 0, slow: 0, wob: this.rng() * Math.PI * 2,
      animPhase: this.rng() * Math.PI * 2,
      panic: !!def.panic,
      elite: !!def.elite,
      boss: !!def.boss,
      sniper: !!def.sniper || type === 'sniper',
      sniperPhase: (!!def.sniper || type === 'sniper') ? 'reposition' : undefined,
      sniperPhaseT: (!!def.sniper || type === 'sniper') ? (0.4 + this.rng() * 0.8) : undefined,
      shieldGuard: !!def.shieldGuard || type === 'shield',
      shieldPhase: (!!def.shieldGuard || type === 'shield') ? 'chase' : undefined,
      shieldPhaseT: (!!def.shieldGuard || type === 'shield') ? (0.6 + this.rng() * 0.8) : undefined,
      artillery: !!def.artillery || type === 'artillery',
      artilleryPhase: (!!def.artillery || type === 'artillery') ? 'reposition' : undefined,
      artilleryPhaseT: (!!def.artillery || type === 'artillery') ? (0.8 + this.rng() * 1.0) : undefined,
      bomber: !!def.bomber || type === 'bomber',
      bomberPhase: (!!def.bomber || type === 'bomber') ? 'chase' : undefined,
      bomberPhaseT: (!!def.bomber || type === 'bomber') ? 0 : undefined,
      flanker: !!def.flanker || type === 'flanker',
      flankerPhase: (!!def.flanker || type === 'flanker') ? 'flank' : undefined,
      flankerPhaseT: (!!def.flanker || type === 'flanker') ? (0.35 + this.rng() * 0.55) : undefined,
      flankSide: (!!def.flanker || type === 'flanker') ? (this.rng() < 0.5 ? -1 : 1) : undefined,
      medic: !!def.medic || type === 'medic',
      medicPhase: (!!def.medic || type === 'medic') ? 'seek' : undefined,
      medicPhaseT: (!!def.medic || type === 'medic') ? (0.3 + this.rng() * 0.5) : undefined,
      healTargetId: undefined,
      jammer: !!def.jammer || type === 'jammer',
      jammerPhase: (!!def.jammer || type === 'jammer') ? 'reposition' : undefined,
      jammerPhaseT: (!!def.jammer || type === 'jammer') ? (0.35 + this.rng() * 0.55) : undefined,
      aimX: 0,
      aimZ: 0,
      faceDx: 0,
      faceDz: 1,
      telegraphDur: 0,
      telegraphAt: 0,
      aimDx: 0,
      aimDz: 1,
    });
  }

  /** Fire named beats (elite @120/@240, boss @360) then endless cadence. */
  _beatCheck(events) {
    for (const beat of BEATS) {
      const key = String(beat.at) + ':' + (beat.id || beat.kind);
      if (this._beatsFired[key]) continue;
      const pauseSec = beat.kind === 'boss' ? BOSS.spawnPauseSec : (beat.kind === 'elite' ? ELITE.spawnPauseSec : 0);
      if (pauseSec > 0 && this.t >= beat.at - pauseSec && this.t < beat.at) {
        this._spawnPauseUntil = Math.max(this._spawnPauseUntil, beat.at);
      }
      if (this.t < beat.at) continue;
      if (beat.kind === 'elite') {
        if (this.enemies.some((e) => e.elite && !e.boss)) {
          this._beatsFired[key] = true;
          continue;
        }
        this._spawnElite(beat, events);
        this._beatsFired[key] = true;
      } else if (beat.kind === 'boss') {
        if (this.enemies.some((e) => e.boss)) {
          this._beatsFired[key] = true;
          continue;
        }
        this._spawnBoss(beat, events);
        this._beatsFired[key] = true;
      }
    }
    this._endlessBeatCheck(events);
  }

  /**
   * Endless elites/boss after ENDLESS.startAfter (default 360).
   * Only when this.endless === true. Defers schedule while elite/boss still alive
   * (does not mark skipped — waits and spawns when clear). Alternates eliteRotate.
   */
  _endlessBeatCheck(events) {
    if (!this.endless) return;
    if (this.t < ENDLESS.startAfter) return;
    if (this._nextEndlessEliteAt == null) {
      this._nextEndlessEliteAt = ENDLESS.startAfter + ENDLESS.eliteEvery;
      this._nextEndlessBossAt = ENDLESS.startAfter + ENDLESS.bossEvery;
      this._endlessEliteIdx = 0;
    }

    const eAt = this._nextEndlessEliteAt;
    const ePause = ELITE.spawnPauseSec || 0;
    if (ePause > 0 && this.t >= eAt - ePause && this.t < eAt) {
      this._spawnPauseUntil = Math.max(this._spawnPauseUntil, eAt);
    }
    if (this.t >= eAt) {
      const eliteAlive = this.enemies.some((e) => e.elite && !e.boss);
      if (!eliteAlive) {
        const rotate = ENDLESS.eliteRotate || ['sentinel', 'hunter', 'commander'];
        const id = rotate[this._endlessEliteIdx % rotate.length];
        this._endlessEliteIdx += 1;
        this._spawnElite({ at: eAt, kind: 'elite', id }, events);
        this._nextEndlessEliteAt = eAt + ENDLESS.eliteEvery;
      }
      // else: defer — leave _nextEndlessEliteAt unchanged
    }

    const bAt = this._nextEndlessBossAt;
    const bPause = BOSS.spawnPauseSec || 0;
    if (bPause > 0 && this.t >= bAt - bPause && this.t < bAt) {
      this._spawnPauseUntil = Math.max(this._spawnPauseUntil, bAt);
    }
    if (this.t >= bAt) {
      const bossAlive = this.enemies.some((e) => e.boss);
      if (!bossAlive) {
        const id = ENDLESS.bossId || 'swarm_core';
        this._spawnBoss({ at: bAt, kind: 'boss', id }, events);
        this._nextEndlessBossAt = bAt + ENDLESS.bossEvery;
      }
      // else: defer
    }
  }

  _spawnElite(beat, events) {
    const type = beat.id || ELITE.type || 'sentinel';
    const def = ENEMIES[type];
    if (!def) return null;
    const cfg = eliteCfg(type);
    const ang = this.rng() * Math.PI * 2;
    const dist = ARENA.spawnNear + 2 + this.rng() * 3;
    const c = this._softClamp(this.px + Math.cos(ang) * dist, this.pz + Math.sin(ang) * dist, def.radius);
    const { hpMul, speedMul } = swarmPressure(this.t);
    const walkMin = cfg.walkSecMin;
    const walkMax = cfg.walkSecMax;
    const e = {
      id: this._nextEid++,
      type, kind: def.kind, family: def.family, nameZh: def.zh, nameEn: def.en,
      x: c.x, z: c.z, prevX: c.x, prevZ: c.z, vx: 0, vz: 0,
      hp: def.hp * hpMul, maxHp: def.hp * hpMul,
      speed: def.speed * speedMul, r: def.radius,
      xp: def.xp, score: def.score, color: def.color, chase: def.chase,
      damage: def.damage || 1, shield: def.shield || 0,
      hit: 0, slow: 0, wob: this.rng() * Math.PI * 2,
      animPhase: this.rng() * Math.PI * 2,
      panic: false,
      elite: true,
      phase: 'walk',
      phaseT: walkMin + this.rng() * (walkMax - walkMin),
      telegraphDur: cfg.telegraphSec,
      telegraphAt: 0,
      damageAt: 0,
      chargeDx: 0,
      chargeDz: 1,
      comboSeg: 0,
      comboSegs: Math.max(1, cfg.comboSegs || 1),
      dualLane: !!cfg.dualLane,
      _comboContinue: false,
      // Army commander: alternate summon / personal attack modes
      cmdMode: cfg.modeShift ? 'summon' : null,
      cmdPhase: null,
      summonMarks: null,
    };
    this.enemies.push(e);
    events.push({
      type: 'beat', kind: 'elite', id: type,
      nameZh: def.zh, nameEn: def.en,
    });
    events.push({
      type: 'eliteIn', nameZh: def.zh, nameEn: def.en,
    });
    return e;
  }

  _beginEliteTelegraph(e, events, cfg) {
    e.phase = 'telegraph';
    e.phaseT = cfg.telegraphSec;
    e.telegraphDur = cfg.telegraphSec;
    e.telegraphAt = this.t;
    e.damageAt = this.t + cfg.telegraphSec;
    const adx = this.px - e.x, adz = this.pz - e.z;
    const al = Math.hypot(adx, adz) || 1;
    e.chargeDx = adx / al;
    e.chargeDz = adz / al;
    e.vx = 0; e.vz = 0;
    events.push({
      type: 'telegraph',
      eliteId: e.id,
      eliteType: e.type,
      segment: e.comboSeg || 0,
      segments: e.comboSegs || 1,
      x: e.x, z: e.z,
      dx: e.chargeDx, dz: e.chargeDz,
      duration: cfg.telegraphSec,
      damageAt: e.damageAt,
      dualLane: !!e.dualLane,
    });
  }

  /**
   * Elite state machine (per-type via eliteCfg):
   * walk → telegraph (≥1.2s) → charge → [short recover → telegraph → charge]×(comboSegs-1) → recover.
   * Contact damage only during charge after telegraph completes.
   */
  _tickElite(e, dt, events) {
    if (e.type === 'commander') {
      this._tickCommander(e, dt, events);
      return;
    }
    const cfg = eliteCfg(e.type);
    e.phaseT -= dt;
    if (e.hit > 0) e.hit -= dt;
    if (e.slow > 0) e.slow -= dt;
    const slowMul = e.slow > 0 ? 0.55 : 1;

    if (e.phase === 'walk') {
      const dx = this.px - e.x, dz = this.pz - e.z;
      const len = Math.hypot(dx, dz) || 1;
      const spd = e.speed * e.chase * cfg.walkSpeedMul * slowMul;
      e.vx = (dx / len) * spd;
      e.vz = (dz / len) * spd;
      e.x += e.vx * dt;
      e.z += e.vz * dt;
      const ec = this._softClamp(e.x, e.z, e.r);
      e.x = ec.x; e.z = ec.z;
      e.animPhase = (e.animPhase || 0) + Math.max(6, spd * 5) * dt;
      if (e.phaseT <= 0) {
        e.comboSeg = 0;
        e._comboContinue = false;
        this._beginEliteTelegraph(e, events, cfg);
      }
    } else if (e.phase === 'telegraph') {
      e.vx = 0; e.vz = 0;
      // Hold aim lock; no charge damage yet
      if (e.phaseT <= 0) {
        e.phase = 'charge';
        e.phaseT = cfg.chargeSec;
        events.push({ type: 'eliteCharge', eliteId: e.id, segment: e.comboSeg || 0 });
      }
    } else if (e.phase === 'charge') {
      const spd = cfg.chargeSpeed * slowMul;
      e.vx = e.chargeDx * spd;
      e.vz = e.chargeDz * spd;
      e.x += e.vx * dt;
      e.z += e.vz * dt;
      const ec = this._softClamp(e.x, e.z, e.r);
      e.x = ec.x; e.z = ec.z;
      e.animPhase = (e.animPhase || 0) + 14 * dt;
      // Contact damage only during charge (after telegraph)
      if (this.invuln <= 0 && Math.hypot(e.x - this.px, e.z - this.pz) < e.r + PLAYER.radius) {
        const dmg = cfg.chargeDamage != null ? cfg.chargeDamage : (e.damage || 3);
        const taken = Math.max(1, dmg - this._effectiveArmor());
        this.hp -= taken;
        this.invuln = 0.85 + (this.deflect || 0);
        this.hitFlash = 0.28;
        events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, amount: taken });
        e.x -= e.chargeDx * 1.1;
        e.z -= e.chargeDz * 1.1;
        if (this.hp <= 0) {
          this.alive = false;
          this.hp = 0;
          this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
          events.push({ type: 'dead' });
        }
      }
      if (e.phaseT <= 0) {
        e.comboSeg = (e.comboSeg || 0) + 1;
        const more = e.comboSeg < (e.comboSegs || 1);
        e.phase = 'recover';
        e.phaseT = more ? (cfg.recoverShortSec || 0.5) : cfg.recoverSec;
        e._comboContinue = more;
        e.vx = 0; e.vz = 0;
      }
    } else if (e.phase === 'recover') {
      e.vx = 0; e.vz = 0;
      if (e.phaseT <= 0) {
        if (e._comboContinue) {
          e._comboContinue = false;
          this._beginEliteTelegraph(e, events, cfg);
        } else {
          e.comboSeg = 0;
          e.phase = 'walk';
          e.phaseT = cfg.walkSecMin + this.rng() * (cfg.walkSecMax - cfg.walkSecMin);
        }
      }
    } else {
      e.phase = 'walk';
      e.phaseT = 1.5;
    }
  }


  /**
   * Army Commander elite: mode shifts
   *   walk → telegraph_summon (≥1.0s orange/red marks) → summon soldiers/drones → recover
   *        → telegraph_attack (≥1.1s lane) → charge → recover → (repeat alternate)
   * Contact damage only during charge after attack telegraph. Max one elite still holds.
   */
  _tickCommander(e, dt, events) {
    const cfg = eliteCfg(e.type);
    e.phaseT -= dt;
    if (e.hit > 0) e.hit -= dt;
    if (e.slow > 0) e.slow -= dt;
    const slowMul = e.slow > 0 ? 0.55 : 1;
    if (!e.cmdMode) e.cmdMode = 'summon';

    if (e.phase === 'walk') {
      const dx = this.px - e.x, dz = this.pz - e.z;
      const len = Math.hypot(dx, dz) || 1;
      const spd = e.speed * e.chase * (cfg.walkSpeedMul || 0.8) * slowMul;
      e.vx = (dx / len) * spd;
      e.vz = (dz / len) * spd;
      e.x += e.vx * dt;
      e.z += e.vz * dt;
      const ec = this._softClamp(e.x, e.z, e.r);
      e.x = ec.x; e.z = ec.z;
      e.animPhase = (e.animPhase || 0) + Math.max(6, spd * 5) * dt;
      if (e.phaseT <= 0) {
        if (e.cmdMode === 'summon') this._beginCommanderSummonTelegraph(e, events, cfg);
        else this._beginCommanderAttackTelegraph(e, events, cfg);
      }
    } else if (e.phase === 'telegraph_summon') {
      e.vx = 0; e.vz = 0;
      if (e.phaseT <= 0) {
        this._commanderDoSummon(e, events, cfg);
        e.phase = 'recover';
        e.phaseT = cfg.recoverSec || 1.7;
        e.cmdMode = 'attack';
        e.summonMarks = null;
      }
    } else if (e.phase === 'telegraph' || e.phase === 'telegraph_attack') {
      e.vx = 0; e.vz = 0;
      if (e.phaseT <= 0) {
        e.phase = 'charge';
        e.phaseT = cfg.chargeSec;
        events.push({ type: 'eliteCharge', eliteId: e.id, segment: 0, eliteType: 'commander', mode: 'attack' });
      }
    } else if (e.phase === 'charge') {
      const spd = (cfg.chargeSpeed || 8.8) * slowMul;
      e.vx = e.chargeDx * spd;
      e.vz = e.chargeDz * spd;
      e.x += e.vx * dt;
      e.z += e.vz * dt;
      const ec = this._softClamp(e.x, e.z, e.r);
      e.x = ec.x; e.z = ec.z;
      e.animPhase = (e.animPhase || 0) + 14 * dt;
      if (this.invuln <= 0 && Math.hypot(e.x - this.px, e.z - this.pz) < e.r + PLAYER.radius) {
        const dmg = cfg.chargeDamage != null ? cfg.chargeDamage : (e.damage || 3);
        const taken = Math.max(1, dmg - this._effectiveArmor());
        this.hp -= taken;
        this.invuln = 0.85 + (this.deflect || 0);
        this.hitFlash = 0.28;
        events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, amount: taken });
        e.x -= e.chargeDx * 1.1;
        e.z -= e.chargeDz * 1.1;
        if (this.hp <= 0) {
          this.alive = false;
          this.hp = 0;
          this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
          events.push({ type: 'dead' });
        }
      }
      if (e.phaseT <= 0) {
        e.phase = 'recover';
        e.phaseT = cfg.recoverSec || 1.7;
        e.vx = 0; e.vz = 0;
        e.cmdMode = 'summon';
      }
    } else if (e.phase === 'recover') {
      e.vx = 0; e.vz = 0;
      if (e.phaseT <= 0) {
        e.phase = 'walk';
        e.phaseT = (cfg.walkSecMin || 1.5) + this.rng() * ((cfg.walkSecMax || 2.6) - (cfg.walkSecMin || 1.5));
      }
    } else {
      e.phase = 'walk';
      e.phaseT = 1.5;
    }
  }

  _beginCommanderSummonTelegraph(e, events, cfg) {
    const tele = cfg.summonTelegraphSec != null ? cfg.summonTelegraphSec : 1.0;
    e.phase = 'telegraph_summon';
    e.phaseT = tele;
    e.telegraphDur = tele;
    e.telegraphAt = this.t;
    e.damageAt = this.t + tele;
    e.vx = 0; e.vz = 0;
    const n = Math.max(2, cfg.summonCount || 4);
    const marks = [];
    for (let i = 0; i < n; i++) {
      const ang = this.rng() * Math.PI * 2;
      const dist = 1.6 + this.rng() * 1.8;
      const c = this._softClamp(e.x + Math.cos(ang) * dist, e.z + Math.sin(ang) * dist, 0.35);
      marks.push({ x: c.x, z: c.z });
    }
    e.summonMarks = marks;
    events.push({
      type: 'telegraph',
      kind: 'commanderSummon',
      eliteId: e.id,
      eliteType: 'commander',
      mode: 'summon',
      x: e.x, z: e.z,
      marks: marks.map((m) => ({ x: m.x, z: m.z })),
      duration: tele,
      damageAt: e.damageAt,
    });
  }

  _beginCommanderAttackTelegraph(e, events, cfg) {
    const tele = cfg.attackTelegraphSec != null ? cfg.attackTelegraphSec : (cfg.telegraphSec || 1.1);
    e.phase = 'telegraph_attack';
    // Keep phase==='telegraph' compatible for warn-lane sync: also set a flag
    // View treats telegraph_attack like telegraph for lanes.
    e.phaseT = tele;
    e.telegraphDur = tele;
    e.telegraphAt = this.t;
    e.damageAt = this.t + tele;
    const adx = this.px - e.x, adz = this.pz - e.z;
    const al = Math.hypot(adx, adz) || 1;
    e.chargeDx = adx / al;
    e.chargeDz = adz / al;
    e.vx = 0; e.vz = 0;
    e.summonMarks = null;
    events.push({
      type: 'telegraph',
      kind: 'commanderAttack',
      eliteId: e.id,
      eliteType: 'commander',
      mode: 'attack',
      x: e.x, z: e.z,
      dx: e.chargeDx, dz: e.chargeDz,
      duration: tele,
      damageAt: e.damageAt,
      dualLane: false,
    });
  }

  _commanderDoSummon(e, events, cfg) {
    const types = (cfg.summonTypes && cfg.summonTypes.length) ? cfg.summonTypes : ['soldier', 'drone'];
    const marks = e.summonMarks || [];
    let spawned = 0;
    for (let i = 0; i < marks.length; i++) {
      const typ = types[i % types.length];
      const def = ENEMIES[typ];
      if (!def) continue;
      // Soft cap: don't flood if arena already dense
      if (this.enemies.length >= 70) break;
      const m = marks[i];
      const { hpMul, speedMul } = swarmPressure(this.t);
      this.enemies.push({
        id: this._nextEid++,
        type: typ, kind: def.kind, family: def.family, nameZh: def.zh, nameEn: def.en,
        x: m.x, z: m.z, prevX: m.x, prevZ: m.z, vx: 0, vz: 0,
        hp: def.hp * hpMul, maxHp: def.hp * hpMul,
        speed: def.speed * speedMul, r: def.radius,
        xp: def.xp, score: def.score, color: def.color, chase: def.chase,
        damage: def.damage || 1, shield: def.shield || 0,
        hit: 0, slow: 0, wob: this.rng() * Math.PI * 2,
        animPhase: this.rng() * Math.PI * 2,
        panic: !!def.panic,
        elite: false,
        boss: false,
        summonedBy: e.id,
        faceDx: 0, faceDz: 1,
        telegraphDur: 0, telegraphAt: 0,
        aimDx: 0, aimDz: 1, aimX: 0, aimZ: 0,
      });
      spawned += 1;
    }
    events.push({
      type: 'commanderSummon',
      eliteId: e.id,
      count: spawned,
      marks: marks.map((m) => ({ x: m.x, z: m.z })),
    });
  }

  _bossPhaseName(e) {
    const r = e.maxHp > 0 ? e.hp / e.maxHp : 0;
    if (r > 2 / 3) return 'orbit';
    if (r > 1 / 3) return 'volley';
    return 'frenzy';
  }

  _spawnBoss(beat, events) {
    const type = beat.id || BOSS.type || 'swarm_core';
    const def = ENEMIES[type];
    if (!def) return null;
    const ang = this.rng() * Math.PI * 2;
    const dist = ARENA.spawnNear + 3 + this.rng() * 2;
    const c = this._softClamp(this.px + Math.cos(ang) * dist, this.pz + Math.sin(ang) * dist, def.radius);
    const { hpMul, speedMul } = swarmPressure(this.t);
    const e = {
      id: this._nextEid++,
      type, kind: def.kind, family: def.family, nameZh: def.zh, nameEn: def.en,
      x: c.x, z: c.z, prevX: c.x, prevZ: c.z, vx: 0, vz: 0,
      hp: def.hp * hpMul, maxHp: def.hp * hpMul,
      speed: def.speed * speedMul, r: def.radius,
      xp: def.xp, score: def.score, color: def.color, chase: def.chase,
      damage: def.damage || 4, shield: def.shield || 0,
      hit: 0, slow: 0, wob: this.rng() * Math.PI * 2,
      animPhase: this.rng() * Math.PI * 2,
      panic: false,
      elite: false,
      boss: true,
      phase: 'orbit',
      phaseT: BOSS.orbitCycleSec,
      telegraphDur: BOSS.orbitTelegraphSec,
      telegraphAt: 0,
      damageAt: 0,
      bossSub: 'idle', // idle | telegraph | fire
      frenzyLeft: 0,
      frenzyStarted: false,
      podsAlive: BOSS.podCount,
      ringAng: this.rng() * Math.PI * 2,
      volleyAng: 0,
    };
    this.enemies.push(e);
    events.push({
      type: 'beat', kind: 'boss', id: type,
      nameZh: def.zh, nameEn: def.en,
    });
    events.push({
      type: 'bossIn', nameZh: def.zh, nameEn: def.en,
    });
    events.push({ type: 'phase', bossId: e.id, phase: 'orbit' });
    return e;
  }

  /**
   * Boss state machine by HP thirds:
   * Orbit — floor telegraph then runner/drone spawns (~3s)
   * Volley — 6-way bullet lanes drawn ≥0.8s before damage
   * Frenzy — spawn spike ~8s then recover toward Orbit timing
   */
  _tickBoss(e, dt, events) {
    if (e.hit > 0) e.hit -= dt;
    if (e.slow > 0) e.slow -= dt;
    const slowMul = e.slow > 0 ? 0.55 : 1;

    // Pods detach visually as HP drops (logic count for view)
    const wantPods = Math.max(0, Math.ceil(BOSS.podCount * (e.hp / Math.max(1, e.maxHp))));
    e.podsAlive = wantPods;

    const nextPhase = this._bossPhaseName(e);
    if (nextPhase !== e.phase) {
      const prev = e.phase;
      e.phase = nextPhase;
      e.bossSub = 'idle';
      e.phaseT = nextPhase === 'orbit' ? BOSS.orbitCycleSec
        : nextPhase === 'volley' ? BOSS.volleyCycleSec
        : BOSS.frenzyCycleSec;
      if (nextPhase === 'frenzy' && !e.frenzyStarted) {
        e.frenzyStarted = true;
        e.frenzyLeft = BOSS.frenzyDurationSec;
      }
      events.push({ type: 'phase', bossId: e.id, phase: nextPhase, from: prev });
    }

    // Slow hover toward player
    {
      const dx = this.px - e.x, dz = this.pz - e.z;
      const len = Math.hypot(dx, dz) || 1;
      const spd = e.speed * e.chase * BOSS.hoverSpeedMul * slowMul;
      e.vx = (dx / len) * spd;
      e.vz = (dz / len) * spd;
      e.x += e.vx * dt;
      e.z += e.vz * dt;
      const ec = this._softClamp(e.x, e.z, e.r);
      e.x = ec.x; e.z = ec.z;
      e.ringAng = (e.ringAng || 0) + dt * 0.55;
      e.animPhase = (e.animPhase || 0) + 4 * dt;
    }

    // Contact damage (always on, readable large hitbox)
    if (this.invuln <= 0 && Math.hypot(e.x - this.px, e.z - this.pz) < e.r + PLAYER.radius) {
      const dmg = BOSS.contactDamage != null ? BOSS.contactDamage : (e.damage || 4);
      const taken = Math.max(1, dmg - this._effectiveArmor());
      this.hp -= taken;
      this.invuln = 0.9 + (this.deflect || 0);
      this.hitFlash = 0.28;
      events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, amount: taken });
      const pdx = this.px - e.x, pdz = this.pz - e.z;
      const pl = Math.hypot(pdx, pdz) || 1;
      e.x -= (pdx / pl) * 0.6;
      e.z -= (pdz / pl) * 0.6;
      if (this.hp <= 0) {
        this.alive = false;
        this.hp = 0;
        this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
        events.push({ type: 'dead' });
      }
    }

    if (e.phase === 'orbit') {
      this._tickBossOrbit(e, dt, events);
    } else if (e.phase === 'volley') {
      this._tickBossVolley(e, dt, events);
    } else {
      this._tickBossFrenzy(e, dt, events);
    }
  }

  _tickBossOrbit(e, dt, events) {
    e.phaseT -= dt;
    if (e.bossSub === 'idle' && e.phaseT <= BOSS.orbitTelegraphSec) {
      e.bossSub = 'telegraph';
      e.telegraphDur = BOSS.orbitTelegraphSec;
      e.telegraphAt = this.t;
      e.damageAt = this.t + BOSS.orbitTelegraphSec;
      // Floor ring telegraph around boss
      this.bossHazards.push({
        kind: 'orbitRing',
        x: e.x, z: e.z,
        r: 2.4,
        life: BOSS.orbitTelegraphSec,
        maxLife: BOSS.orbitTelegraphSec,
        damageAt: e.damageAt,
        bossId: e.id,
      });
      events.push({
        type: 'telegraph', kind: 'orbit', bossId: e.id,
        x: e.x, z: e.z, duration: BOSS.orbitTelegraphSec, damageAt: e.damageAt,
      });
    }
    if (e.bossSub === 'telegraph' && e.phaseT <= 0) {
      e.bossSub = 'idle';
      e.phaseT = BOSS.orbitCycleSec;
      const n = BOSS.orbitSpawnCount;
      for (let i = 0; i < n; i++) {
        const typ = this.rng() < 0.55 ? 'drone' : 'soldier';
        this._spawn(typ);
        const spawned = this.enemies[this.enemies.length - 1];
        if (spawned && !spawned.boss && !spawned.elite) {
          const a = e.ringAng + (i / n) * Math.PI * 2;
          spawned.x = e.x + Math.cos(a) * 2.6;
          spawned.z = e.z + Math.sin(a) * 2.6;
          const sc = this._softClamp(spawned.x, spawned.z, spawned.r);
          spawned.x = sc.x; spawned.z = sc.z;
        }
      }
      events.push({ type: 'bossSpawn', bossId: e.id, count: n, phase: 'orbit' });
    }
  }

  _tickBossVolley(e, dt, events) {
    e.phaseT -= dt;
    if (e.bossSub === 'idle' && e.phaseT <= BOSS.volleyTelegraphSec) {
      e.bossSub = 'telegraph';
      e.telegraphDur = BOSS.volleyTelegraphSec;
      e.telegraphAt = this.t;
      e.damageAt = this.t + BOSS.volleyTelegraphSec;
      e.volleyAng = Math.atan2(this.pz - e.z, this.px - e.x);
      const ways = BOSS.volleyWays;
      for (let i = 0; i < ways; i++) {
        const ang = e.volleyAng + (i / ways) * Math.PI * 2;
        const dx = Math.cos(ang), dz = Math.sin(ang);
        this.bossHazards.push({
          kind: 'volleyLane',
          x: e.x, z: e.z,
          dx, dz,
          life: BOSS.volleyTelegraphSec,
          maxLife: BOSS.volleyTelegraphSec,
          damageAt: e.damageAt,
          bossId: e.id,
          fired: false,
        });
      }
      events.push({
        type: 'telegraph', kind: 'volley', bossId: e.id,
        x: e.x, z: e.z, ways, duration: BOSS.volleyTelegraphSec, damageAt: e.damageAt,
      });
    }
    if (e.bossSub === 'telegraph' && e.phaseT <= 0) {
      e.bossSub = 'idle';
      e.phaseT = BOSS.volleyCycleSec;
      // Convert lanes → damaging bullets (damage only after telegraph)
      for (const h of this.bossHazards) {
        if (h.kind === 'volleyLane' && h.bossId === e.id && !h.fired) {
          h.fired = true;
          h.kind = 'volleyBullet';
          h.life = BOSS.volleyBulletLife;
          h.maxLife = BOSS.volleyBulletLife;
          h.speed = BOSS.volleyBulletSpeed;
          h.r = BOSS.volleyBulletRadius;
          h.dmg = BOSS.volleyBulletDamage;
        }
      }
      events.push({ type: 'bossVolley', bossId: e.id, ways: BOSS.volleyWays });
    }
  }

  _tickBossFrenzy(e, dt, events) {
    if (e.frenzyLeft > 0) e.frenzyLeft -= dt;
    const spike = e.frenzyLeft > 0;
    const cycle = spike ? (BOSS.frenzyCycleSec / BOSS.frenzySpawnMul) : BOSS.orbitCycleSec;
    // Reuse orbit telegraph/spawn but with faster cycle during spike
    e.phaseT -= dt;
    const tele = BOSS.orbitTelegraphSec;
    if (e.bossSub === 'idle' && e.phaseT <= tele) {
      e.bossSub = 'telegraph';
      e.telegraphDur = tele;
      e.telegraphAt = this.t;
      e.damageAt = this.t + tele;
      this.bossHazards.push({
        kind: 'orbitRing',
        x: e.x, z: e.z,
        r: 2.8,
        life: tele,
        maxLife: tele,
        damageAt: e.damageAt,
        bossId: e.id,
      });
      events.push({
        type: 'telegraph', kind: 'frenzy', bossId: e.id,
        x: e.x, z: e.z, duration: tele, damageAt: e.damageAt, spike,
      });
    }
    if (e.bossSub === 'telegraph' && e.phaseT <= 0) {
      e.bossSub = 'idle';
      e.phaseT = cycle;
      const n = spike ? BOSS.orbitSpawnCount + 2 : BOSS.orbitSpawnCount;
      for (let i = 0; i < n; i++) {
        const typ = this.rng() < 0.6 ? 'drone' : 'soldier';
        this._spawn(typ);
        const spawned = this.enemies[this.enemies.length - 1];
        if (spawned && !spawned.boss && !spawned.elite) {
          const a = e.ringAng + (i / n) * Math.PI * 2;
          spawned.x = e.x + Math.cos(a) * 2.8;
          spawned.z = e.z + Math.sin(a) * 2.8;
          const sc = this._softClamp(spawned.x, spawned.z, spawned.r);
          spawned.x = sc.x; spawned.z = sc.z;
        }
      }
      events.push({ type: 'bossSpawn', bossId: e.id, count: n, phase: 'frenzy', spike });
    }
  }

  /** Tick boss hazards: orbit rings (visual only) + volley bullets (damage after telegraph). */
  _tickBossHazards(dt, events) {
    for (let i = this.bossHazards.length - 1; i >= 0; i--) {
      const h = this.bossHazards[i];
      h.life -= dt;
      if (h.kind === 'volleyBullet') {
        h.x += h.dx * h.speed * dt;
        h.z += h.dz * h.speed * dt;
        if (this.alive && this.invuln <= 0 &&
            Math.hypot(h.x - this.px, h.z - this.pz) < (h.r || 0.22) + PLAYER.radius) {
          const taken = Math.max(1, (h.dmg || 2) - this._effectiveArmor());
          this.hp -= taken;
          this.invuln = 0.7 + (this.deflect || 0);
          this.hitFlash = 0.22;
          events.push({ type: 'hurt', by: 'swarm_core', nameZh: '洪流核心', nameEn: 'SWARM CORE', amount: taken });
          this.bossHazards.splice(i, 1);
          if (this.hp <= 0) {
            this.alive = false;
            this.hp = 0;
            this.killer = { kind: 'swarm_core', zh: '洪流核心', en: 'SWARM CORE' };
            events.push({ type: 'dead' });
          }
          continue;
        }
      }
      // Keep unfired volley lanes until boss converts them (telegraph must outlive clock jitter)
      if (h.life <= 0) {
        if (h.kind === 'volleyLane' && !h.fired) continue;
        this.bossHazards.splice(i, 1);
      }
    }
  }

  _waveBurst() {
    const n = 4 + Math.min(10, Math.floor(this.t / 20));
    for (let i = 0; i < n; i++) {
      const r = this.rng();
      const type = this.t < 30
        ? (r < 0.5 ? 'soldier' : r < 0.8 ? 'drone' : 'staffer')
        : (r < 0.55 ? 'soldier' : r < 0.8 ? 'drone' : 'walker');
      this._spawn(type);
    }
  }

  /**
   * Nearest-N without allocating a full mapped/sorted enemy list.
   * n=1: single pass. n>1: insertion of top-n (n is small: multi stacks).
   */
  _nearest(n = 1, maxRange = null) {
    const R = maxRange == null ? 1e9 : maxRange;
    const R2 = R * R;
    const px = this.px, pz = this.pz;
    const enemies = this.enemies;
    if (n <= 1) {
      let best = null, bd = Infinity;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        const dx = e.x - px, dz = e.z - pz;
        const d2 = dx * dx + dz * dz;
        if (d2 <= R2 && d2 < bd) { bd = d2; best = e; }
      }
      return best ? [best] : [];
    }
    const want = n | 0;
    const topE = new Array(want);
    const topD = new Array(want);
    let count = 0;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      const dx = e.x - px, dz = e.z - pz;
      const d2 = dx * dx + dz * dz;
      if (d2 > R2) continue;
      if (count < want) {
        let j = count++;
        topE[j] = e; topD[j] = d2;
        while (j > 0 && topD[j] < topD[j - 1]) {
          const te = topE[j]; topE[j] = topE[j - 1]; topE[j - 1] = te;
          const td = topD[j]; topD[j] = topD[j - 1]; topD[j - 1] = td;
          j--;
        }
      } else if (d2 < topD[want - 1]) {
        let j = want - 1;
        topE[j] = e; topD[j] = d2;
        while (j > 0 && topD[j] < topD[j - 1]) {
          const te = topE[j]; topE[j] = topE[j - 1]; topE[j - 1] = te;
          const td = topD[j]; topD[j] = topD[j - 1]; topD[j - 1] = td;
          j--;
        }
      }
    }
    if (count === 0) return [];
    if (count === want) return topE;
    return topE.slice(0, count);
  }

  /**
   * Sticky auto-aim: keep primary ~0.2s unless dead / OOR / clearly closer foe.
   * Multi: sticky primary + fill nearest others (no full Array.sort).
   */
  _targetsForWeapon(n = 1, maxRange = null) {
    const R = maxRange == null ? this.fireRange : maxRange;
    // v0.9.22: slightly stickier primary (readability / aim calm); no balance table change
    const hold = 0.24;
    const stealFrac = 0.22;
    const stealAbs = 1.35;
    const want = Math.max(1, n | 0);

    let sticky = this._sticky;
    if (sticky) {
      if (this.enemies.indexOf(sticky) < 0 || sticky.hp <= 0) sticky = null;
      else {
        const d = Math.hypot(sticky.x - this.px, sticky.z - this.pz);
        if (d > R) sticky = null;
      }
    }

    const pool = this._nearest(Math.max(want, 8), R);
    if (!pool.length) {
      this._sticky = null;
      return [];
    }

    const best = pool[0];
    const bestD = Math.hypot(best.x - this.px, best.z - this.pz);
    // Mild closing bias: approaching foes count slightly nearer for steal (keeps sticky).
    const closingOf = (e) => {
      const dx = e.x - this.px, dz = e.z - this.pz;
      const d = Math.hypot(dx, dz) || 1;
      return -((e.vx || 0) * dx + (e.vz || 0) * dz) / d;
    };
    if (!sticky) {
      sticky = best;
      this._stickyUntil = this.t + hold;
    } else {
      const sd = Math.hypot(sticky.x - this.px, sticky.z - this.pz);
      const holding = this.t < this._stickyUntil;
      const closeBias = (closingOf(best) > 1.2 && closingOf(sticky) < 0.6) ? 0.4 : 0;
      const effBest = Math.max(0, bestD - closeBias);
      const clearlyCloser = best !== sticky && (effBest <= sd * (1 - stealFrac) || (sd - bestD) >= stealAbs - closeBias);
      if (!holding || clearlyCloser) {
        sticky = best;
        this._stickyUntil = this.t + hold;
      }
    }
    this._sticky = sticky;

    if (want <= 1) return [sticky];
    const out = [sticky];
    for (let i = 0; i < pool.length; i++) {
      const e = pool[i];
      if (e === sticky) continue;
      out.push(e);
      if (out.length >= want) break;
    }
    return out;
  }

  _setAimFrom(dx, dz) {
    const len = Math.hypot(dx, dz) || 1;
    this.aimX = dx / len;
    this.aimZ = dz / len;
  }

  /** Stable primary forward vector for grenade fan / body facing. */
  primaryForward() {
    let fx = this.visualAimX, fz = this.visualAimZ;
    let fl = Math.hypot(fx, fz);
    if (fl > 0.01) return { x: fx / fl, z: fz / fl };
    fx = this.aimX; fz = this.aimZ;
    fl = Math.hypot(fx, fz);
    if (fl > 0.01) return { x: fx / fl, z: fz / fl };
    return { x: 0, z: 1 };
  }

  /**
   * Fire event always carries its own aimX/aimZ.
   * Body visualAim updates only for primary weapons (mg/laser) unless opts.updateVisual overrides.
   */
  _pushFire(events, weapon, dx, dz, bullet, target, opts = {}) {
    const len = Math.hypot(dx, dz) || 1;
    const ax = dx / len, az = dz / len;
    const updateVisual = opts.updateVisual != null
      ? !!opts.updateVisual
      : PRIMARY_VISUAL_WEAPONS.has(weapon);
    if (updateVisual) {
      this._setAimFrom(ax, az);
      this.visualAimX = ax;
      this.visualAimZ = az;
    }
    if (!events) return;
    const mx = bullet ? bullet.x : this.px + ax * 0.9;
    const my = bullet && bullet.y != null ? bullet.y : 0.95;
    const mz = bullet ? bullet.z : this.pz + az * 0.9;
    events.push({
      type: 'fire',
      weapon,
      aimX: ax,
      aimZ: az,
      muzzleX: mx,
      muzzleY: my,
      muzzleZ: mz,
      targetId: target && target.id != null ? target.id : null,
      updateVisual,
    });
  }

  primaryWeapon() {
    const order = ['laser', 'rocket', 'shotgun', 'grenade', 'plasma', 'dmg', 'rate', 'pierce', 'multi', 'nova', 'orbit'];
    let best = 'mg';
    let n = 0;
    for (const id of order) {
      const c = this.taken ? (this.taken[id] || 0) : 0;
      if (c > n) { n = c; best = id; }
    }
    return best;
  }

  _emitBullet(dx, dz, opts = {}) {
    const len = Math.hypot(dx, dz) || 1;
    dx /= len; dz /= len;
    const weapon = opts.weapon || 'mg';
    const speed = opts.speed != null ? opts.speed : this.bulletSpeed;
    // Shared pure muzzle-world (same helper as VFX flash) — per-dir recorded projections.
    const mw = muzzleWorld(this.px, this.pz, dx, dz);
    const my = opts.y != null ? opts.y : mw.y;
    // Close-range: if foe is nearer than muzzle offset + radius, shorten spawn so bullet does not appear past them.
    let spawnX = mw.x, spawnZ = mw.z;
    if (opts.targetDist != null) {
      const cm = closeMuzzlePos(
        this.px, this.pz, mw.x, mw.z, dx, dz,
        opts.targetDist, opts.targetR != null ? opts.targetR : 0.3
      );
      spawnX = cm.x;
      spawnZ = cm.z;
    }
    const b = {
      weapon,
      tier: shotTier((this.taken && this.taken[weapon]) || opts.tierStacks || 0),
      x: spawnX + (opts.ox || 0),
      z: spawnZ + (opts.oz || 0),
      y: my,
      vx: dx * speed,
      vz: dz * speed,
      vy: opts.vy || 0,
      life: opts.life != null ? opts.life : (this.bulletLife || PLAYER.bulletLife),
      dmg: opts.dmg != null ? opts.dmg : this.bulletDmg,
      r: opts.r != null ? opts.r : 0.12,
      pierce: opts.pierce != null ? opts.pierce : 0,
      hitIds: new Set(),
      aoe: opts.aoe || 0,
      aoeDmg: opts.aoeDmg || 0,
      fuse: opts.fuse || 0,
      grav: opts.grav || 0,
      puddle: opts.puddle || 0,
      kind: opts.kind || weapon,
      ...opts,
    };
    // Aim + (possibly shortened) muzzle win over any opts spread.
    b.x = spawnX + (opts.ox || 0);
    b.z = spawnZ + (opts.oz || 0);
    b.y = my;
    b.vx = dx * speed;
    b.vz = dz * speed;
    if (opts.vy != null) b.vy = opts.vy;
    if (opts.grav != null) b.grav = opts.grav;
    else b.grav = 0;
    this.bullets.push(b);
    return b;
  }

  /** Continuous cyan MG / gatling laser-feel bolts / vulcan spray. */
  _fireMg(events, opts = {}) {
    const range = opts.range || this.fireRange;
    const targets = this._targetsForWeapon(this.multi || 1, range);
    if (!targets.length) return false;
    let primary = null;
    let primaryDx = 0, primaryDz = 1;
    const maxT = Math.max(AIM_LEAD_MAX_T, this.bulletLife || PLAYER.bulletLife);
    const tag = opts.weaponTag || 'mg';
    const speed = opts.laserFeel ? (this.bulletSpeed * 1.15) : this.bulletSpeed;
    const boltCount = Math.max(1, opts.boltCount || 1);
    const spreadRad = opts.spreadRad || 0;
    const burn = opts.burn || 0;
    const burnDur = opts.burnDur || 0;
    for (const best of targets) {
      const lead = muzzleInterceptAimDir(
        this.px, this.pz, best.x, best.z, best.vx || 0, best.vz || 0,
        speed, maxT
      );
      const baseAng = Math.atan2(lead.dz, lead.dx);
      const tDist = Math.hypot(best.x - this.px, best.z - this.pz);
      for (let bi = 0; bi < boltCount; bi++) {
        const t = boltCount === 1 ? 0 : (bi / (boltCount - 1)) * 2 - 1;
        const a = baseAng + t * spreadRad;
        const dx = Math.cos(a), dz = Math.sin(a);
        const b = this._emitBullet(dx, dz, {
          weapon: tag,
          dmg: this.bulletDmg * (opts.dmgMul || 1),
          pierce: (this.pierce || 0) + (opts.pierceAdd || 0),
          life: this.bulletLife,
          speed,
          r: opts.laserFeel ? 0.09 : 0.1,
          laserFeel: !!opts.laserFeel,
          burn,
          burnDur,
          targetDist: tDist,
          targetR: best.r || 0.3,
        });
        if (!primary) { primary = { b, best, dx, dz }; primaryDx = dx; primaryDz = dz; }
      }
    }
    this._pushFire(events, tag === 'gatling' ? 'mg' : tag, primaryDx, primaryDz, primary.b, primary.best);
    return true;
  }

  _fireLaser(events) {
    const targets = this._targetsForWeapon(1, this.fireRange + 4);
    if (!targets.length) return false;
    const best = targets[0];
    const stacks = this.laser;
    const speed = 38;
    const lead = muzzleInterceptAimDir(
      this.px, this.pz, best.x, best.z, best.vx || 0, best.vz || 0,
      speed, Math.max(AIM_LEAD_MAX_T, 0.28)
    );
    const dx = lead.dx, dz = lead.dz;
    const tDist = Math.hypot(best.x - this.px, best.z - this.pz);
    const b = this._emitBullet(dx, dz, {
      weapon: 'laser',
      dmg: 1.1 + stacks * 0.55,
      pierce: 3 + stacks,
      life: 0.28,
      speed,
      r: 0.16,
      tierStacks: stacks,
      targetDist: tDist,
      targetR: best.r || 0.3,
    });
    this._pushFire(events, 'laser', dx, dz, b, best);
    return true;
  }

  _fireShotgun(events, opts = {}) {
    const range = opts.range || 6.5;
    const targets = this._targetsForWeapon(1, range);
    if (!targets.length) return false;
    const best = targets[0];
    const stacks = this.shotgun;
    const speed = 16 + stacks;
    const lead = muzzleInterceptAimDir(
      this.px, this.pz, best.x, best.z, best.vx || 0, best.vz || 0,
      speed, Math.max(AIM_LEAD_MAX_T, 0.22)
    );
    const ang = Math.atan2(lead.dz, lead.dx);
    const n = opts.pellets || (5 + stacks);
    const spread = Math.max(0.08, (opts.heavy ? (0.62 + stacks * 0.09) : (0.55 + stacks * 0.08)) + (opts.spreadAdd || 0));
    const tDist = Math.hypot(best.x - this.px, best.z - this.pz);
    let primary = null;
    const dmg = ((opts.heavy ? 0.7 : 0.55) + stacks * 0.22) * (opts.dmgMul || 1);
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
      const a = ang + t * spread;
      const dx = Math.cos(a), dz = Math.sin(a);
      const b = this._emitBullet(dx, dz, {
        weapon: 'shotgun',
        dmg,
        life: 0.20,
        speed,
        r: opts.heavy ? 0.15 : 0.14,
        pierce: opts.pierceAdd || 0,
        tierStacks: stacks,
        targetDist: tDist,
        targetR: best.r || 0.3,
      });
      if (!primary) primary = { b, dx, dz };
    }
    this._pushFire(events, 'shotgun', primary.dx, primary.dz, primary.b, best);
    return true;
  }

  _fireRocket(events) {
    const targets = this._targetsForWeapon(1, this.fireRange + 2);
    if (!targets.length) return false;
    const best = targets[0];
    const stacks = this.rocket;
    const speed = 7.5 + stacks * 0.8;
    const lead = muzzleInterceptAimDir(
      this.px, this.pz, best.x, best.z, best.vx || 0, best.vz || 0,
      speed, Math.max(AIM_LEAD_MAX_T, 1.6)
    );
    const dx = lead.dx, dz = lead.dz;
    const tDist = Math.hypot(best.x - this.px, best.z - this.pz);
    const b = this._emitBullet(dx, dz, {
      weapon: 'rocket',
      dmg: 2.2 + stacks * 1.4,
      life: 1.6,
      speed,
      r: 0.28,
      pierce: 0,
      aoe: 1.6 + stacks * 0.35,
      aoeDmg: 2.5 + stacks * 1.2,
      tierStacks: stacks,
      targetDist: tDist,
      targetR: best.r || 0.3,
    });
    this._pushFire(events, 'rocket', dx, dz, b, best);
    return true;
  }

  _fireGrenade(events, opts = {}) {
    const fwd = this.primaryForward();
    const throwAim = resolveGrenadeThrow(
      this.px, this.pz, fwd.x, fwd.z, this.enemies, this.fireRange
    );
    const dx = throwAim.dx, dz = throwAim.dz;
    const dist = throwAim.dist;
    const best = throwAim.target;
    const stacks = Math.max(this.grenade || 0, this.frag || 0, 1);
    const speed = 6.5 + stacks * 0.5;
    const fuse = (opts.fuse != null ? opts.fuse : 0.75) - stacks * 0.05;
    const aoe = (opts.aoe != null ? opts.aoe : 1.9) + stacks * 0.35;
    const aoeDmg = (opts.hit != null ? opts.hit : 3.2) + stacks * 1.4;
    const b = this._emitBullet(dx, dz, {
      weapon: opts.weaponTag || 'grenade',
      dmg: 0.4,
      life: 1.1,
      speed,
      r: 0.22,
      pierce: 99,
      fuse: Math.max(0.25, fuse),
      grav: 14,
      vy: 7.5 + Math.min(4, dist * 0.25),
      aoe,
      aoeDmg,
      shards: opts.shards || 0,
      tierStacks: stacks,
      hitIds: new Set(),
    });
    b.noHit = true;
    b.grenadeMode = throwAim.mode;
    this._pushFire(events, opts.weaponTag || 'grenade', dx, dz, b, best, { updateVisual: false });
    return true;
  }

  _firePlasma(events) {
    const targets = this._targetsForWeapon(1, this.fireRange);
    if (!targets.length) return false;
    const best = targets[0];
    const stacks = this.plasma;
    const speed = 9;
    const lead = muzzleInterceptAimDir(
      this.px, this.pz, best.x, best.z, best.vx || 0, best.vz || 0,
      speed, Math.max(AIM_LEAD_MAX_T, 0.9)
    );
    const dx = lead.dx, dz = lead.dz;
    const tDist = Math.hypot(best.x - this.px, best.z - this.pz);
    const b = this._emitBullet(dx, dz, {
      weapon: 'plasma',
      dmg: 1.2 + stacks * 0.6,
      life: 0.9,
      speed,
      r: 0.26,
      pierce: 0,
      puddle: 1.4 + stacks * 0.35,
      aoeDmg: 0.9 + stacks * 0.35,
      tierStacks: stacks,
      targetDist: tDist,
      targetR: best.r || 0.3,
    });
    this._pushFire(events, 'plasma', dx, dz, b, best);
    return true;
  }

  /** ion_beam: charge-fire high damage pierce shot */
  _fireIonBeam(events, stacks, base = {}) {
    const targets = this._targetsForWeapon(1, this.fireRange + 5);
    if (!targets.length) return false;
    const best = targets[0];
    const speed = 42;
    const lead = muzzleInterceptAimDir(
      this.px, this.pz, best.x, best.z, best.vx || 0, best.vz || 0,
      speed, Math.max(AIM_LEAD_MAX_T, 0.3)
    );
    const dx = lead.dx, dz = lead.dz;
    const tDist = Math.hypot(best.x - this.px, best.z - this.pz);
    const b = this._emitBullet(dx, dz, {
      weapon: 'ion_beam',
      dmg: (base.hit || 3.6) + stacks * 0.7,
      pierce: (base.pierce || 3) + stacks,
      life: base.slit ? 0.26 : 0.32,
      speed: base.slit ? speed * 1.12 : speed,
      r: base.slit ? 0.12 : 0.18,
      chainJumps: base.chainJumps || 0,
      chainRange: base.chainRange || 0,
      tierStacks: stacks,
      targetDist: tDist,
      targetR: best.r || 0.3,
    });
    this._pushFire(events, 'laser', dx, dz, b, best);
    return true;
  }

  /** zero_laser: discrete chill bolts */
  _fireZeroBolt(events, stacks, base = {}) {
    const targets = this._targetsForWeapon(1, this.fireRange + 2);
    if (!targets.length) return false;
    const best = targets[0];
    const speed = base.speed || 32;
    const lead = muzzleInterceptAimDir(
      this.px, this.pz, best.x, best.z, best.vx || 0, best.vz || 0,
      speed, Math.max(AIM_LEAD_MAX_T, 0.35)
    );
    const dx = lead.dx, dz = lead.dz;
    const tDist = Math.hypot(best.x - this.px, best.z - this.pz);
    const chill = (base.chill || 0.7) * (base.chillMul || 1);
    const b = this._emitBullet(dx, dz, {
      weapon: 'zero_laser',
      dmg: (base.hit || 1.5) + stacks * 0.35,
      pierce: (base.pierce || 1) + (base.pierceAdd || 0),
      life: 0.45,
      speed,
      r: 0.11,
      chill,
      frostBurstR: base.frostBurstR || 0,
      frostBurstDmg: base.frostBurstDmg || 0,
      tierStacks: stacks,
      targetDist: tDist,
      targetR: best.r || 0.3,
    });
    this._pushFire(events, 'laser', dx, dz, b, best);
    return true;
  }

  /** tracking_bomb: homing → stick → quick explode (branch kits: multi / mine / drone-seek). */
  _fireTrackingBomb(events, stacks, base = {}) {
    const targets = this._targetsForWeapon(1, this.fireRange + 3);
    if (!targets.length) return false;
    const best = targets[0];
    const warheads = Math.max(1, base.warheads || 1);
    const speed = (9 + stacks * 0.6) * (base.seekSpeedMul || 1);
    const lead = muzzleInterceptAimDir(
      this.px, this.pz, best.x, best.z, best.vx || 0, best.vz || 0,
      speed, Math.max(AIM_LEAD_MAX_T, 1.2)
    );
    const baseAng = Math.atan2(lead.dz, lead.dx);
    const tDist = Math.hypot(best.x - this.px, best.z - this.pz);
    const hit = ((base.hit || 2.4) + stacks * 0.9) * (base.dmgMul || 1);
    const aoe = (base.aoe || 1.6) * (base.aoeMul || 1);
    const stick = (base.stick || 0.35) * (base.stickMul || 1);
    const homing = (base.homing || 14) * (base.homingMul || 1);
    let primary = null;
    for (let i = 0; i < warheads; i++) {
      const t = warheads === 1 ? 0 : (i / (warheads - 1)) * 2 - 1;
      const a = baseAng + t * (warheads > 1 ? 0.22 : 0);
      const dx = Math.cos(a), dz = Math.sin(a);
      const b = this._emitBullet(dx, dz, {
        weapon: 'tracking_bomb',
        dmg: hit,
        life: 2.2,
        speed,
        r: warheads > 1 ? 0.18 : 0.26,
        pierce: 0,
        aoe,
        aoeDmg: hit,
        homing,
        homeTarget: best,
        stickOnHit: true,
        stickFuse: stick,
        tierStacks: stacks,
        targetDist: tDist,
        targetR: best.r || 0.3,
      });
      if (!primary) primary = { b, dx, dz };
    }
    this._pushFire(events, 'rocket', primary.dx, primary.dz, primary.b, best);
    return true;
  }

  /** acid_gun: rapid dissolving stream shot */
  _fireAcidStream(events, stacks, base = {}) {
    const targets = this._targetsForWeapon(1, this.fireRange);
    if (!targets.length) return false;
    const best = targets[0];
    const speed = 14;
    const lead = muzzleInterceptAimDir(
      this.px, this.pz, best.x, best.z, best.vx || 0, best.vz || 0,
      speed, Math.max(AIM_LEAD_MAX_T, 0.5)
    );
    const dx = lead.dx, dz = lead.dz;
    const tDist = Math.hypot(best.x - this.px, best.z - this.pz);
    const b = this._emitBullet(dx, dz, {
      weapon: 'acid_gun',
      dmg: (base.hit || 0.85) + stacks * 0.25,
      life: 0.55,
      speed,
      r: 0.14,
      pierce: 1,
      puddle: (base.dissolve || 1.4) * 0.55,
      aoeDmg: 0.55 + stacks * 0.2,
      tierStacks: stacks,
      targetDist: tDist,
      targetR: best.r || 0.3,
    });
    this._pushFire(events, 'plasma', dx, dz, b, best);
    return true;
  }

  /** slow_gun: rush feel + AoE slow field near aim point */
  _fireSlowRush(events, stacks, base = {}) {
    const targets = this._targetsForWeapon(1, (base.rush || 14));
    const fwd = this.primaryForward();
    let x = this.px + fwd.x * 4;
    let z = this.pz + fwd.z * 4;
    if (targets.length) {
      x = targets[0].x; z = targets[0].z;
    }
    const aoe = base.aoe || 2.4;
    const slow = base.slow || 1.6;
    const hit = (base.hit || 0.6) + stacks * 0.15;
    for (const e of this.enemies) {
      if (Math.hypot(e.x - x, e.z - z) > aoe + e.r) continue;
      this._applyEnemyDamage(e, hit, this.px, this.pz, events, { hitTime: 0.1 });
      e.slow = Math.max(e.slow || 0, slow);
    }
    this.zones.push({
      x, z, r: aoe, life: slow, dps: 0, kind: 'slow',
    });
    events.push({ type: 'slowField', x, z, r: aoe, dur: slow });
    this._pushFire(events, 'plasma', fwd.x, fwd.z, null, targets[0] || null);
    return true;
  }

  /** attack_drone: deploy 2 escort drones (orbit stacks + timed helpers) */
  _deployAttackDrones(events, stacks, base = {}) {
    const n = base.drones || 2;
    this.orbits = Math.min(6, (this.orbits || 0) + n);
    if (!this._drones) this._drones = [];
    const life = (base.life || 8) + stacks;
    for (let i = 0; i < n; i++) {
      this._drones.push({ life, dmg: (base.hit || 0.7) + stacks * 0.15, cd: 0 });
    }
    events.push({ type: 'deployDrones', count: n, life });
    const fwd = this.primaryForward();
    this._pushFire(events, 'plasma', fwd.x, fwd.z, null, null);
    return true;
  }

  /** blackhole: AoE pull then crush */
  _fireBlackhole(events, stacks, base = {}) {
    const targets = this._targetsForWeapon(1, this.fireRange + 1);
    const fwd = this.primaryForward();
    let x = this.px + fwd.x * 5;
    let z = this.pz + fwd.z * 5;
    if (targets.length) { x = targets[0].x; z = targets[0].z; }
    const aoe = (base.aoe || 3.4) + stacks * 0.2;
    const pull = base.pull || 9;
    const dur = base.duration || 1.2;
    const hit = (base.hit || 2.2) + stacks * 0.5;
    if (!this._pullFields) this._pullFields = [];
    this._pullFields.push({ x, z, r: aoe, pull, life: dur, dmgAcc: 0, dmg: hit / Math.max(0.4, dur) });
    events.push({ type: 'blackhole', x, z, r: aoe, dur });
    this._pushFire(events, 'plasma', fwd.x, fwd.z, null, targets[0] || null);
    return true;
  }

  _fireChillBomb(events, stacks, base = {}) {
    const ok = this._fireGrenade(events, {
      weaponTag: 'chill', fuse: base.fuse || 0.35, aoe: base.aoe || 2.8, hit: base.hit || 1.0,
    });
    if (!ok) return false;
    const b = this.bullets[this.bullets.length - 1];
    if (b) {
      b.chillField = true;
      b.slow = base.slow || 1.8;
      b.fieldDur = base.duration || 2.2;
      b.aoeDmg = (base.hit || 1.0) + stacks * 0.4;
    }
    return true;
  }

  _fireFlashbang(events, stacks, base = {}) {
    const ok = this._fireGrenade(events, {
      weaponTag: 'flash', fuse: base.fuse || 0.12, aoe: base.aoe || 3.2, hit: base.hit || 0.25,
    });
    if (!ok) return false;
    const b = this.bullets[this.bullets.length - 1];
    if (b) {
      b.flashbang = true;
      b.stun = base.stun || 0.9;
      b.aoeDmg = (base.hit || 0.25) + stacks * 0.1;
    }
    return true;
  }

  _fireGravityBomb(events, stacks, base = {}) {
    const ok = this._fireGrenade(events, {
      weaponTag: 'gravity', fuse: base.fuse || 0.45, aoe: base.aoe || 3.2, hit: base.hit || 2.8,
    });
    if (!ok) return false;
    const b = this.bullets[this.bullets.length - 1];
    if (b) {
      b.gravityPull = true;
      b.pull = base.pull || 11;
      b.fieldDur = base.duration || 0.9;
      b.aoeDmg = (base.hit || 2.8) + stacks * 0.8;
    }
    return true;
  }

  _aoeAt(x, z, radius, dmg, events, tag = 'blast') {
    for (let j = this.enemies.length - 1; j >= 0; j--) {
      const e = this.enemies[j];
      if (Math.hypot(e.x - x, e.z - z) > radius + e.r) continue;
      const dead = this._applyEnemyDamage(e, dmg, x, z, events, { hitTime: 0.18, pushHit: true, heavy: true });
      if (dead) { this._kill(e, j, events); events.push({ type: 'kill', enemy: e, gore: true }); }
    }
    events.push({ type: 'explode', x, z, r: radius, tag });
  }

  _novaBlast(events) {
    const R = 2.1 + this.nova * 0.35;
    const dmg = 2 + this.nova * 1.5;
    for (let j = this.enemies.length - 1; j >= 0; j--) {
      const e = this.enemies[j];
      if (Math.hypot(e.x - this.px, e.z - this.pz) > R) continue;
      const dead = this._applyEnemyDamage(e, dmg, this.px, this.pz, events, { hitTime: 0.15 });
      if (dead) { this._kill(e, j, events); events.push({ type: 'kill', enemy: e, gore: true }); }
    }
    events.push({ type: 'nova', r: R });
  }

  _dropGem(e) {
    const healChance = e.family === 'human' ? 0.1 : 0.06;
    if (this.rng() < healChance) {
      this.gems.push({ x: e.x + 0.25, z: e.z + 0.25, xp: 0, r: 0.2, life: 18, pop: 0.25, letter: 'H', kind: 'heal' });
      return;
    }
    // Rare magnet disc — same util effect as magnet card; XP/heal amounts unchanged.
    if (this.rng() < (MAGNET_DROP_CHANCE || 0.025)) {
      this.gems.push({
        x: e.x + 0.15, z: e.z - 0.15, xp: 0, r: 0.22, life: 20, pop: 0.28,
        letter: 'M', kind: 'magnet',
      });
      return;
    }
    for (const c of cratesFor(e.xp)) {
      this.gems.push({ x: e.x, z: e.z, xp: c.xp, r: 0.18, life: 18, pop: 0.25, letter: c.letter, kind: 'xp' });
    }
  }

  weaponIcon() {
    const owned = Object.keys(this.taken || {}).filter((id) => WEAPON_IDS.includes(id));
    if (!owned.length) return 'dmg';
    return owned[Math.floor(this.rng() * owned.length)];
  }


  /**
   * Additive positioning / clear-efficiency bonuses (SCORE_POS).
   * Base score path above is unchanged. Totals feed over-screen only — no mid-run toast.
   */
  _awardScorePos(_e) {
    const cfg = typeof SCORE_POS !== 'undefined' && SCORE_POS ? SCORE_POS : null;
    if (!cfg) return;
    const moveWin = cfg.moveWindowSec != null ? cfg.moveWindowSec : 0.5;
    const moveBonus = Math.max(0, cfg.moveBonus | 0);
    const safeBonus = Math.max(0, cfg.safeBonus | 0);
    const paceWin = cfg.paceWindowSec != null ? cfg.paceWindowSec : 2.5;
    const paceMin = Math.max(1, cfg.paceMinKills | 0);
    const paceBonus = Math.max(0, cfg.paceBonus | 0);
    const paceCap = Math.max(0, cfg.paceCapPerKill != null ? (cfg.paceCapPerKill | 0) : paceBonus);

    // 1) Move: killed while recently moving
    if (moveBonus > 0 && (this.t - (this._lastMovedAt || -999)) <= moveWin) {
      this.score += moveBonus;
      this.scoreMove = (this.scoreMove || 0) + moveBonus;
    }

    // 2) Safe-zone: pressure active and player inside safeR
    if (safeBonus > 0 && this.zonePressureActive) {
      const dist = Math.hypot(this.px || 0, this.pz || 0);
      const r = this.safeR != null ? this.safeR : 0;
      if (dist <= r) {
        this.score += safeBonus;
        this.scoreSafe = (this.scoreSafe || 0) + safeBonus;
      }
    }

    // 3) Pace: ≥N kills in rolling window → small flat (hard-capped per kill)
    if (paceBonus > 0 && paceWin > 0) {
      if (!this._recentKillTs) this._recentKillTs = [];
      this._recentKillTs.push(this.t);
      const cutoff = this.t - paceWin;
      while (this._recentKillTs.length && this._recentKillTs[0] < cutoff) this._recentKillTs.shift();
      if (this._recentKillTs.length >= paceMin) {
        const add = Math.min(paceBonus, paceCap);
        if (add > 0) {
          this.score += add;
          this.scorePace = (this.scorePace || 0) + add;
        }
      }
    }
  }

  _kill(e, i, events) {
    this.enemies.splice(i, 1);
    this.kills++;
    if (this.kills >= this.goalKills) {
      this.goalsCleared++;
      this.score += 250 * this.goalsCleared;
      this.goalKills += 40 + this.goalsCleared * 10;
    }
    this.score += e.score + Math.floor(this.t);
    this._awardScorePos(e);
    this._dropGem(e);
    if ((e.kind === 'chief' || e.kind === 'mech' || e.elite || e.boss) && this.rng() < ((e.elite || e.boss) ? 1 : 0.35)) {
      const w = this.weaponIcon();
      this.gems.push({
        x: e.x, z: e.z, xp: 0, r: 0.22, life: 22, pop: 0.3, letter: 'W', kind: 'weapon',
        weapon: w, weaponIcon: WEAPON_ICONS[w] || '⚡',
      });
    }
    // Elite payoff: bonus XP crates + choice of 2 cards (BEATS-PLAN simplified)
    if (e.elite && !e.boss) {
      for (let k = 0; k < 3; k++) {
        const ang = this.rng() * Math.PI * 2;
        const d = 0.4 + this.rng() * 0.6;
        this.gems.push({
          x: e.x + Math.cos(ang) * d, z: e.z + Math.sin(ang) * d,
          xp: 4, r: 0.24, life: 24, pop: 0.35, letter: 'X', kind: 'xp',
        });
      }
      if (!this.taken) this.taken = {};
      this.pendingCards = pickCards(this.rng, 2, this.taken);
      this.pausedForLevel = true;
      if (events) events.push({ type: 'levelup', cards: this.pendingCards, from: 'elite' });
    }
    // Boss payoff: score bonus 5000×(1+t/60) + choice of 3 cards (BEATS-PLAN §3)
    if (e.boss) {
      const bonus = Math.floor(BOSS.scoreBonusBase * (1 + this.t / 60));
      this.score += bonus;
      for (let k = 0; k < 5; k++) {
        const ang = this.rng() * Math.PI * 2;
        const d = 0.5 + this.rng() * 0.8;
        this.gems.push({
          x: e.x + Math.cos(ang) * d, z: e.z + Math.sin(ang) * d,
          xp: 6, r: 0.26, life: 26, pop: 0.4, letter: 'X', kind: 'xp',
        });
      }
      if (!this.taken) this.taken = {};
      this.pendingCards = pickCards(this.rng, BOSS.cardChoices, this.taken);
      this.pausedForLevel = true;
      if (events) {
        events.push({ type: 'bossKill', bonus, cards: this.pendingCards });
        events.push({ type: 'levelup', cards: this.pendingCards, from: 'boss', bonus });
      }
    }
  }


  /** v0.9.53: blackhole pull fields + attack drones DPS + orbit decay. */
  _tickWeaponFields(dt, events) {
    if (this._pullFields && this._pullFields.length) {
      for (let i = this._pullFields.length - 1; i >= 0; i--) {
        const f = this._pullFields[i];
        f.life -= dt;
        for (const e of this.enemies) {
          const dx = f.x - e.x, dz = f.z - e.z;
          const d = Math.hypot(dx, dz) || 0.001;
          if (d > f.r + e.r) continue;
          const pull = (f.pull || 8) * dt * (1 - d / (f.r + 0.01));
          e.x += (dx / d) * pull;
          e.z += (dz / d) * pull;
          const dead = this._applyEnemyDamage(e, (f.dmg || 1) * dt, f.x, f.z, events, { hitTime: 0.05, pushHit: false });
          if (dead) {
            const j = this.enemies.indexOf(e);
            if (j >= 0) { this._kill(e, j, events); events.push({ type: 'kill', enemy: e, gore: true }); }
          }
        }
        if (f.life <= 0) this._pullFields.splice(i, 1);
      }
    }
    if (this._drones && this._drones.length) {
      for (let i = this._drones.length - 1; i >= 0; i--) {
        const d = this._drones[i];
        d.life -= dt;
        d.cd = (d.cd || 0) - dt;
        if (d.cd <= 0) {
          d.cd = 0.45;
          const targets = this._targetsForWeapon(1, this.fireRange);
          if (targets.length) {
            const e = targets[0];
            const dead = this._applyEnemyDamage(e, d.dmg || 0.7, this.px, this.pz, events, { hitTime: 0.08 });
            events.push({ type: 'hit', x: e.x, z: e.z, color: e.color, kind: e.kind, dmg: d.dmg, id: e.id });
            if (dead) {
              const j = this.enemies.indexOf(e);
              if (j >= 0) { this._kill(e, j, events); events.push({ type: 'kill', enemy: e, gore: false }); }
            }
          }
        }
        if (d.life <= 0) {
          this._drones.splice(i, 1);
          this.orbits = Math.max(0, (this.orbits || 0) - 1);
        }
      }
    }
  }

  _tickWeapons(dt, events) {
    let fired = false;
    // v0.9.53: primary auto OR active secondary (resource) OR throw-on-request.
    const jamMul = (this.jamT > 0 && this.jamFireMul > 1) ? this.jamFireMul : 1;
    this._regenSecondary(dt);
    if (this.throwCdT) {
      for (const k of Object.keys(this.throwCdT)) {
        this.throwCdT[k] = Math.max(0, this.throwCdT[k] - dt);
      }
    }

    if (this._throwRequest) {
      const tid = this._throwRequest;
      this._throwRequest = null;
      if (this._slotArmed(tid) && this._fireThrow(tid, events)) {
        const def = weaponDef(tid);
        const cd = (def && def.base && def.base.cd) || 1.7;
        if (!this.throwCdT) this.throwCdT = Object.create(null);
        this.throwCdT[tid] = cd * jamMul;
        this.muzzle = 0.14; this.aimHold = 0.48;
        fired = true;
      }
    }

    if (this.fireMode === 'secondary') {
      const sid = this.activeSecondaryId();
      const def = weaponDef(sid);
      if (!sid || !this._slotArmed(sid) || !def) {
        this.fireMode = 'primary';
      } else {
        const res = this.weaponResources[sid] || initialResource(sid);
        this.weaponResources[sid] = res;
        if (!res || res.current <= 0) {
          this.fireMode = 'primary';
        } else {
          const stacks = Math.max((this.taken && this.taken[sid]) || 0, this[sid] || 0, 1);
          if (this._tickSecondary(sid, def.behavior || 'shotgun', stacks, events, jamMul, dt)) {
            fired = true;
          }
        }
      }
    }

    if (this.fireMode === 'primary') {
      if (this._tickPrimary(dt, events, jamMul)) fired = true;
    }
    return fired;
  }

  _tickPrimary(dt, events, jamMul) {
    const nid = this.activePrimaryId();
    if (!this._slotArmed(nid) && nid !== 'gatling') {
      if (!this.loadout) this.loadout = starterLoadout();
      if (!this.loadout.primary[0]) this.loadout.primary[0] = 'gatling';
      this._syncSlotsFromLoadout();
    }
    const def = weaponDef(nid);
    const behavior = (def && def.behavior) || 'mg';
    const base = (def && def.base) || {};

    // gatling: laser-feel flying bolts + deep branch kits
    if (behavior === 'mg') {
      this.fireT -= dt;
      if (this.fireT > 0) return false;
      const mods = this._weaponMods(nid);
      const fired = this._fireMg(events, {
        weaponTag: 'gatling', laserFeel: true,
        dmgMul: mods.dmgMul, pierceAdd: mods.pierceAdd,
        boltCount: mods.boltCount || 1, spreadRad: mods.spreadRad || 0,
      });
      if (fired) {
        let cd = (base.cd || this.fireCd || 0.1) * jamMul * (mods.cdMul || 1);
        if (mods.overheat) {
          this._gatlingHeat = Math.min(1.35, (this._gatlingHeat || 0) + 0.085);
          if (this._gatlingHeat >= 1) {
            cd *= 2.4; // brief overheat stutter
            this._gatlingHeat = 0.15;
            events.push({ type: 'overheat', weapon: 'gatling' });
          }
        } else {
          this._gatlingHeat = Math.max(0, (this._gatlingHeat || 0) - 0.02);
        }
        this.fireT = cd;
        this.muzzle = 0.08; this.aimHold = 0.42;
        return true;
      }
      this.fireT = 0.05;
      return false;
    }

    // vulcan: minigun spray with spin-up + branch kits
    if (behavior === 'vulcan' || behavior === 'mg_fast') {
      if ((this.vulcan || 0) < 1 && nid === 'vulcan') this.vulcan = Math.max(this.vulcan || 0, 1);
      this._vulcanSpin = Math.min(1, (this._vulcanSpin || 0) + dt / (base.spinUp || 0.4));
      this.fireT -= dt;
      if (this.fireT > 0) return false;
      const spin = this._vulcanSpin || 0;
      const cd = Math.max(0.028, (base.cd || 0.045) * (1.55 - 0.55 * spin));
      const mods = this._weaponMods(nid);
      const pierceAdd = (mods.pierceAdd || 0) + (mods.fortressPierce || 0);
      const fired = this._fireMg(events, {
        weaponTag: 'vulcan', range: base.range || 10,
        dmgMul: 0.7 * (mods.dmgMul || 1), pierceAdd,
        boltCount: mods.boltCount || 1,
        spreadRad: mods.spreadRad || 0,
        burn: mods.burn || 0, burnDur: mods.burnDur || 0,
      });
      if (fired) {
        this.fireT = cd * jamMul * (mods.cdMul || 1);
        this.muzzle = 0.06; this.aimHold = 0.35;
        if ((mods.fortressMoveMul || 1) < 1) {
          this._fortressT = 0.22;
          this._fortressMoveMul = mods.fortressMoveMul;
        }
        return true;
      }
      this.fireT = 0.04;
      return false;
    }

    // ion_beam: charge → fire → charge (+ focus / chain / slit kits)
    if (behavior === 'ion_charge' || behavior === 'laser') {
      const stacks = Math.max(this.laser || 0, this.ion_beam || 0, 1);
      if ((this.laser || 0) < 1 && (this.ion_beam || 0) < 1) this.laser = 1;
      const mods = this._weaponMods(nid);
      if (this._ionPhase == null) this._ionPhase = 'charge';
      if (this._ionPhase === 'charge') {
        this._ionChargeT = (this._ionChargeT || 0) + dt;
        const need = Math.max(0.18, ((base.charge || 0.55) * (mods.chargeMul || 1)) - stacks * 0.04);
        if (this._ionChargeT < need * jamMul) return false;
        this._ionChargeT = 0;
        this._ionPhase = 'fire';
      }
      if (this._ionPhase === 'fire') {
        const base2 = {
          ...base,
          hit: (base.hit || 3.6) * (mods.dmgMul || 1),
          pierce: (base.pierce || 0) + (mods.pierceAdd || 0),
          chainJumps: mods.chainJumps || 0,
          chainRange: mods.chainRange || 0,
          slit: !!mods.slit,
        };
        if (this._fireIonBeam(events, stacks, base2)) {
          this.muzzle = 0.18; this.aimHold = 0.55;
          this._ionPhase = 'charge';
          this.laserT = (base.cd || 0.12) * jamMul * (mods.cdMul || 1);
          return true;
        }
        return false;
      }
      return false;
    }

    // zero_laser: discrete chill bolts + chill/frost/shield kits
    if (behavior === 'zero_bolts' || behavior === 'laser_chill') {
      const stacks = Math.max(this.zero_laser || 0, this.laser || 0, 1);
      if ((this.zero_laser || 0) < 1) this.zero_laser = 1;
      this.laserT -= dt;
      if (this.laserT > 0) return false;
      const mods = this._weaponMods(nid);
      const base2 = {
        ...base,
        hit: (base.hit || 1.5) * (mods.dmgMul || 1),
        chillMul: mods.chillMul || 1,
        frostBurstR: mods.frostBurstR || 0,
        frostBurstDmg: (mods.frostBurstDmg || 0) * (mods.dmgMul || 1),
        pierceAdd: mods.pierceAdd || 0,
      };
      if (this._fireZeroBolt(events, stacks, base2)) {
        this.laserT = Math.max(0.16, (base.cd || 0.28) - stacks * 0.02) * jamMul * (mods.cdMul || 1);
        this.muzzle = 0.1; this.aimHold = 0.45;
        this._refreshBranchShield(mods);
        return true;
      }
      return false;
    }

    // tracking_bomb: track → stick → explode (+ triple / mine / drone kits)
    if (behavior === 'track_stick' || behavior === 'rocket') {
      const stacks = Math.max(this.rocket || 0, this.tracking_bomb || 0, 1);
      if ((this.rocket || 0) < 1 && (this.tracking_bomb || 0) < 1) this.rocket = 1;
      this.rocketT -= dt;
      if (this.rocketT > 0) return false;
      const mods = this._weaponMods(nid);
      const base2 = {
        ...base,
        dmgMul: mods.dmgMul || 1,
        aoeMul: mods.aoeMul || 1,
        warheads: mods.warheads || 1,
        stickMul: mods.stickMul || 1,
        homingMul: mods.homingMul || 1,
        seekSpeedMul: mods.seekSpeedMul || 1,
      };
      if (this._fireTrackingBomb(events, stacks, base2)) {
        this.rocketT = Math.max(0.7, (base.cd || 1.5) - stacks * 0.12) * jamMul * (mods.cdMul || 1);
        this.muzzle = 0.16; this.aimHold = 0.48;
        return true;
      }
      return false;
    }

    this.fireT -= dt;
    if (this.fireT > 0) return false;
    if (this._fireMg(events)) {
      this.fireT = 0.14 * jamMul;
      this.muzzle = 0.08; this.aimHold = 0.35;
      return true;
    }
    this.fireT = 0.05;
    return false;
  }

  _tickSecondary(sid, behavior, stacks, events, jamMul, dt) {
    const def = weaponDef(sid);
    const base = (def && def.base) || {};
    const mods = this._weaponMods(sid);

    if (behavior === 'shotgun') {
      if ((this.shotgun || 0) < 1) this.shotgun = 1;
      this.shotgunT -= dt;
      if (this.shotgunT > 0) return false;
      const pellets = Math.max(1, (base.pellets || 10) + (mods.pelletsAdd || 0));
      if (this._fireShotgun(events, {
        heavy: true, pellets, range: base.range || 7,
        spreadAdd: mods.spreadRad || 0, dmgMul: mods.dmgMul || 1, pierceAdd: mods.pierceAdd || 0,
      })) {
        this.shotgunT = Math.max(0.35, (base.cd || 0.7) - stacks * 0.08) * jamMul * (mods.cdMul || 1);
        this.muzzle = 0.14; this.aimHold = 0.48;
        this._consumeSecondary(sid, 1);
        return true;
      }
      return false;
    }

    // acid: 10 continuous dissolving shots
    if (behavior === 'acid_stream' || behavior === 'plasma') {
      if ((this.plasma || 0) < 1 && (this.acid_gun || 0) < 1) this.plasma = 1;
      this.plasmaT -= dt;
      if (this.plasmaT > 0) return false;
      const base2 = {
        ...base,
        hit: (base.hit || 0.85) * (mods.dmgMul || 1),
        dissolve: (base.dissolve || 1.4) * (mods.dissolveMul || 1) * (mods.aoeMul || 1),
      };
      if (this._fireAcidStream(events, stacks, base2)) {
        this.plasmaT = Math.max(0.08, (base.cd || 0.12) - stacks * 0.01) * jamMul * (mods.cdMul || 1);
        this.muzzle = 0.1; this.aimHold = 0.4;
        this._consumeSecondary(sid, 1);
        return true;
      }
      return false;
    }

    // slow_gun: rush → AoE stop/slow
    if (behavior === 'slow_rush' || behavior === 'slow_stub') {
      this.plasmaT -= dt;
      if (this.plasmaT > 0) return false;
      const base2 = {
        ...base,
        hit: (base.hit || 0.6) * (mods.dmgMul || 1),
        slow: (base.slow || 1.6) * (mods.slowMul || 1),
        aoe: (base.aoe || 2.4) * (mods.aoeMul || 1),
      };
      if (this._fireSlowRush(events, stacks, base2)) {
        this.plasmaT = Math.max(0.6, (base.cd || 1.1) - stacks * 0.08) * jamMul * (mods.cdMul || 1);
        this.muzzle = 0.16; this.aimHold = 0.5;
        this._consumeSecondary(sid, 1);
        return true;
      }
      return false;
    }

    // attack_drone: deploy 2 drones
    if (behavior === 'deploy_drones' || behavior === 'drone_stub') {
      this.plasmaT -= dt;
      if (this.plasmaT > 0) return false;
      const base2 = {
        ...base,
        drones: (base.drones || 2) + (mods.droneAdd || 0),
        hit: (base.hit || 0.7) * (mods.dmgMul || 1),
      };
      if (this._deployAttackDrones(events, stacks, base2)) {
        this.plasmaT = Math.max(3.5, (base.cd || 5.5) - stacks * 0.4) * jamMul * (mods.cdMul || 1);
        this.muzzle = 0.12; this.aimHold = 0.4;
        this._consumeSecondary(sid, 1);
        return true;
      }
      return false;
    }

    // blackhole: AoE pull to center
    if (behavior === 'blackhole_pull' || behavior === 'blackhole_stub') {
      this.plasmaT -= dt;
      if (this.plasmaT > 0) return false;
      const base2 = {
        ...base,
        hit: (base.hit || 2.2) * (mods.dmgMul || 1),
        aoe: (base.aoe || 3.4) * (mods.aoeMul || 1),
        pull: (base.pull || 9) * (mods.pullMul || 1),
      };
      if (this._fireBlackhole(events, stacks, base2)) {
        this.plasmaT = Math.max(1.6, (base.cd || 2.6) - stacks * 0.15) * jamMul * (mods.cdMul || 1);
        this.muzzle = 0.18; this.aimHold = 0.55;
        this._consumeSecondary(sid, 1);
        return true;
      }
      return false;
    }
    return false;
  }

  _fireThrow(tid, events) {
    const def = weaponDef(tid);
    const behavior = (def && def.behavior) || 'grenade';
    const stacks = Math.max((this.taken && this.taken[tid]) || 0, this[tid] || 0, this.grenade || 0, 1);
    const base = (def && def.base) || {};
    const mods = this._weaponMods(tid);
    const base2 = {
      ...base,
      hit: (base.hit || 1) * (mods.dmgMul || 1),
      aoe: (base.aoe || 2) * (mods.aoeMul || 1),
      fuse: (base.fuse || 0.5) * (mods.fuseMul || 1),
      shards: (base.shards || 0) + (mods.shardsAdd || 0),
      slow: (base.slow || 1) * (mods.slowMul || 1),
      stun: (base.stun || 0.9) * (mods.stunMul || 1),
      pull: (base.pull || 11) * (mods.pullMul || 1),
    };
    if ((this.grenade || 0) < 1 && (this.frag || 0) < 1) this.grenade = 1;
    if (behavior === 'grenade' || tid === 'frag') return this._fireGrenade(events, { ...base2, weaponTag: 'frag' });
    if (behavior === 'chill_field' || tid === 'chill') return this._fireChillBomb(events, stacks, base2);
    if (behavior === 'flashbang' || tid === 'flash') return this._fireFlashbang(events, stacks, base2);
    if (behavior === 'gravity_pull' || tid === 'gravity') return this._fireGravityBomb(events, stacks, base2);
    return this._fireGrenade(events);
  }



  /**
   * Incoming damage multiplier.
   * Shield Guard rule (PHASE3-ENEMY-SHIELD-001): if attack travel dir (src→enemy)
   * dots facing ≥ frontConeDot (~120° front), apply (1 - frontMitigation);
   * flank/rear (dot below threshold) take full damage. Other enemies keep flat e.shield.
   */
  _enemyIncomingMul(e, srcX, srcZ) {
    if (e.shieldGuard || e.kind === 'shield' || e.type === 'shield') {
      const cfg = SHIELD_GUARD;
      let fdx = e.faceDx, fdz = e.faceDz;
      if (fdx == null || fdz == null || (Math.abs(fdx) + Math.abs(fdz)) < 1e-6) {
        fdx = this.px - e.x;
        fdz = this.pz - e.z;
      }
      const fl = Math.hypot(fdx, fdz) || 1;
      fdx /= fl; fdz /= fl;
      // Front if shield faces the damage source (face · dirToSrc >= cone).
      let ax = (srcX != null ? srcX : this.px) - e.x;
      let az = (srcZ != null ? srcZ : this.pz) - e.z;
      const al = Math.hypot(ax, az) || 1;
      ax /= al; az /= al;
      const dot = ax * fdx + az * fdz;
      if (dot >= (cfg.frontConeDot ?? 0.5)) {
        return 1 - (cfg.frontMitigation ?? 0.85);
      }
      return 1;
    }
    return 1 - (e.shield || 0);
  }

  /** Apply damage to enemy with directional / flat mitigation. Returns true if killed. */
  _applyEnemyDamage(e, dmg, srcX, srcZ, events, opts = {}) {
    const mul = this._enemyIncomingMul(e, srcX, srcZ);
    const applied = dmg * mul;
    e.hp -= applied;
    e.hit = opts.hitTime != null ? opts.hitTime : 0.12;
    if (opts.pushHit) {
      events.push({
        type: 'hit', x: e.x, z: e.z, color: e.color, kind: e.kind,
        heavy: !!opts.heavy, frontBlock: mul < 0.5, dmg: applied, id: e.id,
      });
    }
    return e.hp <= 0;
  }

  /**
   * Shield Guard AI: slow chase, prefer face player, short red bash telegraph → contact slam.
   * Frontal defense handled in _enemyIncomingMul (not here).
   */
  _tickShield(e, dt, events) {
    const cfg = SHIELD_GUARD;
    if (e.hit > 0) e.hit -= dt;
    if (e.slow > 0) e.slow -= dt;
    const slowMul = e.slow > 0 ? Math.max(0.35, 1 - Math.min(0.55, 0.4)) : 1;
    const dx = this.px - e.x, dz = this.pz - e.z;
    const dist = Math.hypot(dx, dz) || 1;
    const ndx = dx / dist, ndz = dz / dist;

    // Prefer face player (smooth turn)
    let fdx = e.faceDx != null ? e.faceDx : ndx;
    let fdz = e.faceDz != null ? e.faceDz : ndz;
    const fl0 = Math.hypot(fdx, fdz) || 1;
    fdx /= fl0; fdz /= fl0;
    const turn = Math.min(1, (cfg.faceTurnRate || 4.5) * dt);
    fdx = fdx * (1 - turn) + ndx * turn;
    fdz = fdz * (1 - turn) + ndz * turn;
    const fl = Math.hypot(fdx, fdz) || 1;
    e.faceDx = fdx / fl;
    e.faceDz = fdz / fl;
    e.aimDx = e.faceDx;
    e.aimDz = e.faceDz;

    if (!e.shieldPhase) e.shieldPhase = 'chase';
    if (e.shieldPhaseT == null) e.shieldPhaseT = 0.5;

    if (e.shieldPhase === 'telegraph') {
      e.vx = 0; e.vz = 0;
      e.shieldPhaseT -= dt;
      // Lock face toward player during wind-up for readable slam cone
      e.faceDx = ndx; e.faceDz = ndz;
      e.aimDx = ndx; e.aimDz = ndz;
      if (e.shieldPhaseT <= 0) {
        let hitPlayer = false;
        if (dist < (cfg.bashRange || 1.55) + PLAYER.radius) {
          hitPlayer = true;
          if (this.invuln <= 0) {
            const taken = Math.max(1, (cfg.bashDamage || e.damage || 2) - this._effectiveArmor());
            this.hp -= taken;
            this.invuln = 0.85 + (this.deflect || 0);
            this.hitFlash = 0.32;
            events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, shieldBash: true, amount: taken });
            // shove player slightly back
            this.px += ndx * 0.35;
            this.pz += ndz * 0.35;
            if (this.hp <= 0) {
              this.alive = false;
              this.hp = 0;
              this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
              events.push({ type: 'dead' });
            }
          }
        }
        events.push({
          type: 'shieldBash',
          enemyId: e.id,
          x: e.x, z: e.z,
          aimDx: ndx, aimDz: ndz,
          hit: hitPlayer,
        });
        e.shieldPhase = 'recover';
        e.shieldPhaseT = cfg.bashCooldownSec;
        e.shotFlash = 0.16;
      }
      return;
    }

    // chase / recover: slow advance, face player
    e.shieldPhaseT -= dt;
    if (e.shotFlash > 0) e.shotFlash -= dt;
    const spd = e.speed * e.chase * slowMul;
    // During recover, move even slower
    const moveMul = e.shieldPhase === 'recover' ? 0.45 : 1;
    const stepX = ndx * spd * moveMul * dt;
    const stepZ = ndz * spd * moveMul * dt;
    e.vx = stepX / Math.max(dt, 1e-6);
    e.vz = stepZ / Math.max(dt, 1e-6);
    e.x += stepX;
    e.z += stepZ;
    const moving = Math.hypot(e.vx, e.vz) > 0.05;
    e.animPhase = (e.animPhase || 0) + (moving ? Math.max(6, Math.hypot(e.vx, e.vz) * 5.5) * dt : 0);
    const ec = this._softClamp(e.x, e.z, e.r);
    e.x = ec.x; e.z = ec.z;

    if (e.shieldPhase === 'recover') {
      if (e.shieldPhaseT <= 0) {
        e.shieldPhase = 'chase';
        e.shieldPhaseT = 0.2 + this.rng() * 0.35;
      }
    } else if (e.shieldPhase === 'chase' && e.shieldPhaseT <= 0 && dist < (cfg.bashRange || 1.55) * 1.35) {
      e.shieldPhase = 'telegraph';
      e.shieldPhaseT = cfg.bashTelegraphSec;
      e.telegraphDur = cfg.bashTelegraphSec;
      e.telegraphAt = this.t;
      e.faceDx = ndx; e.faceDz = ndz;
      e.aimDx = ndx; e.aimDz = ndz;
      events.push({
        type: 'telegraph',
        kind: 'shield',
        enemyId: e.id,
        x: e.x, z: e.z,
        aimDx: ndx, aimDz: ndz,
        duration: cfg.bashTelegraphSec,
      });
    }

    // Contact body damage (separate from bash slam)
    if (this.invuln <= 0 && Math.hypot(e.x - this.px, e.z - this.pz) < e.r + PLAYER.radius) {
      const taken = Math.max(1, (e.damage || 2) - this._effectiveArmor());
      this.hp -= taken;
      this.invuln = 0.85 + (this.deflect || 0);
      this.hitFlash = 0.28;
      events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, amount: taken });
      e.x -= ndx * 0.7;
      e.z -= ndz * 0.7;
      if (this.hp <= 0) {
        this.alive = false;
        this.hp = 0;
        this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
        events.push({ type: 'dead' });
      }
    }
  }

  /**
   * Sniper AI: prefer keep distance → red aim telegraph (≥~1s) → hitscan shot.
   * Never silent instant snipe. Damage only after telegraph completes.
   */
  _tickSniper(e, dt, events) {
    const cfg = SNIPER;
    if (e.hit > 0) e.hit -= dt;
    if (e.slow > 0) e.slow -= dt;
    const slowMul = e.slow > 0 ? Math.max(0.35, 1 - Math.min(0.55, 0.4)) : 1;
    const dx = this.px - e.x, dz = this.pz - e.z;
    const dist = Math.hypot(dx, dz) || 1;
    const ndx = dx / dist, ndz = dz / dist;

    if (!e.sniperPhase) e.sniperPhase = 'reposition';
    if (e.sniperPhaseT == null) e.sniperPhaseT = 0.5;

    if (e.sniperPhase === 'aim') {
      e.vx = 0; e.vz = 0;
      e.sniperPhaseT -= dt;
      // Mild tracking so dodge still works but the red line reads clearly
      const track = Math.min(1, dt * 1.4);
      const curLen = Math.hypot(e.aimDx || 0, e.aimDz || 0) || 1;
      let adx = (e.aimDx || ndx) / curLen;
      let adz = (e.aimDz || ndz) / curLen;
      adx = adx * (1 - track) + ndx * track;
      adz = adz * (1 - track) + ndz * track;
      const al = Math.hypot(adx, adz) || 1;
      e.aimDx = adx / al;
      e.aimDz = adz / al;
      if (e.sniperPhaseT <= 0) {
        const ax = e.aimDx, az = e.aimDz;
        const range = cfg.shotRange;
        const halfW = cfg.beamHalfWidth;
        const along = (this.px - e.x) * ax + (this.pz - e.z) * az;
        const closestX = e.x + ax * Math.max(0, Math.min(range, along));
        const closestZ = e.z + az * Math.max(0, Math.min(range, along));
        const perp = Math.hypot(this.px - closestX, this.pz - closestZ);
        let hitPlayer = false;
        if (along > 0.2 && along < range && perp < PLAYER.radius + halfW) {
          hitPlayer = true;
          if (this.invuln <= 0) {
            const taken = Math.max(1, (cfg.shotDamage || 2) - this._effectiveArmor());
            this.hp -= taken;
            this.invuln = 0.85 + (this.deflect || 0);
            this.hitFlash = 0.32;
            events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, sniper: true, amount: taken });
            if (this.hp <= 0) {
              this.alive = false;
              this.hp = 0;
              this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
              events.push({ type: 'dead' });
            }
          }
        }
        events.push({
          type: 'sniperShot',
          enemyId: e.id,
          x: e.x, z: e.z,
          aimDx: ax, aimDz: az,
          hit: hitPlayer,
          muzzleX: e.x + ax * 0.55,
          muzzleY: 1.05,
          muzzleZ: e.z + az * 0.55,
        });
        e.sniperPhase = 'cooldown';
        e.sniperPhaseT = cfg.cooldownSec;
        e.shotFlash = 0.18;
      }
      if (this.invuln <= 0 && dist < e.r + PLAYER.radius) {
        const taken = Math.max(1, (e.damage || 1) - this._effectiveArmor());
        this.hp -= taken;
        this.invuln = 0.85 + (this.deflect || 0);
        this.hitFlash = 0.28;
        events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, amount: taken });
        e.x -= ndx * 0.9;
        e.z -= ndz * 0.9;
        if (this.hp <= 0) {
          this.alive = false;
          this.hp = 0;
          this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
          events.push({ type: 'dead' });
        }
      }
      return;
    }

    e.sniperPhaseT -= dt;
    if (e.shotFlash > 0) e.shotFlash -= dt;
    let toward = 0;
    if (dist < cfg.retreatBelow) toward = -1;
    else if (dist > cfg.approachAbove) toward = 1;
    else if (dist < cfg.idealMin) toward = -0.55;
    else if (dist > cfg.idealMax) toward = 0.55;
    else toward = 0;
    const strafe = (toward === 0) ? 0.35 : 0;
    const pdx = -ndz, pdz = ndx;
    const side = (Math.sin(e.wob + this.t * 0.7) >= 0) ? 1 : -1;
    const spd = e.speed * e.chase * slowMul * (cfg.repositionSpeedMul || 0.9);
    const stepX = (ndx * toward + pdx * side * strafe) * spd * dt;
    const stepZ = (ndz * toward + pdz * side * strafe) * spd * dt;
    e.vx = stepX / Math.max(dt, 1e-6);
    e.vz = stepZ / Math.max(dt, 1e-6);
    e.x += stepX;
    e.z += stepZ;
    const moving = Math.hypot(e.vx, e.vz) > 0.05;
    e.animPhase = (e.animPhase || 0) + (moving ? Math.max(8, Math.hypot(e.vx, e.vz) * 6.5) * dt : 0);
    const ec = this._softClamp(e.x, e.z, e.r);
    e.x = ec.x; e.z = ec.z;

    const inBand = dist >= cfg.idealMin * 0.85 && dist <= cfg.idealMax * 1.15;
    if (e.sniperPhase === 'cooldown') {
      if (e.sniperPhaseT <= 0) {
        e.sniperPhase = 'reposition';
        e.sniperPhaseT = 0.25 + this.rng() * 0.4;
      }
    } else if (e.sniperPhase === 'reposition' && e.sniperPhaseT <= 0 && (inBand || dist < cfg.approachAbove)) {
      e.sniperPhase = 'aim';
      e.sniperPhaseT = cfg.telegraphSec;
      e.telegraphDur = cfg.telegraphSec;
      e.telegraphAt = this.t;
      e.aimDx = ndx;
      e.aimDz = ndz;
      events.push({
        type: 'telegraph',
        kind: 'sniper',
        enemyId: e.id,
        x: e.x, z: e.z,
        aimDx: ndx, aimDz: ndz,
        duration: cfg.telegraphSec,
      });
    }

    if (this.invuln <= 0 && Math.hypot(e.x - this.px, e.z - this.pz) < e.r + PLAYER.radius) {
      const taken = Math.max(1, (e.damage || 1) - this._effectiveArmor());
      this.hp -= taken;
      this.invuln = 0.85 + (this.deflect || 0);
      this.hitFlash = 0.28;
      events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, amount: taken });
      e.x -= ndx * 0.9;
      e.z -= ndz * 0.9;
      if (this.hp <= 0) {
        this.alive = false;
        this.hp = 0;
        this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
        events.push({ type: 'dead' });
      }
    }
  }


  /**
   * Heavy Artillery AI: slow/stationary-ish → orange blast telegraph (≥~1s) → AoE impact.
   * Aim zone = predicted player area (lead). Never silent — damage only after telegraph.
   * Orange = blast radius (distinct from sniper/shield red contact).
   */
  _tickArtillery(e, dt, events) {
    const cfg = ARTILLERY;
    if (e.hit > 0) e.hit -= dt;
    if (e.slow > 0) e.slow -= dt;
    const slowMul = e.slow > 0 ? Math.max(0.35, 1 - Math.min(0.55, 0.4)) : 1;
    const dx = this.px - e.x, dz = this.pz - e.z;
    const dist = Math.hypot(dx, dz) || 1;
    const ndx = dx / dist, ndz = dz / dist;

    if (!e.artilleryPhase) e.artilleryPhase = 'reposition';
    if (e.artilleryPhaseT == null) e.artilleryPhaseT = 0.5;

    if (e.artilleryPhase === 'telegraph') {
      e.vx = 0; e.vz = 0;
      e.artilleryPhaseT -= dt;
      // Mild retarget so dodge still works but orange ring stays readable
      const lead = cfg.leadSec || 0.55;
      const pvx = (this.vx || 0) * (this.speed || 0);
      const pvz = (this.vz || 0) * (this.speed || 0);
      const predX = this.px + pvx * lead;
      const predZ = this.pz + pvz * lead;
      const track = Math.min(1, dt * 0.9);
      e.aimX = (e.aimX != null ? e.aimX : predX) * (1 - track) + predX * track;
      e.aimZ = (e.aimZ != null ? e.aimZ : predZ) * (1 - track) + predZ * track;
      // Face toward blast aim
      const adx = e.aimX - e.x, adz = e.aimZ - e.z;
      const al = Math.hypot(adx, adz) || 1;
      e.aimDx = adx / al;
      e.aimDz = adz / al;
      e.faceDx = e.aimDx;
      e.faceDz = e.aimDz;
      if (e.artilleryPhaseT <= 0) {
        const blastR = cfg.blastRadius || 2.4;
        const ax = e.aimX, az = e.aimZ;
        const toPlayer = Math.hypot(this.px - ax, this.pz - az);
        let hitPlayer = false;
        if (toPlayer < blastR + PLAYER.radius) {
          hitPlayer = true;
          if (this.invuln <= 0) {
            const taken = Math.max(1, (cfg.blastDamage || 2) - this._effectiveArmor());
            this.hp -= taken;
            this.invuln = 0.85 + (this.deflect || 0);
            this.hitFlash = 0.35;
            events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, artillery: true, amount: taken });
            if (this.hp <= 0) {
              this.alive = false;
              this.hp = 0;
              this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
              events.push({ type: 'dead' });
            }
          }
        }
        events.push({
          type: 'artilleryImpact',
          enemyId: e.id,
          x: ax, z: az,
          radius: blastR,
          hit: hitPlayer,
          fromX: e.x, fromZ: e.z,
        });
        e.artilleryPhase = 'cooldown';
        e.artilleryPhaseT = cfg.cooldownSec;
        e.shotFlash = 0.22;
      }
      // Contact body damage while planted
      if (this.invuln <= 0 && dist < e.r + PLAYER.radius) {
        const taken = Math.max(1, (e.damage || 2) - this._effectiveArmor());
        this.hp -= taken;
        this.invuln = 0.85 + (this.deflect || 0);
        this.hitFlash = 0.28;
        events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, amount: taken });
        e.x -= ndx * 0.7;
        e.z -= ndz * 0.7;
        if (this.hp <= 0) {
          this.alive = false;
          this.hp = 0;
          this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
          events.push({ type: 'dead' });
        }
      }
      return;
    }

    e.artilleryPhaseT -= dt;
    if (e.shotFlash > 0) e.shotFlash -= dt;
    // Slow reposition toward ideal band (stationary-ish)
    let toward = 0;
    if (dist < cfg.retreatBelow) toward = -1;
    else if (dist > cfg.approachAbove) toward = 1;
    else if (dist < cfg.idealMin) toward = -0.4;
    else if (dist > cfg.idealMax) toward = 0.4;
    else toward = 0;
    const spd = e.speed * e.chase * slowMul * (cfg.repositionSpeedMul || 0.55);
    const stepX = ndx * toward * spd * dt;
    const stepZ = ndz * toward * spd * dt;
    e.vx = stepX / Math.max(dt, 1e-6);
    e.vz = stepZ / Math.max(dt, 1e-6);
    e.x += stepX;
    e.z += stepZ;
    const moving = Math.hypot(e.vx, e.vz) > 0.05;
    e.animPhase = (e.animPhase || 0) + (moving ? Math.max(6, Math.hypot(e.vx, e.vz) * 5) * dt : 0);
    const ec = this._softClamp(e.x, e.z, e.r);
    e.x = ec.x; e.z = ec.z;
    e.faceDx = ndx;
    e.faceDz = ndz;
    e.aimDx = ndx;
    e.aimDz = ndz;

    const inBand = dist >= cfg.idealMin * 0.8 && dist <= cfg.idealMax * 1.2;
    if (e.artilleryPhase === 'cooldown') {
      if (e.artilleryPhaseT <= 0) {
        e.artilleryPhase = 'reposition';
        e.artilleryPhaseT = 0.35 + this.rng() * 0.5;
      }
    } else if (e.artilleryPhase === 'reposition' && e.artilleryPhaseT <= 0 && (inBand || dist < cfg.approachAbove)) {
      e.artilleryPhase = 'telegraph';
      e.artilleryPhaseT = cfg.telegraphSec;
      e.telegraphDur = cfg.telegraphSec;
      e.telegraphAt = this.t;
      e.blastRadius = cfg.blastRadius;
      const lead = cfg.leadSec || 0.55;
      const pvx = (this.vx || 0) * (this.speed || 0);
      const pvz = (this.vz || 0) * (this.speed || 0);
      e.aimX = this.px + pvx * lead;
      e.aimZ = this.pz + pvz * lead;
      const adx = e.aimX - e.x, adz = e.aimZ - e.z;
      const al = Math.hypot(adx, adz) || 1;
      e.aimDx = adx / al;
      e.aimDz = adz / al;
      events.push({
        type: 'telegraph',
        kind: 'artillery',
        enemyId: e.id,
        x: e.aimX, z: e.aimZ,
        radius: cfg.blastRadius,
        fromX: e.x, fromZ: e.z,
        duration: cfg.telegraphSec,
      });
    }

    if (this.invuln <= 0 && Math.hypot(e.x - this.px, e.z - this.pz) < e.r + PLAYER.radius) {
      const taken = Math.max(1, (e.damage || 2) - this._effectiveArmor());
      this.hp -= taken;
      this.invuln = 0.85 + (this.deflect || 0);
      this.hitFlash = 0.28;
      events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, amount: taken });
      e.x -= ndx * 0.7;
      e.z -= ndz * 0.7;
      if (this.hp <= 0) {
        this.alive = false;
        this.hp = 0;
        this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
        events.push({ type: 'dead' });
      }
    }
  }

  /**
   * Suicide Bomber AI: chase → red self-blast telegraph (≥0.9s) → AoE detonate (self dies).
   * Blast ring under bomber (not artillery aim-zone). No damage during telegraph.
   * Killed mid-chase / mid-telegraph → no explode (fairness).
   */
  _tickBomber(e, dt, events) {
    const cfg = BOMBER;
    if (e.hit > 0) e.hit -= dt;
    if (e.slow > 0) e.slow -= dt;
    const slowMul = e.slow > 0 ? Math.max(0.35, 1 - Math.min(0.55, 0.4)) : 1;
    const dx = this.px - e.x, dz = this.pz - e.z;
    const dist = Math.hypot(dx, dz) || 1;
    const ndx = dx / dist, ndz = dz / dist;

    if (!e.bomberPhase) e.bomberPhase = 'chase';
    if (e.bomberPhaseT == null) e.bomberPhaseT = 0;

    e.faceDx = ndx;
    e.faceDz = ndz;
    e.aimDx = ndx;
    e.aimDz = ndz;

    if (e.bomberPhase === 'telegraph') {
      // Slow/stop; blast ring stays under self; no damage yet
      const tMul = cfg.telegraphSpeedMul != null ? cfg.telegraphSpeedMul : 0.12;
      const spd = e.speed * e.chase * slowMul * tMul;
      const stepX = ndx * spd * dt;
      const stepZ = ndz * spd * dt;
      e.vx = stepX / Math.max(dt, 1e-6);
      e.vz = stepZ / Math.max(dt, 1e-6);
      e.x += stepX;
      e.z += stepZ;
      const ec = this._softClamp(e.x, e.z, e.r);
      e.x = ec.x; e.z = ec.z;
      e.aimX = e.x;
      e.aimZ = e.z;
      e.blastRadius = cfg.blastRadius;
      e.bomberPhaseT -= dt;
      e.animPhase = (e.animPhase || 0) + 14 * dt; // frantic charge blink

      if (e.bomberPhaseT <= 0) {
        const blastR = cfg.blastRadius || 2.2;
        const ax = e.x, az = e.z;
        const toPlayer = Math.hypot(this.px - ax, this.pz - az);
        let hitPlayer = false;
        if (toPlayer < blastR + PLAYER.radius) {
          hitPlayer = true;
          if (this.invuln <= 0) {
            const taken = Math.max(1, (cfg.blastDamage || 3) - this._effectiveArmor());
            this.hp -= taken;
            this.invuln = 0.85 + (this.deflect || 0);
            this.hitFlash = 0.4;
            events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, bomber: true, amount: taken });
            if (this.hp <= 0) {
              this.alive = false;
              this.hp = 0;
              this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
              events.push({ type: 'dead' });
            }
          }
        }
        events.push({
          type: 'bomberDetonate',
          enemyId: e.id,
          x: ax, z: az,
          radius: blastR,
          hit: hitPlayer,
        });
        // Self-destruct after loop (avoid splice mid for-of). No second post-death AoE.
        e.hp = 0;
        e.bomberDetonated = true;
      }
      return;
    }

    // Chase toward player (above-soldier speed from ENEMIES.bomber.speed)
    const spd = e.speed * e.chase * slowMul * (cfg.chaseSpeedMul != null ? cfg.chaseSpeedMul : 1);
    const stepX = ndx * spd * dt;
    const stepZ = ndz * spd * dt;
    e.vx = stepX / Math.max(dt, 1e-6);
    e.vz = stepZ / Math.max(dt, 1e-6);
    e.x += stepX;
    e.z += stepZ;
    const moving = Math.hypot(e.vx, e.vz) > 0.05;
    e.animPhase = (e.animPhase || 0) + (moving ? Math.max(10, Math.hypot(e.vx, e.vz) * 7) * dt : 0);
    const ec = this._softClamp(e.x, e.z, e.r);
    e.x = ec.x; e.z = ec.z;

    const fuseMin = cfg.fuseMin != null ? cfg.fuseMin : 2.2;
    const fuseMax = cfg.fuseMax != null ? cfg.fuseMax : 3.2;
    const afterChase = Math.hypot(e.x - this.px, e.z - this.pz);
    if (afterChase <= fuseMax) {
      // Enter telegraph once inside fuse band (prefer fuseMin–fuseMax; allow closer too)
      e.bomberPhase = 'telegraph';
      e.bomberPhaseT = cfg.telegraphSec;
      e.telegraphDur = cfg.telegraphSec;
      e.telegraphAt = this.t;
      e.blastRadius = cfg.blastRadius;
      e.aimX = e.x;
      e.aimZ = e.z;
      events.push({
        type: 'telegraph',
        kind: 'bomber',
        enemyId: e.id,
        x: e.x, z: e.z,
        radius: cfg.blastRadius,
        duration: cfg.telegraphSec,
      });
      return;
    }

    // Ordinary contact while chasing (not blast) — same as grunt; telegraph path skips this
    if (this.invuln <= 0 && afterChase < e.r + PLAYER.radius) {
      const taken = Math.max(1, (e.damage || 1) - this._effectiveArmor());
      this.hp -= taken;
      this.invuln = 0.85 + (this.deflect || 0);
      this.hitFlash = 0.28;
      events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, amount: taken });
      e.x -= ndx * 0.55;
      e.z -= ndz * 0.55;
      if (this.hp <= 0) {
        this.alive = false;
        this.hp = 0;
        this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
        events.push({ type: 'dead' });
      }
    }
  }


  /**
   * Flanker AI: arc/flank approach → cyan/danger dash telegraph (≥0.85s) → dash contact → recover → re-angle.
   * No damage during telegraph. Killed mid-telegraph = no dash (never reaches dash phase).
   */
  _tickFlanker(e, dt, events) {
    const cfg = FLANKER;
    if (e.hit > 0) e.hit -= dt;
    if (e.slow > 0) e.slow -= dt;
    const slowMul = e.slow > 0 ? Math.max(0.35, 1 - Math.min(0.55, 0.4)) : 1;
    const dx = this.px - e.x, dz = this.pz - e.z;
    const dist = Math.hypot(dx, dz) || 1;
    const ndx = dx / dist, ndz = dz / dist;

    if (!e.flankerPhase) e.flankerPhase = 'flank';
    if (e.flankerPhaseT == null) e.flankerPhaseT = 0.4;
    if (e.flankSide == null) e.flankSide = (this.rng() < 0.5 ? -1 : 1);

    // ---- telegraph: nearly stop; lock dash aim; no damage ----
    if (e.flankerPhase === 'telegraph') {
      const tMul = cfg.telegraphSpeedMul != null ? cfg.telegraphSpeedMul : 0.08;
      const spd = e.speed * e.chase * slowMul * tMul;
      const stepX = ndx * spd * dt;
      const stepZ = ndz * spd * dt;
      e.vx = stepX / Math.max(dt, 1e-6);
      e.vz = stepZ / Math.max(dt, 1e-6);
      e.x += stepX;
      e.z += stepZ;
      const ec = this._softClamp(e.x, e.z, e.r);
      e.x = ec.x; e.z = ec.z;
      // Mild aim track so dodge reads, but wedge stays readable
      const track = Math.min(1, dt * 1.2);
      let adx = e.aimDx != null ? e.aimDx : ndx;
      let adz = e.aimDz != null ? e.aimDz : ndz;
      adx = adx * (1 - track) + ndx * track;
      adz = adz * (1 - track) + ndz * track;
      const al = Math.hypot(adx, adz) || 1;
      e.aimDx = adx / al;
      e.aimDz = adz / al;
      e.faceDx = e.aimDx;
      e.faceDz = e.aimDz;
      e.flankerPhaseT -= dt;
      e.animPhase = (e.animPhase || 0) + 12 * dt;
      if (e.flankerPhaseT <= 0) {
        e.flankerPhase = 'dash';
        e.flankerPhaseT = cfg.dashSec != null ? cfg.dashSec : 0.28;
        e.dashHit = false;
        e.shotFlash = 0.18;
      }
      return;
    }

    // ---- dash: rush along locked aim; contact damage once ----
    if (e.flankerPhase === 'dash') {
      const adx = e.aimDx != null ? e.aimDx : ndx;
      const adz = e.aimDz != null ? e.aimDz : ndz;
      const al = Math.hypot(adx, adz) || 1;
      const ddx = adx / al, ddz = adz / al;
      const dSpd = (cfg.dashSpeed != null ? cfg.dashSpeed : 11.5) * slowMul;
      const stepX = ddx * dSpd * dt;
      const stepZ = ddz * dSpd * dt;
      e.vx = stepX / Math.max(dt, 1e-6);
      e.vz = stepZ / Math.max(dt, 1e-6);
      e.x += stepX;
      e.z += stepZ;
      const ec = this._softClamp(e.x, e.z, e.r);
      e.x = ec.x; e.z = ec.z;
      e.faceDx = ddx; e.faceDz = ddz;
      e.animPhase = (e.animPhase || 0) + 18 * dt;
      e.flankerPhaseT -= dt;

      const hitR = (cfg.dashHitRadius != null ? cfg.dashHitRadius : 0.9) + PLAYER.radius;
      const toP = Math.hypot(e.x - this.px, e.z - this.pz);
      if (!e.dashHit && toP < hitR) {
        e.dashHit = true;
        let hitPlayer = false;
        if (this.invuln <= 0) {
          hitPlayer = true;
          const taken = Math.max(1, (cfg.dashDamage || 2) - this._effectiveArmor());
          this.hp -= taken;
          this.invuln = 0.85 + (this.deflect || 0);
          this.hitFlash = 0.32;
          events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, flanker: true, amount: taken });
          this.px += ddx * 0.4;
          this.pz += ddz * 0.4;
          if (this.hp <= 0) {
            this.alive = false;
            this.hp = 0;
            this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
            events.push({ type: 'dead' });
          }
        }
        events.push({
          type: 'flankerDash',
          enemyId: e.id,
          x: e.x, z: e.z,
          aimDx: ddx, aimDz: ddz,
          hit: hitPlayer,
        });
      }

      if (e.flankerPhaseT <= 0) {
        if (!e.dashHit) {
          events.push({
            type: 'flankerDash',
            enemyId: e.id,
            x: e.x, z: e.z,
            aimDx: ddx, aimDz: ddz,
            hit: false,
          });
        }
        e.flankerPhase = 'recover';
        e.flankerPhaseT = cfg.recoverSec != null ? cfg.recoverSec : 1.35;
        e.flankSide = -e.flankSide; // re-angle opposite side
      }
      return;
    }

    // ---- flank / recover: arc approach ----
    e.flankerPhaseT -= dt;
    if (e.shotFlash > 0) e.shotFlash -= dt;
    const pdx = -ndz, pdz = ndx;
    const side = e.flankSide || 1;
    const strafe = cfg.flankStrafe != null ? cfg.flankStrafe : 1.2;
    let toward = 1;
    if (dist < (cfg.flankIdealMin || 5.5)) toward = -0.35;
    else if (dist > (cfg.flankIdealMax || 9.5)) toward = 1;
    else toward = 0.35;
    const moveMul = e.flankerPhase === 'recover'
      ? (cfg.recoverSpeedMul != null ? cfg.recoverSpeedMul : 0.55)
      : (cfg.approachSpeedMul != null ? cfg.approachSpeedMul : 1.05);
    const spd = e.speed * e.chase * slowMul * moveMul;
    const stepX = (ndx * toward + pdx * side * strafe) * spd * dt;
    const stepZ = (ndz * toward + pdz * side * strafe) * spd * dt;
    e.vx = stepX / Math.max(dt, 1e-6);
    e.vz = stepZ / Math.max(dt, 1e-6);
    e.x += stepX;
    e.z += stepZ;
    const moving = Math.hypot(e.vx, e.vz) > 0.05;
    e.animPhase = (e.animPhase || 0) + (moving ? Math.max(10, Math.hypot(e.vx, e.vz) * 7) * dt : 0);
    const ec = this._softClamp(e.x, e.z, e.r);
    e.x = ec.x; e.z = ec.z;
    e.faceDx = ndx;
    e.faceDz = ndz;
    e.aimDx = ndx;
    e.aimDz = ndz;

    if (e.flankerPhase === 'recover') {
      if (e.flankerPhaseT <= 0) {
        e.flankerPhase = 'flank';
        e.flankerPhaseT = 0.25 + this.rng() * 0.45;
      }
    } else if (e.flankerPhase === 'flank' && e.flankerPhaseT <= 0) {
      const commit = cfg.dashCommitRange != null ? cfg.dashCommitRange : 7.0;
      if (dist <= commit) {
        e.flankerPhase = 'telegraph';
        e.flankerPhaseT = cfg.telegraphSec;
        e.telegraphDur = cfg.telegraphSec;
        e.telegraphAt = this.t;
        e.aimDx = ndx;
        e.aimDz = ndz;
        e.faceDx = ndx;
        e.faceDz = ndz;
        e.dashHit = false;
        events.push({
          type: 'telegraph',
          kind: 'flanker',
          enemyId: e.id,
          x: e.x, z: e.z,
          aimDx: ndx, aimDz: ndz,
          duration: cfg.telegraphSec,
        });
      } else {
        // Still too far — keep flanking a bit longer
        e.flankerPhaseT = 0.2 + this.rng() * 0.3;
      }
    }

    // Ordinary body contact while flanking (not dash) — same as grunt
    if (this.invuln <= 0 && Math.hypot(e.x - this.px, e.z - this.pz) < e.r + PLAYER.radius) {
      const taken = Math.max(1, (e.damage || 1) - this._effectiveArmor());
      this.hp -= taken;
      this.invuln = 0.85 + (this.deflect || 0);
      this.hitFlash = 0.28;
      events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, amount: taken });
      e.x -= ndx * 0.55;
      e.z -= ndz * 0.55;
      if (this.hp <= 0) {
        this.alive = false;
        this.hp = 0;
        this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
        events.push({ type: 'dead' });
      }
    }
  }

  _findWoundedAlly(medic, radius) {
    const r2 = (radius != null ? radius : 12) ** 2;
    let best = null;
    let bestD = Infinity;
    for (const o of this.enemies) {
      if (!o || o === medic) continue;
      if (o.elite || o.boss) continue;
      if (o.hp == null || o.maxHp == null) continue;
      if (o.hp >= o.maxHp - 1e-6) continue;
      // Ordinary-only heal path (no elite/boss); medics may heal each other if wounded.
      const dx = o.x - medic.x, dz = o.z - medic.z;
      const d2 = dx * dx + dz * dz;
      if (d2 > r2) continue;
      // Prefer most wounded, then nearest
      const miss = (o.maxHp - o.hp) / Math.max(1, o.maxHp);
      const score = d2 - miss * 40;
      if (score < bestD) { bestD = score; best = o; }
    }
    return best;
  }

  _tickMedic(e, dt, events) {
    const cfg = MEDIC;
    if (e.hit > 0) e.hit -= dt;
    if (e.slow > 0) e.slow -= dt;
    if (e.shotFlash > 0) e.shotFlash -= dt;
    const slowMul = e.slow > 0 ? Math.max(0.35, 1 - Math.min(0.55, 0.4)) : 1;
    const pdx = this.px - e.x, pdz = this.pz - e.z;
    const pDist = Math.hypot(pdx, pdz) || 1;
    const pndx = pdx / pDist, pndz = pdz / pDist;

    if (!e.medicPhase) e.medicPhase = 'seek';
    if (e.medicPhaseT == null) e.medicPhaseT = 0.35;

    const lowHp = e.hp <= e.maxHp * (cfg.fleeHpFrac != null ? cfg.fleeHpFrac : 0.45);
    const playerClose = pDist < (cfg.fleePlayerDist != null ? cfg.fleePlayerDist : 3.4);
    const wounded = this._findWoundedAlly(e, 14);
    const alone = !wounded;

    // Force flee when low / player close / alone (except mid-heal telegraph/heal)
    if ((lowHp || playerClose || alone) && e.medicPhase !== 'telegraph' && e.medicPhase !== 'heal') {
      if (e.medicPhase !== 'flee') {
        e.medicPhase = 'flee';
        e.medicPhaseT = 0.6 + this.rng() * 0.5;
        e.healTargetId = undefined;
      }
    }

    // ---- telegraph: nearly stop; lime aura; no heal yet ----
    if (e.medicPhase === 'telegraph') {
      const tMul = cfg.telegraphSpeedMul != null ? cfg.telegraphSpeedMul : 0.12;
      // Drift gently toward locked heal target if still alive
      let tdx = 0, tdz = 0;
      const tgt = this.enemies.find((o) => o && o.id === e.healTargetId);
      if (tgt) {
        const dx = tgt.x - e.x, dz = tgt.z - e.z;
        const d = Math.hypot(dx, dz) || 1;
        tdx = dx / d; tdz = dz / d;
        e.faceDx = tdx; e.faceDz = tdz;
        e.aimDx = tdx; e.aimDz = tdz;
        e.aimX = tgt.x; e.aimZ = tgt.z;
      } else {
        // Target gone — cancel heal
        e.medicPhase = 'seek';
        e.medicPhaseT = 0.2;
        e.healTargetId = undefined;
        return;
      }
      const spd = e.speed * e.chase * slowMul * tMul;
      e.x += tdx * spd * dt;
      e.z += tdz * spd * dt;
      e.vx = tdx * spd; e.vz = tdz * spd;
      const ec = this._softClamp(e.x, e.z, e.r);
      e.x = ec.x; e.z = ec.z;
      e.medicPhaseT -= dt;
      e.animPhase = (e.animPhase || 0) + 10 * dt;
      if (e.medicPhaseT <= 0) {
        e.medicPhase = 'heal';
        e.medicPhaseT = 0.12;
        e.shotFlash = 0.22;
      }
      return;
    }

    // ---- heal: pulse once to nearby wounded ordinary allies ----
    if (e.medicPhase === 'heal') {
      const radius = cfg.healRadius != null ? cfg.healRadius : 4.2;
      const amount = cfg.healAmount != null ? cfg.healAmount : 2;
      const maxT = cfg.healMaxTargets != null ? cfg.healMaxTargets : 2;
      const healed = [];
      // Prefer locked target first
      const ordered = [];
      const locked = this.enemies.find((o) => o && o.id === e.healTargetId);
      if (locked) ordered.push(locked);
      for (const o of this.enemies) {
        if (!o || o === e) continue;
        if (ordered.includes(o)) continue;
        ordered.push(o);
      }
      for (const o of ordered) {
        if (healed.length >= maxT) break;
        if (!o || o === e) continue;
        if (o.elite || o.boss) continue;
        if (o.hp == null || o.maxHp == null) continue;
        if (o.hp >= o.maxHp - 1e-6) continue;
        const d = Math.hypot(o.x - e.x, o.z - e.z);
        if (d > radius) continue;
        const before = o.hp;
        o.hp = Math.min(o.maxHp, o.hp + amount);
        if (o.hp > before) {
          healed.push({ id: o.id, x: o.x, z: o.z, amount: o.hp - before });
        }
      }
      events.push({
        type: 'medicHeal',
        enemyId: e.id,
        x: e.x, z: e.z,
        radius,
        targets: healed,
        count: healed.length,
      });
      e.medicPhase = 'recover';
      e.medicPhaseT = cfg.recoverSec != null ? cfg.recoverSec : 1.15;
      e.healTargetId = undefined;
      return;
    }

    // ---- flee: soft kite away from player ----
    if (e.medicPhase === 'flee') {
      const fMul = cfg.fleeSpeedMul != null ? cfg.fleeSpeedMul : 1.3;
      const spd = e.speed * e.chase * slowMul * fMul;
      // Away from player; slight noise
      const awayX = -pndx, awayZ = -pndz;
      e.x += awayX * spd * dt;
      e.z += awayZ * spd * dt;
      e.vx = awayX * spd; e.vz = awayZ * spd;
      const ec = this._softClamp(e.x, e.z, e.r);
      e.x = ec.x; e.z = ec.z;
      e.faceDx = awayX; e.faceDz = awayZ;
      e.animPhase = (e.animPhase || 0) + 14 * dt;
      e.medicPhaseT -= dt;
      if (e.medicPhaseT <= 0) {
        // Re-evaluate: if wounded ally exists and not too threatened, seek
        if (!lowHp && !playerClose && wounded) {
          e.medicPhase = 'seek';
          e.medicPhaseT = 0.25;
        } else {
          e.medicPhaseT = 0.4 + this.rng() * 0.4;
        }
      }
      // Light contact only
      if (this.invuln <= 0 && Math.hypot(e.x - this.px, e.z - this.pz) < e.r + PLAYER.radius) {
        const taken = Math.max(1, (e.damage || 1) - this._effectiveArmor());
        this.hp -= taken;
        this.invuln = 0.85 + (this.deflect || 0);
        this.hitFlash = 0.22;
        events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, amount: taken });
        e.x -= pndx * 0.5; e.z -= pndz * 0.5;
        if (this.hp <= 0) {
          this.alive = false; this.hp = 0;
          this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
          events.push({ type: 'dead' });
        }
      }
      return;
    }

    // ---- recover / seek: move mid-range toward wounded ally ----
    e.medicPhaseT -= dt;
    if (!wounded) {
      e.medicPhase = 'flee';
      e.medicPhaseT = 0.5;
      return;
    }
    e.healTargetId = wounded.id;
    const dx = wounded.x - e.x, dz = wounded.z - e.z;
    const dist = Math.hypot(dx, dz) || 1;
    const ndx = dx / dist, ndz = dz / dist;
    e.faceDx = ndx; e.faceDz = ndz;
    e.aimDx = ndx; e.aimDz = ndz;
    e.aimX = wounded.x; e.aimZ = wounded.z;

    let toward = 1;
    const idealMin = cfg.seekIdealMin != null ? cfg.seekIdealMin : 3.2;
    const idealMax = cfg.seekIdealMax != null ? cfg.seekIdealMax : 6.0;
    if (dist < idealMin) toward = -0.4;
    else if (dist > idealMax) toward = 1;
    else toward = 0.15;

    const moveMul = e.medicPhase === 'recover'
      ? (cfg.recoverSpeedMul != null ? cfg.recoverSpeedMul : 0.7)
      : (cfg.approachSpeedMul != null ? cfg.approachSpeedMul : 1.0);
    const spd = e.speed * e.chase * slowMul * moveMul;
    // Strafe a bit so silhouette reads as support, not charge
    const sdx = -ndz, sdz = ndx;
    const side = (e.id % 2 === 0) ? 1 : -1;
    e.x += (ndx * toward + sdx * side * 0.55) * spd * dt;
    e.z += (ndz * toward + sdz * side * 0.55) * spd * dt;
    e.vx = ndx * toward * spd; e.vz = ndz * toward * spd;
    const ec = this._softClamp(e.x, e.z, e.r);
    e.x = ec.x; e.z = ec.z;
    e.animPhase = (e.animPhase || 0) + 11 * dt;

    if (e.medicPhase === 'recover') {
      if (e.medicPhaseT <= 0) {
        e.medicPhase = 'seek';
        e.medicPhaseT = 0.2 + this.rng() * 0.35;
      }
    } else if (e.medicPhase === 'seek' && e.medicPhaseT <= 0) {
      // Commit to heal when close enough to wounded
      if (dist <= idealMax + 1.5) {
        e.medicPhase = 'telegraph';
        e.medicPhaseT = cfg.telegraphSec;
        e.telegraphDur = cfg.telegraphSec;
        e.telegraphAt = this.t;
        events.push({
          type: 'telegraph',
          kind: 'medic',
          enemyId: e.id,
          x: e.x, z: e.z,
          aimX: wounded.x, aimZ: wounded.z,
          targetId: wounded.id,
          duration: cfg.telegraphSec,
        });
      } else {
        e.medicPhaseT = 0.2 + this.rng() * 0.25;
      }
    }

    // Light body contact
    if (this.invuln <= 0 && Math.hypot(e.x - this.px, e.z - this.pz) < e.r + PLAYER.radius) {
      const taken = Math.max(1, (e.damage || 1) - this._effectiveArmor());
      this.hp -= taken;
      this.invuln = 0.85 + (this.deflect || 0);
      this.hitFlash = 0.22;
      events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, amount: taken });
      e.x -= pndx * 0.5; e.z -= pndz * 0.5;
      if (this.hp <= 0) {
        this.alive = false; this.hp = 0;
        this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
        events.push({ type: 'dead' });
      }
    }
  }

  _applyJammerDebuff(cfg, events, enemy) {
    const mul = cfg.jamMul != null ? cfg.jamMul : 1.35;
    const dur = cfg.jamDuration != null ? cfg.jamDuration : 2.5;
    // Stack cap 1: refresh duration; do not multiply mul further.
    this.jamFireMul = mul;
    this.jamT = Math.max(this.jamT || 0, dur);
    events.push({
      type: 'jammerPulse',
      enemyId: enemy ? enemy.id : undefined,
      x: enemy ? enemy.x : this.px,
      z: enemy ? enemy.z : this.pz,
      mul,
      duration: dur,
      jamT: this.jamT,
    });
  }

  _tickJammer(e, dt, events) {
    const cfg = JAMMER;
    if (e.hit > 0) e.hit -= dt;
    if (e.slow > 0) e.slow -= dt;
    if (e.shotFlash > 0) e.shotFlash -= dt;
    const slowMul = e.slow > 0 ? Math.max(0.35, 1 - Math.min(0.55, 0.4)) : 1;
    const dx = this.px - e.x, dz = this.pz - e.z;
    const dist = Math.hypot(dx, dz) || 1;
    const ndx = dx / dist, ndz = dz / dist;

    if (!e.jammerPhase) e.jammerPhase = 'reposition';
    if (e.jammerPhaseT == null) e.jammerPhaseT = 0.4;

    // ---- telegraph: nearly stop; violet ring; no apply yet ----
    if (e.jammerPhase === 'telegraph') {
      const tMul = cfg.telegraphSpeedMul != null ? cfg.telegraphSpeedMul : 0.1;
      const spd = e.speed * e.chase * slowMul * tMul;
      e.x += ndx * spd * dt;
      e.z += ndz * spd * dt;
      e.vx = ndx * spd; e.vz = ndz * spd;
      const ec = this._softClamp(e.x, e.z, e.r);
      e.x = ec.x; e.z = ec.z;
      e.faceDx = ndx; e.faceDz = ndz;
      e.aimDx = ndx; e.aimDz = ndz;
      e.jammerPhaseT -= dt;
      e.animPhase = (e.animPhase || 0) + 11 * dt;
      if (e.jammerPhaseT <= 0) {
        e.jammerPhase = 'pulse';
        e.jammerPhaseT = 0.1;
        e.shotFlash = 0.22;
      }
      return;
    }

    // ---- pulse: apply fireCd mul if player in jamRange ----
    if (e.jammerPhase === 'pulse') {
      const range = cfg.jamRange != null ? cfg.jamRange : 9.0;
      const applied = dist <= range;
      if (applied) {
        this._applyJammerDebuff(cfg, events, e);
      } else {
        events.push({
          type: 'jammerPulse',
          enemyId: e.id,
          x: e.x, z: e.z,
          mul: cfg.jamMul != null ? cfg.jamMul : 1.35,
          duration: 0,
          jamT: this.jamT || 0,
          miss: true,
        });
      }
      e.jammerPhase = 'recover';
      e.jammerPhaseT = cfg.recoverSec != null ? cfg.recoverSec : 1.4;
      return;
    }

    // ---- reposition / recover: keep mid-range orbit ----
    e.jammerPhaseT -= dt;
    const idealMin = cfg.idealMin != null ? cfg.idealMin : 5.0;
    const idealMax = cfg.idealMax != null ? cfg.idealMax : 8.5;
    let toward = 1;
    if (dist < idealMin) toward = -0.55;
    else if (dist > idealMax) toward = 1;
    else toward = 0.1;
    const moveMul = e.jammerPhase === 'recover'
      ? (cfg.recoverSpeedMul != null ? cfg.recoverSpeedMul : 0.65)
      : (cfg.approachSpeedMul != null ? cfg.approachSpeedMul : 0.95);
    const spd = e.speed * e.chase * slowMul * moveMul;
    const sdx = -ndz, sdz = ndx;
    const side = (e.id % 2 === 0) ? 1 : -1;
    e.x += (ndx * toward + sdx * side * 0.85) * spd * dt;
    e.z += (ndz * toward + sdz * side * 0.85) * spd * dt;
    e.vx = ndx * toward * spd; e.vz = ndz * toward * spd;
    const ec = this._softClamp(e.x, e.z, e.r);
    e.x = ec.x; e.z = ec.z;
    e.faceDx = ndx; e.faceDz = ndz;
    e.aimDx = ndx; e.aimDz = ndz;
    e.animPhase = (e.animPhase || 0) + 10 * dt;

    if (e.jammerPhase === 'recover') {
      if (e.jammerPhaseT <= 0) {
        e.jammerPhase = 'reposition';
        e.jammerPhaseT = 0.35 + this.rng() * 0.55;
      }
    } else if (e.jammerPhase === 'reposition' && e.jammerPhaseT <= 0) {
      if (dist <= idealMax + 1.5 && dist >= idealMin * 0.55) {
        e.jammerPhase = 'telegraph';
        e.jammerPhaseT = cfg.telegraphSec;
        e.telegraphDur = cfg.telegraphSec;
        e.telegraphAt = this.t;
        events.push({
          type: 'telegraph',
          kind: 'jammer',
          enemyId: e.id,
          x: e.x, z: e.z,
          aimDx: ndx, aimDz: ndz,
          duration: cfg.telegraphSec,
        });
      } else {
        e.jammerPhaseT = 0.2 + this.rng() * 0.3;
      }
    }

    // Light body contact
    if (this.invuln <= 0 && Math.hypot(e.x - this.px, e.z - this.pz) < e.r + PLAYER.radius) {
      const taken = Math.max(1, (e.damage || 1) - this._effectiveArmor());
      this.hp -= taken;
      this.invuln = 0.85 + (this.deflect || 0);
      this.hitFlash = 0.22;
      events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, amount: taken });
      e.x -= ndx * 0.5; e.z -= ndz * 0.5;
      if (this.hp <= 0) {
        this.alive = false; this.hp = 0;
        this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
        events.push({ type: 'dead' });
      }
    }
  }

  /**
   * Advance all enemies one dt, recording prevX/prevZ at the start of the interval.
   * Contact damage / elite / boss AI stay here (same as pre-reorder).
   */
  _moveEnemies(dt, events) {
    // Reverse index so bomber self-detonate (or any mid-tick remove) stays safe.
    for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
      const e = this.enemies[ei];
      e.prevX = e.x;
      e.prevZ = e.z;
      if (e.boss) {
        this._tickBoss(e, dt, events);
        continue;
      }
      if (e.elite) {
        this._tickElite(e, dt, events);
        continue;
      }
      if (e.sniper || e.kind === 'sniper' || e.type === 'sniper') {
        this._tickSniper(e, dt, events);
        continue;
      }
      if (e.shieldGuard || e.kind === 'shield' || e.type === 'shield') {
        this._tickShield(e, dt, events);
        continue;
      }
      if (e.artillery || e.kind === 'artillery' || e.type === 'artillery') {
        this._tickArtillery(e, dt, events);
        continue;
      }
      if (e.bomber || e.kind === 'bomber' || e.type === 'bomber') {
        this._tickBomber(e, dt, events);
        if (e.bomberDetonated) {
          const idx = this.enemies.indexOf(e);
          if (idx >= 0) {
            this._kill(e, idx, events);
            events.push({ type: 'kill', enemy: e, gore: true, bomber: true });
          }
        }
        continue;
      }
      if (e.flanker || e.kind === 'flanker' || e.type === 'flanker') {
        this._tickFlanker(e, dt, events);
        continue;
      }
      if (e.medic || e.kind === 'medic' || e.type === 'medic') {
        this._tickMedic(e, dt, events);
        continue;
      }
      if (e.jammer || e.kind === 'jammer' || e.type === 'jammer') {
        this._tickJammer(e, dt, events);
        continue;
      }
      if (e.hit > 0) e.hit -= dt;
      if (e.slow > 0) e.slow -= dt;
      const slowMul = e.slow > 0 ? Math.max(0.35, 1 - Math.min(0.55, 0.4)) : 1;
      const dx = this.px - e.x, dz = this.pz - e.z;
      const len = Math.hypot(dx, dz) || 1;
      const toward = e.panic ? -1 : 1;
      const stepX = (dx / len) * toward * e.speed * e.chase * slowMul * dt;
      const stepZ = (dz / len) * toward * e.speed * e.chase * slowMul * dt;
      e.vx = stepX / Math.max(dt, 1e-6);
      e.vz = stepZ / Math.max(dt, 1e-6);
      e.x += stepX;
      e.z += stepZ;
      const moving = Math.hypot(e.vx, e.vz) > 0.05;
      e.animPhase = (e.animPhase || 0) + (moving ? Math.max(8, Math.hypot(e.vx, e.vz) * 6.5) * dt : 0);
      const ec = this._softClamp(e.x, e.z, e.r);
      e.x = ec.x; e.z = ec.z;
      if (this.invuln <= 0 && Math.hypot(e.x - this.px, e.z - this.pz) < e.r + PLAYER.radius) {
        const taken = Math.max(1, (e.damage || 2) - this._effectiveArmor());
        this.hp -= taken;
        this.invuln = 0.85 + (this.deflect || 0);
        this.hitFlash = 0.28;
        events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn, amount: taken });
        e.x -= (dx / len) * toward * 0.9;
        e.z -= (dz / len) * toward * 0.9;
        if (this.hp <= 0) {
          this.alive = false;
          this.hp = 0;
          this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
          events.push({ type: 'dead' });
        }
      }
    }
  }

  /**
   * Move projectiles and collide with enemies using relative continuous sweep
   * (bullet prev→curr + enemy prev→curr over the same dt).
   */
  _stepProjectiles(dt, events) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      // Homing toward homeTarget (tracking bomb)
      if (b.homing && b.homeTarget && this.enemies.includes(b.homeTarget) && b.homeTarget.hp > 0 && !b.stuck) {
        const tx = b.homeTarget.x - b.x, tz = b.homeTarget.z - b.z;
        const tl = Math.hypot(tx, tz) || 1;
        const spd = Math.hypot(b.vx, b.vz) || 8;
        const turn = Math.min(1, (b.homing * dt) / spd);
        b.vx = b.vx * (1 - turn) + (tx / tl) * spd * turn;
        b.vz = b.vz * (1 - turn) + (tz / tl) * spd * turn;
      }
      // Stuck bomb rides on enemy then fuses
      if (b.stuck && b.stickEnemy) {
        if (this.enemies.includes(b.stickEnemy) && b.stickEnemy.hp > 0) {
          b.x = b.stickEnemy.x; b.z = b.stickEnemy.z; b.y = 0.7;
          b.vx = 0; b.vz = 0;
        } else {
          b.stuck = false; b.stickEnemy = null;
        }
      }
      if (b.grav) {
        b.vy -= b.grav * dt;
        b.y += b.vy * dt;
        if (b.y < 0.05) { b.y = 0.05; b.vy = 0; }
      }
      const prevX = b.x, prevZ = b.z;
      if (!b.stuck) { b.x += b.vx * dt; b.z += b.vz * dt; }
      b.life -= dt;
      if (b.fuse > 0) {
        b.fuse -= dt;
        if (b.fuse <= 0) {
          this._aoeAt(b.x, b.z, b.aoe || 1.8, b.aoeDmg || b.dmg, events, b.weapon);
          if (b.chillField) {
            for (const e of this.enemies) {
              if (Math.hypot(e.x - b.x, e.z - b.z) <= (b.aoe || 2.8) + e.r) e.slow = Math.max(e.slow || 0, b.slow || 1.8);
            }
            this.zones.push({ x: b.x, z: b.z, r: b.aoe || 2.8, life: b.fieldDur || 2.2, dps: 0, kind: 'chill' });
          }
          if (b.flashbang) {
            for (const e of this.enemies) {
              if (Math.hypot(e.x - b.x, e.z - b.z) <= (b.aoe || 3.2) + e.r) {
                e.slow = Math.max(e.slow || 0, b.stun || 0.9);
                if (e.aimT != null) e.aimT = Math.min(e.aimT, 0.05);
                if (e.telegraphT != null) e.telegraphT = 0;
              }
            }
            events.push({ type: 'flash', x: b.x, z: b.z, r: b.aoe || 3.2 });
          }
          if (b.gravityPull) {
            if (!this._pullFields) this._pullFields = [];
            this._pullFields.push({
              x: b.x, z: b.z, r: b.aoe || 3.2, pull: b.pull || 11,
              life: b.fieldDur || 0.9, dmgAcc: 0, dmg: (b.aoeDmg || b.dmg) / Math.max(0.4, b.fieldDur || 0.9),
            });
          }
          this.bullets.splice(i, 1);
          continue;
        }
      }
      const br = Math.hypot(b.x - this.px, b.z - this.pz);
      if (b.life <= 0 || br > ARENA.spawnFar + 12) {
        if (b.aoe && !b.fuse && (b.weapon === 'rocket' || b.weapon === 'grenade')) {
          this._aoeAt(b.x, b.z, b.aoe, b.aoeDmg || b.dmg, events, b.weapon);
        }
        if (b.puddle) {
          this.zones.push({
            x: b.x, z: b.z, r: b.puddle, life: 2.4 + (this.plasma || 0) * 0.4,
            dps: b.aoeDmg || 1, kind: 'plasma',
          });
          events.push({ type: 'puddle', x: b.x, z: b.z, r: b.puddle });
        }
        this.bullets.splice(i, 1);
        continue;
      }
      if (b.noHit) continue;
      let consumed = false;
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (b.hitIds.has(e)) continue;
        const er = b.r + e.r;
        const ex0 = e.prevX != null ? e.prevX : e.x;
        const ez0 = e.prevZ != null ? e.prevZ : e.z;
        // Relative continuous: bullet segment + enemy segment over same interval.
        if (relativeSegmentHitsCircle(prevX, prevZ, b.x, b.z, ex0, ez0, e.x, e.z, er)) {
          // Source ≈ previous bullet pos (attack travel dir toward enemy)
          const hitMul = this._enemyIncomingMul(e, prevX, prevZ);
          const dead = this._applyEnemyDamage(e, b.dmg, prevX, prevZ, events, { hitTime: 0.12 });
          b.hitIds.add(e);
          const heavy = b.weapon === 'rocket' || b.weapon === 'laser' || b.weapon === 'grenade';
          events.push({
            type: 'hit', x: e.x, z: e.z, color: e.color, kind: e.kind,
            heavy, frontBlock: hitMul < 0.5, dmg: b.dmg * hitMul, id: e.id,
          });
          if (dead) {
            this._kill(e, j, events);
            const punch = isPunchKill(e, heavy);
            events.push({ type: 'kill', enemy: e, gore: punch, elite: punch });
          }
          if (b.chill) e.slow = Math.max(e.slow || 0, b.chill);
          if (b.burn > 0) {
            e.burnDps = Math.max(e.burnDps || 0, b.burn);
            e.burnT = Math.max(e.burnT || 0, b.burnDur || 1.4);
          }
          if (b.chainJumps > 0) {
            this._ionChainJump(e, b.chainJumps, b.chainRange || 3.5, b.dmg * 0.85, events);
          }
          if (b.frostBurstR > 0) {
            this._frostBurstAt(e.x, e.z, b.frostBurstR, b.frostBurstDmg || b.dmg * 0.6, (b.chill || 0.5) * 0.85, events);
          }
          if (b.stickOnHit && !b.stuck) {
            b.stuck = true;
            b.stickEnemy = e;
            b.fuse = b.stickFuse || 0.35;
            b.vx = 0; b.vz = 0;
            b.noHit = true;
            consumed = true;
            break;
          }
          if (b.aoe && (b.weapon === 'rocket' || b.weapon === 'plasma' || b.weapon === 'tracking_bomb' || b.weapon === 'acid_gun')) {
            this._aoeAt(b.x, b.z, b.aoe || b.puddle || 1.2, b.aoeDmg || b.dmg * 0.6, events, b.weapon);
            if (b.puddle) {
              this.zones.push({
                x: b.x, z: b.z, r: b.puddle, life: 2.2, dps: b.aoeDmg || 1, kind: 'plasma',
              });
            }
            this.bullets.splice(i, 1);
            consumed = true;
            break;
          }
          if (b.pierce > 0) { b.pierce -= 1; }
          else { this.bullets.splice(i, 1); consumed = true; break; }
        }
      }
      if (consumed) continue;
    }
  }

  /**
   * Periodic arena red danger circles (PHASE6-PERIODIC-DANGER-001).
   * Cadence after startAfter; telegraph ≥0.9s then pulse. Skip when paused/dead (caller).
   * Max concurrent; offset from player so not always under feet.
   */
  _tickDangerPulses(dt, events) {
    const cfg = DANGER_PULSE;
    if (!this.dangerPulses) this.dangerPulses = [];

    // Tick active pulses
    for (let i = this.dangerPulses.length - 1; i >= 0; i--) {
      const p = this.dangerPulses[i];
      if (p.phase !== 'telegraph') {
        this.dangerPulses.splice(i, 1);
        continue;
      }
      p.phaseT -= dt;
      if (p.phaseT > 0) continue;

      const r = p.radius != null ? p.radius : cfg.radius;
      const toPlayer = Math.hypot(this.px - p.x, this.pz - p.z);
      let hitPlayer = false;
      if (this.alive && toPlayer < r + PLAYER.radius) {
        hitPlayer = true;
        if (this.invuln <= 0) {
          const taken = Math.max(1, (cfg.damage || 2) - this._effectiveArmor());
          this.hp -= taken;
          this.invuln = 0.85 + (this.deflect || 0);
          this.hitFlash = 0.35;
          events.push({
            type: 'hurt',
            by: 'dangerPulse',
            nameZh: '危險範圍',
            nameEn: 'Danger Zone',
            dangerPulse: true,
            amount: taken,
          });
          if (this.hp <= 0) {
            this.alive = false;
            this.hp = 0;
            this.killer = { kind: 'dangerPulse', zh: '危險範圍', en: 'Danger Zone' };
            events.push({ type: 'dead' });
          }
        }
      }
      events.push({
        type: 'dangerPulse',
        id: p.id,
        x: p.x,
        z: p.z,
        radius: r,
        hit: hitPlayer,
      });
      this.dangerPulses.splice(i, 1);
    }

    if (!this.alive) return;
    if (this.t < cfg.startAfter) return;

    if (this._nextDangerPulseAt == null) {
      this._nextDangerPulseAt = cfg.startAfter;
    }

    const maxC = cfg.maxConcurrent != null ? cfg.maxConcurrent : 2;
    while (this.dangerPulses.length < maxC && this.t >= this._nextDangerPulseAt) {
      this._spawnDangerPulse(events);
      this._nextDangerPulseAt += cfg.everySec;
    }
  }

  _spawnDangerPulse(events) {
    const cfg = DANGER_PULSE;
    const oMin = cfg.offsetMin != null ? cfg.offsetMin : 1.8;
    const oMax = cfg.offsetMax != null ? cfg.offsetMax : 4.0;
    const ang = this.rng() * Math.PI * 2;
    const dist = oMin + this.rng() * Math.max(0.01, oMax - oMin);
    let x = this.px + Math.cos(ang) * dist;
    let z = this.pz + Math.sin(ang) * dist;
    // Keep circle center in soft arena so player can escape the ring
    const clamped = this._softClamp(x, z, (cfg.radius || 2.4) * 0.35);
    x = clamped.x;
    z = clamped.z;
    const tele = cfg.telegraphSec;
    const id = this._nextDangerPulseId++;
    const pulse = {
      id,
      x, z,
      radius: cfg.radius,
      phase: 'telegraph',
      phaseT: tele,
      telegraphDur: tele,
      telegraphAt: this.t,
    };
    this.dangerPulses.push(pulse);
    events.push({
      type: 'telegraph',
      kind: 'dangerPulse',
      id,
      x, z,
      radius: cfg.radius,
      duration: tele,
    });
  }

  /**
   * Shrinking / pollution safe zone (PHASE6-ZONE-PRESSURE-001).
   * After startAfter, safeR lerps startR→endR; outside → tick DoT. Skip when paused/dead (caller).
   */
  _tickZonePressure(dt, events) {
    const cfg = ZONE_PRESSURE;
    const startR = cfg.startR != null ? cfg.startR : 30;
    const endR = cfg.endR != null ? cfg.endR : 16;
    const shrinkSec = Math.max(1, cfg.shrinkSec != null ? cfg.shrinkSec : 200);
    const startAfter = cfg.startAfter != null ? cfg.startAfter : 110;

    if (this.t < startAfter) {
      this.zonePressureActive = false;
      this.safeR = startR;
      return;
    }

    if (!this._zonePressureStarted) {
      this._zonePressureStarted = true;
      this.zonePressureActive = true;
      this.safeR = startR;
      this._zonePressureTickAcc = 0;
      events.push({
        type: 'zonePressure',
        phase: 'start',
        safeR: this.safeR,
        startR,
        endR,
      });
    }

    this.zonePressureActive = true;
    const u = Math.max(0, Math.min(1, (this.t - startAfter) / shrinkSec));
    this.safeR = startR + (endR - startR) * u;

    if (!this.alive) return;

    const dist = Math.hypot(this.px, this.pz);
    const outside = dist > this.safeR + (typeof PLAYER !== 'undefined' ? PLAYER.radius * 0.25 : 0);
    if (!outside) {
      this._zonePressureTickAcc = 0;
      return;
    }

    const tickSec = cfg.tickSec != null ? cfg.tickSec : 0.5;
    const dmgPerSec = cfg.dmgPerSec != null ? cfg.dmgPerSec : 1.0;
    this._zonePressureTickAcc += dt;
    while (this._zonePressureTickAcc >= tickSec) {
      this._zonePressureTickAcc -= tickSec;
      if (this.invuln > 0) continue;
      const raw = dmgPerSec * tickSec;
      const taken = Math.max(0.15, raw - this._effectiveArmor() * 0.15);
      this.hp -= taken;
      this.hitFlash = Math.max(this.hitFlash, 0.22);
      events.push({
        type: 'hurt',
        by: 'zonePressure',
        nameZh: '污染區',
        nameEn: 'Pollution Zone',
        zonePressure: true,
        amount: taken,
      });
      if (this.hp <= 0) {
        this.alive = false;
        this.hp = 0;
        this.killer = { kind: 'zonePressure', zh: '污染區', en: 'Pollution Zone' };
        events.push({ type: 'dead' });
        break;
      }
    }
  }

  step(dt) {
    if (!this.alive || this.pausedForLevel) return { events: [] };
    const events = [];
    this.t += dt;
    // Phase 6: lab → assembly @195 → reactor @285 → blockade @420 → rooftop @510
    if (this.mapZone === 'lab' && this.t >= MAP_ZONE.assemblyAt) {
      this.mapZone = 'assembly';
      events.push({ type: 'zoneEnter', zone: 'assembly', at: MAP_ZONE.assemblyAt });
    }
    if (this.mapZone === 'assembly' && this.t >= MAP_ZONE.reactorAt) {
      this.mapZone = 'reactor';
      events.push({ type: 'zoneEnter', zone: 'reactor', at: MAP_ZONE.reactorAt });
    }
    if (this.mapZone === 'reactor' && this.t >= MAP_ZONE.blockadeAt) {
      this.mapZone = 'blockade';
      events.push({ type: 'zoneEnter', zone: 'blockade', at: MAP_ZONE.blockadeAt });
    }
    if (this.mapZone === 'blockade' && this.t >= MAP_ZONE.rooftopAt) {
      this.mapZone = 'rooftop';
      events.push({ type: 'zoneEnter', zone: 'rooftop', at: MAP_ZONE.rooftopAt });
    }
    if (this.invuln > 0) this.invuln -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.jamT > 0) {
      this.jamT -= dt;
      if (this.jamT <= 0) { this.jamT = 0; this.jamFireMul = 1; }
    }
    if (this.muzzle > 0) this.muzzle -= dt;
    if (this.aimHold > 0) this.aimHold -= dt;
    if (this._branchShieldT > 0) this._branchShieldT -= dt;
    if (this._fortressT > 0) this._fortressT -= dt;
    if (this._gatlingHeat > 0) this._gatlingHeat = Math.max(0, this._gatlingHeat - dt * 0.25);

    const moveMul = ((this._fortressT || 0) > 0) ? (this._fortressMoveMul || 0.45) : 1;
    this.px += this.vx * this.speed * moveMul * dt;
    this.pz += this.vz * this.speed * moveMul * dt;
    const clamped = this._softClamp(this.px, this.pz, PLAYER.radius);
    this.px = clamped.x; this.pz = clamped.z;
    // Score-pos: mark recent movement (stick input / non-trivial velocity)
    if (Math.hypot(this.vx || 0, this.vz || 0) > 0.12) this._lastMovedAt = this.t;

    this._tickWeapons(dt, events);
    this._tickWeaponFields(dt, events);

    if (this.nova > 0) {
      this.novaT -= dt;
      if (this.novaT <= 0) {
        this._novaBlast(events);
        this.novaT = this.novaCd || 3.5;
      }
    }

    // Enemies move first (recording prev), then projectiles collide with relative sweep
    // over the same dt. Fire already used pre-move positions/velocities above.
    this._moveEnemies(dt, events);

    this._stepProjectiles(dt, events);

    // ---- lingering zones (acid / plasma)
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      z.life -= dt;
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (Math.hypot(e.x - z.x, e.z - z.z) < z.r + e.r) {
          this._applyEnemyDamage(e, z.dps * dt * 3.2, z.x, z.z, events, { hitTime: 0.08 });
          e.slow = Math.max(e.slow, 0.35);
          e.hit = Math.max(e.hit, 0.05);
          if (e.hp <= 0) {
            this._kill(e, j, events);
            const punch = isPunchKill(e, true);
            events.push({ type: 'kill', enemy: e, gore: punch, elite: punch });
          }
        }
      }
      if (z.life <= 0) this.zones.splice(i, 1);
    }

    // Branch burn DoT (vulcan B 燒夷彈)
    for (let j = this.enemies.length - 1; j >= 0; j--) {
      const e = this.enemies[j];
      if (!(e.burnT > 0) || !(e.burnDps > 0)) continue;
      e.burnT -= dt;
      const dead = this._applyEnemyDamage(e, e.burnDps * dt, e.x, e.z, events, { hitTime: 0.04 });
      if (dead) {
        this._kill(e, j, events);
        events.push({ type: 'kill', enemy: e, gore: false, burn: true });
      }
      if (e.burnT <= 0) { e.burnT = 0; e.burnDps = 0; }
    }

    if (this.orbits > 0) {
      const R = 1.35;
      for (let o = 0; o < this.orbits; o++) {
        const ang = this.t * 3.2 + (o / this.orbits) * Math.PI * 2;
        const ox = this.px + Math.cos(ang) * R;
        const oz = this.pz + Math.sin(ang) * R;
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (Math.hypot(ox - e.x, oz - e.z) < 0.35 + e.r) {
            const dead = this._applyEnemyDamage(e, 0.55 * this.bulletDmg * dt * 8, ox, oz, events, { hitTime: 0.08 });
            if (dead) {
              this._kill(e, j, events);
              const punch = isPunchKill(e, false);
              events.push({ type: 'kill', enemy: e, gore: punch, elite: punch });
            }
          }
        }
      }
    }

    this._tickBossHazards(dt, events);
    this._tickDangerPulses(dt, events);
    this._tickZonePressure(dt, events);

    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      g.life -= dt;
      if (g.pop > 0) g.pop -= dt;
      const d = Math.hypot(g.x - this.px, g.z - this.pz);
      if (d < this.magnet * 1.4) {
        const pull = Math.min(14, 6 + (this.magnet - d));
        g.x += ((this.px - g.x) / (d || 1)) * pull * dt;
        g.z += ((this.pz - g.z) / (d || 1)) * pull * dt;
      }
      if (d < PLAYER.radius + g.r + 0.35) {
        if (g.kind === 'heal') {
          this.hp = Math.min(this.maxHp, this.hp + 2);
          events.push({ type: 'heal', amount: 2 });
        } else if (g.kind === 'magnet') {
          // Same as magnet util card (×1.35, max 4 stacks via taken) — no new formula.
          if (!this.taken) this.taken = {};
          const card = CARDS_BY_ID && CARDS_BY_ID.magnet;
          const max = (card && card.max != null) ? card.max : 4;
          const stacks = this.taken.magnet || 0;
          if (stacks < max) {
            if (card && typeof card.apply === 'function') card.apply(this);
            else this.magnet *= 1.35;
            this.taken.magnet = stacks + 1;
            events.push({ type: 'magnet', stacks: this.taken.magnet });
          } else {
            events.push({ type: 'magnet', stacks, atMax: true });
          }
        } else if (g.kind === 'weapon') {
          // Already offering cards (level-up / elite / boss / prior pickup) — leave crate.
          if (this.pausedForLevel) continue;
          const offer = this._offerWeaponPickup(g.weapon);
          events.push({ type: 'weapon', id: g.weapon });
          if (offer) {
            events.push({
              type: 'weaponOffer',
              id: g.weapon,
              mode: offer.mode,
              stacks: offer.stacks,
              cards: offer.choices,
            });
            events.push({
              type: 'levelup',
              cards: offer.choices,
              from: 'pickup',
              weaponId: g.weapon,
              mode: offer.mode,
            });
          }
        } else {
          this.xp += g.xp;
        }
        this.score += 2;
        this.gems.splice(i, 1);
        if (g.kind === 'xp') events.push({ type: 'xp', x: this.px, z: this.pz });
        // Do not open a level-up over an active pickup / elite / boss card offer.
        if (this.xp >= this.xpNeed && !this.pausedForLevel) {
          this._levelUp();
          events.push({ type: 'levelup', cards: this.pendingCards });
        }
      } else if (g.life <= 0) this.gems.splice(i, 1);
    }

    this._beatCheck(events);

    const { density } = swarmPressure(this.t);
    const paused = this.t < this._spawnPauseUntil;
    if (!paused) this.spawnAcc += dt * density;
    const cap = 24 + Math.min(36, Math.floor(this.t / 8));
    while (!paused && this.spawnAcc >= 1 && this.enemies.length < cap) {
      this.spawnAcc -= 1;
      this._spawn();
    }
    this.waveT -= dt;
    if (!paused && this.waveT <= 0) {
      this._waveBurst();
      this.waveT = 11 + this.rng() * 5;
      events.push({ type: 'wave' });
    }

    return { events };
  }
}

export { DROP, cratesFor, WEAPON_IDS, PRIMARY_VISUAL_WEAPONS, SLOT_WEAPONS, WEAPON_SLOT_MAX, isSlotWeapon, emptyWeaponSlots, weaponSlotLevel };
