/**
 * Milestone A — nearest perf, sticky aim, fire event payload, hurt move unlock.
 * Run: node tests/milestone-a.test.mjs
 */
import { Game } from '../js/logic.js';
import { muzzleWorld } from '../js/muzzle.js';
import assert from 'assert';

function spawnAt(game, x, z, type = 'soldier') {
  game._spawn(type);
  const e = game.enemies[game.enemies.length - 1];
  e.x = x; e.z = z; e.vx = 0; e.vz = 0;
  return e;
}

// ---- _nearest: no full sort; correct top-n ----
{
  const g = new Game({ seed: 1 });
  g.enemies.length = 0;
  g.px = 0; g.pz = 0;
  const positions = [
    [5, 0], [2, 0], [8, 0], [3, 0], [1, 0], [10, 0], [4, 0],
  ];
  for (const [x, z] of positions) spawnAt(g, x, z);
  const one = g._nearest(1, 20);
  assert.equal(one.length, 1);
  assert.ok(Math.hypot(one[0].x, one[0].z) < 1.1, 'nearest should be at ~1');

  const three = g._nearest(3, 20);
  assert.equal(three.length, 3);
  const ds = three.map((e) => Math.hypot(e.x - g.px, e.z - g.pz));
  assert.ok(ds[0] <= ds[1] && ds[1] <= ds[2], 'top-n must be ascending');
  assert.ok(ds[0] < 1.1 && ds[1] < 2.1 && ds[2] < 3.1);
}

// ---- stress timing: 100 / 200 / 300 enemies ----
{
  const sizes = [100, 200, 300];
  const report = {};
  for (const n of sizes) {
    const g = new Game({ seed: 7 });
    g.enemies.length = 0;
    g.px = 0; g.pz = 0;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2;
      const r = 2 + (i % 17) * 0.7;
      spawnAt(g, Math.cos(ang) * r, Math.sin(ang) * r);
    }
    // warmup
    for (let i = 0; i < 20; i++) g._nearest(1, 11);
    for (let i = 0; i < 20; i++) g._nearest(3, 11);
    const runs = 400;
    let t0 = performance.now();
    for (let i = 0; i < runs; i++) g._nearest(1, 11);
    const ms1 = (performance.now() - t0) / runs;
    t0 = performance.now();
    for (let i = 0; i < runs; i++) g._nearest(3, 11);
    const ms3 = (performance.now() - t0) / runs;
    report[n] = { nearest1_ms: +ms1.toFixed(4), nearest3_ms: +ms3.toFixed(4) };
    // sanity: should stay well under 1ms/call even at 300 on node
    assert.ok(ms1 < 2, 'nearest(1) too slow at ' + n + ': ' + ms1);
    assert.ok(ms3 < 3, 'nearest(3) too slow at ' + n + ': ' + ms3);
  }
  console.log('nearest timing (ms/call avg)', report);
}

// ---- sticky aim: does not thrash on tiny distance changes ----
{
  const g = new Game({ seed: 3 });
  g.enemies.length = 0;
  g.px = 0; g.pz = 0;
  const a = spawnAt(g, 4, 0);
  const b = spawnAt(g, 4.2, 0.1);
  const t1 = g._targetsForWeapon(1, 11);
  assert.equal(t1[0], a);
  const stickyId = a.id;
  // nudge b slightly closer but not 20% — should keep sticky during hold
  b.x = 3.9; b.z = 0;
  g.t = 0.05; // still within ~0.20 hold
  const t2 = g._targetsForWeapon(1, 11);
  assert.equal(t2[0].id, stickyId, 'should keep sticky for small closer delta');
  // clearly closer challenger should steal
  b.x = 2.0;
  const t3 = g._targetsForWeapon(1, 11);
  assert.equal(t3[0].id, b.id, 'clearly closer foe should retarget');
  // death clears sticky
  g.enemies.splice(g.enemies.indexOf(b), 1);
  g._sticky = b;
  const t4 = g._targetsForWeapon(1, 11);
  assert.equal(t4[0].id, a.id, 'retarget after sticky death');
}

// ---- fire event carries aim + muzzle ----
{
  const g = new Game({ seed: 5 });
  g.enemies.length = 0;
  g.px = 0; g.pz = 0;
  spawnAt(g, 5, 0);
  const events = [];
  assert.ok(g._fireMg(events));
  assert.ok(events.length >= 1);
  const ev = events.find((e) => e.type === 'fire');
  assert.ok(ev, 'fire event present');
  assert.equal(ev.weapon, 'mg');
  assert.ok(typeof ev.aimX === 'number' && typeof ev.aimZ === 'number');
  assert.ok(typeof ev.muzzleX === 'number' && typeof ev.muzzleY === 'number' && typeof ev.muzzleZ === 'number');
  assert.ok(ev.targetId != null);
  // muzzle uses shared per-dir world helper (east target → ahead on +X)
  assert.ok(ev.muzzleX > g.px, 'muzzle ahead on X toward east target');
  assert.ok(Math.abs(g.aimX) > 0.5, 'aimX set toward target');
  const mw = muzzleWorld(g.px, g.pz, ev.aimX, ev.aimZ);
  assert.ok(Math.abs(ev.muzzleX - mw.x) < 1e-9 && Math.abs(ev.muzzleZ - mw.z) < 1e-9, 'fire event muzzle == helper');
}

// ---- hurt does not clear velocity / moveDir still works ----
{
  const g = new Game({ seed: 8 });
  g.enemies.length = 0;
  g.invuln = 0;
  g.hitFlash = 0.28;
  g.invuln = 0.85;
  g.moveDir(1, 0);
  assert.ok(g.vx > 0.5, 'moveDir works during hitFlash');
  const px0 = g.px;
  // step while "hurt" — movement must apply
  // place foe far so we don't die immediately
  spawnAt(g, 20, 20);
  g.step(0.05);
  assert.ok(g.px > px0, 'position advances while hitFlash/invuln active');
}

// ---- ordinary kill not marked gore; elite is ----
{
  const g = new Game({ seed: 9 });
  g.enemies.length = 0;
  g.px = 0; g.pz = 0;
  const grunt = spawnAt(g, 1.5, 0, 'staffer');
  grunt.hp = 0.01;
  g.bulletDmg = 10;
  g.fireT = 0;
  const { events } = (() => {
    // force a hit kill via tiny step with bullet already aimed
    const evs = [];
    g._fireMg(evs);
    // advance bullets into enemy
    for (let i = 0; i < 30; i++) {
      const r = g.step(1 / 60);
      evs.push(...r.events);
      if (evs.some((e) => e.type === 'kill')) break;
    }
    return { events: evs };
  })();
  const kill = events.find((e) => e.type === 'kill');
  // staffer ordinary — may or may not have died; if died should not be punch
  if (kill && kill.enemy.kind === 'staffer') {
    assert.equal(!!kill.gore, false, 'ordinary staffer kill should not be gore');
  }
  // elite punch
  const g2 = new Game({ seed: 10 });
  g2.enemies.length = 0;
  const chief = spawnAt(g2, 1.2, 0, 'chief');
  chief.hp = 0.01;
  g2.bulletDmg = 50;
  g2.fireT = 0;
  const evs2 = [];
  g2._fireMg(evs2);
  for (let i = 0; i < 40; i++) {
    const r = g2.step(1 / 60);
    evs2.push(...r.events);
    if (evs2.some((e) => e.type === 'kill')) break;
  }
  const k2 = evs2.find((e) => e.type === 'kill');
  assert.ok(k2, 'chief should die');
  assert.ok(k2.gore || k2.elite, 'elite kill should punch');
}

console.log('milestone-a OK');
