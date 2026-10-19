import { ARENA, PLAYER, ENEMIES, DROP, xpToLevel, swarmPressure, pickCards, pickEnemyType, MECH_BY_ID, WEAPON_ICONS, shotTier } from './config.js';

const WEAPON_IDS = Object.keys(WEAPON_ICONS);

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
    const bonus = this.mech.bonus || {};
    this.maxHp = PLAYER.hp + (bonus.maxHp || 0);
    this.hp = this.maxHp;
    this.speed = PLAYER.speed * (bonus.speedMul || 1);
    this.fireCd = PLAYER.fireCd;
    this.fireT = 0;
    this.bulletDmg = PLAYER.bulletDmg;
    this.bulletSpeed = PLAYER.bulletSpeed;
    this.bulletLife = PLAYER.bulletLife;
    this.magnet = PLAYER.magnet * (bonus.magnetMul || 1);
    this.armor = PLAYER.armor + (bonus.armor || 0);
    this.deflect = 0;
    this.orbits = 0;
    this.spread = 0;
    this.pierce = 0;
    this.multi = 1;
    this.nova = 0;
    this.novaCd = 0;
    this.novaT = 0;
    this.frost = 0;
    this.invuln = 1.5;

    this.enemies = [];
    this.bullets = [];
    this.gems = [];
    this.spawnAcc = 0;
    this.hitFlash = 0;
    this.muzzle = 0;
    this.waveT = 8;
    this.killer = null;
    // contract goal: the kill target shown on the HUD; each clear raises it
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

  /** Soft radial clamp — gentle push near soft rim, hard stop at half. */
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
      type, kind: def.kind, family: def.family, nameZh: def.zh, nameEn: def.en,
      x: c.x, z: c.z,
      hp: def.hp * hpMul, maxHp: def.hp * hpMul,
      speed: def.speed * speedMul, r: def.radius,
      xp: def.xp, score: def.score, color: def.color, chase: def.chase,
      damage: def.damage || 1, shield: def.shield || 0,
      hit: 0, slow: 0, wob: this.rng() * Math.PI * 2,
    });
  }

  /** A squad: soldiers first, a couple of support frames walking behind them. */
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

  _nearest(n = 1) {
    return this.enemies
      .map((e) => ({ e, d: Math.hypot(e.x - this.px, e.z - this.pz) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, n)
      .map((x) => x.e);
  }

  /** The weapon whose look the muzzle / default shots borrow (highest stack owned). */
  primaryWeapon() {
    let best = 'dmg';
    let n = -1;
    for (const id of WEAPON_IDS) {
      const c = this.taken ? (this.taken[id] || 0) : 0;
      if (c > n) { n = c; best = id; }
    }
    return best;
  }

  _emitBullet(dx, dz, opts = {}) {
    const len = Math.hypot(dx, dz) || 1;
    dx /= len; dz /= len;
    const weapon = opts.weapon || this.primaryWeapon();
    this.bullets.push({
      weapon, tier: shotTier((this.taken && this.taken[weapon]) || 0),
      x: this.px, z: this.pz,
      vx: dx * this.bulletSpeed, vz: dz * this.bulletSpeed,
      life: this.bulletLife || PLAYER.bulletLife, dmg: this.bulletDmg,
      r: 0.14, pierce: this.pierce, hitIds: new Set(),
      frost: this.frost, ...opts,
    });
  }

  _fire() {
    const targets = this._nearest(this.multi || 1);
    if (!targets.length) {
      this._emitBullet(0, -1);
      return;
    }
    for (const best of targets) {
      const base = Math.atan2(best.z - this.pz, best.x - this.px);
      const wide = this.spread > 0;
      this._emitBullet(Math.cos(base), Math.sin(base), { weapon: wide ? 'spread' : 'dmg' });
      for (let s = 1; s <= this.spread; s++) {
        this._emitBullet(Math.cos(base + s * 0.32), Math.sin(base + s * 0.32), { weapon: 'spread' });
        this._emitBullet(Math.cos(base - s * 0.32), Math.sin(base - s * 0.32), { weapon: 'spread' });
      }
    }
  }

  _novaBlast(events) {
    const R = 2.1 + this.nova * 0.35;
    const dmg = 2 + this.nova * 1.5;
    for (let j = this.enemies.length - 1; j >= 0; j--) {
      const e = this.enemies[j];
      if (Math.hypot(e.x - this.px, e.z - this.pz) > R) continue;
      e.hp -= dmg; e.hit = 0.15;
      if (this.frost) e.slow = Math.max(e.slow, 0.6);
      if (e.hp <= 0) { this._kill(e, j); events.push({ type: 'kill', enemy: e }); }
    }
    events.push({ type: 'nova', r: R });
  }

  /** XP crates (+ a repair or shield cube now and then — readable drops, no mystery sprites). */
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

  /** The weapon icon a kill drops every so often (big English letter "W" + gun emblem on the view). */
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
      this.gems.push({ x: e.x, z: e.z, xp: 0, r: 0.22, life: 22, pop: 0.3, letter: 'W', kind: 'weapon', weapon: this.weaponIcon(), weaponIcon: WEAPON_ICONS[this.weaponIcon()] || '⚡' });
    }
  }

  step(dt) {
    if (!this.alive || this.pausedForLevel) return { events: [] };
    const events = [];
    this.t += dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.muzzle > 0) this.muzzle -= dt;

    this.px += this.vx * this.speed * dt;
    this.pz += this.vz * this.speed * dt;
    const clamped = this._softClamp(this.px, this.pz, PLAYER.radius);
    this.px = clamped.x; this.pz = clamped.z;

    this.fireT -= dt;
    if (this.fireT <= 0 && this.enemies.length) {
      this._fire();
      this.fireT = this.fireCd;
      this.muzzle = 0.14;
      events.push({ type: 'fire' });
    }

    if (this.nova > 0) {
      this.novaT -= dt;
      if (this.novaT <= 0) {
        this._novaBlast(events);
        this.novaT = this.novaCd || 3.5;
      }
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt; b.z += b.vz * dt; b.life -= dt;
      const br = Math.hypot(b.x - this.px, b.z - this.pz);
      if (b.life <= 0 || br > ARENA.spawnFar + 10) { this.bullets.splice(i, 1); continue; }
      let consumed = false;
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (b.hitIds.has(e)) continue;
        if (Math.hypot(b.x - e.x, b.z - e.z) < b.r + e.r) {
          e.hp -= b.dmg * (1 - (e.shield || 0)); e.hit = 0.12;
          if (b.frost) e.slow = Math.max(e.slow, 0.5 + b.frost);
          b.hitIds.add(e);
          events.push({ type: 'hit', x: e.x, z: e.z, color: e.color, kind: e.kind });
          if (e.hp <= 0) { this._kill(e, j); events.push({ type: 'kill', enemy: e }); }
          if (b.pierce > 0) { b.pierce -= 1; } else { this.bullets.splice(i, 1); consumed = true; break; }
        }
      }
      if (consumed) continue;
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
            if (this.frost) e.slow = Math.max(e.slow, 0.35);
            if (e.hp <= 0) { this._kill(e, j); events.push({ type: 'kill', enemy: e }); }
          }
        }
      }
    }

    for (const e of this.enemies) {
      if (e.hit > 0) e.hit -= dt;
      if (e.slow > 0) e.slow -= dt;
      const slowMul = e.slow > 0 ? Math.max(0.35, 1 - Math.min(0.55, this.frost || 0.35)) : 1;
      const dx = this.px - e.x, dz = this.pz - e.z;
      const len = Math.hypot(dx, dz) || 1;
      e.x += (dx / len) * e.speed * e.chase * slowMul * dt;
      e.z += (dz / len) * e.speed * e.chase * slowMul * dt;
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

export { DROP, cratesFor, WEAPON_IDS };
