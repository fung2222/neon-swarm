/**
 * WEAPONS-BRANCH-KITS-001 (v0.9.55) — A≠B≠C combat deltas.
 * Run: node tests/weapons-branch-kits.test.mjs
 */
import assert from 'assert';
import { Game } from '../js/logic.js';
import { branchStatMods, branchOptions } from '../js/config.js';

function spawnGrunt(g, x, z, hp = 8) {
  const e = {
    id: `e${g.enemies.length}`,
    kind: 'soldier', type: 'soldier', family: 'human',
    x, z, prevX: x, prevZ: z, vx: 0, vz: 0,
    hp, maxHp: hp, r: 0.35, speed: 1.2, damage: 1,
    color: '#c44', nameZh: '士兵', nameEn: 'Soldier',
    slow: 0, hit: 0, score: 10,
  };
  g.enemies.push(e);
  return e;
}

function readyGatling(g, letter) {
  g.taken = { gatling: 3, mg: 3 };
  g.weaponBranches = { gatling: letter };
  g.loadout = { primary: ['gatling', null], secondary: [null, null], throw: [null, null] };
  g.fireMode = 'primary';
  g.activePrimaryIndex = 0;
  g.fireT = 0;
  g._gatlingHeat = 0;
  g.px = 0; g.pz = 0;
  g.bullets.length = 0;
  g.enemies.length = 0;
  g.alive = true;
  g.invuln = 99;
}

{
  // Kit tables: A/B/C distinct for every primary
  for (const id of ['gatling', 'ion_beam', 'tracking_bomb', 'vulcan', 'zero_laser']) {
    const A = branchStatMods(id, 'A');
    const B = branchStatMods(id, 'B');
    const C = branchStatMods(id, 'C');
    const sig = (m) => JSON.stringify({
      dmgMul: m.dmgMul, cdMul: m.cdMul, pierceAdd: m.pierceAdd,
      boltCount: m.boltCount, spreadRad: m.spreadRad, overheat: m.overheat,
      chargeMul: m.chargeMul, chainJumps: m.chainJumps, slit: m.slit,
      warheads: m.warheads, stickMul: m.stickMul, homingMul: m.homingMul,
      burn: m.burn, fortressMoveMul: m.fortressMoveMul,
      chillMul: m.chillMul, frostBurstR: m.frostBurstR, selfShield: m.selfShield,
    });
    assert.notEqual(sig(A), sig(B), `${id} A≠B`);
    assert.notEqual(sig(B), sig(C), `${id} B≠C`);
    assert.notEqual(sig(A), sig(C), `${id} A≠C`);
  }
}

{
  // Named kit flags
  assert.equal(branchStatMods('gatling', 'A').overheat, true);
  assert.ok(branchStatMods('gatling', 'B').pierceAdd >= 2);
  assert.equal(branchStatMods('gatling', 'C').boltCount, 3);
  assert.ok(branchStatMods('ion_beam', 'A').chargeMul > 1.2);
  assert.equal(branchStatMods('ion_beam', 'B').chainJumps, 2);
  assert.equal(branchStatMods('ion_beam', 'C').slit, true);
  assert.equal(branchStatMods('tracking_bomb', 'A').warheads, 3);
  assert.ok(branchStatMods('tracking_bomb', 'B').stickMul > 2);
  assert.ok(branchStatMods('tracking_bomb', 'C').homingMul > 1.5);
  assert.equal(branchStatMods('vulcan', 'A').boltCount, 2);
  assert.ok(branchStatMods('vulcan', 'B').burn > 0);
  assert.ok(branchStatMods('vulcan', 'C').fortressMoveMul < 0.5);
  assert.ok(branchStatMods('zero_laser', 'A').chillMul > 1.5);
  assert.ok(branchStatMods('zero_laser', 'B').frostBurstR > 1);
  assert.ok(branchStatMods('zero_laser', 'C').selfShield > 0);
  // Ult still light amp only
  const u1 = branchStatMods('gatling', 'A', 'U1');
  const base = branchStatMods('gatling', 'A');
  assert.ok(u1.dmgMul > base.dmgMul);
  assert.equal(u1.boltCount, base.boltCount);
}

