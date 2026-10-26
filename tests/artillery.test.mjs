/**
 * PHASE3-ENEMY-ARTILLERY-001 — heavy artillery silhouette + orange blast telegraph → AoE.
 * Run: node tests/artillery.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { ENEMIES, ARTILLERY, waveMix, pickEnemyType } from '../js/config.js';

assert.ok(ENEMIES.artillery, 'ENEMIES.artillery defined');
assert.equal(ENEMIES.artillery.zh, '重炮單位');
assert.equal(ENEMIES.artillery.en, 'Heavy Artillery');
assert.equal(ENEMIES.artillery.kind, 'artillery');
assert.ok(ENEMIES.artillery.color !== ENEMIES.walker.color, 'artillery color ≠ walker');
assert.ok(ENEMIES.artillery.color !== ENEMIES.mech.color, 'artillery color ≠ mech');
assert.ok(ENEMIES.artillery.color !== ENEMIES.sniper.color, 'artillery color ≠ sniper');
assert.ok(ENEMIES.artillery.speed < ENEMIES.soldier.speed, 'artillery slower than soldier');
assert.ok(ARTILLERY.telegraphSec >= 0.8 && ARTILLERY.telegraphSec <= 1.2, 'telegraph in 0.8–1.2s');
assert.ok(ARTILLERY.blastRadius >= 1.5 && ARTILLERY.blastRadius <= 3.5, 'blast radius sensible');

// Early lab: no artillery; late / blockade / rooftop light
{
  const early = Object.fromEntries(waveMix(20, 'lab'));
  assert.ok(!(early.artillery > 0), 'no artillery in early lab');
  const mid = Object.fromEntries(waveMix(80, 'lab'));
  assert.ok(!(mid.artillery > 0), 'no artillery before late lab');
  const late = Object.fromEntries(waveMix(110, 'lab'));
  assert.ok((late.artillery || 0) > 0 && (late.artillery || 0) <= 0.08, 'light late lab artillery');
  const bl = Object.fromEntries(waveMix(430, 'blockade'));
  assert.ok((bl.artillery || 0) >= 0.05, 'blockade artillery presence');
  const rt = Object.fromEntries(waveMix(520, 'rooftop'));
  assert.ok((rt.artillery || 0) >= 0.04, 'rooftop light artillery');
}

// Behavior: telegraph then AoE impact; no damage during telegraph
{
  const g = new Game({ seed: 7 });
  g.invuln = 0;
  g.hp = 7;
  g.px = 0; g.pz = 0;
  g.vx = 0; g.vz = 0;
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g._spawn('artillery');
  const e = g.enemies[0];
  assert.ok(e.artillery || e.kind === 'artillery');
  e.x = 0; e.z = -10;
  e.prevX = e.x; e.prevZ = e.z;
  e.artilleryPhase = 'reposition';
  e.artilleryPhaseT = 0;
  e.speed = 0;

  const events = [];
  g._tickArtillery(e, 0.05, events);
  assert.equal(e.artilleryPhase, 'telegraph', 'enters telegraph when in band');
  assert.ok(e.artilleryPhaseT >= 0.8, 'telegraph remaining ≥0.8 at start');
  const tele = events.find((ev) => ev.type === 'telegraph' && ev.kind === 'artillery');
  assert.ok(tele, 'telegraph event kind:artillery');
  assert.ok((tele.duration || 0) >= 0.8, 'telegraph duration ≥0.8');
  assert.ok((tele.radius || 0) >= 1.5, 'telegraph carries blast radius');
  assert.ok(tele.x != null && tele.z != null, 'telegraph aim zone');

  const hpBefore = g.hp;
  let guard = 0;
  while (e.artilleryPhase === 'telegraph' && e.artilleryPhaseT > 0.05 && guard++ < 200) {
    const evs = [];
    g._tickArtillery(e, 0.05, evs);
    assert.ok(!evs.some((x) => x.type === 'artilleryImpact'), 'no impact before telegraph ends');
  }
  assert.equal(g.hp, hpBefore, 'no damage during telegraph');

  // Stay inside blast aim zone
  g.px = e.aimX;
  g.pz = e.aimZ;
  g.invuln = 0;
  const fireEvs = [];
  while (e.artilleryPhase === 'telegraph' && guard++ < 400) {
    g._tickArtillery(e, 0.05, fireEvs);
  }
  const impact = fireEvs.find((ev) => ev.type === 'artilleryImpact');
  assert.ok(impact, 'artilleryImpact after telegraph');
  assert.ok(e.artilleryPhase === 'cooldown', 'enters cooldown after impact');
  assert.ok(impact.radius >= 1.5, 'impact has radius');
  assert.ok(impact.hit === true, 'player in blast zone is hit');
  assert.ok(g.hp < hpBefore, 'AoE damage applied after telegraph');
}

// Miss when player leaves blast zone during telegraph
{
  const g = new Game({ seed: 11 });
  g.invuln = 0;
  g.hp = 7;
  g.px = 0; g.pz = 0;
  g.vx = 0; g.vz = 0;
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g._spawn('artillery');
  const e = g.enemies[0];
  e.x = 0; e.z = -10;
  e.artilleryPhase = 'telegraph';
  e.artilleryPhaseT = 0.05;
  e.telegraphDur = 1.0;
  e.aimX = 0; e.aimZ = 0;
  e.blastRadius = ARTILLERY.blastRadius;
  // Player far from aim
  g.px = 8; g.pz = 8;
  const evs = [];
  g._tickArtillery(e, 0.1, evs);
  const impact = evs.find((ev) => ev.type === 'artilleryImpact');
  assert.ok(impact, 'impact still fires (never silent)');
  assert.equal(impact.hit, false, 'miss when outside blast');
  assert.equal(g.hp, 7, 'no damage on miss');
}

// pickEnemyType can return artillery late / blockade
{
  let found = false;
  for (let i = 0; i < 100; i++) {
    const rng = (() => { const v = i / 100; return () => v; })();
    if (pickEnemyType(rng, 430, 'blockade') === 'artillery') found = true;
  }
  assert.ok(found, 'pickEnemyType can return artillery in blockade');
}

console.log('artillery.test.mjs OK');
