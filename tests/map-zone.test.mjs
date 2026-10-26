/**
 * Phase 6 map zone — lab → assembly @ MAP_ZONE.assemblyAt (195s).
 * Run: node tests/map-zone.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { MAP_ZONE, waveMix, pickEnemyType, BEATS } from '../js/config.js';

assert.equal(MAP_ZONE.assemblyAt, 195, 'assemblyAt documented at 195s (3:15)');
assert.ok(MAP_ZONE.assemblyAt >= 180 && MAP_ZONE.assemblyAt <= 210, 'gate in 180–210 band');
assert.ok(MAP_ZONE.assemblyAt < 240, 'assembly before hunter@240');
assert.equal(BEATS.find((b) => b.id === 'hunter').at, 240);

// Lab mix still has staffers early; assembly mix suppresses them.
{
  const lab = waveMix(30, 'lab');
  const asm = waveMix(200, 'assembly');
  const labStaff = Object.fromEntries(lab)['staffer'] || 0;
  const asmStaff = Object.fromEntries(asm)['staffer'] || 0;
  const asmSoldier = Object.fromEntries(asm)['soldier'] || 0;
  const asmWalker = Object.fromEntries(asm)['walker'] || 0;
  assert.ok(labStaff > 0.2, 'lab early has staffers');
  assert.ok(asmStaff < 0.1, 'assembly fewer staffers');
  assert.ok(asmSoldier + asmWalker > 0.5, 'assembly heavier soldier/walker');
}

// Deterministic pick respects zone
{
  const rng = (() => { let i = 0; const seq = [0.01, 0.4, 0.7, 0.9]; return () => seq[i++ % seq.length]; })();
  const a = pickEnemyType(rng, 200, 'assembly');
  assert.ok(['soldier', 'walker', 'officer', 'drone', 'chief', 'staffer'].includes(a));
}

function drive(g, until, onEvents) {
  const dt = 1 / 30;
  let guard = 0;
  while (g.t < until && g.alive && guard++ < 500000) {
    g.invuln = 999;
    g.enemies.length = 0;
    g.bullets.length = 0;
    g.gems.length = 0;
    g.spawnAcc = 0;
    g.bossHazards.length = 0;
    if (g.pausedForLevel && g.pendingCards && g.pendingCards.length) {
      g.applyCard(g.pendingCards[0]);
    }
    const { events } = g.step(dt);
    if (onEvents) onEvents(events, g);
  }
}

// Game: zoneEnter fires once at assemblyAt; mapZone flips
{
  const g = new Game({ seed: 42 });
  assert.equal(g.mapZone, 'lab');
  let zoneEv = null;
  let zoneCount = 0;
  drive(g, MAP_ZONE.assemblyAt + 1.5, (events) => {
    for (const ev of events) {
      if (ev.type === 'zoneEnter') {
        zoneCount++;
        zoneEv = ev;
      }
    }
  });
  assert.equal(zoneCount, 1, 'zoneEnter exactly once');
  assert.ok(zoneEv);
  assert.equal(zoneEv.zone, 'assembly');
  assert.equal(zoneEv.at, MAP_ZONE.assemblyAt);
  assert.equal(g.mapZone, 'assembly');
  assert.ok(g.t >= MAP_ZONE.assemblyAt);
}

// Beats still fire after zone swap (hunter @240)
{
  const g = new Game({ seed: 7 });
  let sawZone = false;
  let sawHunter = false;
  drive(g, 245, (events, game) => {
    for (const ev of events) {
      if (ev.type === 'zoneEnter') sawZone = true;
      if (ev.type === 'eliteIn' && ev.nameEn === 'HUNTER RAID') sawHunter = true;
      if (ev.type === 'beat' && ev.kind === 'elite' && ev.id === 'hunter') sawHunter = true;
    }
    if (game.enemies.some((e) => e.type === 'hunter')) sawHunter = true;
  });
  assert.ok(sawZone, 'zone entered before hunter window');
  assert.equal(g.mapZone, 'assembly');
  assert.ok(sawHunter, 'hunter beat still fires after assembly');
}

console.log('map-zone.test.mjs OK');
