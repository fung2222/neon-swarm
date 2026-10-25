import { ARENA, PLAYER, ENEMIES, DROP, xpToLevel, swarmPressure, pickCards, pickEnemyType, MECH_BY_ID, WEAPON_ICONS, shotTier, resolveMechCombat } from './config.js';
import { muzzleWorld } from './muzzle.js';

const WEAPON_IDS = Object.keys(WEAPON_ICONS);

/** Per-weapon muzzle distance (along aim) + height. Used by _emitBullet + fire VFX. */
const MUZZLE_BY_WEAPON = {
  mg: { dist: 0.72, y: 0.95 },
  laser: { dist: 0.90, y: 1.05 },
  shotgun: { dist: 0.62, y: 0.88 },
  rocket: { dist: 0.78, y: 1.10 },
  grenade: { dist: 0.55, y: 0.75 },
  plasma: { dist: 0.70, y: 0.98 },
};

/** Weapons that update body visual facing (primary). Secondaries keep their own fire-event aim. */
const PRIMARY_VISUAL_WEAPONS = new Set(['mg', 'laser']);

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

function isPunchKill(e, heavyWeapon = false) {
  if (heavyWeapon) return true;
  const k = e && e.kind;
  return k === 'chief' || k === 'mech' || k === 'walker' || k === 'officer';
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
    this.laserT = 0;
    this.shotgunT = 0;
    this.rocketT = 0;
    this.grenadeT = 0;
    this.plasmaT = 0;
    this.invuln = 1.5;

    this.enemies = [];
    this.bullets = [];
    this.zones = []; // plasma puddles / delayed blasts
    this.gems = [];
    this.spawnAcc = 0;
    this.hitFlash = 0;
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
    for (let i = 0; i < 10; i++) this._spawn();
  }

  moveDir(dx, dz) {
    const len = Math.hypot(dx, dz) || 1;
    this.vx = dx / len;
    this.vz = dz / len;
  }
  stopMove() { this.vx = 0; this.vz = 0; }

  applyCard(card) {
    card.apply(this);
    if (!this.taken) this.taken = {};
    this.taken[card.id] = (this.taken[card.id] || 0) + 1;
    this.pendingCards = null;
    this.pausedForLevel = false;
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
    return pickEnemyType(this.rng, this.t);
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
      x: c.x, z: c.z, vx: 0, vz: 0,
      hp: def.hp * hpMul, maxHp: def.hp * hpMul,
      speed: def.speed * speedMul, r: def.radius,
      xp: def.xp, score: def.score, color: def.color, chase: def.chase,
      damage: def.damage || 1, shield: def.shield || 0,
      hit: 0, slow: 0, wob: this.rng() * Math.PI * 2,
      animPhase: this.rng() * Math.PI * 2,
    });
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
    const hold = 0.20;
    const stealFrac = 0.20;
    const stealAbs = 1.25;
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
    if (!sticky) {
      sticky = best;
      this._stickyUntil = this.t + hold;
    } else {
      const sd = Math.hypot(sticky.x - this.px, sticky.z - this.pz);
      const holding = this.t < this._stickyUntil;
      const clearlyCloser = best !== sticky && (bestD <= sd * (1 - stealFrac) || (sd - bestD) >= stealAbs);
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
    events.push({
      type: 'fire',
      weapon,
      aimX: ax,
      aimZ: az,
      muzzleX: bullet.x,
      muzzleY: bullet.y != null ? bullet.y : 0.95,
      muzzleZ: bullet.z,
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
    const b = {
      weapon,
      tier: shotTier((this.taken && this.taken[weapon]) || opts.tierStacks || 0),
      x: mw.x + (opts.ox || 0),
      z: mw.z + (opts.oz || 0),
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
    // Aim + shared muzzle win over any opts spread (ox/oz already applied above).
    b.x = mw.x + (opts.ox || 0);
    b.z = mw.z + (opts.oz || 0);
    b.y = my;
    b.vx = dx * speed;
    b.vz = dz * speed;
    if (opts.vy != null) b.vy = opts.vy;
    if (opts.grav != null) b.grav = opts.grav;
    else b.grav = 0;
    this.bullets.push(b);
    return b;
  }

  /** Continuous cyan MG — excitement from volume. */
  _fireMg(events) {
    const targets = this._targetsForWeapon(this.multi || 1, this.fireRange);
    if (!targets.length) return false;
    let primary = null;
    let primaryDx = 0, primaryDz = 1;
    for (const best of targets) {
      const base = Math.atan2(best.z - this.pz, best.x - this.px);
      const jitter = (this.rng() - 0.5) * 0.08;
      const dx = Math.cos(base + jitter), dz = Math.sin(base + jitter);
      const b = this._emitBullet(dx, dz, {
        weapon: 'mg',
        dmg: this.bulletDmg,
        pierce: this.pierce,
        life: this.bulletLife,
        speed: this.bulletSpeed,
        r: 0.1,
      });
      if (!primary) { primary = { b, best, dx, dz }; primaryDx = dx; primaryDz = dz; }
    }
    this._pushFire(events, 'mg', primaryDx, primaryDz, primary.b, primary.best);
    return true;
  }

  _fireLaser(events) {
    const targets = this._targetsForWeapon(1, this.fireRange + 4);
    if (!targets.length) return false;
    const best = targets[0];
    const base = Math.atan2(best.z - this.pz, best.x - this.px);
    const stacks = this.laser;
    const dx = Math.cos(base), dz = Math.sin(base);
    const b = this._emitBullet(dx, dz, {
      weapon: 'laser',
      dmg: 1.1 + stacks * 0.55,
      pierce: 3 + stacks,
      life: 0.28,
      speed: 38,
      r: 0.16,
      tierStacks: stacks,
    });
    this._pushFire(events, 'laser', dx, dz, b, best);
    return true;
  }

  _fireShotgun(events) {
    const targets = this._targetsForWeapon(1, 6.5);
    if (!targets.length) return false;
    const best = targets[0];
    const base = Math.atan2(best.z - this.pz, best.x - this.px);
    const stacks = this.shotgun;
    const n = 5 + stacks;
    const spread = 0.55 + stacks * 0.08;
    let primary = null;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
      const a = base + t * spread;
      const dx = Math.cos(a), dz = Math.sin(a);
      const b = this._emitBullet(dx, dz, {
        weapon: 'shotgun',
        dmg: 0.55 + stacks * 0.2,
        life: 0.22,
        speed: 16 + stacks,
        r: 0.14,
        pierce: 0,
        tierStacks: stacks,
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
    const base = Math.atan2(best.z - this.pz, best.x - this.px);
    const stacks = this.rocket;
    const dx = Math.cos(base), dz = Math.sin(base);
    const b = this._emitBullet(dx, dz, {
      weapon: 'rocket',
      dmg: 2.2 + stacks * 1.4,
      life: 1.6,
      speed: 7.5 + stacks * 0.8,
      r: 0.28,
      pierce: 0,
      aoe: 1.6 + stacks * 0.35,
      aoeDmg: 2.5 + stacks * 1.2,
      tierStacks: stacks,
    });
    this._pushFire(events, 'rocket', dx, dz, b, best);
    return true;
  }

  _fireGrenade(events) {
    // Forward-only ~120° fan (dot >= 0.5). Never pick nearest behind.
    // No legal front target → fixed-distance throw along primary forward (same dir for aim/arc/impact).
    const fwd = this.primaryForward();
    const throwAim = resolveGrenadeThrow(
      this.px, this.pz, fwd.x, fwd.z, this.enemies, this.fireRange
    );
    const dx = throwAim.dx, dz = throwAim.dz;
    const dist = throwAim.dist;
    const best = throwAim.target;
    const stacks = this.grenade;
    const speed = 6.5 + stacks * 0.5;
    const b = this._emitBullet(dx, dz, {
      weapon: 'grenade',
      dmg: 0.4,
      life: 1.1,
      speed,
      r: 0.22,
      pierce: 99,
      fuse: 0.75 - stacks * 0.05,
      grav: 14,
      vy: 7.5 + Math.min(4, dist * 0.25),
      aoe: 1.9 + stacks * 0.4,
      aoeDmg: 3.2 + stacks * 1.4,
      tierStacks: stacks,
      hitIds: new Set(),
    });
    b.noHit = true;
    b.grenadeMode = throwAim.mode;
    this._pushFire(events, 'grenade', dx, dz, b, best, { updateVisual: false });
    return true;
  }

  _firePlasma(events) {
    const targets = this._targetsForWeapon(1, this.fireRange);
    if (!targets.length) return false;
    const best = targets[0];
    const base = Math.atan2(best.z - this.pz, best.x - this.px);
    const stacks = this.plasma;
    const dx = Math.cos(base), dz = Math.sin(base);
    const b = this._emitBullet(dx, dz, {
      weapon: 'plasma',
      dmg: 1.2 + stacks * 0.6,
      life: 0.9,
      speed: 9,
      r: 0.26,
      pierce: 0,
      puddle: 1.4 + stacks * 0.35,
      aoeDmg: 0.9 + stacks * 0.35,
      tierStacks: stacks,
    });
    this._pushFire(events, 'plasma', dx, dz, b, best);
    return true;
  }

  _aoeAt(x, z, radius, dmg, events, tag = 'blast') {
    for (let j = this.enemies.length - 1; j >= 0; j--) {
      const e = this.enemies[j];
      if (Math.hypot(e.x - x, e.z - z) > radius + e.r) continue;
      e.hp -= dmg * (1 - (e.shield || 0));
      e.hit = 0.18;
      events.push({ type: 'hit', x: e.x, z: e.z, color: e.color, kind: e.kind, heavy: true });
      if (e.hp <= 0) { this._kill(e, j); events.push({ type: 'kill', enemy: e, gore: true }); }
    }
    events.push({ type: 'explode', x, z, r: radius, tag });
  }

  _novaBlast(events) {
    const R = 2.1 + this.nova * 0.35;
    const dmg = 2 + this.nova * 1.5;
    for (let j = this.enemies.length - 1; j >= 0; j--) {
      const e = this.enemies[j];
      if (Math.hypot(e.x - this.px, e.z - this.pz) > R) continue;
      e.hp -= dmg; e.hit = 0.15;
      if (e.hp <= 0) { this._kill(e, j); events.push({ type: 'kill', enemy: e, gore: true }); }
    }
    events.push({ type: 'nova', r: R });
  }

  _dropGem(e) {
    const healChance = e.family === 'human' ? 0.1 : 0.06;
    if (this.rng() < healChance) {
      this.gems.push({ x: e.x + 0.25, z: e.z + 0.25, xp: 0, r: 0.2, life: 18, pop: 0.25, letter: 'H', kind: 'heal' });
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

  _kill(e, i) {
    this.enemies.splice(i, 1);
    this.kills++;
    if (this.kills >= this.goalKills) {
      this.goalsCleared++;
      this.score += 250 * this.goalsCleared;
      this.goalKills += 40 + this.goalsCleared * 10;
    }
    this.score += e.score + Math.floor(this.t);
    this._dropGem(e);
    if ((e.kind === 'chief' || e.kind === 'mech') && this.rng() < 0.35) {
      const w = this.weaponIcon();
      this.gems.push({
        x: e.x, z: e.z, xp: 0, r: 0.22, life: 22, pop: 0.3, letter: 'W', kind: 'weapon',
        weapon: w, weaponIcon: WEAPON_ICONS[w] || '⚡',
      });
    }
  }

  _tickWeapons(dt, events) {
    let fired = false;
    // Base continuous MG — only when a foe is in range
    this.fireT -= dt;
    if (this.fireT <= 0) {
      if (this._fireMg(events)) {
        this.fireT = this.fireCd;
        this.muzzle = 0.08; this.aimHold = 0.42;
        fired = true;
      } else {
        this.fireT = 0.05;
      }
    }

    if (this.laser > 0) {
      this.laserT -= dt;
      if (this.laserT <= 0 && this._fireLaser(events)) {
        this.laserT = Math.max(0.18, 0.42 - this.laser * 0.05);
        this.muzzle = 0.12; this.aimHold = 0.48;
        fired = true;
      }
    }
    if (this.shotgun > 0) {
      this.shotgunT -= dt;
      if (this.shotgunT <= 0 && this._fireShotgun(events)) {
        this.shotgunT = Math.max(0.35, 0.85 - this.shotgun * 0.1);
        this.muzzle = 0.14; this.aimHold = 0.48;
        fired = true;
      }
    }
    if (this.rocket > 0) {
      this.rocketT -= dt;
      if (this.rocketT <= 0 && this._fireRocket(events)) {
        this.rocketT = Math.max(0.9, 2.1 - this.rocket * 0.25);
        this.muzzle = 0.16; this.aimHold = 0.48;
        fired = true;
      }
    }
    if (this.grenade > 0) {
      this.grenadeT -= dt;
      if (this.grenadeT <= 0 && this._fireGrenade(events)) {
        this.grenadeT = Math.max(0.85, 1.9 - this.grenade * 0.2);
        this.muzzle = 0.14; this.aimHold = 0.48;
        fired = true;
      }
    }
    if (this.plasma > 0) {
      this.plasmaT -= dt;
      if (this.plasmaT <= 0 && this._firePlasma(events)) {
        this.plasmaT = Math.max(0.55, 1.35 - this.plasma * 0.15);
        this.muzzle = 0.12; this.aimHold = 0.48;
        fired = true;
      }
    }
    return fired;
  }

  step(dt) {
    if (!this.alive || this.pausedForLevel) return { events: [] };
    const events = [];
    this.t += dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.muzzle > 0) this.muzzle -= dt;
    if (this.aimHold > 0) this.aimHold -= dt;

    this.px += this.vx * this.speed * dt;
    this.pz += this.vz * this.speed * dt;
    const clamped = this._softClamp(this.px, this.pz, PLAYER.radius);
    this.px = clamped.x; this.pz = clamped.z;

    this._tickWeapons(dt, events);

    if (this.nova > 0) {
      this.novaT -= dt;
      if (this.novaT <= 0) {
        this._novaBlast(events);
        this.novaT = this.novaCd || 3.5;
      }
    }

    // ---- projectiles
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (b.grav) {
        b.vy -= b.grav * dt;
        b.y += b.vy * dt;
        if (b.y < 0.05) { b.y = 0.05; b.vy = 0; }
      }
      b.x += b.vx * dt; b.z += b.vz * dt; b.life -= dt;
      if (b.fuse > 0) {
        b.fuse -= dt;
        if (b.fuse <= 0) {
          this._aoeAt(b.x, b.z, b.aoe || 1.8, b.aoeDmg || b.dmg, events, b.weapon);
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
        if (Math.hypot(b.x - e.x, b.z - e.z) < er) {
          e.hp -= b.dmg * (1 - (e.shield || 0));
          e.hit = 0.12;
          b.hitIds.add(e);
          const heavy = b.weapon === 'rocket' || b.weapon === 'laser' || b.weapon === 'grenade';
          events.push({ type: 'hit', x: e.x, z: e.z, color: e.color, kind: e.kind, heavy });
          if (e.hp <= 0) {
            this._kill(e, j);
            const punch = isPunchKill(e, heavy);
            events.push({ type: 'kill', enemy: e, gore: punch, elite: punch });
          }
          if (b.aoe && (b.weapon === 'rocket' || b.weapon === 'plasma')) {
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

    // ---- lingering zones (acid / plasma)
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      z.life -= dt;
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (Math.hypot(e.x - z.x, e.z - z.z) < z.r + e.r) {
          e.hp -= z.dps * dt * 3.2;
          e.slow = Math.max(e.slow, 0.35);
          e.hit = Math.max(e.hit, 0.05);
          if (e.hp <= 0) {
            this._kill(e, j);
            const punch = isPunchKill(e, true); // lingering acid still reads as special
            events.push({ type: 'kill', enemy: e, gore: punch, elite: punch });
          }
        }
      }
      if (z.life <= 0) this.zones.splice(i, 1);
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
            e.hp -= 0.55 * this.bulletDmg * dt * 8;
            e.hit = 0.08;
            if (e.hp <= 0) {
              this._kill(e, j);
              const punch = isPunchKill(e, false);
              events.push({ type: 'kill', enemy: e, gore: punch, elite: punch });
            }
          }
        }
      }
    }

    for (const e of this.enemies) {
      if (e.hit > 0) e.hit -= dt;
      if (e.slow > 0) e.slow -= dt;
      const slowMul = e.slow > 0 ? Math.max(0.35, 1 - Math.min(0.55, 0.4)) : 1;
      const dx = this.px - e.x, dz = this.pz - e.z;
      const len = Math.hypot(dx, dz) || 1;
      const stepX = (dx / len) * e.speed * e.chase * slowMul * dt;
      const stepZ = (dz / len) * e.speed * e.chase * slowMul * dt;
      e.vx = stepX / Math.max(dt, 1e-6);
      e.vz = stepZ / Math.max(dt, 1e-6);
      e.x += stepX;
      e.z += stepZ;
      const moving = Math.hypot(e.vx, e.vz) > 0.05;
      e.animPhase = (e.animPhase || 0) + (moving ? Math.max(8, Math.hypot(e.vx, e.vz) * 6.5) * dt : 0);
      const ec = this._softClamp(e.x, e.z, e.r);
      e.x = ec.x; e.z = ec.z;
      if (this.invuln <= 0 && Math.hypot(e.x - this.px, e.z - this.pz) < e.r + PLAYER.radius) {
        const taken = Math.max(1, (e.damage || 2) - (this.armor || 0));
        this.hp -= taken;
        this.invuln = 0.85 + (this.deflect || 0);
        this.hitFlash = 0.28;
        events.push({ type: 'hurt', by: e.kind, nameZh: e.nameZh, nameEn: e.nameEn });
        e.x -= (dx / len) * 0.9;
        e.z -= (dz / len) * 0.9;
        if (this.hp <= 0) {
          this.alive = false;
          this.hp = 0;
          this.killer = { kind: e.kind, zh: e.nameZh, en: e.nameEn };
          events.push({ type: 'dead' });
        }
      }
    }

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
        } else if (g.kind === 'weapon') {
          events.push({ type: 'weapon', id: g.weapon });
        } else {
          this.xp += g.xp;
        }
        this.score += 2;
        this.gems.splice(i, 1);
        if (g.kind === 'xp') events.push({ type: 'xp', x: this.px, z: this.pz });
        if (this.xp >= this.xpNeed) {
          this._levelUp();
          events.push({ type: 'levelup', cards: this.pendingCards });
        }
      } else if (g.life <= 0) this.gems.splice(i, 1);
    }

    const { density } = swarmPressure(this.t);
    this.spawnAcc += dt * density;
    const cap = 24 + Math.min(36, Math.floor(this.t / 8));
    while (this.spawnAcc >= 1 && this.enemies.length < cap) {
      this.spawnAcc -= 1;
      this._spawn();
    }
    this.waveT -= dt;
    if (this.waveT <= 0) {
      this._waveBurst();
      this.waveT = 11 + this.rng() * 5;
      events.push({ type: 'wave' });
    }

    return { events };
  }
}

export { DROP, cratesFor, WEAPON_IDS, PRIMARY_VISUAL_WEAPONS };
