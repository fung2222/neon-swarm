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
const g2 = new Game({ seed: 9 });
g2.spread = 1; g2.multi = 2;
// ensure enemies exist
while (g2.enemies.length < 3) g2._spawn('runner');
g2._fire();
assert.ok(g2.bullets.length >= 4, 'spread+multi fires several, got ' + g2.bullets.length);
console.log('logic OK', { t: g.t.toFixed(1), enemies: g.enemies.length, cards: CARDS.length, bullets: g2.bullets.length });
