import { ARENA, PLAYER, ENEMIES, xpToLevel, swarmPressure, pickCards } from './config.js';

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Game {
  constructor({ seed = 1, endless = true } = {}) {
    this.rng = mulberry32(seed >>> 0);
    this.endless = endless;
    this.t = 0;
    this.score = 0;
    this.kills = 0;
    this.alive = true;
    this.level = 1;
    this.xp = 0;
    this.xpNeed = xpToLevel(1);
    this.pendingCards = null;
    this.pausedForLevel = false;

    this.px = 0; this.pz = 0;
    this.vx = 0; this.vz = 0;
    this.maxHp = PLAYER.hp;
    this.hp = PLAYER.hp;
    this.speed = PLAYER.speed;
    this.fireCd = PLAYER.fireCd;
    this.fireT = 0;
    this.bulletDmg = PLAYER.bulletDmg;
    this.bulletSpeed = PLAYER.bulletSpeed;
    this.bulletLife = PLAYER.bulletLife;
    this.magnet = PLAYER.magnet;
    this.armor = PLAYER.armor || 0;
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
    this.waveT = 12;
    for (let i = 0; i < 5; i++) this._spawn();
  }

  moveDir(dx, dz) {
    const len = Math.hypot(dx, dz) || 1;
    this.vx = dx / len;
    this.vz = dz / len;
  }
  stopMove() { this.vx = 0; this.vz = 0; }

  applyCard(card) {
    card.apply(this);
    this.pendingCards = null;
    this.pausedForLevel = false;
  }

  _levelUp() {
    this.level++;
    this.xp -= this.xpNeed;
    if (this.xp < 0) this.xp = 0;
    this.xpNeed = xpToLevel(this.level);
    this.pendingCards = pickCards(this.rng, 3);
    this.pausedForLevel = true;
  }

  _pickType() {
    const t = this.t;
    if (t < 18) return 'runner';
    if (t < 35) return this.rng() < 0.75 ? 'runner' : 'swarmling';
    if (t < 55) {
      const r = this.rng();
      if (r < 0.45) return 'runner';
      if (r < 0.7) return 'swarmling';
      if (r < 0.9) return 'tank';
      return 'splitter';
    }
    const r = this.rng();
    if (r < 0.35) return 'runner';
    if (r < 0.55) return 'swarmling';
    if (r < 0.78) return 'tank';
    return 'splitter';
  }

  /** Soft radial clamp — gentle push near soft rim, hard stop at half. */
  _softClamp(x, z, radius = 0) {
    const lim = ARENA.half - radius;
    const soft = ARENA.soft - radius;
    let r = Math.hypot(x, z);
    if (r <= soft || r < 1e-6) return { x, z };
    if (r > lim) {
      const s = lim / r;
      return { x: x * s, z: z * s };
    }
    // Soft band: pull slightly inward (proportion of overflow)
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
    let x = this.px + Math.cos(ang) * dist;
    let z = this.pz + Math.sin(ang) * dist;
    const c = this._softClamp(x, z, def.radius);
    x = c.x; z = c.z;
    const { hpMul, speedMul } = swarmPressure(this.t);
    this.enemies.push({
      type, x, z,
      hp: def.hp * hpMul, maxHp: def.hp * hpMul,
      speed: def.speed * speedMul, r: def.radius,
      xp: def.xp, score: def.score, color: def.color, chase: def.chase,
      split: def.split || 0, hit: 0, slow: 0,
    });
  }

  _waveBurst() {
    const n = 5 + Math.min(10, Math.floor(this.t / 22));
    for (let i = 0; i < n; i++) this._spawn(this.rng() < 0.6 ? 'swarmling' : 'runner');
  }

  _nearest(n = 1) {
    const ranked = this.enemies
      .map((e) => ({ e, d: Math.hypot(e.x - this.px, e.z - this.pz) }))
      .sort((a, b) => a.d - b.d);
    return ranked.slice(0, n).map((x) => x.e);
  }

  _emitBullet(dx, dz, opts = {}) {
    const len = Math.hypot(dx, dz) || 1;
    dx /= len; dz /= len;
    this.bullets.push({
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
      let dx = best.x - this.px, dz = best.z - this.pz;
      const base = Math.atan2(dz, dx);
      this._emitBullet(Math.cos(base), Math.sin(base));
      for (let s = 1; s <= this.spread; s++) {
        const a1 = base + s * 0.32;
        const a2 = base - s * 0.32;
        this._emitBullet(Math.cos(a1), Math.sin(a1));
        this._emitBullet(Math.cos(a2), Math.sin(a2));
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

  _dropGem(e) {
    // XP gems carry a shape tag so the view can show readable silhouettes
    this.gems.push({ x: e.x, z: e.z, xp: e.xp, r: 0.18, life: 16, pop: 0.25, shape: 'xp' });
  }

  _kill(e, i) {
    this.enemies.splice(i, 1);
    this.kills++;
    this.score += e.score + Math.floor(this.t);
    this._dropGem(e);
    if (e.split) {
      for (let k = 0; k < e.split; k++) {
        const a = this.rng() * Math.PI * 2;
        const def = ENEMIES.runner;
        const { hpMul, speedMul } = swarmPressure(this.t);
        this.enemies.push({
          type: 'runner', x: e.x + Math.cos(a) * 0.4, z: e.z + Math.sin(a) * 0.4,
          hp: def.hp * hpMul * 0.6, maxHp: def.hp * hpMul * 0.6,
          speed: def.speed * speedMul * 1.15, r: def.radius * 0.85,
          xp: 1, score: 8, color: def.color, chase: 1, split: 0, hit: 0, slow: 0,
        });
      }
    }
  }

  step(dt) {
    if (!this.alive || this.pausedForLevel) return { events: [] };
    const events = [];
    this.t += dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    const sp = this.speed;
    this.px += this.vx * sp * dt;
    this.pz += this.vz * sp * dt;
    const clamped = this._softClamp(this.px, this.pz, PLAYER.radius);
    this.px = clamped.x; this.pz = clamped.z;

    this.fireT -= dt;
    if (this.fireT <= 0 && this.enemies.length) {
      this._fire();
      this.fireT = this.fireCd;
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
      if (b.life <= 0 || br > ARENA.spawnFar + 8) { this.bullets.splice(i, 1); continue; }
      let consumed = false;
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (b.hitIds.has(e)) continue;
        if (Math.hypot(b.x - e.x, b.z - e.z) < b.r + e.r) {
          e.hp -= b.dmg; e.hit = 0.12;
          if (b.frost) e.slow = Math.max(e.slow, 0.5 + b.frost);
          b.hitIds.add(e);
          events.push({ type: 'hit', x: e.x, z: e.z, color: e.color });
          if (e.hp <= 0) { this._kill(e, j); events.push({ type: 'kill', enemy: e }); }
          if (b.pierce > 0) { b.pierce -= 1; }
          else { this.bullets.splice(i, 1); consumed = true; break; }
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
        const raw = 2;
        const taken = Math.max(1, raw - (this.armor || 0));
        this.hp -= taken;
        this.invuln = 0.85 + (this.deflect || 0);
        this.hitFlash = 0.28;
        events.push({ type: 'hurt' });
        e.x -= (dx / len) * 0.9;
        e.z -= (dz / len) * 0.9;
        if (this.hp <= 0) {
          this.alive = false;
          this.hp = 0;
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
      if (d < PLAYER.radius + g.r + 0.35 || Math.hypot(g.x - this.px, g.z - this.pz) < 0.7) {
        this.xp += g.xp;
        this.score += 2;
        this.gems.splice(i, 1);
        events.push({ type: 'xp', x: this.px, z: this.pz });
        if (this.xp >= this.xpNeed) {
          this._levelUp();
          events.push({ type: 'levelup', cards: this.pendingCards });
        }
      } else if (g.life <= 0) this.gems.splice(i, 1);
    }

    const { density } = swarmPressure(this.t);
    this.spawnAcc += dt * density;
    const cap = 32 + Math.min(48, Math.floor(this.t / 8));
    while (this.spawnAcc >= 1 && this.enemies.length < cap) {
      this.spawnAcc -= 1;
      this._spawn();
    }
    this.waveT -= dt;
    if (this.waveT <= 0) {
      this._waveBurst();
      this.waveT = 14 + this.rng() * 6;
      events.push({ type: 'wave' });
    }

    return { events };
  }
}
