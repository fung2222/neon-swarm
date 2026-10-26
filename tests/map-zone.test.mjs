/**
 * Phase 6 map zone — lab → assembly @195 → reactor @285.
 * Run: node tests/map-zone.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { MAP_ZONE, waveMix, pickEnemyType, BEATS } from '../js/config.js';

assert.equal(MAP_ZONE.assemblyAt, 195, 'assemblyAt documented at 195s (3:15)');
assert.ok(MAP_ZONE.assemblyAt >= 180 && MAP_ZONE.assemblyAt <= 210, 'gate in 180–210 band');
assert.ok(MAP_ZONE.assemblyAt < 240, 'assembly before hunter@240');
assert.equal(MAP_ZONE.reactorAt, 285, 'reactorAt documented at 285s (4:45)');
assert.ok(MAP_ZONE.reactorAt > 240, 'reactor after hunter@240');
assert.ok(MAP_ZONE.reactorAt < 360, 'reactor before boss@360');
assert.ok(MAP_ZONE.reactorAt > MAP_ZONE.assemblyAt, 'reactor after assembly');
assert.equal(BEATS.find((b) => b.id === 'hunter').at, 240);
assert.equal(BEATS.find((b) => b.id === 'swarm_core').at, 360);

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

// Reactor mix: more drone/mech/officer, fewer staffer/guard; no new boss/elite.
{
  const rx = waveMix(300, 'reactor');
  const m = Object.fromEntries(rx);
  assert.ok((m.drone || 0) >= 0.2, 'reactor more drones');
  assert.ok((m.mech || 0) >= 0.15, 'reactor more mechs');
  assert.ok((m.officer || 0) >= 0.15, 'reactor more officers');
  assert.ok((m.staffer || 0) < 0.05, 'reactor almost no staffers');
  assert.ok((m.guard || 0) < 0.05, 'reactor almost no guards');
  const ids = rx.map(([id]) => id);
  assert.ok(!ids.includes('hunter') && !ids.includes('swarm_core') && !ids.includes('sentinel'),
    'reactor mix has no elite/boss types');
}

// Implicit zone from time (no zone arg)
{
  assert.equal(waveMix(100).map((x) => x[0]).join(','), waveMix(100, 'lab').map((x) => x[0]).join(','));
  // t past reactorAt without zone → reactor table
  const auto = waveMix(290);
  const rx = waveMix(290, 'reactor');
  assert.deepEqual(auto, rx, 't>=reactorAt implies reactor mix');
  const autoAsm = waveMix(200);
  assert.deepEqual(autoAsm, waveMix(200, 'assembly'), 'assembly band implies assembly mix');
}

// Deterministic pick respects zone
{
  const rng = (() => { let i = 0; const seq = [0.01, 0.4, 0.7, 0.9]; return () => seq[i++ % seq.length]; })();
  const a = pickEnemyType(rng, 200, 'assembly');
  assert.ok(['soldier', 'walker', 'officer', 'drone', 'chief', 'staffer'].includes(a));
  const r = pickEnemyType(rng, 300, 'reactor');
  assert.ok(['drone', 'mech', 'officer', 'walker', 'soldier', 'chief'].includes(r));
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

// Beats still fire after zone swap (hunter @240); still in assembly before reactor
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

// Reactor zoneEnter after hunter window; mapZone becomes reactor
{
  const g = new Game({ seed: 11 });
  const zones = [];
  drive(g, MAP_ZONE.reactorAt + 2, (events) => {
    for (const ev of events) {
      if (ev.type === 'zoneEnter') zones.push(ev);
    }
  });
  assert.equal(zones.length, 2, 'assembly then reactor');
  assert.equal(zones[0].zone, 'assembly');
  assert.equal(zones[0].at, MAP_ZONE.assemblyAt);
  assert.equal(zones[1].zone, 'reactor');
  assert.equal(zones[1].at, MAP_ZONE.reactorAt);
  assert.equal(g.mapZone, 'reactor');
  assert.ok(g.t >= MAP_ZONE.reactorAt);
}

// Boss beat still reachable after reactor (drive to 365, suppress combat clutter)
{
  const g = new Game({ seed: 13 });
  let sawReactor = false;
  let sawBoss = false;
  drive(g, 365, (events, game) => {
    for (const ev of events) {
      if (ev.type === 'zoneEnter' && ev.zone === 'reactor') sawReactor = true;
      if (ev.type === 'bossIn' || (ev.type === 'beat' && ev.kind === 'boss')) sawBoss = true;
    }
    if (game.enemies.some((e) => e.type === 'swarm_core' || e.boss)) sawBoss = true;
  });
  assert.ok(sawReactor, 'reactor entered before boss');
  assert.equal(g.mapZone, 'reactor');
  assert.ok(sawBoss, 'boss beat still fires after reactor');
}

console.log('map-zone.test.mjs OK');
