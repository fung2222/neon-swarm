/**
 * AIM-HIT-FAST-001 — swept collision, lead aim, close muzzle.
 * Run: node tests/aim-hit-fast.test.mjs
 */
import assert from 'assert';
import {
  Game,
  segmentHitsCircle,
  leadAimDir,
  closeMuzzlePos,
  AIM_LEAD_MAX_T,
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
