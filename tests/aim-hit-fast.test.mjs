/**
 * AIM-HIT-FAST-001 + AIM-HIT-FAST-002 — swept collision, precise intercept, relative sweep.
 * Run: node tests/aim-hit-fast.test.mjs
 */
import assert from 'assert';
import {
  Game,
  segmentHitsCircle,
  leadAimDir,
  closeMuzzlePos,
  AIM_LEAD_MAX_T,
  relativeSegmentHitsCircle,
  interceptAimDir,
} from '../js/logic.js';
import { muzzleWorld } from '../js/muzzle.js';
import { PLAYER } from '../js/config.js';
// ---- segmentHitsCircle (tunnel case) ----
{
  // Fast bullet steps over a small enemy: endpoints miss point-circle, segment hits.
  const er = 0.24, br = 0.1, R = er + br;
  const cx = 5, cz = 0;
  const x0 = 0, z0 = 0;
  const x1 = 10, z1 = 0; // passes through circle center
  assert.equal(segmentHitsCircle(x0, z0, x1, z1, cx, cz, R), true, 'through-center must hit');

  // Parallel miss well above
  assert.equal(segmentHitsCircle(0, 2, 10, 2, cx, cz, R), false, 'far parallel must miss');

  // Tunnel: start before, end after, neither endpoint inside circle, but path crosses
  const bx0 = 4.5, bz0 = 0;
  const step = 1.2; // larger than 2*R ≈ 0.68
  const bx1 = bx0 + step, bz1 = 0;
  assert.ok(Math.hypot(bx0 - cx, bz0 - cz) >= R, 'start outside');
  assert.ok(Math.hypot(bx1 - cx, bz1 - cz) >= R, 'end outside');
  assert.equal(segmentHitsCircle(bx0, bz0, bx1, bz1, cx, cz, R), true, 'tunneling step must hit');

  // Degenerate zero-length = point test
  assert.equal(segmentHitsCircle(5, 0, 5, 0, 5, 0, R), true);
  assert.equal(segmentHitsCircle(5, 1, 5, 1, 5, 0, 0.3), false);
  console.log('segmentHitsCircle OK');
}

// ---- leadAimDir (head-on rusher) ----
{
  const bulletSpeed = PLAYER.bulletSpeed; // 28
  // Enemy at +Z=8 rushing toward player at origin with vz=-3.5 (drone-ish)
  const lead = leadAimDir(0, 0, 0, 8, 0, -3.5, bulletSpeed, AIM_LEAD_MAX_T);
  assert.ok(lead.leadT > 0 && lead.leadT <= AIM_LEAD_MAX_T + 1e-9, 'lead clamped');
  // Predicted point is closer than current (closing)
  assert.ok(lead.tz < 8, 'predicted z closer than current');
  // Aim should still be mostly +Z
  assert.ok(lead.dz > 0.95, 'head-on aim stays forward');

  // Strafing: enemy at (6,0) with vz=4 → aim should bias toward +Z
  const strafe = leadAimDir(0, 0, 6, 0, 0, 4, bulletSpeed, 0.30);
  assert.ok(strafe.dz > 0.05, 'strafe lead biases toward velocity');
  assert.ok(strafe.dx > 0.7, 'still mostly toward current X');

  // Cap: very far target → leadT == max
  const far = leadAimDir(0, 0, 0, 40, 1, 0, 28, 0.30);
  assert.ok(Math.abs(far.leadT - 0.30) < 1e-9, 'far target clamps lead');

  // Stationary → same as raw aim
  const still = leadAimDir(0, 0, 3, 4, 0, 0, 28, 0.30);
  assert.ok(Math.abs(still.dx - 0.6) < 1e-9 && Math.abs(still.dz - 0.8) < 1e-9);
  console.log('leadAimDir OK', { headOnLeadT: lead.leadT.toFixed(3), strafeDz: strafe.dz.toFixed(3) });
}

