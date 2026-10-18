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
    this.magnet = PLAYER.magnet;
    this.orbits = 0;
    this.invuln = 1.5; // spawn protection

    this.enemies = [];
    this.bullets = [];
    this.gems = [];
    this.orbitHits = []; // cooldown per orbit index
    this.spawnAcc = 0;
    this.hitFlash = 0;
    // warmup spawn so the first seconds feel alive
    for (let i = 0; i < 4; i++) this._spawn();
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
    while (this.xp >= this.xpNeed && this.level < 99) {
      // only one pick UI at a time; bank extra for next
      break;
    }
  }

  _spawn() {
    const types = ['runner', 'runner', 'runner', 'tank', 'splitter'];
    // unlock cadence
    if (this.t < 25) types.length = 3; // runners only early
    else if (this.t < 55) { /* runners + tank via weights */ }
    const type = types[Math.floor(this.rng() * (this.t < 25 ? 3 : this.t < 55 ? 4 : 5))];
    const def = ENEMIES[type];
    const ang = this.rng() * Math.PI * 2;
    const dist = ARENA.half * 0.92 + this.rng() * 1.2;
    const { hpMul, speedMul } = swarmPressure(this.t);
    this.enemies.push({
      type, x: Math.cos(ang) * dist, z: Math.sin(ang) * dist,
      hp: def.hp * hpMul, maxHp: def.hp * hpMul,
      speed: def.speed * speedMul, r: def.radius,
      xp: def.xp, score: def.score, color: def.color, chase: def.chase,
      split: def.split || 0, hit: 0,
    });
  }

  _fire() {
    // nearest enemy
    let best = null, bestD = 1e9;
    for (const e of this.enemies) {
      const d = Math.hypot(e.x - this.px, e.z - this.pz);
      if (d < bestD) { bestD = d; best = e; }
    }
    let dx = 0, dz = -1;
    if (best) { dx = best.x - this.px; dz = best.z - this.pz; }
    const len = Math.hypot(dx, dz) || 1;
    dx /= len; dz /= len;
    this.bullets.push({
      x: this.px, z: this.pz, vx: dx * this.bulletSpeed, vz: dz * this.bulletSpeed,
      life: PLAYER.bulletLife, dmg: this.bulletDmg, r: 0.14,
    });
  }

  _dropGem(e) {
    this.gems.push({ x: e.x, z: e.z, xp: e.xp, r: 0.18, life: 12 });
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
          xp: 1, score: 8, color: def.color, chase: 1, split: 0, hit: 0,
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

    // move player
    const sp = this.speed;
    this.px += this.vx * sp * dt;
    this.pz += this.vz * sp * dt;
    const lim = ARENA.half - PLAYER.radius;
    this.px = Math.max(-lim, Math.min(lim, this.px));
    this.pz = Math.max(-lim, Math.min(lim, this.pz));

    // fire
    this.fireT -= dt;
    if (this.fireT <= 0 && this.enemies.length) {
      this._fire();
      this.fireT = this.fireCd;
      events.push({ type: 'fire' });
    }

    // bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt; b.z += b.vz * dt; b.life -= dt;
      if (b.life <= 0 || Math.hypot(b.x, b.z) > ARENA.half + 2) { this.bullets.splice(i, 1); continue; }
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (Math.hypot(b.x - e.x, b.z - e.z) < b.r + e.r) {
          e.hp -= b.dmg; e.hit = 0.12;
          this.bullets.splice(i, 1);
          if (e.hp <= 0) { this._kill(e, j); events.push({ type: 'kill', enemy: e }); }
          else events.push({ type: 'hit' });
          break;
        }
      }
    }

    // orbit blades
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
            if (e.hp <= 0) { this._kill(e, j); events.push({ type: 'kill', enemy: e }); }
          }
        }
      }
    }

    // enemies chase
    for (const e of this.enemies) {
      if (e.hit > 0) e.hit -= dt;
      const dx = this.px - e.x, dz = this.pz - e.z;
      const len = Math.hypot(dx, dz) || 1;
      e.x += (dx / len) * e.speed * e.chase * dt;
      e.z += (dz / len) * e.speed * e.chase * dt;
      if (this.invuln <= 0 && Math.hypot(e.x - this.px, e.z - this.pz) < e.r + PLAYER.radius) {
        this.hp -= 1;
        this.invuln = 0.85;
        this.hitFlash = 0.25;
        events.push({ type: 'hurt' });
        // knockback
        e.x -= (dx / len) * 0.8;
        e.z -= (dz / len) * 0.8;
        if (this.hp <= 0) {
          this.alive = false;
          this.hp = 0;
          events.push({ type: 'dead' });
        }
      }
    }

    // gems
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      g.life -= dt;
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
        events.push({ type: 'xp' });
        if (this.xp >= this.xpNeed) {
          this._levelUp();
          events.push({ type: 'levelup', cards: this.pendingCards });
        }
      } else if (g.life <= 0) this.gems.splice(i, 1);
    }

    // spawn
    const { density } = swarmPressure(this.t);
    this.spawnAcc += dt * density;
    const cap = 28 + Math.min(40, Math.floor(this.t / 8));
    while (this.spawnAcc >= 1 && this.enemies.length < cap) {
      this.spawnAcc -= 1;
      this._spawn();
    }

    return { events };
  }
}
