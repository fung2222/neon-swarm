/**
 * Phase 6 map zone — lab → assembly @195 → reactor @285 → blockade @420 → rooftop @510.
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
assert.equal(MAP_ZONE.blockadeAt, 420, 'blockadeAt documented at 420s (7:00)');
assert.ok(MAP_ZONE.blockadeAt > 360, 'blockade after boss@360');
assert.ok(MAP_ZONE.blockadeAt > MAP_ZONE.reactorAt, 'blockade after reactor');
assert.equal(MAP_ZONE.rooftopAt, 510, 'rooftopAt documented at 510s (8:30)');
assert.ok(MAP_ZONE.rooftopAt > MAP_ZONE.blockadeAt, 'rooftop after blockade');
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
  const asmShield = Object.fromEntries(asm)['shield'] || 0;
  assert.ok(asmShield >= 0.10 && asmShield <= 0.16, 'assembly light shield presence');
  const labShield = Object.fromEntries(lab)['shield'] || 0;
  assert.equal(labShield, 0, 'early lab has no shield');
}

// Reactor mix
{
  const rx = waveMix(300, 'reactor');
  const m = Object.fromEntries(rx);
  assert.ok((m.drone || 0) >= 0.2, 'reactor more drones');
  assert.ok((m.mech || 0) >= 0.15, 'reactor more mechs');
  assert.ok((m.officer || 0) >= 0.15, 'reactor more officers');
  assert.ok((m.staffer || 0) < 0.05, 'reactor almost no staffers');
  const ids = rx.map(([id]) => id);
  assert.ok(!ids.includes('hunter') && !ids.includes('swarm_core') && !ids.includes('sentinel'),
    'reactor mix has no elite/boss types');
}

// Blockade mix
{
  const bl = waveMix(430, 'blockade');
  const m = Object.fromEntries(bl);
  assert.ok((m.soldier || 0) >= 0.25, 'blockade more soldiers');
  assert.ok((m.officer || 0) >= 0.2, 'blockade more officers');
  assert.ok((m.chief || 0) >= 0.15, 'blockade more chiefs');
  assert.ok((m.mech || 0) >= 0.15, 'blockade more mechs');
  assert.ok((m.staffer || 0) < 0.05, 'blockade almost no staffers');
  assert.ok((m.drone || 0) < 0.08, 'blockade fewer drones');
  assert.ok((m.shield || 0) >= 0.10 && (m.shield || 0) <= 0.16, 'blockade light shield presence');
  const ids = bl.map(([id]) => id);
  assert.ok(!ids.includes('hunter') && !ids.includes('swarm_core') && !ids.includes('sentinel'),
    'blockade mix has no elite/boss types');
}

// Rooftop mix: more drone/mech/chief, fewer staffer; no new boss/elite.
{
  const rt = waveMix(520, 'rooftop');
  const m = Object.fromEntries(rt);
  assert.ok((m.drone || 0) >= 0.25, 'rooftop more drones');
  assert.ok((m.mech || 0) >= 0.2, 'rooftop more mechs');
  assert.ok((m.chief || 0) >= 0.15, 'rooftop more chiefs');
  assert.ok((m.staffer || 0) < 0.05, 'rooftop almost no staffers');
  const ids = rt.map(([id]) => id);
  assert.ok(!ids.includes('hunter') && !ids.includes('swarm_core') && !ids.includes('sentinel'),
    'rooftop mix has no elite/boss types');
}

// Implicit zone from time (no zone arg) — five-zone timeline
{
  assert.deepEqual(waveMix(100), waveMix(100, 'lab'));
  assert.deepEqual(waveMix(200), waveMix(200, 'assembly'));
  assert.deepEqual(waveMix(290), waveMix(290, 'reactor'));
  assert.deepEqual(waveMix(430), waveMix(430, 'blockade'));
  assert.deepEqual(waveMix(520), waveMix(520, 'rooftop'));
}

// Deterministic pick respects zone
{
  const rng = (() => { let i = 0; const seq = [0.01, 0.4, 0.7, 0.9]; return () => seq[i++ % seq.length]; })();
  const a = pickEnemyType(rng, 200, 'assembly');
  assert.ok(['soldier', 'walker', 'officer', 'drone', 'chief', 'staffer', 'sniper', 'shield'].includes(a));
  const r = pickEnemyType(rng, 300, 'reactor');
  assert.ok(['drone', 'mech', 'officer', 'walker', 'soldier', 'chief', 'sniper', 'shield'].includes(r));
  const b = pickEnemyType(rng, 430, 'blockade');
  assert.ok(['soldier', 'officer', 'chief', 'mech', 'walker', 'drone', 'sniper', 'shield'].includes(b));
  const t = pickEnemyType(rng, 520, 'rooftop');
  assert.ok(['drone', 'mech', 'chief', 'officer', 'soldier', 'walker', 'sniper', 'shield'].includes(t));
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

// Game: zoneEnter fires once at assemblyAt
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
}

// Hunter still fires in assembly band
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
  assert.ok(sawZone);
  assert.equal(g.mapZone, 'assembly');
  assert.ok(sawHunter, 'hunter beat still fires after assembly');
}

// Reactor then boss still in reactor before blockade
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
  assert.ok(sawReactor);
  assert.equal(g.mapZone, 'reactor');
  assert.ok(sawBoss, 'boss beat still fires after reactor');
}

// Five-zone timeline: assembly → reactor → blockade → rooftop
{
  const g = new Game({ seed: 19 });
  const zones = [];
  drive(g, MAP_ZONE.rooftopAt + 2, (events) => {
    for (const ev of events) {
      if (ev.type === 'zoneEnter') zones.push(ev);
    }
  });
  assert.equal(zones.length, 4, 'four zoneEnter events after lab');
  assert.equal(zones[0].zone, 'assembly');
  assert.equal(zones[0].at, MAP_ZONE.assemblyAt);
  assert.equal(zones[1].zone, 'reactor');
  assert.equal(zones[1].at, MAP_ZONE.reactorAt);
  assert.equal(zones[2].zone, 'blockade');
  assert.equal(zones[2].at, MAP_ZONE.blockadeAt);
  assert.equal(zones[3].zone, 'rooftop');
  assert.equal(zones[3].at, MAP_ZONE.rooftopAt);
  assert.equal(g.mapZone, 'rooftop');
  assert.ok(g.t >= MAP_ZONE.rooftopAt);
}

console.log('map-zone.test.mjs OK');
