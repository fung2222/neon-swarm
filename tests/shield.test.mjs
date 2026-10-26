/**
 * PHASE3-ENEMY-SHIELD-001 — shield silhouette config + frontal defense + bash telegraph.
 * Run: node tests/shield.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { ENEMIES, SHIELD_GUARD, waveMix, pickEnemyType } from '../js/config.js';

assert.ok(ENEMIES.shield, 'ENEMIES.shield defined');
assert.equal(ENEMIES.shield.zh, '盾衛');
assert.equal(ENEMIES.shield.en, 'Shield Guard');
assert.equal(ENEMIES.shield.kind, 'shield');
assert.ok(ENEMIES.shield.color !== ENEMIES.soldier.color, 'shield color ≠ soldier');
assert.ok(ENEMIES.shield.color !== ENEMIES.walker.color, 'shield color ≠ walker');
assert.ok(ENEMIES.shield.speed < ENEMIES.soldier.speed, 'shield slower than soldier');
assert.ok(SHIELD_GUARD.frontMitigation >= 0.7 && SHIELD_GUARD.frontMitigation <= 0.95);
assert.ok(SHIELD_GUARD.bashTelegraphSec >= 0.45 && SHIELD_GUARD.bashTelegraphSec <= 1.0);
assert.ok(SHIELD_GUARD.frontConeDot >= 0.4 && SHIELD_GUARD.frontConeDot <= 0.7);

// Early lab: no shield flood
{
  const early = Object.fromEntries(waveMix(20, 'lab'));
  assert.ok(!(early.shield > 0), 'no shield in early lab');
  const midEarly = Object.fromEntries(waveMix(50, 'lab'));
  assert.ok(!(midEarly.shield > 0), 'no shield before ~65s lab');
  const mid = Object.fromEntries(waveMix(80, 'lab'));
  assert.ok((mid.shield || 0) > 0 && (mid.shield || 0) <= 0.12, 'light shield mid-late lab');
  const as = Object.fromEntries(waveMix(200, 'assembly'));
  assert.ok((as.shield || 0) >= 0.12, 'assembly shield presence');
  const bl = Object.fromEntries(waveMix(430, 'blockade'));
  assert.ok((bl.shield || 0) >= 0.12, 'blockade shield presence');
}

// Frontal mitigation vs rear/flank full damage
{
  const g = new Game({ seed: 3 });
  g.enemies.length = 0;
  g.px = 0; g.pz = 0;
  g._spawnPauseUntil = 9999;
  g._spawn('shield');
  const e = g.enemies[0];
  assert.ok(e.shieldGuard || e.type === 'shield', 'spawned shield');
  e.x = 0; e.z = -4;
  e.faceDx = 0; e.faceDz = 1; // facing +Z toward player
  e.prevX = e.x; e.prevZ = e.z;

  const frontMul = g._enemyIncomingMul(e, 0, 0);   // src in front (player)
  const rearMul = g._enemyIncomingMul(e, 0, -8);   // src behind
  const flankMul = g._enemyIncomingMul(e, 6, -4);  // src to the side
  assert.ok(frontMul < 0.3, `front heavily mitigated, got ${frontMul}`);
  assert.ok(Math.abs(frontMul - (1 - SHIELD_GUARD.frontMitigation)) < 1e-6, 'front = 1 - mitigation');
  assert.equal(rearMul, 1, 'rear takes full damage');
  assert.equal(flankMul, 1, 'flank takes full damage');

  const hp0 = e.hp;
  g._applyEnemyDamage(e, 10, 0, 0, [], {});
  const afterFront = e.hp;
  assert.ok(hp0 - afterFront < 2.5, 'front 10 dmg deals ~1.5');
  e.hp = hp0;
  g._applyEnemyDamage(e, 10, 0, -8, [], {});
  assert.equal(e.hp, hp0 - 10, 'rear 10 dmg deals full 10');
}

// Bash: telegraph then contact slam
{
  const g = new Game({ seed: 7 });
  g.invuln = 99;
  g.hp = 7;
  g.px = 0; g.pz = 0;
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g._spawn('shield');
  const e = g.enemies[0];
  e.x = 0; e.z = -1.2;
  e.prevX = e.x; e.prevZ = e.z;
  e.shieldPhase = 'chase';
  e.shieldPhaseT = 0;
  e.speed = 0;

  const events = [];
  g._tickShield(e, 0.05, events);
  assert.equal(e.shieldPhase, 'telegraph', 'enters telegraph when close');
  assert.ok(e.shieldPhaseT >= 0.45, 'telegraph remaining ≥0.45 at start');
  const tele = events.find((ev) => ev.type === 'telegraph' && ev.kind === 'shield');
  assert.ok(tele, 'telegraph event kind:shield');
  assert.ok((tele.duration || 0) >= 0.45, 'telegraph duration ≥0.45');

  let guard = 0;
  while (e.shieldPhase === 'telegraph' && e.shieldPhaseT > 0.05 && guard++ < 200) {
    const evs = [];
    g._tickShield(e, 0.05, evs);
    assert.ok(!evs.some((x) => x.type === 'shieldBash'), 'no bash before telegraph ends');
  }

  g.invuln = 0;
  e.x = 0; e.z = -1.1;
  const fireEvs = [];
  while (e.shieldPhase === 'telegraph' && guard++ < 400) {
    g._tickShield(e, 0.05, fireEvs);
  }
  const bash = fireEvs.find((ev) => ev.type === 'shieldBash');
  assert.ok(bash, 'shieldBash after telegraph');
  assert.ok(e.shieldPhase === 'recover', 'enters recover after bash');
}

// Slow chase toward player
{
  const g = new Game({ seed: 11 });
  g.enemies.length = 0;
  g.px = 0; g.pz = 0;
  g._spawnPauseUntil = 9999;
  g._spawn('shield');
  const e = g.enemies[0];
  e.x = 0; e.z = -8;
  e.shieldPhase = 'chase';
  e.shieldPhaseT = 2.0;
  const z0 = e.z;
  g._tickShield(e, 0.2, []);
  assert.ok(e.z > z0, 'chases toward player (less negative z)');
  assert.ok(e.faceDz > 0.5, 'prefers face player');
}

// pickEnemyType can return shield in assembly
{
  let found = false;
  for (let i = 0; i < 80; i++) {
    const rng = (() => { const v = i / 80; return () => v; })();
    if (pickEnemyType(rng, 200, 'assembly') === 'shield') found = true;
  }
  assert.ok(found, 'pickEnemyType can yield shield in assembly');
}

console.log('shield.test.mjs OK');
