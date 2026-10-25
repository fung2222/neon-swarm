import { Game } from '../js/logic.js';
import { xpToLevel, pickCards, CARDS } from '../js/config.js';
import assert from 'assert';

const g = new Game({ seed: 42 });
g.moveDir(1, 0);
for (let i = 0; i < 120; i++) g.step(1 / 30);
assert.ok(g.t > 3);
assert.ok(g.enemies.length >= 0);
assert.equal(xpToLevel(1) > 0, true);
assert.ok(CARDS.length >= 10);
const cards = pickCards(() => 0.2, 3);
assert.equal(cards.length, 3);

function nearFoe(game, type = 'soldier') {
  game._spawn(type);
  const e = game.enemies[game.enemies.length - 1];
  e.x = game.px + 3; e.z = game.pz + 1;
  return e;
}

// Base MG + multi-lock
const g2 = new Game({ seed: 9 });
g2.enemies.length = 0;
g2.multi = 2;
nearFoe(g2); nearFoe(g2); nearFoe(g2);
assert.ok(g2._fireMg(), 'MG should fire at nearest');
assert.ok(g2.bullets.length >= 2, 'multi MG fires several, got ' + g2.bullets.length);
assert.ok(g2.bullets.every((b) => b.weapon === 'mg'));

// Special weapons unlock
const g3 = new Game({ seed: 11 });
g3.enemies.length = 0;
nearFoe(g3); nearFoe(g3);
g3.laser = 1; g3.shotgun = 1; g3.rocket = 1; g3.grenade = 1; g3.plasma = 1;
assert.ok(g3._fireLaser());
assert.ok(g3._fireShotgun());
assert.ok(g3._fireRocket());
assert.ok(g3._fireGrenade());
assert.ok(g3._firePlasma());
const kinds = new Set(g3.bullets.map((b) => b.weapon));
for (const w of ['laser', 'shotgun', 'rocket', 'grenade', 'plasma']) {
  assert.ok(kinds.has(w), 'missing weapon ' + w);
}

// Enemy motion phase advances while chasing
const e0 = g3.enemies[0];
const phase0 = e0.animPhase;
g3.step(0.2);
assert.ok(Math.hypot(e0.vx, e0.vz) > 0, 'enemy should have velocity');
assert.ok(e0.animPhase !== phase0, 'animPhase should advance');

console.log('logic OK', {
  t: g.t.toFixed(1),
  enemies: g.enemies.length,
  cards: CARDS.length,
  mgBullets: g2.bullets.length,
  specials: [...kinds],
});