// ---- closeMuzzlePos ----
{
  const mw = muzzleWorld(0, 0, 0, 1); // +Z / north
  const muzzleHoriz = Math.hypot(mw.x, mw.z);
  assert.ok(muzzleHoriz > 0.7, 'muzzle offset ~0.86+');

  // Far target: unchanged
  const far = closeMuzzlePos(0, 0, mw.x, mw.z, 0, 1, 5, 0.24);
  assert.equal(far.shortened, false);
  assert.ok(Math.abs(far.x - mw.x) < 1e-9);

  // Close rusher inside muzzle reach: shortened toward player
  const close = closeMuzzlePos(0, 0, mw.x, mw.z, 0, 1, 0.5, 0.24);
  assert.equal(close.shortened, true);
  assert.ok(close.spawnDist < muzzleHoriz, 'spawn pulled in');
  assert.ok(close.spawnDist <= 0.5, 'spawn not beyond foe dist');
  // Bullet spawn should be closer to origin than full muzzle
  assert.ok(Math.hypot(close.x, close.z) < muzzleHoriz - 0.05);
  console.log('closeMuzzlePos OK', { muzzleHoriz: muzzleHoriz.toFixed(3), closeSpawn: close.spawnDist.toFixed(3) });
}

// ---- Integration: MG vs head-on drone rusher lands hits with lead+swept ----
{
  const g = new Game({ seed: 77 });
  g.enemies.length = 0;
  g.bullets.length = 0;
  g.px = 0; g.pz = 0;
  g._spawn('drone');
  const e = g.enemies[0];
  // Place ahead on +Z, rushing inward
  e.x = 0; e.z = 7;
  e.vx = 0; e.vz = -3.6;
  e.hp = 50; // survive several hits for counting
  // Deterministic: no MG jitter
  g.rng = () => 0.5;

  let hits = 0;
  for (let i = 0; i < 45; i++) {
    // Keep enemy velocity (step would overwrite via chase — set after step)
    g.fireT = 0;
    const beforeHp = e.hp;
    g._fireMg([]);
    // Advance bullets with a fairly large dt (tunnel-prone)
    const dt = 1 / 20;
    // Manually tick projectiles similar to Game.step's bullet loop via step,
    // but freeze enemy motion so lead prediction stays valid for the test.
    const holdX = e.x, holdZ = e.z, holdVx = e.vx, holdVz = e.vz;
    g.step(dt);
    // Restore rusher kinematics (step moves/chases)
    if (g.enemies.indexOf(e) >= 0) {
      e.x = holdX + holdVx * dt;
      e.z = holdZ + holdVz * dt;
      e.vx = holdVx; e.vz = holdVz;
      // Stop if past player
      if (e.z < 0.4) { e.z = 0.4; e.vx = 0; e.vz = 0; }
    }
    if (e.hp < beforeHp) hits++;
  }
  assert.ok(hits >= 3, 'head-on rusher should take multiple MG hits with lead, got ' + hits);

  // Lead aim direction vs raw aim: when firing at moving foe, dx/dz bias toward velocity
  g.bullets.length = 0;
  e.x = 5; e.z = 0; e.vx = 0; e.vz = 4; e.hp = 20;
  g.rng = () => 0.5;
  g._fireMg([]);
  assert.ok(g.bullets.length >= 1);
  const b = g.bullets[0];
  // Raw atan2(0-0, 5-0) = +X only (vz=0 aim). Lead should add +Z component.
  const rawLen = Math.hypot(b.vx, b.vz) || 1;
  const aimZ = b.vz / rawLen;
  assert.ok(aimZ > 0.02, 'MG lead vs strafer should aim with +Z, aimZ=' + aimZ);
  console.log('MG integration OK', { hits, strafeAimZ: aimZ.toFixed(3) });
}

// ---- Integration: close-range spawn does not place bullet past foe ----
{
  const g = new Game({ seed: 3 });
  g.enemies.length = 0;
  g.px = 0; g.pz = 0;
  g._spawn('drone');
  const e = g.enemies[0];
  e.x = 0; e.z = 0.55; // closer than muzzle ~0.86
  e.vx = 0; e.vz = 0; e.r = 0.24;
  g.rng = () => 0.5;
  g._fireMg([]);
  assert.ok(g.bullets.length >= 1);
  const b = g.bullets[0];
  const spawnDist = Math.hypot(b.x - g.px, b.z - g.pz);
  const foeDist = Math.hypot(e.x - g.px, e.z - g.pz);
  assert.ok(spawnDist < foeDist + 0.05, `spawn ${spawnDist.toFixed(3)} should be ≤ foe ${foeDist.toFixed(3)}`);
  // Also: bullet flying toward foe (not already past)
  const toFoe = (e.x - b.x) * b.vx + (e.z - b.z) * b.vz;
  assert.ok(toFoe > 0, 'bullet velocity should still point toward foe');
  console.log('close spawn OK', { spawnDist: spawnDist.toFixed(3), foeDist: foeDist.toFixed(3) });
}

