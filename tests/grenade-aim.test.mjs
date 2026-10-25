/**
 * Grenade forward fan + primary visual aim isolation.
 * Run: node tests/grenade-aim.test.mjs
 */
import assert from 'assert';
import { Game, resolveGrenadeThrow, GRENADE_FAN_DOT, GRENADE_FORWARD_DIST } from '../js/logic.js';
import { isMechPlayable, MECHS, MECH_BY_ID } from '../js/config.js';

function spawnAt(game, x, z, type = 'soldier') {
  game._spawn(type);
  const e = game.enemies[game.enemies.length - 1];
  e.x = x; e.z = z; e.vx = 0; e.vz = 0;
  return e;
}

// ---- mech lock ----
{
  assert.equal(isMechPlayable('horn'), true);
  assert.equal(isMechPlayable('heavy'), false);
  assert.equal(isMechPlayable('prototype'), false);
  assert.equal(MECH_BY_ID.horn.playable, true);
  assert.ok(MECH_BY_ID.heavy.comingSoon);
  assert.ok(MECH_BY_ID.prototype.comingSoon);
  console.log('mech lock OK');
}

// ---- resolveGrenadeThrow pure helper ----
{
  const fwd = { x: 0, z: 1 }; // +Z forward
  // Behind (−Z)
  {
    const r = resolveGrenadeThrow(0, 0, fwd.x, fwd.z, [{ x: 0, z: -5, hp: 1, id: 1 }]);
    assert.equal(r.mode, 'forward');
    assert.equal(r.target, null);
    assert.ok(Math.abs(r.dx - 0) < 1e-9 && Math.abs(r.dz - 1) < 1e-9);
    assert.equal(r.dist, GRENADE_FORWARD_DIST);
  }
  // Side-rear (dot for (1,-1) normalized vs (0,1) = -0.707)
  {
    const r = resolveGrenadeThrow(0, 0, 0, 1, [{ x: 4, z: -4, hp: 1, id: 2 }]);
    assert.equal(r.mode, 'forward', 'side-rear must not be picked');
    assert.equal(r.target, null);
  }
  // Front (+Z)
  {
    const foe = { x: 0, z: 5, hp: 1, id: 3 };
    const r = resolveGrenadeThrow(0, 0, 0, 1, [foe]);
    assert.equal(r.mode, 'target');
    assert.equal(r.target, foe);
    assert.ok(r.dz > 0.9);
  }
  // Fan boundary: angle 60° → dot ≈ 0.5. Point at (sin60, cos60) = (0.866, 0.5)
  {
    const ang = Math.acos(GRENADE_FAN_DOT); // 60°
    const x = Math.sin(ang) * 5;
    const z = Math.cos(ang) * 5;
    const foe = { x, z, hp: 1, id: 4 };
    const r = resolveGrenadeThrow(0, 0, 0, 1, [foe]);
    assert.equal(r.mode, 'target', 'dot==0.5 boundary must be legal');
    assert.equal(r.target, foe);
  }
  // Just outside fan: 61°
  {
    const ang = Math.acos(GRENADE_FAN_DOT) + 0.02;
    const foe = { x: Math.sin(ang) * 5, z: Math.cos(ang) * 5, hp: 1, id: 5 };
    const r = resolveGrenadeThrow(0, 0, 0, 1, [foe]);
    assert.equal(r.mode, 'forward', 'just outside fan must defer to forward');
  }
  // Prefer front over nearer rear
  {
    const rear = { x: 0, z: -2, hp: 1, id: 6 };
    const front = { x: 0, z: 8, hp: 1, id: 7 };
    const r = resolveGrenadeThrow(0, 0, 0, 1, [rear, front]);
    assert.equal(r.target, front);
  }
  console.log('resolveGrenadeThrow OK');
}

// ---- Game._fireGrenade never throws backward ----
{
  const g = new Game({ seed: 11 });
  g.enemies.length = 0;
  g.px = 0; g.pz = 0;
  g.grenade = 1;
  g.visualAimX = 0; g.visualAimZ = 1; // face +Z
  g.aimX = 0; g.aimZ = 1;
  spawnAt(g, 0, -4); // only behind
  const events = [];
  assert.ok(g._fireGrenade(events));
  const ev = events.find((e) => e.type === 'fire' && e.weapon === 'grenade');
  assert.ok(ev);
  assert.ok(ev.aimZ > 0.9, 'grenade aim must stay forward, got aimZ=' + ev.aimZ);
  assert.ok(ev.aimX * ev.aimX < 0.05);
  assert.equal(ev.updateVisual, false);
  const b = g.bullets[g.bullets.length - 1];
  assert.ok(b.vz > 0, 'grenade velocity must go forward');
  assert.equal(b.grenadeMode, 'forward');
  console.log('grenade rear-only → forward OK');
}

// ---- Multi-weapon: rocket must not overwrite visualAim ----
{
  const g = new Game({ seed: 12 });
  g.enemies.length = 0;
  g.px = 0; g.pz = 0;
  // Primary aim toward +X
  spawnAt(g, 6, 0);
  const mgE = [];
  assert.ok(g._fireMg(mgE));
  assert.ok(g.visualAimX > 0.8, 'MG should set visualAim toward +X');
  const vx0 = g.visualAimX, vz0 = g.visualAimZ;
  // Rocket target behind (−Z) — sticky/nearest may pick it; must not flip body
  g.enemies.length = 0;
  spawnAt(g, 0, -6);
  g.rocket = 1;
  const rkE = [];
  // If rocket finds a target it fires; visual must stay
  const fired = g._fireRocket(rkE);
  if (fired) {
    assert.ok(Math.abs(g.visualAimX - vx0) < 1e-9, 'rocket must not change visualAimX');
    assert.ok(Math.abs(g.visualAimZ - vz0) < 1e-9, 'rocket must not change visualAimZ');
    const ev = rkE.find((e) => e.type === 'fire');
    assert.equal(ev.updateVisual, false);
    // Per-event aim may differ
    assert.ok(typeof ev.aimX === 'number');
  }
  // Grenade behind
  g.grenade = 1;
  g.enemies.length = 0;
  spawnAt(g, 0, -5);
  const grE = [];
  assert.ok(g._fireGrenade(grE));
  assert.ok(Math.abs(g.visualAimX - vx0) < 1e-9);
  assert.ok(Math.abs(g.visualAimZ - vz0) < 1e-9);
  console.log('visualAim isolation OK');
}

// ---- Same-frame MG + grenade: body stays on MG aim ----
{
  const g = new Game({ seed: 13 });
  g.enemies.length = 0;
  g.px = 0; g.pz = 0;
  spawnAt(g, 5, 1);   // front-ish for MG
  spawnAt(g, -5, 0);  // left/behind-ish
  g.grenade = 1;
  const events = [];
  g._fireMg(events);
  const vx = g.visualAimX, vz = g.visualAimZ;
  g._fireGrenade(events);
  assert.ok(Math.abs(g.visualAimX - vx) < 1e-9);
  assert.ok(Math.abs(g.visualAimZ - vz) < 1e-9);
  const fires = events.filter((e) => e.type === 'fire');
  assert.ok(fires.some((e) => e.weapon === 'mg' && e.updateVisual));
  assert.ok(fires.some((e) => e.weapon === 'grenade' && !e.updateVisual));
  console.log('same-frame multi-weapon OK');
}

console.log('grenade-aim tests passed');
