/**
 * PHASE3-ENEMY-SNIPER-001 — sniper silhouette config + red-aim telegraph → shot.
 * Run: node tests/sniper.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { ENEMIES, SNIPER, waveMix, pickEnemyType } from '../js/config.js';

assert.ok(ENEMIES.sniper, 'ENEMIES.sniper defined');
assert.equal(ENEMIES.sniper.zh, '狙擊單位');
assert.equal(ENEMIES.sniper.en, 'Sniper Unit');
assert.equal(ENEMIES.sniper.kind, 'sniper');
assert.ok(ENEMIES.sniper.color !== ENEMIES.soldier.color, 'sniper color ≠ soldier');
assert.ok(ENEMIES.sniper.color !== ENEMIES.officer.color, 'sniper color ≠ officer');
assert.ok(SNIPER.telegraphSec >= 0.8 && SNIPER.telegraphSec <= 1.2, 'telegraph in 0.8–1.2s');

// Early lab: no sniper domination
{
  const early = Object.fromEntries(waveMix(20, 'lab'));
  assert.ok(!(early.sniper > 0), 'no sniper in very early lab');
  const mid = Object.fromEntries(waveMix(50, 'lab'));
  assert.ok((mid.sniper || 0) > 0 && (mid.sniper || 0) <= 0.12, 'light sniper mid-late lab');
  const rx = Object.fromEntries(waveMix(300, 'reactor'));
  assert.ok((rx.sniper || 0) >= 0.05, 'reactor light sniper');
  const bl = Object.fromEntries(waveMix(430, 'blockade'));
  assert.ok((bl.sniper || 0) >= 0.05, 'blockade light sniper');
}

// Behavior: telegraph then shot; no damage during telegraph
{
  const g = new Game({ seed: 7 });
  g.invuln = 0;
  g.hp = 7;
  g.px = 0; g.pz = 0;
  g.enemies.length = 0;
  g._spawnPauseUntil = 9999;
  g._spawn('sniper');
  const e = g.enemies[0];
  assert.ok(e.sniper || e.kind === 'sniper');
  // Place at ideal range, facing player
  e.x = 0; e.z = -9;
  e.prevX = e.x; e.prevZ = e.z;
  e.sniperPhase = 'reposition';
  e.sniperPhaseT = 0;

  const events = [];
  // One step should enter aim + emit telegraph
  g._tickSniper(e, 0.05, events);
  assert.equal(e.sniperPhase, 'aim', 'enters aim when in band');
  assert.ok(e.sniperPhaseT >= 0.8, 'telegraph remaining ≥0.8 at start');
  const tele = events.find((ev) => ev.type === 'telegraph' && ev.kind === 'sniper');
  assert.ok(tele, 'telegraph event');
  assert.ok((tele.duration || 0) >= 0.8, 'telegraph duration ≥0.8');

  const hpBefore = g.hp;
  // Drive almost full telegraph without completing — still no sniperShot
  let guard = 0;
  while (e.sniperPhase === 'aim' && e.sniperPhaseT > 0.05 && guard++ < 200) {
    const evs = [];
    g._tickSniper(e, 0.05, evs);
    assert.ok(!evs.some((x) => x.type === 'sniperShot'), 'no shot before telegraph ends');
  }
  assert.equal(g.hp, hpBefore, 'no damage during telegraph (player not walking into body)');

  // Finish telegraph → shot
  const fireEvs = [];
  g.invuln = 0;
  // Stay on the aim line
  g.px = e.x + e.aimDx * 9;
  g.pz = e.z + e.aimDz * 9;
  while (e.sniperPhase === 'aim' && guard++ < 400) {
    g._tickSniper(e, 0.05, fireEvs);
  }
  const shot = fireEvs.find((ev) => ev.type === 'sniperShot');
  assert.ok(shot, 'sniperShot after telegraph');
  assert.ok(e.sniperPhase === 'cooldown', 'enters cooldown after shot');
  assert.ok(shot.muzzleX != null && shot.muzzleZ != null, 'muzzle coords for VFX');
}

// Keep distance: retreat when too close
{
  const g = new Game({ seed: 11 });
  g.px = 0; g.pz = 0;
  g._spawn('sniper');
  const e = g.enemies[0];
  e.x = 0; e.z = -3; // too close
  e.sniperPhase = 'reposition';
  e.sniperPhaseT = 1.0;
  const z0 = e.z;
  g._tickSniper(e, 0.2, []);
  // Should move away (more negative z, or at least not toward player at z=0)
  assert.ok(Math.abs(e.z) >= Math.abs(z0) - 0.05, 'prefers keep distance when close');
}

// pickEnemyType can return sniper mid-late
{
  let found = false;
  for (let i = 0; i < 80; i++) {
    const rng = (() => { const v = i / 80; return () => v; })();
    if (pickEnemyType(rng, 70, 'lab') === 'sniper') found = true;
  }
  assert.ok(found, 'pickEnemyType can yield sniper mid-late lab');
}

console.log('sniper.test.mjs OK');