// ---- Integration: swept collision catches tunnel in Game.step ----
{
  const g = new Game({ seed: 5 });
  g.enemies.length = 0;
  g.bullets.length = 0;
  g.px = 0; g.pz = 0;
  g._spawn('drone');
  const e = g.enemies[0];
  e.x = 5; e.z = 0; e.vx = 0; e.vz = 0; e.hp = 10; e.r = 0.2;
  // Inject a fast bullet that will jump over the enemy in one dt
  g.bullets.push({
    weapon: 'mg', x: 4.4, z: 0, y: 1, vx: 40, vz: 0, vy: 0,
    life: 1, dmg: 1, r: 0.1, pierce: 0, hitIds: new Set(),
    aoe: 0, aoeDmg: 0, fuse: 0, grav: 0, puddle: 0, kind: 'mg',
  });
  const dt = 0.05; // step 2.0 units — tunnels past 0.3 radius with point test
  const hp0 = e.hp;
  // Freeze spawns / enemy motion noise: clear spawn budget
  g.spawnAcc = -99;
  g.waveT = 99;
  g.step(dt);
  assert.ok(e.hp < hp0 || g.enemies.indexOf(e) < 0, 'swept collision must register tunnel hit');
  console.log('swept Game.step OK', { hpBefore: hp0, hpAfter: e.hp });
}

console.log('aim-hit-fast ALL OK');

// =====================================================================
// AIM-HIT-FAST-002 — high-speed lateral / relative sweep / muzzle / jitter
// =====================================================================

const HUNTER_R = 0.68;
const SMALL_R = 0.24;

/**
 * Perpendicular constant-velocity MG scenario.
 * Only counts bullets fired in the window; suppresses Game.step auto-fire;
 * waits for window bullets to resolve; drives enemy on rails.
 */
function perpMgWindowed({
  speed, radius, hz, dist = 8, fireShots = 5, seed = 42, useLiveJitter = false,
}) {
  const g = new Game({ seed });
  g.enemies.length = 0;
  g.bullets.length = 0;
  g.zones.length = 0;
  g.gems.length = 0;
  g.spawnAcc = -99;
  g.waveT = 999;
  g.px = 0; g.pz = 0; g.vx = 0; g.vz = 0;
  g._spawn('drone');
  const e = g.enemies[0];
  const cd = g.fireCd || 0.1;
  e.x = -speed * (fireShots * cd * 0.45);
  e.z = dist;
  e.vx = speed; e.vz = 0;
  e.r = radius;
  e.hp = 1e9; e.maxHp = 1e9;
  e.speed = 0; e.chase = 0;
  e.elite = false; e.boss = false;
  e.prevX = e.x; e.prevZ = e.z;
  if (!useLiveJitter) g.rng = () => 0.5;

  const dt = 1 / hz;
  const windowBullets = new Set();
  let shots = 0;
  const maxFrames = Math.ceil(hz * 3);
  g.fireCd = 1e9;
  g.fireT = 1e9;
  const fireEvery = Math.max(1, Math.round(cd / dt));

  for (let f = 0; f < maxFrames && shots < fireShots; f++) {
    e.vx = speed; e.vz = 0;
    if (f % fireEvery === 0) {
      const n0 = g.bullets.length;
      g._fireMg([]);
      for (let i = n0; i < g.bullets.length; i++) windowBullets.add(g.bullets[i]);
      shots++;
    }
    const holdX = e.x, holdZ = e.z;
    e.prevX = e.x; e.prevZ = e.z;
    g.spawnAcc = -99;
    g.fireT = 1e9;
    if (typeof g._moveEnemiesScripted === 'function') {
      // not used — prefer full step with rails restore, or split API
    }
    if (typeof g._stepProjectiles === 'function') {
      // Move enemy on rails for this interval, then collide
      e.prevX = holdX; e.prevZ = holdZ;
      e.x = holdX + speed * dt;
      e.z = holdZ;
      e.vx = speed; e.vz = 0;
      g._stepProjectiles(dt, []);
    } else {
      g.step(dt);
      if (g.enemies.indexOf(e) >= 0) {
        e.x = holdX + speed * dt;
        e.z = holdZ;
        e.vx = speed; e.vz = 0;
      }
    }
  }

  let drain = 0;
  while ([...windowBullets].some((b) => g.bullets.includes(b)) && drain++ < hz * 4) {
    const holdX = e.x, holdZ = e.z;
    g.spawnAcc = -99;
    g.fireT = 1e9;
    if (typeof g._stepProjectiles === 'function') {
      e.prevX = holdX; e.prevZ = holdZ;
      e.x = holdX + speed * dt;
      e.z = holdZ;
      e.vx = speed; e.vz = 0;
      g._stepProjectiles(dt, []);
    } else {
      g.step(dt);
      if (g.enemies.indexOf(e) >= 0) {
        e.x = holdX + speed * dt;
        e.z = holdZ;
        e.vx = speed; e.vz = 0;
      }
    }
  }

  let hits = 0;
  for (const b of windowBullets) {
    if (b.hitIds && b.hitIds.has(e)) hits++;
  }
  return { shots, hits, g, e };
}