{
  // Gatling combat: C fires more bolts than B; A has shorter cd
  const g = new Game({ seed: 11 });
  readyGatling(g, 'C');
  spawnGrunt(g, 0, 4);
  const events = [];
  assert.equal(g._tickPrimary(0.02, events, 1), true);
  const boltsC = g.bullets.filter((b) => b.weapon === 'gatling').length;
  assert.ok(boltsC >= 3, `gatling C multi-bolt got ${boltsC}`);

  readyGatling(g, 'B');
  spawnGrunt(g, 0, 4);
  g._tickPrimary(0.02, events, 1);
  const boltsB = g.bullets.filter((b) => b.weapon === 'gatling').length;
  assert.equal(boltsB, 1, 'gatling B single bolt');
  assert.ok((g.bullets[0].pierce || 0) >= 2, 'gatling B pierce');

  readyGatling(g, 'A');
  spawnGrunt(g, 0, 4);
  g._tickPrimary(0.02, events, 1);
  const cdA = g.fireT;
  readyGatling(g, 'B');
  spawnGrunt(g, 0, 4);
  g._tickPrimary(0.02, events, 1);
  const cdB = g.fireT;
  assert.ok(cdA < cdB, `gatling A RoF faster (${cdA} < ${cdB})`);
}

{
  // Ion A longer charge need than C slit
  const g = new Game({ seed: 12 });
  g.taken = { ion_beam: 3, laser: 3 };
  g.loadout = { primary: ['ion_beam', null], secondary: [null, null], throw: [null, null] };
  g.fireMode = 'primary';
  g.activePrimaryIndex = 0;
  g.laser = 1; g.ion_beam = 1;
  g.px = 0; g.pz = 0; g.alive = true; g.invuln = 99;

  g.weaponBranches = { ion_beam: 'A' };
  g._ionPhase = 'charge'; g._ionChargeT = 0;
  spawnGrunt(g, 0, 5, 20);
  const ev = [];
  // short dt should NOT complete A charge (need ~0.55*1.4)
  g._tickPrimary(0.4, ev, 1);
  assert.equal(g._ionPhase, 'charge', 'ion A still charging after 0.4s');
  assert.ok(g.bullets.length === 0);

  g.weaponBranches = { ion_beam: 'C' };
  g._ionPhase = 'charge'; g._ionChargeT = 0;
  g.bullets.length = 0;
  g._tickPrimary(0.35, ev, 1);
  // C chargeMul 0.52 → need ~0.28; 0.35 should fire
  assert.ok(g.bullets.some((b) => b.weapon === 'ion_beam') || g._ionPhase === 'charge' && g._ionChargeT === 0,
    'ion C should fire quickly');
  // Force fire path
  g._ionPhase = 'fire';
  g.bullets.length = 0;
  g._tickPrimary(0.02, ev, 1);
  const ionB = g.bullets.find((b) => b.weapon === 'ion_beam');
  assert.ok(ionB, 'ion C fired');
  assert.ok(ionB.r < 0.15, 'ion C slit narrower');
}

{
  // Ion B chain jump on hit
  const g = new Game({ seed: 13 });
  g.taken = { ion_beam: 3 };
  g.weaponBranches = { ion_beam: 'B' };
  g.loadout = { primary: ['ion_beam', null], secondary: [null, null], throw: [null, null] };
  g.laser = 1; g.ion_beam = 1;
  g.px = 0; g.pz = 0; g.alive = true; g.invuln = 99;
  const a = spawnGrunt(g, 0, 3, 30);
  const b = spawnGrunt(g, 1.5, 3.2, 30);
  const mods = g._weaponMods('ion_beam');
  assert.equal(mods.chainJumps, 2);
  const ev = [];
  g._ionChainJump(a, 2, 3.6, 2.0, ev);
  assert.ok(ev.some((e) => e.type === 'chainJump'), 'chain jump event');
  assert.ok(b.hp < 30, 'chain damaged neighbor');
}

