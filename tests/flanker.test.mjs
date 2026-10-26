/**
 * PHASE3-ENEMY-FLANKER-001 — flanker + cyan dash telegraph → contact dash.
 * Run: node tests/flanker.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { ENEMIES, FLANKER, waveMix, pickEnemyType } from '../js/config.js';

assert.ok(ENEMIES.flanker, 'ENEMIES.flanker defined');
assert.equal(ENEMIES.flanker.zh, '側襲單位');
assert.equal(ENEMIES.flanker.en, 'Flanker');
assert.equal(ENEMIES.flanker.kind, 'flanker');
assert.ok(ENEMIES.flanker.color !== ENEMIES.soldier.color, 'flanker color ≠ soldier');
assert.ok(ENEMIES.flanker.color !== ENEMIES.bomber.color, 'flanker color ≠ bomber');
assert.ok(ENEMIES.flanker.color !== ENEMIES.drone.color, 'flanker color ≠ drone');
assert.ok(ENEMIES.flanker.color !== ENEMIES.hunter.color, 'flanker color ≠ hunter');
assert.ok(ENEMIES.flanker.speed > ENEMIES.soldier.speed, 'flanker faster than soldier');
assert.ok(ENEMIES.flanker.hp <= ENEMIES.soldier.hp, 'flanker HP ≤ soldier');
assert.ok(FLANKER.telegraphSec >= 0.85, 'telegraph ≥0.85s');
assert.ok(FLANKER.dashDamage >= 1 && FLANKER.dashDamage <= 3, 'dash damage readable not one-shot');

function mixSum(t, zone) {
  return waveMix(t, zone).reduce((s, [, w]) => s + w, 0);
}
for (const [t, z] of [[20, 'lab'], [50, 'lab'], [80, 'lab'], [110, 'lab'], [200, 'assembly'], [300, 'reactor'], [430, 'blockade'], [520, 'rooftop']]) {
  const s = mixSum(t, z);
  assert.ok(Math.abs(s - 1) < 0.02, `waveMix sum≈1 at t=${t} zone=${z} (got ${s})`);
}

// Early lab: no flanker; mid-late lab + zones light; reactor rare
{
  const early = Object.fromEntries(waveMix(20, 'lab'));
  assert.ok(!(early.flanker > 0), 'no flanker in early lab t<40');
  const early2 = Object.fromEntries(waveMix(35, 'lab'));
  assert.ok(!(early2.flanker > 0), 'no flanker before 40s');
  const mid = Object.fromEntries(waveMix(50, 'lab'));
  assert.ok((mid.flanker || 0) > 0 && (mid.flanker || 0) <= 0.1, 'light mid lab flanker');
  const late = Object.fromEntries(waveMix(110, 'lab'));
  assert.ok((late.flanker || 0) > 0 && (late.flanker || 0) <= 0.1, 'light late lab flanker');
  for (const z of ['assembly', 'blockade', 'rooftop']) {
    const m = Object.fromEntries(waveMix(500, z));
    assert.ok((m.flanker || 0) > 0 && (m.flanker || 0) <= 0.1, `${z} light flanker`);
  }
  const reactor = Object.fromEntries(waveMix(500, 'reactor'));
  assert.ok((reactor.flanker || 0) > 0 && (reactor.flanker || 0) <= 0.05, 'reactor rare flanker');
}

// Behavior: telegraph ≥0.85 before dash damage; flankerDash event; no dmg during telegraph
{
  const g = new Game({ seed: 7 });
  g.invuln = 0;
  g.hp = 7;
  g.px = 0; g.pz = 0;
  g.vx = 0; g.vz = 0;
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g._spawn('flanker');
  const e = g.enemies[0];
  assert.ok(e.flanker || e.kind === 'flanker');
  e.x = 0; e.z = -4.0;
  e.prevX = e.x; e.prevZ = e.z;
  e.flankerPhase = 'flank';
  e.flankerPhaseT = 0;
  e.flankSide = 1;
  e.speed = 0; // stay put; dist already in commit range

  const events = [];
  g._tickFlanker(e, 0.05, events);
  assert.equal(e.flankerPhase, 'telegraph', 'enters telegraph in commit range');
  assert.ok(e.flankerPhaseT >= 0.85, 'telegraph remaining ≥0.85 at start');
  const tele = events.find((ev) => ev.type === 'telegraph' && ev.kind === 'flanker');
  assert.ok(tele, 'telegraph event kind:flanker');
  assert.ok((tele.duration || 0) >= 0.85, 'telegraph duration ≥0.85');
  assert.ok(tele.aimDx != null && tele.aimDz != null, 'telegraph carries aim');

  const hpBefore = g.hp;
  let guard = 0;
  while (e.flankerPhase === 'telegraph' && e.flankerPhaseT > 0.05 && guard++ < 200) {
    const evs = [];
    g._tickFlanker(e, 0.05, evs);
    assert.ok(!evs.some((x) => x.type === 'flankerDash'), 'no dash before telegraph ends');
    assert.ok(!evs.some((x) => x.type === 'hurt' && x.flanker), 'no flanker dash hurt during telegraph');
  }
  assert.equal(g.hp, hpBefore, 'no damage during telegraph');

  // Stay under dash path
  g.px = e.x + (e.aimDx || 0) * 0.5;
  g.pz = e.z + (e.aimDz || 0) * 0.5;
  // Put player near flanker for contact
  g.px = e.x;
  g.pz = e.z;
  g.invuln = 0;
  const fireEvs = [];
  while (e.flankerPhase === 'telegraph' && guard++ < 400) {
    g._tickFlanker(e, 0.05, fireEvs);
  }
  assert.equal(e.flankerPhase, 'dash', 'enters dash after telegraph');
  // Ensure player is on dash path / near unit
  g.px = e.x; g.pz = e.z; g.invuln = 0;
  while (e.flankerPhase === 'dash' && guard++ < 400) {
    g.px = e.x; g.pz = e.z; // stick to flanker for contact
    g._tickFlanker(e, 0.05, fireEvs);
  }
  const dash = fireEvs.find((ev) => ev.type === 'flankerDash');
  assert.ok(dash, 'flankerDash after telegraph');
  assert.ok(dash.hit === true, 'player contact during dash is hit');
  assert.ok(g.hp < hpBefore, 'dash damage applied after telegraph');
}

// Miss when player leaves dash path during telegraph
{
  const g = new Game({ seed: 11 });
  g.invuln = 0;
  g.hp = 7;
  g.px = 0; g.pz = 0;
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g._spawn('flanker');
  const e = g.enemies[0];
  e.x = 0; e.z = -4;
  e.flankerPhase = 'telegraph';
  e.flankerPhaseT = 0.05;
  e.telegraphDur = 0.9;
  e.aimDx = 0; e.aimDz = 1;
  g.px = 10; g.pz = 10;
  const evs = [];
  // finish telegraph → dash → recover without hitting
  let guard = 0;
  while (e.flankerPhase !== 'recover' && guard++ < 200) {
    g._tickFlanker(e, 0.05, evs);
  }
  const dash = evs.find((ev) => ev.type === 'flankerDash');
  assert.ok(dash, 'dash event still fires');
  assert.equal(dash.hit, false, 'miss when outside dash');
  assert.equal(g.hp, 7, 'no damage on miss');
}

// Killed during telegraph → no dash damage
{
  const g = new Game({ seed: 13 });
  g.invuln = 0;
  g.hp = 7;
  g.px = 0; g.pz = 0;
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g._spawn('flanker');
  const e = g.enemies[0];
  e.x = 0; e.z = -3.5;
  e.flankerPhase = 'telegraph';
  e.flankerPhaseT = 0.5;
  e.telegraphDur = 0.9;
  e.aimDx = 0; e.aimDz = 1;
  const idx = g.enemies.indexOf(e);
  g._kill(e, idx, []);
  assert.equal(g.enemies.length, 0, 'flanker removed');
  assert.equal(e.flankerPhase, 'telegraph', 'still telegraph at death — never dashed');
  assert.equal(g.hp, 7, 'no dash damage when killed mid-telegraph');
}

// pickEnemyType can return flanker mid/late / blockade
{
  let found = false;
  for (let i = 0; i < 120; i++) {
    const rng = (() => { const v = i / 120; return () => v; })();
    if (pickEnemyType(rng, 430, 'blockade') === 'flanker') found = true;
  }
  assert.ok(found, 'pickEnemyType can return flanker in blockade');
}

console.log('flanker.test.mjs OK');