// ---- relativeSegmentHitsCircle: crossing case both static tests miss ----
{
  const bx0 = 0, bz0 = 0, bx1 = 2, bz1 = 0;
  const ex0 = 1, ez0 = -1, ex1 = 1, ez1 = 1;
  const r = 0.15;
  assert.equal(segmentHitsCircle(bx0, bz0, bx1, bz1, ex0, ez0, r), false, 'static @ old must miss');
  assert.equal(segmentHitsCircle(bx0, bz0, bx1, bz1, ex1, ez1, r), false, 'static @ new must miss');
  assert.equal(
    relativeSegmentHitsCircle(bx0, bz0, bx1, bz1, ex0, ez0, ex1, ez1, r),
    true,
    'relative sweep must hit crossing paths'
  );
  console.log('relativeSegmentHitsCircle crossing OK');
}

// ---- interceptAimDir: quadratic beats approx for fast lateral ----
{
  const S = PLAYER.bulletSpeed;
  const approx = leadAimDir(0, 0, 0, 8, 10.8, 0, S, AIM_LEAD_MAX_T);
  const precise = interceptAimDir(0, 0, 0, 8, 10.8, 0, S, 2.0);
  assert.ok(precise.ok, 'perpendicular intercept must find a solution');
  // True root ≈ 0.3097; approx under 0.30-cap formula ≈ 0.286
  assert.ok(precise.leadT > 0.30, 'precise t for this case should exceed 0.30 approx clamp, got ' + precise.leadT);
  assert.ok(Math.abs(precise.leadT - 0.3097) < 0.02, 'precise t near quadratic root, got ' + precise.leadT);
  assert.ok(approx.leadT <= AIM_LEAD_MAX_T + 1e-9, 'sanity: approx still clamped');

  const still = interceptAimDir(0, 0, 3, 4, 0, 0, S, 1);
  assert.ok(Math.abs(still.dx - 0.6) < 1e-6 && Math.abs(still.dz - 0.8) < 1e-6);

  const crawl = interceptAimDir(0, 0, 5, 0, 1e-8, 0, S, 1);
  assert.ok(crawl.dx > 0.99);

  const flee = interceptAimDir(0, 0, 5, 0, 40, 0, 10, 1);
  assert.ok(Number.isFinite(flee.dx) && Number.isFinite(flee.dz), 'no-solution must be finite');
  console.log('interceptAimDir OK', { preciseT: precise.leadT.toFixed(4), approxT: approx.leadT.toFixed(4) });
}

// ---- Perpendicular constant velocity ----
{
  const evidence = [];
  const cases = [
    { speed: 4, radius: 0.3, hz: 60, minHits: 4 },
    { speed: 9.5, radius: 0.3, hz: 60, minHits: 4 },
    { speed: 10.8, radius: 0.3, hz: 60, minHits: 4 },
    { speed: 14, radius: 0.3, hz: 60, minHits: 4 },
    { speed: 10.8, radius: SMALL_R, hz: 60, minHits: 4 },
    { speed: 10.8, radius: SMALL_R, hz: 30, minHits: 4 },
    { speed: 10.8, radius: HUNTER_R, hz: 60, minHits: 5 },
    { speed: 10.8, radius: HUNTER_R, hz: 30, minHits: 5 },
    { speed: 14, radius: SMALL_R, hz: 60, minHits: 4 },
    { speed: 14, radius: SMALL_R, hz: 30, minHits: 3 },
  ];
  let fails = 0;
  for (const c of cases) {
    const r = perpMgWindowed({ ...c, fireShots: 5, seed: 99, useLiveJitter: false });
    const ok = r.hits >= c.minHits;
    evidence.push({ speed: c.speed, radius: c.radius, hz: c.hz, shots: r.shots, hits: r.hits, minHits: c.minHits, ok });
    if (!ok) fails++;
  }
  console.log('perp evidence', JSON.stringify(evidence));
  assert.equal(fails, 0, 'perpendicular high-speed MG misses:\\n' + JSON.stringify(evidence, null, 2));
  console.log('perpendicular constant-velocity OK');
}

