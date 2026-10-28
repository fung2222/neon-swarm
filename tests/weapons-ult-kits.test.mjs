/**
 * WEAPONS-ULT-KITS-001 (v0.9.123) — unique U1/U2 behavior deltas for all 5 primaries.
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { Game } from '../js/logic.js';
import { branchStatMods, applyUltKitMods } from '../js/config.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const weapons = readFileSync(new URL('../js/weapons.js', import.meta.url), 'utf8');
assert.ok(/\?v=0\.9\.(12[3-9]|1[3-9]\d)/.test(html), 'cache-bust ≥0.9.123');
assert.ok(weapons.includes('WEAPONS-ULT-KITS-001'), 'ship id');
assert.equal(typeof applyUltKitMods, 'function');

const primaries = ['gatling', 'ion_beam', 'tracking_bomb', 'vulcan', 'zero_laser'];
for (const id of primaries) {
  for (const L of 'ABC') {
    const base = branchStatMods(id, L);
    const u1 = branchStatMods(id, L, 'U1');
    const u2 = branchStatMods(id, L, 'U2');
    assert.notEqual(JSON.stringify(u1), JSON.stringify(base), `${id} ${L} U1≠base`);
    assert.notEqual(JSON.stringify(u2), JSON.stringify(base), `${id} ${L} U2≠base`);
    assert.notEqual(JSON.stringify(u1), JSON.stringify(u2), `${id} ${L} U1≠U2`);
  }
}

// Named kit flags
assert.equal(branchStatMods('gatling', 'C', 'U1').boltCount, 5);
assert.equal(branchStatMods('gatling', 'C', 'U2').boltCount, 4);
assert.ok(branchStatMods('gatling', 'A', 'U1').heatGainMul > 1);
assert.ok(branchStatMods('gatling', 'A', 'U2').heatGainMul < 1);
assert.ok(branchStatMods('gatling', 'B', 'U1').pierceAdd >= 4);
assert.ok(branchStatMods('ion_beam', 'B', 'U1').chainJumps >= 4);
assert.equal(branchStatMods('ion_beam', 'C', 'U1').boltCount, 2);
assert.equal(branchStatMods('tracking_bomb', 'A', 'U1').warheads, 5);
assert.equal(branchStatMods('tracking_bomb', 'B', 'U1').warheads, 2);
assert.equal(branchStatMods('vulcan', 'A', 'U1').boltCount, 3);
assert.ok(branchStatMods('vulcan', 'B', 'U1').burn > branchStatMods('vulcan', 'B').burn);
assert.ok(branchStatMods('vulcan', 'C', 'U1').fortressMoveMul < branchStatMods('vulcan', 'C').fortressMoveMul);
assert.ok(branchStatMods('zero_laser', 'A', 'U1').chillMul > branchStatMods('zero_laser', 'A').chillMul);
assert.ok(branchStatMods('zero_laser', 'B', 'U1').frostBurstR > branchStatMods('zero_laser', 'B').frostBurstR);
assert.ok(branchStatMods('zero_laser', 'C', 'U1').selfShield > branchStatMods('zero_laser', 'C').selfShield);

// Combat: gatling C U1 fires 5 bolts
{
  const g = new Game({ seed: 42 });
  g.taken = { gatling: 5, mg: 5 };
  g.weaponBranches = { gatling: 'C' };
  g.weaponUlts = { gatling: 'U1' };
  g.loadout = { primary: ['gatling', null], secondary: [null, null], throw: [null, null] };
  g.fireMode = 'primary';
  g.activePrimaryIndex = 0;
  g.fireT = 0;
  g.px = 0; g.pz = 0; g.alive = true; g.invuln = 99;
  g.enemies.push({
    id: 'e0', kind: 'soldier', type: 'soldier', family: 'human',
    x: 0, z: 4, prevX: 0, prevZ: 4, vx: 0, vz: 0,
    hp: 20, maxHp: 20, r: 0.35, speed: 1, damage: 1, color: '#c44', slow: 0, hit: 0, score: 10,
  });
  const events = [];
  assert.equal(g._tickPrimary(0.02, events, 1), true);
  const bolts = g.bullets.filter((b) => b.weapon === 'gatling').length;
  assert.ok(bolts >= 5, `cone nova bolts got ${bolts}`);
}

// Combat: ion C U1 dual slit
{
  const g = new Game({ seed: 43 });
  g.taken = { ion_beam: 5, laser: 5 };
  g.weaponBranches = { ion_beam: 'C' };
  g.weaponUlts = { ion_beam: 'U1' };
  g.loadout = { primary: ['ion_beam', null], secondary: [null, null], throw: [null, null] };
  g.fireMode = 'primary';
  g.activePrimaryIndex = 0;
  g.laser = 1; g.ion_beam = 1;
  g.px = 0; g.pz = 0; g.alive = true; g.invuln = 99;
  g._ionPhase = 'fire';
  g.enemies.push({
    id: 'e0', kind: 'soldier', type: 'soldier', family: 'human',
    x: 0, z: 5, prevX: 0, prevZ: 5, vx: 0, vz: 0,
    hp: 30, maxHp: 30, r: 0.35, speed: 1, damage: 1, color: '#c44', slow: 0, hit: 0, score: 10,
  });
  const events = [];
  assert.equal(g._tickPrimary(0.02, events, 1), true);
  const bolts = g.bullets.filter((b) => b.weapon === 'ion_beam').length;
  assert.ok(bolts >= 2, `dual slit bolts got ${bolts}`);
}

// Combat: tracking A U1 penta
{
  const g = new Game({ seed: 44 });
  g.taken = { tracking_bomb: 5, rocket: 5 };
  g.weaponBranches = { tracking_bomb: 'A' };
  g.weaponUlts = { tracking_bomb: 'U1' };
  g.loadout = { primary: ['tracking_bomb', null], secondary: [null, null], throw: [null, null] };
  g.fireMode = 'primary';
  g.activePrimaryIndex = 0;
  g.rocket = 1; g.tracking_bomb = 1;
  g.rocketT = 0;
  g.px = 0; g.pz = 0; g.alive = true; g.invuln = 99;
  g.enemies.push({
    id: 'e0', kind: 'soldier', type: 'soldier', family: 'human',
    x: 0, z: 6, prevX: 0, prevZ: 6, vx: 0, vz: 0,
    hp: 40, maxHp: 40, r: 0.35, speed: 1, damage: 1, color: '#c44', slow: 0, hit: 0, score: 10,
  });
  const events = [];
  assert.equal(g._tickPrimary(0.02, events, 1), true);
  const bolts = g.bullets.filter((b) => b.weapon === 'tracking_bomb').length;
  assert.ok(bolts >= 5, `penta warheads got ${bolts}`);
}

console.log('weapons-ult-kits.test.mjs: PASS');
