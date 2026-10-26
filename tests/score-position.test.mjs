/**
 * PHASE6-SCORE-POSITION-001 — move / safe-zone / pace kill bonuses.
 * Run: node --test tests/score-position.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { SCORE_POS, ZONE_PRESSURE, PLAYER, CARDS_BY_ID } from '../js/config.js';

assert.ok(SCORE_POS, 'SCORE_POS defined');
assert.ok(SCORE_POS.moveWindowSec >= 0.35 && SCORE_POS.moveWindowSec <= 0.6, 'moveWindow ~0.35–0.6');
assert.ok(SCORE_POS.moveBonus > 0, 'moveBonus > 0');
assert.ok(SCORE_POS.safeBonus > 0, 'safeBonus > 0');
assert.ok(SCORE_POS.paceWindowSec > 0, 'paceWindowSec');
assert.ok(SCORE_POS.paceMinKills >= 2, 'paceMinKills');
assert.ok(SCORE_POS.paceBonus > 0, 'paceBonus');
assert.ok(SCORE_POS.paceCapPerKill >= 1, 'paceCapPerKill hard cap');

function stubEnemy(score = 10) {
  return {
    x: 1, z: 0, score, xp: 1, kind: 'drone',
    elite: false, boss: false, r: 0.3, hp: 0,
  };
}

function killOnce(g, score = 10) {
  const e = stubEnemy(score);
  g.enemies.push(e);
  const i = g.enemies.length - 1;
  const before = g.score;
  g._kill(e, i, []);
  return g.score - before;
}

// Base formula unchanged: e.score + floor(t); no bonuses when stationary / inactive
{
  const g = new Game({ seed: 3 });
  g.enemies.length = 0;
  g.t = 12.7;
  g._lastMovedAt = -999;
  g.zonePressureActive = false;
  g._recentKillTs = [];
  g.scoreMove = 0; g.scoreSafe = 0; g.scorePace = 0;
  const base = 10 + Math.floor(g.t);
  const delta = killOnce(g, 10);
  assert.equal(delta, base, `stationary kill = base only (got ${delta}, want ${base})`);
  assert.equal(g.scoreMove, 0, 'no move bonus stationary');
  assert.equal(g.scoreSafe, 0, 'no safe bonus inactive');
}

// Moving kill gets moveBonus
{
  const g = new Game({ seed: 4 });
  g.enemies.length = 0;
  g.t = 20;
  g._lastMovedAt = g.t; // just moved
  g.zonePressureActive = false;
  g._recentKillTs = [];
  const base = 10 + Math.floor(g.t);
  const delta = killOnce(g, 10);
  assert.equal(delta, base + SCORE_POS.moveBonus, 'moving kill includes moveBonus');
  assert.equal(g.scoreMove, SCORE_POS.moveBonus, 'scoreMove tracked');
}

// Movement window expires → no move bonus
{
  const g = new Game({ seed: 5 });
  g.enemies.length = 0;
  g.t = 30;
  g._lastMovedAt = g.t - (SCORE_POS.moveWindowSec + 0.05);
  g.zonePressureActive = false;
  g._recentKillTs = [];
  const base = 10 + Math.floor(g.t);
  const delta = killOnce(g, 10);
  assert.equal(delta, base, 'expired move window → no moveBonus');
  assert.equal(g.scoreMove, 0);
}

// step() with stick input marks _lastMovedAt
{
  const g = new Game({ seed: 6 });
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g.invuln = 99;
  g.t = 5;
  g._lastMovedAt = -999;
  g.moveDir(1, 0);
  g.step(1 / 30);
  assert.ok(g.t - g._lastMovedAt < 0.05, 'step while moving stamps _lastMovedAt');
  g.stopMove();
  const stamped = g._lastMovedAt;
  g.t = stamped + 1; // jump time without stepping move
  // don't step — just check kill uses stamp
  g.enemies.length = 0;
  g.zonePressureActive = false;
  g._recentKillTs = [];
  // stamp is stale (> moveWindow)
  g._lastMovedAt = g.t - 1;
  const base = 10 + Math.floor(g.t);
  const delta = killOnce(g, 10);
  assert.equal(delta, base, 'stale stamp after stop → no moveBonus');
}

// Outside safeR → no safeBonus even when active
{
  const g = new Game({ seed: 7 });
  g.enemies.length = 0;
  g.t = 40;
  g._lastMovedAt = -999;
  g.zonePressureActive = true;
  g.safeR = 16;
  g.px = 20; g.pz = 0; // outside
  g._recentKillTs = [];
  const base = 10 + Math.floor(g.t);
  const delta = killOnce(g, 10);
  assert.equal(delta, base, 'outside safeR → no safeBonus');
  assert.equal(g.scoreSafe, 0);
}

// Inside + active → safeBonus
{
  const g = new Game({ seed: 8 });
  g.enemies.length = 0;
  g.t = 40;
  g._lastMovedAt = -999;
  g.zonePressureActive = true;
  g.safeR = 16;
  g.px = 0; g.pz = 0;
  g._recentKillTs = [];
  const base = 10 + Math.floor(g.t);
  const delta = killOnce(g, 10);
  assert.equal(delta, base + SCORE_POS.safeBonus, 'inside safeR + active → safeBonus');
  assert.equal(g.scoreSafe, SCORE_POS.safeBonus);
}

// Pace: fewer than min kills → no pace; at threshold → paceBonus (capped)
{
  const g = new Game({ seed: 9 });
  g.enemies.length = 0;
  g.t = 50;
  g._lastMovedAt = -999;
  g.zonePressureActive = false;
  g._recentKillTs = [];
  const need = SCORE_POS.paceMinKills;
  for (let i = 0; i < need - 1; i++) {
    g.t += 0.05;
    killOnce(g, 1);
  }
  assert.equal(g.scorePace, 0, 'below pace threshold → no pace');
  g.t += 0.05;
  const before = g.scorePace;
  killOnce(g, 1);
  const expectedAdd = Math.min(SCORE_POS.paceBonus, SCORE_POS.paceCapPerKill);
  assert.equal(g.scorePace - before, expectedAdd, 'at threshold → paceBonus');
  // Further kills in window still only get cap per kill
  g.t += 0.05;
  const before2 = g.scorePace;
  killOnce(g, 1);
  assert.equal(g.scorePace - before2, expectedAdd, 'pace cap per kill holds');
}

// Combined: move + safe stack additively; base still present
{
  const g = new Game({ seed: 10 });
  g.enemies.length = 0;
  g.t = 60;
  g._lastMovedAt = g.t;
  g.zonePressureActive = true;
  g.safeR = 16;
  g.px = 1; g.pz = 1;
  g._recentKillTs = [];
  const base = 10 + Math.floor(g.t);
  const delta = killOnce(g, 10);
  assert.equal(
    delta,
    base + SCORE_POS.moveBonus + SCORE_POS.safeBonus,
    'move + safe stack on base',
  );
}

// Existing card / player numbers untouched by this feature (sanity)
{
  assert.ok(PLAYER.bulletSpeed > 0);
  assert.ok(CARDS_BY_ID.dmg, 'dmg card still present');
  assert.ok(ZONE_PRESSURE.startAfter > 0);
}

console.log('score-position.test.mjs OK');
