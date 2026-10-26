/**
 * PHASE3-ENEMY-JAMMER-001 — signal jammer + violet telegraph → fireCd mul debuff.
 * Run: node tests/jammer.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { ENEMIES, JAMMER, waveMix, pickEnemyType } from '../js/config.js';

assert.ok(ENEMIES.jammer, 'ENEMIES.jammer defined');
assert.equal(ENEMIES.jammer.zh, '干擾單位');
assert.equal(ENEMIES.jammer.en, 'Signal Jammer');
assert.equal(ENEMIES.jammer.kind, 'jammer');
assert.ok(ENEMIES.jammer.color !== ENEMIES.drone.color, 'jammer ≠ drone');
assert.ok(ENEMIES.jammer.color !== ENEMIES.medic.color, 'jammer ≠ medic');
assert.ok(ENEMIES.jammer.color !== ENEMIES.artillery.color, 'jammer ≠ artillery');
assert.ok(ENEMIES.jammer.color !== ENEMIES.flanker.color, 'jammer ≠ flanker');
assert.ok(JAMMER.telegraphSec >= 0.85, 'telegraph ≥0.85s');
assert.ok(JAMMER.jamMul >= 1.2 && JAMMER.jamMul <= 1.6, 'jam mul readable');
assert.ok(JAMMER.jamDuration >= 1.5 && JAMMER.jamDuration <= 4, 'jam duration short');

function mixSum(t, zone) {
  return waveMix(t, zone).reduce((s, [, w]) => s + w, 0);
}
for (const [t, z] of [[20, 'lab'], [50, 'lab'], [80, 'lab'], [110, 'lab'], [200, 'assembly'], [300, 'reactor'], [430, 'blockade'], [520, 'rooftop']]) {
  const s = mixSum(t, z);
  assert.ok(Math.abs(s - 1) < 0.02, `waveMix sum≈1 at t=${t} zone=${z} (got ${s})`);
}

// Early lab: no jammer; mid-late light; reactor/blockade/rooftop light; assembly rare
{
  assert.ok(!(Object.fromEntries(waveMix(20, 'lab')).jammer > 0), 'no jammer early lab');
  assert.ok(!(Object.fromEntries(waveMix(35, 'lab')).jammer > 0), 'no jammer before 40s');
  const mid = Object.fromEntries(waveMix(50, 'lab'));
  assert.ok((mid.jammer || 0) > 0 && (mid.jammer || 0) <= 0.1, 'light mid lab jammer');
  for (const z of ['reactor', 'blockade', 'rooftop']) {
    const m = Object.fromEntries(waveMix(500, z));
    assert.ok((m.jammer || 0) > 0 && (m.jammer || 0) <= 0.1, `${z} light jammer`);
  }
  const assembly = Object.fromEntries(waveMix(500, 'assembly'));
  assert.ok((assembly.jammer || 0) > 0 && (assembly.jammer || 0) <= 0.03, 'assembly rare jammer');
}

// Behavior: telegraph ≥0.85 → jammerPulse applies fireCd mul; stack cap 1; ends cleanly
{
  const g = new Game({ seed: 7 });
  g.invuln = 99;
  g.hp = 7;
  g.px = 0; g.pz = 0;
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g._spawn('jammer');
  const e = g.enemies[0];
  assert.ok(e.jammer || e.kind === 'jammer');
  e.x = 0; e.z = -6.0;
  e.prevX = e.x; e.prevZ = e.z;
  e.jammerPhase = 'reposition';
  e.jammerPhaseT = 0;
  e.speed = 0; // stay in commit range

  const events = [];
  g._tickJammer(e, 0.05, events);
  assert.equal(e.jammerPhase, 'telegraph', 'enters telegraph mid-range');
  assert.ok(e.jammerPhaseT >= 0.85, 'telegraph remaining ≥0.85');
  const tele = events.find((ev) => ev.type === 'telegraph' && ev.kind === 'jammer');
  assert.ok(tele, 'telegraph kind:jammer');
  assert.ok((tele.duration || 0) >= 0.85);

  assert.equal(g.jamT || 0, 0, 'no jam during telegraph');
  assert.equal(g.jamFireMul || 1, 1);
  let guard = 0;
  while (e.jammerPhase === 'telegraph' && guard++ < 400) {
    const evs = [];
    g._tickJammer(e, 0.05, evs);
    assert.ok(!evs.some((x) => x.type === 'jammerPulse' && !x.miss), 'no apply during telegraph');
  }
  const fireEvs = [];
  while (e.jammerPhase === 'telegraph' && guard++ < 400) g._tickJammer(e, 0.05, fireEvs);
  if (e.jammerPhase === 'pulse') g._tickJammer(e, 0.05, fireEvs);
  const pulse = fireEvs.find((ev) => ev.type === 'jammerPulse');
  assert.ok(pulse, 'jammerPulse after telegraph');
  assert.ok(!pulse.miss, 'pulse hits in range');
  assert.ok(g.jamT >= 2.0, 'jam duration applied');
  assert.equal(g.jamFireMul, JAMMER.jamMul, 'jam mul set');

  // Stack cap 1: refresh, do not compound mul
  const tBefore = g.jamT;
  g._applyJammerDebuff(JAMMER, [], e);
  assert.equal(g.jamFireMul, JAMMER.jamMul, 'mul not stacked');
  assert.ok(g.jamT >= tBefore - 0.01, 'duration refreshed');

  // fireCd path uses jam mul
  g.fireCd = 0.10;
  g.fireT = 0;
  g.weaponSlots = ['mg', null, null, null];
  // stub fire so CD is set
  const orig = g._fireMg.bind(g);
  g._fireMg = () => true;
  g._tickWeapons(0.016, []);
  assert.ok(Math.abs(g.fireT - g.fireCd * JAMMER.jamMul) < 1e-6, `fireT uses jam mul (got ${g.fireT})`);
  g._fireMg = orig;

  // Ends cleanly
  g.jamT = 0.05;
  g.step(0.06);
  assert.equal(g.jamT, 0, 'jamT cleared');
  assert.equal(g.jamFireMul, 1, 'mul reset');
}

// Kill mid-telegraph = no apply
{
  const g = new Game({ seed: 13 });
  g.invuln = 99;
  g.px = 0; g.pz = 0;
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g._spawn('jammer');
  const e = g.enemies[0];
  e.x = 0; e.z = -6;
  e.jammerPhase = 'telegraph';
  e.jammerPhaseT = 0.5;
  e.telegraphDur = 0.9;
  const idx = g.enemies.indexOf(e);
  g._kill(e, idx, []);
  assert.equal(g.enemies.length, 0);
  assert.equal(g.jamT || 0, 0, 'no jam when killed mid-telegraph');
  assert.equal(g.jamFireMul || 1, 1);
}

// pickEnemyType can return jammer in blockade
{
  let found = false;
  for (let i = 0; i < 120; i++) {
    const rng = (() => { const v = i / 120; return () => v; })();
    if (pickEnemyType(rng, 430, 'blockade') === 'jammer') found = true;
  }
  assert.ok(found, 'pickEnemyType can return jammer in blockade');
}

console.log('jammer.test.mjs OK');