{
  // Vulcan B applies burn; vulcan C sets fortress
  const g = new Game({ seed: 14 });
  g.taken = { vulcan: 3 };
  g.loadout = { primary: ['vulcan', null], secondary: [null, null], throw: [null, null] };
  g.vulcan = 1; g.fireMode = 'primary'; g.activePrimaryIndex = 0;
  g.px = 0; g.pz = 0; g.alive = true; g.invuln = 99; g.fireT = 0;
  g._vulcanSpin = 1;

  g.weaponBranches = { vulcan: 'B' };
  spawnGrunt(g, 0, 3, 20);
  const ev = [];
  g._tickPrimary(0.02, ev, 1);
  assert.ok(g.bullets.some((b) => b.burn > 0), 'vulcan B burn flag on bullet');

  g.bullets.length = 0; g.enemies.length = 0; g.fireT = 0;
  g.weaponBranches = { vulcan: 'C' };
  spawnGrunt(g, 0, 3, 20);
  g._tickPrimary(0.02, ev, 1);
  assert.ok((g._fortressT || 0) > 0, 'vulcan C fortress timer');
  assert.ok(g._fortressMoveMul < 0.5, 'vulcan C slow move');
}

{
  // Zero A chill stronger; C refreshes shield
  const g = new Game({ seed: 15 });
  g.taken = { zero_laser: 3 };
  g.loadout = { primary: ['zero_laser', null], secondary: [null, null], throw: [null, null] };
  g.zero_laser = 1; g.laserT = 0;
  g.px = 0; g.pz = 0; g.alive = true; g.invuln = 99;

  g.weaponBranches = { zero_laser: 'A' };
  spawnGrunt(g, 0, 4, 20);
  const ev = [];
  g._tickPrimary(0.02, ev, 1);
  const chillA = g.bullets.find((b) => b.weapon === 'zero_laser');
  assert.ok(chillA && chillA.chill > 1.0, `zero A chill ${chillA && chillA.chill}`);

  g.bullets.length = 0; g.enemies.length = 0; g.laserT = 0;
  g.weaponBranches = { zero_laser: 'C' };
  spawnGrunt(g, 0, 4, 20);
  g._tickPrimary(0.02, ev, 1);
  assert.ok((g._branchShieldT || 0) > 0, 'zero C self-shield');
  assert.ok(g._effectiveArmor() > (g.armor || 0), 'shield adds armor');
}

{
  // Tracking A triple warheads
  const g = new Game({ seed: 16 });
  g.taken = { tracking_bomb: 3 };
  g.weaponBranches = { tracking_bomb: 'A' };
  g.loadout = { primary: ['tracking_bomb', null], secondary: [null, null], throw: [null, null] };
  g.rocket = 1; g.tracking_bomb = 1; g.rocketT = 0;
  g.px = 0; g.pz = 0; g.alive = true; g.invuln = 99;
  spawnGrunt(g, 0, 5, 20);
  const ev = [];
  g._tickPrimary(0.02, ev, 1);
  const n = g.bullets.filter((b) => b.weapon === 'tracking_bomb').length;
  assert.equal(n, 3, `tracking A warheads got ${n}`);
}

{
  // Secondary deepen distinct
  const sA = branchStatMods('shotgun', 'A');
  const sB = branchStatMods('shotgun', 'B');
  assert.ok(sA.pelletsAdd > 0);
  assert.ok(sB.pelletsAdd < 0);
  assert.ok(sB.dmgMul > sA.dmgMul);
}

{
  // Offer copy mentions kit
  const opts = branchOptions('gatling');
  assert.ok(opts[0].descZh.includes('過熱') || opts[0].descZh.includes('射速'));
}

console.log('weapons-branch-kits: PASS');