// ---- Live MG jitter path (seeded RNG through real _fireMg) ----
{
  const r = perpMgWindowed({
    speed: 10.8, radius: SMALL_R, hz: 60, fireShots: 8, seed: 12345, useLiveJitter: true,
  });
  console.log('live jitter MG', r.shots, r.hits);
  assert.ok(r.hits >= 6, 'live _fireMg path high-speed hits ' + r.hits + '/8');
  console.log('live MG jitter path OK');
}

// ---- Muzzle origin consistency ----
{
  const g = new Game({ seed: 7 });
  g.enemies.length = 0;
  g.px = 0; g.pz = 0;
  g._spawn('drone');
  const e = g.enemies[0];
  e.x = 2.5; e.z = 2.5; e.vx = 8; e.vz = -2; e.r = 0.3; e.hp = 100;
  g.rng = () => 0.5;
  g._fireMg([]);
  assert.ok(g.bullets.length >= 1);
  const b = g.bullets[0];
  const mw = muzzleWorld(g.px, g.pz, b.vx, b.vz);
  const spawnDistFromPlayer = Math.hypot(b.x - g.px, b.z - g.pz);
  assert.ok(spawnDistFromPlayer > 0.3, 'spawn not at player feet');
  const lead = interceptAimDir(b.x, b.z, e.x, e.z, e.vx, e.vz, g.bulletSpeed, 2.0);
  const bLen = Math.hypot(b.vx, b.vz) || 1;
  const bdx = b.vx / bLen, bdz = b.vz / bLen;
  const dot = bdx * lead.dx + bdz * lead.dz;
  assert.ok(dot > 0.98, 'muzzle-origin aim alignment dot=' + dot.toFixed(4));
  console.log('muzzle origin consistency OK', { dot: dot.toFixed(4), dir: mw.dir });
}

// ---- Turn / state transitions ----
{
  const g = new Game({ seed: 11 });
  g.enemies.length = 0;
  g.bullets.length = 0;
  g.spawnAcc = -99;
  g.waveT = 999;
  g.px = 0; g.pz = 0;
  g._spawn('drone');
  const e = g.enemies[0];
  e.x = 6; e.z = 0;
  e.vx = 10.8; e.vz = 0;
  e.r = HUNTER_R;
  e.hp = 500; e.maxHp = 500;
  e.elite = true;
  e.type = 'hunter';
  e.phase = 'charge';
  e.phaseT = 0.2;
  e.chargeDx = 1; e.chargeDz = 0;
  e.comboSeg = 0; e.comboSegs = 2;
  e.prevX = e.x; e.prevZ = e.z;
  g.rng = () => 0.5;

  let fired = 0;
  for (let i = 0; i < 40; i++) {
    g.fireT = 0;
    g._fireMg([]);
    if (g.bullets.length) {
      const b = g.bullets[g.bullets.length - 1];
      assert.ok(Number.isFinite(b.vx) && Number.isFinite(b.vz), 'NaN velocity');
      assert.ok(Number.isFinite(b.x) && Number.isFinite(b.z), 'NaN position');
      // No wild backward shot while target is still to +X
      if (e.x > g.px + 1) {
        const len = Math.hypot(b.vx, b.vz) || 1;
        assert.ok(b.vx / len > -0.2, 'should not fire hard backward at +X target');
      }
      fired++;
    }
    g.spawnAcc = -99;
    g.fireCd = 1e9;
    g.fireT = 1e9;
    g.step(1 / 60);
  }
  assert.ok(fired >= 5, 'should have fired');
  console.log('turn/state transitions OK', { fired, phase: e.phase });
}

// ---- 60Hz vs 30Hz agreement ----
{
  const a = perpMgWindowed({ speed: 10.8, radius: SMALL_R, hz: 60, fireShots: 5, seed: 77 });
  const b = perpMgWindowed({ speed: 10.8, radius: SMALL_R, hz: 30, fireShots: 5, seed: 77 });
  console.log('hz agreement', { hz60: a.hits, hz30: b.hits });
  assert.ok(a.hits >= 3 && b.hits >= 3, 'both hz must hit, got 60=' + a.hits + ' 30=' + b.hits);
  assert.ok(Math.abs(a.hits - b.hits) <= 2, 'hz hit disagreement too large');
  console.log('60/30 Hz agreement OK');
}

console.log('aim-hit-fast-002 NEW CASES ALL OK');
