/**
 * PHASE3-ENEMY-MEDIC-001 — combat medic + lime heal telegraph → ally heal pulse.
 * Run: node tests/medic.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { ENEMIES, MEDIC, waveMix, pickEnemyType } from '../js/config.js';

assert.ok(ENEMIES.medic, 'ENEMIES.medic defined');
assert.equal(ENEMIES.medic.zh, '醫療支援');
assert.equal(ENEMIES.medic.en, 'Combat Medic');
assert.equal(ENEMIES.medic.kind, 'medic');
assert.ok(ENEMIES.medic.color !== ENEMIES.staffer.color, 'medic color ≠ staffer');
assert.ok(ENEMIES.medic.color !== ENEMIES.chief.color, 'medic color ≠ chief');
assert.ok(ENEMIES.medic.color !== ENEMIES.drone.color, 'medic color ≠ drone');
assert.ok(ENEMIES.medic.color !== ENEMIES.flanker.color, 'medic color ≠ flanker');
assert.ok(ENEMIES.medic.hp <= ENEMIES.soldier.hp, 'medic HP ≤ soldier');
assert.ok(MEDIC.telegraphSec >= 0.7, 'telegraph ≥0.7s');
assert.ok(MEDIC.healAmount >= 1, 'heal amount readable');
assert.ok((MEDIC.healMaxTargets || 0) >= 1, 'heal cap defined');

function mixSum(t, zone) {
  return waveMix(t, zone).reduce((s, [, w]) => s + w, 0);
}
for (const [t, z] of [[20, 'lab'], [50, 'lab'], [80, 'lab'], [110, 'lab'], [200, 'assembly'], [300, 'reactor'], [430, 'blockade'], [520, 'rooftop']]) {
  const s = mixSum(t, z);
  assert.ok(Math.abs(s - 1) < 0.02, `waveMix sum≈1 at t=${t} zone=${z} (got ${s})`);
}

// Early lab: no medic; mid-late + assembly/reactor/blockade light; rooftop rare
{
  const early = Object.fromEntries(waveMix(20, 'lab'));
  assert.ok(!(early.medic > 0), 'no medic in early lab t<40');
  const early2 = Object.fromEntries(waveMix(35, 'lab'));
  assert.ok(!(early2.medic > 0), 'no medic before 40s');
  const mid = Object.fromEntries(waveMix(50, 'lab'));
  assert.ok((mid.medic || 0) > 0 && (mid.medic || 0) <= 0.1, 'light mid lab medic');
  const late = Object.fromEntries(waveMix(110, 'lab'));
  assert.ok((late.medic || 0) > 0 && (late.medic || 0) <= 0.1, 'light late lab medic');
  for (const z of ['assembly', 'reactor', 'blockade']) {
    const m = Object.fromEntries(waveMix(500, z));
    assert.ok((m.medic || 0) > 0 && (m.medic || 0) <= 0.1, `${z} light medic`);
  }
  const rooftop = Object.fromEntries(waveMix(500, 'rooftop'));
  assert.ok((rooftop.medic || 0) > 0 && (rooftop.medic || 0) <= 0.05, 'rooftop rare medic');
}

// Behavior: telegraph ≥0.7 → medicHeal; heals ordinary wounded; no player heal
{
  const g = new Game({ seed: 7 });
  g.invuln = 99;
  g.hp = 7;
  g.px = 12; g.pz = 12; // stay away so medic doesn't flee from player
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g._spawn('soldier');
  const ally = g.enemies[0];
  ally.x = 0; ally.z = 0;
  ally.hp = 2; ally.maxHp = ENEMIES.soldier.hp;
  ally.speed = 0; ally.chase = 0;
  g._spawn('medic');
  const e = g.enemies[1];
  assert.ok(e.medic || e.kind === 'medic');
  e.x = 2.5; e.z = 0;
  e.prevX = e.x; e.prevZ = e.z;
  e.medicPhase = 'seek';
  e.medicPhaseT = 0;
  e.speed = ENEMIES.medic.speed;

  const events = [];
  // Drive seek → telegraph
  let guard = 0;
  while (e.medicPhase !== 'telegraph' && guard++ < 80) {
    g._tickMedic(e, 0.05, events);
  }
  assert.equal(e.medicPhase, 'telegraph', 'enters telegraph near wounded');
  assert.ok(e.medicPhaseT >= 0.7, 'telegraph remaining ≥0.7 at start');
  const tele = events.find((ev) => ev.type === 'telegraph' && ev.kind === 'medic');
  assert.ok(tele, 'telegraph event kind:medic');
  assert.ok((tele.duration || 0) >= 0.7, 'telegraph duration ≥0.7');

  const allyHpBefore = ally.hp;
  const playerHpBefore = g.hp;
  while (e.medicPhase === 'telegraph' && guard++ < 400) {
    const evs = [];
    g._tickMedic(e, 0.05, evs);
    assert.ok(!evs.some((x) => x.type === 'medicHeal'), 'no heal before telegraph ends');
  }
  assert.equal(ally.hp, allyHpBefore, 'no heal during telegraph');
  assert.equal(g.hp, playerHpBefore, 'never heals player');

  // Finish into heal
  const fireEvs = [];
  while (e.medicPhase === 'telegraph' && guard++ < 400) {
    g._tickMedic(e, 0.05, fireEvs);
  }
  if (e.medicPhase === 'heal') {
    g._tickMedic(e, 0.05, fireEvs);
  }
  const heal = fireEvs.find((ev) => ev.type === 'medicHeal') || events.concat(fireEvs).find((ev) => ev.type === 'medicHeal');
  // May have fired on transition
  let all = fireEvs;
  if (!heal) {
    // One more tick if still heal
    if (e.medicPhase === 'heal') g._tickMedic(e, 0.05, all);
  }
  const healEv = all.find((ev) => ev.type === 'medicHeal');
  assert.ok(healEv, 'medicHeal after telegraph');
  assert.ok(ally.hp > allyHpBefore, 'ally healed');
  assert.ok(ally.hp <= ally.maxHp, 'no overheal beyond max');
  assert.equal(g.hp, playerHpBefore, 'player HP unchanged');
}

// Does not heal elite/boss
{
  const g = new Game({ seed: 9 });
  g.invuln = 99;
  g.px = 20; g.pz = 20;
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g._spawn('sentinel');
  const elite = g.enemies[0];
  elite.x = 0; elite.z = 0;
  elite.elite = true;
  elite.hp = 10; elite.maxHp = 90;
  elite.speed = 0;
  g._spawn('medic');
  const e = g.enemies[1];
  e.x = 2; e.z = 0;
  e.medicPhase = 'telegraph';
  e.medicPhaseT = 0.05;
  e.telegraphDur = 0.75;
  e.healTargetId = elite.id;
  const evs = [];
  let guard = 0;
  while (e.medicPhase !== 'recover' && e.medicPhase !== 'seek' && e.medicPhase !== 'flee' && guard++ < 100) {
    g._tickMedic(e, 0.05, evs);
  }
  const heal = evs.find((ev) => ev.type === 'medicHeal');
  assert.ok(heal, 'medicHeal still fires');
  assert.equal(heal.count, 0, 'no elite healed');
  assert.equal(elite.hp, 10, 'elite HP unchanged');
}

// Kill mid-telegraph cancels heal
{
  const g = new Game({ seed: 13 });
  g.invuln = 99;
  g.px = 20; g.pz = 20;
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g._spawn('soldier');
  const ally = g.enemies[0];
  ally.x = 0; ally.z = 0;
  ally.hp = 2; ally.maxHp = 5;
  g._spawn('medic');
  const e = g.enemies[1];
  e.x = 2; e.z = 0;
  e.medicPhase = 'telegraph';
  e.medicPhaseT = 0.5;
  e.telegraphDur = 0.75;
  e.healTargetId = ally.id;
  const allyHp = ally.hp;
  const idx = g.enemies.indexOf(e);
  g._kill(e, idx, []);
  assert.ok(!g.enemies.includes(e), 'medic removed');
  assert.equal(ally.hp, allyHp, 'no heal when medic killed mid-telegraph');
}

// pickEnemyType can return medic in assembly
{
  let found = false;
  for (let i = 0; i < 120; i++) {
    const rng = (() => { const v = i / 120; return () => v; })();
    if (pickEnemyType(rng, 200, 'assembly') === 'medic') found = true;
  }
  assert.ok(found, 'pickEnemyType can return medic in assembly');
}

console.log('medic.test.mjs OK');
