/**
 * PHASE3-ENEMY-BOMBER-001 — suicide bomber + red self-blast telegraph → AoE.
 * Run: node tests/bomber.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { ENEMIES, BOMBER, waveMix, pickEnemyType } from '../js/config.js';

assert.ok(ENEMIES.bomber, 'ENEMIES.bomber defined');
assert.equal(ENEMIES.bomber.zh, '自爆單位');
assert.equal(ENEMIES.bomber.en, 'Suicide Bomber');
assert.equal(ENEMIES.bomber.kind, 'bomber');
assert.ok(ENEMIES.bomber.color !== ENEMIES.drone.color, 'bomber color ≠ drone');
assert.ok(ENEMIES.bomber.color !== ENEMIES.soldier.color, 'bomber color ≠ soldier');
assert.ok(ENEMIES.bomber.color !== ENEMIES.artillery.color, 'bomber color ≠ artillery');
assert.ok(ENEMIES.bomber.color !== ENEMIES.walker.color, 'bomber color ≠ walker');
assert.ok(ENEMIES.bomber.speed > ENEMIES.soldier.speed, 'bomber faster than soldier');
assert.ok(BOMBER.telegraphSec >= 0.9 && BOMBER.telegraphSec <= 1.2, 'telegraph in 0.9–1.2s');
assert.ok(BOMBER.blastRadius >= 1.8 && BOMBER.blastRadius <= 2.8, 'blast radius in 1.8–2.8');
assert.ok(BOMBER.fuseMin >= 2.0 && BOMBER.fuseMax <= 3.5, 'fuse band ~2.2–3.2');

function mixSum(t, zone) {
  return waveMix(t, zone).reduce((s, [, w]) => s + w, 0);
}
for (const [t, z] of [[20, 'lab'], [50, 'lab'], [80, 'lab'], [110, 'lab'], [200, 'assembly'], [300, 'reactor'], [430, 'blockade'], [520, 'rooftop']]) {
  const s = mixSum(t, z);
  assert.ok(Math.abs(s - 1) < 0.02, `waveMix sum≈1 at t=${t} zone=${z} (got ${s})`);
}

// Early lab: no bomber; mid-late lab + zones light
{
  const early = Object.fromEntries(waveMix(20, 'lab'));
  assert.ok(!(early.bomber > 0), 'no bomber in early lab t<40');
  const early2 = Object.fromEntries(waveMix(35, 'lab'));
  assert.ok(!(early2.bomber > 0), 'no bomber before 40s');
  const mid = Object.fromEntries(waveMix(50, 'lab'));
  assert.ok((mid.bomber || 0) > 0 && (mid.bomber || 0) <= 0.1, 'light mid lab bomber');
  const late = Object.fromEntries(waveMix(110, 'lab'));
  assert.ok((late.bomber || 0) > 0 && (late.bomber || 0) <= 0.1, 'light late lab bomber');
  for (const z of ['assembly', 'blockade', 'rooftop', 'reactor']) {
    const m = Object.fromEntries(waveMix(500, z));
    assert.ok((m.bomber || 0) > 0 && (m.bomber || 0) <= 0.1, `${z} light bomber`);
  }
}

// Behavior: telegraph ≥0.9 before damage; detonate event; no dmg during telegraph
{
  const g = new Game({ seed: 7 });
  g.invuln = 0;
  g.hp = 7;
  g.px = 0; g.pz = 0;
  g.vx = 0; g.vz = 0;
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g._spawn('bomber');
  const e = g.enemies[0];
  assert.ok(e.bomber || e.kind === 'bomber');
  // Place just outside fuse, then step into band
  e.x = 0; e.z = -2.8;
  e.prevX = e.x; e.prevZ = e.z;
  e.bomberPhase = 'chase';
  e.bomberPhaseT = 0;
  e.speed = 0; // stay put; dist already in fuse band

  const events = [];
  g._tickBomber(e, 0.05, events);
  assert.equal(e.bomberPhase, 'telegraph', 'enters telegraph in fuse band');
  assert.ok(e.bomberPhaseT >= 0.9, 'telegraph remaining ≥0.9 at start');
  const tele = events.find((ev) => ev.type === 'telegraph' && ev.kind === 'bomber');
  assert.ok(tele, 'telegraph event kind:bomber');
  assert.ok((tele.duration || 0) >= 0.9, 'telegraph duration ≥0.9');
  assert.ok((tele.radius || 0) >= 1.8, 'telegraph carries blast radius');
  assert.ok(tele.x != null && tele.z != null, 'telegraph under self');
  // Ring under self (not far aim zone)
  assert.ok(Math.hypot(tele.x - e.x, tele.z - e.z) < 0.5, 'telegraph centered on bomber');

  const hpBefore = g.hp;
  let guard = 0;
  while (e.bomberPhase === 'telegraph' && e.bomberPhaseT > 0.05 && guard++ < 200) {
    const evs = [];
    g._tickBomber(e, 0.05, evs);
    assert.ok(!evs.some((x) => x.type === 'bomberDetonate'), 'no detonate before telegraph ends');
    assert.ok(!evs.some((x) => x.type === 'hurt' && x.bomber), 'no bomber hurt during telegraph');
  }
  assert.equal(g.hp, hpBefore, 'no damage during telegraph');

  // Stay inside blast (under bomber)
  g.px = e.x;
  g.pz = e.z;
  g.invuln = 0;
  const fireEvs = [];
  while (e.bomberPhase === 'telegraph' && !e.bomberDetonated && guard++ < 400) {
    g._tickBomber(e, 0.05, fireEvs);
  }
  const det = fireEvs.find((ev) => ev.type === 'bomberDetonate');
  assert.ok(det, 'bomberDetonate after telegraph');
  assert.ok(e.bomberDetonated === true, 'marked detonated');
  assert.ok(det.radius >= 1.8, 'detonate has radius');
  assert.ok(det.hit === true, 'player in blast is hit');
  assert.ok(g.hp < hpBefore, 'AoE damage applied after telegraph');
}

// Miss when player leaves blast during telegraph
{
  const g = new Game({ seed: 11 });
  g.invuln = 0;
  g.hp = 7;
  g.px = 0; g.pz = 0;
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g._spawn('bomber');
  const e = g.enemies[0];
  e.x = 0; e.z = -3;
  e.bomberPhase = 'telegraph';
  e.bomberPhaseT = 0.05;
  e.telegraphDur = 1.0;
  e.blastRadius = BOMBER.blastRadius;
  g.px = 8; g.pz = 8;
  const evs = [];
  g._tickBomber(e, 0.1, evs);
  const det = evs.find((ev) => ev.type === 'bomberDetonate');
  assert.ok(det, 'detonate still fires');
  assert.equal(det.hit, false, 'miss when outside blast');
  assert.equal(g.hp, 7, 'no damage on miss');
}

// Killed during telegraph → no detonate / no AoE
{
  const g = new Game({ seed: 13 });
  g.invuln = 0;
  g.hp = 7;
  g.px = 0; g.pz = 0;
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g._spawn('bomber');
  const e = g.enemies[0];
  e.x = 0; e.z = -2.5;
  e.bomberPhase = 'telegraph';
  e.bomberPhaseT = 0.5;
  e.telegraphDur = 1.0;
  e.blastRadius = BOMBER.blastRadius;
  // Simulate player kill (no explode)
  const idx = g.enemies.indexOf(e);
  g._kill(e, idx, []);
  assert.equal(g.enemies.length, 0, 'bomber removed');
  assert.ok(!e.bomberDetonated, 'no detonate flag on kill');
  assert.equal(g.hp, 7, 'no AoE damage when killed mid-telegraph');
}

// pickEnemyType can return bomber mid/late / blockade
{
  let found = false;
  for (let i = 0; i < 120; i++) {
    const rng = (() => { const v = i / 120; return () => v; })();
    if (pickEnemyType(rng, 430, 'blockade') === 'bomber') found = true;
  }
  assert.ok(found, 'pickEnemyType can return bomber in blockade');
}

console.log('bomber.test.mjs OK');
